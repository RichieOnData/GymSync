import { createClient } from "@supabase/supabase-js"
import { addMonths, differenceInDays, format, subMonths } from "date-fns"
import { type Member, type MembershipPlan, SUBSCRIPTION_PLANS } from "@/types/member"

// Initialize Supabase client
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

// Types for our insights
export interface RevenueOpportunity {
  memberId: string
  memberName: string
  currentPlan: MembershipPlan
  suggestedPlan: MembershipPlan
  currentRevenue: number
  potentialRevenue: number
  upgradeReason: string
  upgradeScore: number // 0-100
}

export interface RetentionRisk {
  memberId: string
  memberName: string
  currentPlan: MembershipPlan
  joinDate: string
  lastCheckIn: string
  riskScore: number // 0-100
  riskFactors: string[]
}

export interface ChurnForecast {
  month: string
  predictedChurnRate: number
  predictedChurnCount: number
  contributingFactors: string[]
  confidence: number // 0-100
}

export interface RevenueForecast {
  month: string
  totalRevenue: number
  revenueByPlan: Record<MembershipPlan, number>
  renewalCount: number
  newMemberCount: number
  confidence: number // 0-100
}

export interface PeakHourForecast {
  day: string
  hourlyData: {
    hour: string
    occupancyPercentage: number
    memberCount: number
  }[]
  peakHours: string[]
  suggestedActions: string[]
}

export interface RenewalOffer {
  memberId: string
  memberName: string
  currentPlan: MembershipPlan
  renewalDate: string
  offerType: string
  offerDescription: string
  emailStatus: "pending" | "sent" | "opened" | "clicked"
}

// 1. Revenue Opportunity Analysis
export async function getRevenueOpportunities(): Promise<RevenueOpportunity[]> {
  try {
    // Get all active members
    const { data: members, error: membersError } = await supabase.from("members").select("*").eq("status", "active")

    if (membersError) throw membersError

    // Get attendance data to analyze usage patterns
    const { data: attendance, error: attendanceError } = await supabase
      .from("attendance")
      .select("*")
      .eq("status", "Present")

    if (attendanceError) throw attendanceError

    // Group attendance by member
    const attendanceByMember = attendance.reduce(
      (acc, record) => {
        if (!acc[record.member_id]) {
          acc[record.member_id] = []
        }
        acc[record.member_id].push(record)
        return acc
      },
      {} as Record<string, any[]>,
    )

    // Analyze each member for upgrade opportunities
    const opportunities: RevenueOpportunity[] = []

    for (const member of members) {
      // Skip members already on Premium plan
      if (member.membership_plan === "Premium") continue

      const memberAttendance = attendanceByMember[member.id] || []
      const checkInFrequency = memberAttendance.length / 30 // Avg check-ins per month
      const memberTenure = differenceInDays(new Date(), new Date(member.join_date)) / 30 // Months

      // Determine next tier plan
      let suggestedPlan: MembershipPlan = member.membership_plan
      let upgradeReason = ""
      let upgradeScore = 0

      if (member.membership_plan === "Basic" && (checkInFrequency > 12 || memberTenure > 3)) {
        suggestedPlan = "Pro"
        upgradeReason = checkInFrequency > 12 ? "High gym usage (12+ visits per month)" : "Loyal member (3+ months)"
        upgradeScore = Math.min(checkInFrequency * 5 + memberTenure * 3, 95)
      } else if (member.membership_plan === "Pro" && (checkInFrequency > 20 || memberTenure > 6)) {
        suggestedPlan = "Premium"
        upgradeReason =
          checkInFrequency > 20 ? "Very high gym usage (20+ visits per month)" : "Long-term member (6+ months)"
        upgradeScore = Math.min(checkInFrequency * 3 + memberTenure * 2, 95)
      } else if (member.membership_plan === "One-Day Pass" && checkInFrequency > 3) {
        suggestedPlan = "Basic"
        upgradeReason = "Frequent one-day pass purchases"
        upgradeScore = Math.min(checkInFrequency * 15, 95)
      }

      // If we found an upgrade opportunity
      if (suggestedPlan !== member.membership_plan) {
        const currentPlanDetails = SUBSCRIPTION_PLANS.find((p) => p.name === member.membership_plan)!
        const suggestedPlanDetails = SUBSCRIPTION_PLANS.find((p) => p.name === suggestedPlan)!

        opportunities.push({
          memberId: member.id,
          memberName: member.name,
          currentPlan: member.membership_plan,
          suggestedPlan,
          currentRevenue: currentPlanDetails.price,
          potentialRevenue: suggestedPlanDetails.price,
          upgradeReason,
          upgradeScore,
        })
      }
    }

    // Sort by upgrade score (highest first)
    return opportunities.sort((a, b) => b.upgradeScore - a.upgradeScore)
  } catch (error) {
    console.error("Error analyzing revenue opportunities:", error)
    return []
  }
}

// 2. Member Retention Risk Analysis
export async function getRetentionRisks(): Promise<RetentionRisk[]> {
  try {
    // Get all active members
    const { data: members, error: membersError } = await supabase.from("members").select("*").eq("status", "active")

    if (membersError) throw membersError

    // Get attendance data to analyze usage patterns
    const { data: attendance, error: attendanceError } = await supabase
      .from("attendance")
      .select("*")
      .order("date", { ascending: false })

    if (attendanceError) throw attendanceError

    // Group attendance by member and find last check-in
    const lastCheckInByMember: Record<string, string> = {}
    for (const record of attendance) {
      if (!lastCheckInByMember[record.member_id] && record.status === "Present") {
        lastCheckInByMember[record.member_id] = record.date
      }
    }

    const today = new Date()
    const risks: RetentionRisk[] = []

    for (const member of members) {
      const lastCheckIn = lastCheckInByMember[member.id] || member.join_date
      const daysSinceLastCheckIn = differenceInDays(today, new Date(lastCheckIn))
      const daysUntilExpiration = differenceInDays(new Date(member.expiration_date), today)
      const memberTenure = differenceInDays(today, new Date(member.join_date))

      // Calculate risk factors
      const riskFactors: string[] = []
      let riskScore = 0

      // Factor 1: Inactivity
      if (daysSinceLastCheckIn > 14) {
        riskFactors.push(`No check-ins for ${daysSinceLastCheckIn} days`)
        riskScore += Math.min(daysSinceLastCheckIn, 60)
      }

      // Factor 2: Approaching expiration
      if (daysUntilExpiration < 14 && daysUntilExpiration > 0) {
        riskFactors.push(`Membership expires in ${daysUntilExpiration} days`)
        riskScore += (14 - daysUntilExpiration) * 3
      }

      // Factor 3: New member (less than 30 days) with low engagement
      if (memberTenure < 30 && daysSinceLastCheckIn > 7) {
        riskFactors.push("New member with low engagement")
        riskScore += 20
      }

      // Only include members with significant risk
      if (riskScore > 30) {
        risks.push({
          memberId: member.id,
          memberName: member.name,
          currentPlan: member.membership_plan,
          joinDate: member.join_date,
          lastCheckIn,
          riskScore: Math.min(riskScore, 100),
          riskFactors,
        })
      }
    }

    // Sort by risk score (highest first) and limit to top 10
    return risks.sort((a, b) => b.riskScore - a.riskScore).slice(0, 10)
  } catch (error) {
    console.error("Error analyzing retention risks:", error)
    return []
  }
}

// 3. Churn Trend Forecasting
export async function getChurnForecast(): Promise<ChurnForecast[]> {
  try {
    const today = new Date()
    const forecast: ChurnForecast[] = []

    // Get historical churn data (members who have expired)
    const { data: expiredMembers, error: expiredError } = await supabase
      .from("members")
      .select("*")
      .lt("expiration_date", today.toISOString())

    if (expiredError) throw expiredError

    // Get active members count
    const { count: activeCount, error: activeError } = await supabase
      .from("members")
      .select("*", { count: "exact", head: true })
      .eq("status", "active")

    if (activeError) throw activeError

    // Group expired members by month
    const expiredByMonth: Record<string, any[]> = {}
    for (const member of expiredMembers) {
      const expMonth = format(new Date(member.expiration_date), "yyyy-MM")
      if (!expiredByMonth[expMonth]) {
        expiredByMonth[expMonth] = []
      }
      expiredByMonth[expMonth].push(member)
    }

    // Calculate historical churn rates
    const historicalChurn: Record<string, number> = {}
    const months = Object.keys(expiredByMonth).sort()

    // We need at least 3 months of data for meaningful forecasting
    if (months.length >= 3) {
      for (let i = 0; i < months.length; i++) {
        const month = months[i]
        const expiredCount = expiredByMonth[month].length

        // We need to know how many members were active at the start of this month
        // For simplicity, we'll use a rough estimate based on current active + all expired after this month
        let totalMembersAtStart = activeCount
        for (let j = i; j < months.length; j++) {
          totalMembersAtStart += expiredByMonth[months[j]].length
        }

        historicalChurn[month] = expiredCount / totalMembersAtStart
      }
    }

    // Generate forecast for next 3 months
    for (let i = 1; i <= 3; i++) {
      const forecastMonth = format(addMonths(today, i), "yyyy-MM")
      const forecastMonthName = format(addMonths(today, i), "MMMM yyyy")

      // Simple forecasting model (could be much more sophisticated in a real system)
      // Average of last 3 months with a seasonal adjustment
      let predictedRate = 0.05 // Default 5% if no historical data

      if (months.length >= 3) {
        const recentMonths = months.slice(-3)
        const avgRate = recentMonths.reduce((sum, m) => sum + historicalChurn[m], 0) / recentMonths.length

        // Apply seasonal adjustment (simplified)
        const seasonalFactor = i === 1 ? 1.1 : i === 2 ? 0.9 : 1.0
        predictedRate = avgRate * seasonalFactor
      }

      // Calculate predicted churn count
      const predictedCount = Math.round(activeCount * predictedRate)

      // Determine contributing factors
      const contributingFactors = []

      if (i === 1) contributingFactors.push("End of month membership cycles")
      if (i === 2) contributingFactors.push("Seasonal variation (historical pattern)")
      if (predictedRate > 0.07) contributingFactors.push("Higher than average churn rate")

      // Add plan-specific factors based on historical data
      const planContribution: Record<MembershipPlan, number> = {
        Basic: 0,
        Pro: 0,
        Premium: 0,
        "One-Day Pass": 0,
      }

      for (const month of months.slice(-3)) {
        for (const member of expiredByMonth[month]) {
          planContribution[member.membership_plan as MembershipPlan]++
        }
      }

      // Find the plan with highest churn
      const highestChurnPlan = Object.entries(planContribution)
        .sort((a, b) => b[1] - a[1])
        .map(([plan]) => plan)[0]

      contributingFactors.push(`${highestChurnPlan} plan has highest historical churn`)

      forecast.push({
        month: forecastMonthName,
        predictedChurnRate: Number((predictedRate * 100).toFixed(1)),
        predictedChurnCount: predictedCount,
        contributingFactors,
        confidence: months.length >= 3 ? 75 : 50, // Higher confidence with more historical data
      })
    }

    return forecast
  } catch (error) {
    console.error("Error generating churn forecast:", error)
    return []
  }
}

// 4. Smart Billing Prediction
export async function getRevenueForecast(): Promise<RevenueForecast[]> {
  try {
    const today = new Date()
    const forecast: RevenueForecast[] = []

    // Get all active members
    const { data: members, error: membersError } = await supabase.from("members").select("*").eq("status", "active")

    if (membersError) throw membersError

    // Get payment history
    const { data: payments, error: paymentsError } = await supabase
      .from("payments")
      .select("*")
      .order("payment_date", { ascending: false })

    if (paymentsError) throw paymentsError

    // Group members by plan
    const membersByPlan: Record<MembershipPlan, Member[]> = {
      Basic: [],
      Pro: [],
      Premium: [],
      "One-Day Pass": [],
    }

    for (const member of members) {
      membersByPlan[member.membership_plan as MembershipPlan].push(member)
    }

    // Calculate plan prices
    const planPrices: Record<MembershipPlan, number> = {}
    for (const plan of SUBSCRIPTION_PLANS) {
      planPrices[plan.name] = plan.price
    }

    // Generate forecast for next 3 months
    for (let i = 1; i <= 3; i++) {
      const forecastMonth = format(addMonths(today, i), "yyyy-MM")
      const forecastMonthName = format(addMonths(today, i), "MMMM yyyy")

      // Initialize revenue by plan
      const revenueByPlan: Record<MembershipPlan, number> = {
        Basic: 0,
        Pro: 0,
        Premium: 0,
        "One-Day Pass": 0,
      }

      // Count renewals for this month
      let renewalCount = 0

      // For each plan, calculate expected renewals and revenue
      for (const [plan, planMembers] of Object.entries(membersByPlan)) {
        const planType = plan as MembershipPlan

        // Count members renewing this month
        const renewingMembers = planMembers.filter((member) => {
          const expDate = new Date(member.expiration_date)
          const forecastMonthStart = startOfMonth(addMonths(today, i))
          const forecastMonthEnd = endOfMonth(addMonths(today, i))
          return expDate >= forecastMonthStart && expDate <= forecastMonthEnd
        })

        renewalCount += renewingMembers.length

        // Calculate renewal revenue (assuming 90% renewal rate)
        const renewalRate = 0.9
        revenueByPlan[planType] += renewingMembers.length * renewalRate * planPrices[planType]

        // Add recurring revenue from members not up for renewal
        const recurringMembers = planMembers.length - renewingMembers.length

        // For monthly plans
        if (planType !== "One-Day Pass") {
          revenueByPlan[planType] += recurringMembers * planPrices[planType]
        }
      }

      // Estimate new members (based on historical growth)
      // For simplicity, we'll use a fixed number
      const newMemberCount = 5 + i // Increasing slightly each month

      // Distribute new members across plans (simplified)
      revenueByPlan["Basic"] += newMemberCount * 0.6 * planPrices["Basic"] // 60% choose Basic
      revenueByPlan["Pro"] += newMemberCount * 0.3 * planPrices["Pro"] // 30% choose Pro
      revenueByPlan["Premium"] += newMemberCount * 0.1 * planPrices["Premium"] // 10% choose Premium

      // Calculate total revenue
      const totalRevenue = Object.values(revenueByPlan).reduce((sum, val) => sum + val, 0)

      forecast.push({
        month: forecastMonthName,
        totalRevenue: Math.round(totalRevenue),
        revenueByPlan: revenueByPlan,
        renewalCount,
        newMemberCount,
        confidence: 80 - i * 10, // Confidence decreases for further months
      })
    }

    return forecast
  } catch (error) {
    console.error("Error generating revenue forecast:", error)
    return []
  }
}

// Helper function for date calculations
function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

// 5. Peak Hour Forecast
export async function getPeakHourForecast(): Promise<PeakHourForecast[]> {
  try {
    // Get attendance data for the past 3 months
    const threeMonthsAgo = format(subMonths(new Date(), 3), "yyyy-MM-dd")

    const { data: attendance, error: attendanceError } = await supabase
      .from("attendance")
      .select("*")
      .gte("date", threeMonthsAgo)
      .eq("status", "Present")

    if (attendanceError) throw attendanceError

    // For this demo, we'll generate synthetic hourly data since our actual data doesn't have time
    const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    const forecast: PeakHourForecast[] = []

    for (const day of daysOfWeek) {
      const hourlyData = []
      const peakHours = []
      let maxOccupancy = 0

      // Generate hourly data (6 AM to 10 PM)
      for (let hour = 6; hour <= 22; hour++) {
        // Create a realistic distribution with morning and evening peaks
        let baseOccupancy = 20 // Base occupancy

        // Morning peak (7-9 AM)
        if (hour >= 7 && hour <= 9) {
          baseOccupancy += 30
        }

        // Lunch peak (12-2 PM)
        if (hour >= 12 && hour <= 14) {
          baseOccupancy += 20
        }

        // Evening peak (5-8 PM)
        if (hour >= 17 && hour <= 20) {
          baseOccupancy += 40
        }

        // Weekend adjustment
        if (day === "Saturday" || day === "Sunday") {
          if (hour < 10) {
            baseOccupancy -= 10 // Fewer morning people on weekends
          } else {
            baseOccupancy += 15 // More people during the day on weekends
          }
        }

        // Add some day-specific variations
        if (day === "Monday" && hour >= 17) baseOccupancy += 10 // Monday evening rush
        if (day === "Friday" && hour >= 17) baseOccupancy -= 5 // Friday evening is less busy

        // Add randomness (±10%)
        const randomFactor = 0.9 + Math.random() * 0.2
        const occupancyPercentage = Math.round(baseOccupancy * randomFactor)
        const memberCount = Math.round(occupancyPercentage * 0.5) // Assuming 50 members is 100% capacity

        const hourData = {
          hour: `${hour}:00`,
          occupancyPercentage,
          memberCount,
        }

        hourlyData.push(hourData)

        // Track peak hours (over 70% occupancy)
        if (occupancyPercentage > 70) {
          peakHours.push(`${hour}:00 - ${hour + 1}:00`)
        }

        // Track max occupancy
        if (occupancyPercentage > maxOccupancy) {
          maxOccupancy = occupancyPercentage
        }
      }

      // Generate suggested actions based on peak hours
      const suggestedActions = []

      if (peakHours.length > 0) {
        suggestedActions.push(`Consider staff increases during peak hours: ${peakHours.join(", ")}`)
      }

      if (maxOccupancy > 85) {
        suggestedActions.push("Implement appointment system for peak hours to manage capacity")
      }

      if (day === "Monday" || day === "Tuesday") {
        suggestedActions.push("Offer special promotions for off-peak hours to balance attendance")
      }

      forecast.push({
        day,
        hourlyData,
        peakHours,
        suggestedActions,
      })
    }

    return forecast
  } catch (error) {
    console.error("Error generating peak hour forecast:", error)
    return []
  }
}

// 6. Renewal-Based Offers
export async function getRenewalOffers(): Promise<RenewalOffer[]> {
  try {
    const today = new Date()
    const oneMonthFromNow = addMonths(today, 1)

    // Get members with upcoming renewals
    const { data: members, error: membersError } = await supabase
      .from("members")
      .select("*")
      .eq("status", "active")
      .lte("expiration_date", format(oneMonthFromNow, "yyyy-MM-dd"))
      .gte("expiration_date", format(today, "yyyy-MM-dd"))

    if (membersError) throw membersError

    const offers: RenewalOffer[] = []

    for (const member of members) {
      // Generate personalized offer based on member profile
      let offerType = ""
      let offerDescription = ""

      const daysUntilExpiration = differenceInDays(new Date(member.expiration_date), today)
      const memberTenure = differenceInDays(today, new Date(member.join_date))

      if (memberTenure > 180) {
        // Long-term members (6+ months)
        if (member.membership_plan === "Basic") {
          offerType = "Loyalty Upgrade"
          offerDescription = "50% off first month of Pro plan for loyal members"
        } else if (member.membership_plan === "Pro") {
          offerType = "Premium Trial"
          offerDescription = "Try Premium features for 2 weeks with your renewal"
        } else {
          offerType = "Renewal Discount"
          offerDescription = "10% off your next renewal as a thank you for your loyalty"
        }
      } else {
        // Newer members
        if (daysUntilExpiration < 7) {
          // Urgent renewals
          offerType = "Last Chance"
          offerDescription = "Renew in the next 48 hours and get a free personal training session"
        } else {
          offerType = "Early Bird"
          offerDescription = "Renew early and save 5% on your next membership period"
        }
      }

      // Randomize email status for demo purposes
      const statuses: ("pending" | "sent" | "opened" | "clicked")[] = ["pending", "sent", "opened", "clicked"]
      const emailStatus = statuses[Math.floor(Math.random() * statuses.length)]

      offers.push({
        memberId: member.id,
        memberName: member.name,
        currentPlan: member.membership_plan as MembershipPlan,
        renewalDate: member.expiration_date,
        offerType,
        offerDescription,
        emailStatus,
      })
    }

    return offers
  } catch (error) {
    console.error("Error generating renewal offers:", error)
    return []
  }
}

// Function to get all insights for the dashboard
export async function getAllInsights() {
  try {
    const [revenueOpportunities, retentionRisks, churnForecast, revenueForecast, peakHourForecast, renewalOffers] =
      await Promise.all([
        getRevenueOpportunities(),
        getRetentionRisks(),
        getChurnForecast(),
        getRevenueForecast(),
        getPeakHourForecast(),
        getRenewalOffers(),
      ])

    return {
      revenueOpportunities,
      retentionRisks,
      churnForecast,
      revenueForecast,
      peakHourForecast,
      renewalOffers,

      // Summary metrics
      summary: {
        potentialRevenueIncrease: revenueOpportunities.reduce(
          (sum, opp) => sum + (opp.potentialRevenue - opp.currentRevenue),
          0,
        ),
        highRiskMemberCount: retentionRisks.length,
        averageChurnRate:
          churnForecast.reduce((sum, cf) => sum + cf.predictedChurnRate, 0) / (churnForecast.length || 1),
        nextMonthRevenue: revenueForecast[0]?.totalRevenue || 0,
        upcomingRenewals: renewalOffers.length,
      },
    }
  } catch (error) {
    console.error("Error fetching all insights:", error)
    return {
      revenueOpportunities: [],
      retentionRisks: [],
      churnForecast: [],
      revenueForecast: [],
      peakHourForecast: [],
      renewalOffers: [],
      summary: {
        potentialRevenueIncrease: 0,
        highRiskMemberCount: 0,
        averageChurnRate: 0,
        nextMonthRevenue: 0,
        upcomingRenewals: 0,
      },
    }
  }
}

