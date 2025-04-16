import { createClient } from "@supabase/supabase-js"
import { startOfMonth, endOfMonth, format, subMonths } from "date-fns"

// Initialize Supabase client
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

// Get active members count and new signups this month
export async function getActiveMembersMetrics() {
  const today = new Date()
  const firstDayOfMonth = startOfMonth(today)
  const lastDayOfMonth = endOfMonth(today)

  // Format dates for SQL queries
  const firstDayFormatted = format(firstDayOfMonth, "yyyy-MM-dd")
  const lastDayFormatted = format(lastDayOfMonth, "yyyy-MM-dd")
  const currentDate = format(today, "yyyy-MM-dd")

  try {
    // Get total active members
    const { count: activeCount, error: activeError } = await supabase
      .from("members")
      .select("*", { count: "exact", head: true })
      .eq("status", "active")
      .lte("join_date", currentDate)
      .gte("expiration_date", currentDate)

    if (activeError) throw activeError

    // Get new signups this month
    const { count: newSignupsCount, error: signupsError } = await supabase
      .from("members")
      .select("*", { count: "exact", head: true })
      .gte("join_date", firstDayFormatted)
      .lte("join_date", lastDayFormatted)

    if (signupsError) throw signupsError

    // Get previous month's active members for comparison
    const prevMonth = subMonths(today, 1)
    const prevMonthFormatted = format(prevMonth, "yyyy-MM-dd")

    const { count: prevActiveCount, error: prevActiveError } = await supabase
      .from("members")
      .select("*", { count: "exact", head: true })
      .eq("status", "active")
      .lte("join_date", prevMonthFormatted)
      .gte("expiration_date", prevMonthFormatted)

    if (prevActiveError) throw prevActiveError

    // Calculate percentage change
    const percentageChange = prevActiveCount ? ((activeCount - prevActiveCount) / prevActiveCount) * 100 : 0

    return {
      current: activeCount,
      newSignups: newSignupsCount,
      previous: prevActiveCount,
      percentageChange: Number.parseFloat(percentageChange.toFixed(1)),
    }
  } catch (error) {
    console.error("Error fetching active members metrics:", error)
    throw error
  }
}

// Get monthly revenue metrics
export async function getRevenueMetrics() {
  const today = new Date()
  const firstDayOfMonth = startOfMonth(today)
  const lastDayOfMonth = endOfMonth(today)

  // Format dates for SQL queries
  const firstDayFormatted = format(firstDayOfMonth, "yyyy-MM-dd")
  const lastDayFormatted = format(lastDayOfMonth, "yyyy-MM-dd")

  try {
    // Get current month's revenue
    const { data: currentMonthPayments, error: currentError } = await supabase
      .from("payments")
      .select("amount")
      .gte("payment_date", firstDayFormatted)
      .lte("payment_date", lastDayFormatted)

    if (currentError) throw currentError

    const currentRevenue = currentMonthPayments.reduce((sum, payment) => sum + payment.amount, 0)

    // Get previous month's revenue
    const prevMonth = subMonths(today, 1)
    const prevMonthStart = format(startOfMonth(prevMonth), "yyyy-MM-dd")
    const prevMonthEnd = format(endOfMonth(prevMonth), "yyyy-MM-dd")

    const { data: prevMonthPayments, error: prevError } = await supabase
      .from("payments")
      .select("amount")
      .gte("payment_date", prevMonthStart)
      .lte("payment_date", prevMonthEnd)

    if (prevError) throw prevError

    const prevRevenue = prevMonthPayments.reduce((sum, payment) => sum + payment.amount, 0)

    // Calculate percentage change
    const percentageChange = prevRevenue ? ((currentRevenue - prevRevenue) / prevRevenue) * 100 : 0

    return {
      current: currentRevenue,
      previous: prevRevenue,
      percentageChange: Number.parseFloat(percentageChange.toFixed(1)),
    }
  } catch (error) {
    console.error("Error fetching revenue metrics:", error)
    throw error
  }
}

// Get occupancy metrics based on check-ins
export async function getOccupancyMetrics() {
  const today = new Date()
  const firstDayOfMonth = startOfMonth(today)
  const lastDayOfMonth = endOfMonth(today)

  // Format dates for SQL queries
  const firstDayFormatted = format(firstDayOfMonth, "yyyy-MM-dd")
  const lastDayFormatted = format(lastDayOfMonth, "yyyy-MM-dd")

  try {
    // Get total active members (capacity)
    const { count: totalMembers, error: membersError } = await supabase
      .from("members")
      .select("*", { count: "exact", head: true })
      .eq("status", "active")

    if (membersError) throw membersError

    // Get check-ins this month
    const { data: checkInsData, error: checkInsError } = await supabase
      .from("attendance")
      .select("date")
      .gte("date", firstDayFormatted)
      .lte("date", lastDayFormatted)
      .eq("status", "Present")

    if (checkInsError) throw checkInsError

    // Count check-ins by date manually
    const checkInsByDate = checkInsData.reduce((acc, checkIn) => {
      const date = checkIn.date
      if (!acc[date]) acc[date] = 0
      acc[date]++
      return acc
    }, {})

    const checkIns = Object.keys(checkInsByDate).map((date) => ({
      date,
      count: checkInsByDate[date],
    }))

    // Calculate average daily occupancy
    const totalCheckIns = checkIns.reduce((sum, day) => sum + Number.parseInt(day.count), 0)
    const daysWithData = checkIns.length || 1 // Avoid division by zero
    const avgDailyCheckIns = totalCheckIns / daysWithData

    // Calculate occupancy percentage
    const occupancyPercentage = totalMembers ? (avgDailyCheckIns / totalMembers) * 100 : 0

    // Get previous month's occupancy for comparison
    const prevMonth = subMonths(today, 1)
    const prevMonthStart = format(startOfMonth(prevMonth), "yyyy-MM-dd")
    const prevMonthEnd = format(endOfMonth(prevMonth), "yyyy-MM-dd")

    const { data: prevCheckInsData, error: prevCheckInsError } = await supabase
      .from("attendance")
      .select("date")
      .gte("date", prevMonthStart)
      .lte("date", prevMonthEnd)
      .eq("status", "Present")

    if (prevCheckInsError) throw prevCheckInsError

    // Count check-ins by date manually
    const prevCheckInsByDate = prevCheckInsData.reduce((acc, checkIn) => {
      const date = checkIn.date
      if (!acc[date]) acc[date] = 0
      acc[date]++
      return acc
    }, {})

    const prevCheckIns = Object.keys(prevCheckInsByDate).map((date) => ({
      date,
      count: prevCheckInsByDate[date],
    }))

    const prevTotalCheckIns = prevCheckIns.reduce((sum, day) => sum + Number.parseInt(day.count), 0)
    const prevDaysWithData = prevCheckIns.length || 1
    const prevAvgDailyCheckIns = prevTotalCheckIns / prevDaysWithData
    const prevOccupancyPercentage = totalMembers ? (prevAvgDailyCheckIns / totalMembers) * 100 : 0

    // Calculate percentage change
    const percentageChange = prevOccupancyPercentage
      ? ((occupancyPercentage - prevOccupancyPercentage) / prevOccupancyPercentage) * 100
      : 0

    return {
      current: Math.round(occupancyPercentage),
      previous: Math.round(prevOccupancyPercentage),
      percentageChange: Number.parseFloat(percentageChange.toFixed(1)),
      peakHour: getPeakHour(), // We'll implement this function next
    }
  } catch (error) {
    console.error("Error fetching occupancy metrics:", error)
    throw error
  }
}

// Helper function to get peak hour
async function getPeakHour() {
  try {
    // This would ideally query attendance data with hour information
    // For now, we'll return a placeholder value
    return "6:00 PM - 8:00 PM"
  } catch (error) {
    console.error("Error determining peak hour:", error)
    return "Unknown"
  }
}

// Get revenue trends data for the chart
export async function getRevenueTrends() {
  try {
    const today = new Date()
    const months = []

    // Get data for the last 7 months
    for (let i = 6; i >= 0; i--) {
      const month = subMonths(today, i)
      const monthStart = startOfMonth(month)
      const monthEnd = endOfMonth(month)

      months.push({
        month: format(month, "MMM"),
        startDate: format(monthStart, "yyyy-MM-dd"),
        endDate: format(monthEnd, "yyyy-MM-dd"),
      })
    }

    // Create a placeholder for the result
    const revenueData = []

    // Process each month
    for (const monthData of months) {
      // Fetch payments for this month
      const { data: payments, error } = await supabase
        .from("payments")
        .select("amount, plan")
        .gte("payment_date", monthData.startDate)
        .lte("payment_date", monthData.endDate)

      if (error) throw error

      // Initialize revenue data for this month with all plan types set to 0
      const monthRevenue = {
        month: monthData.month,
        revenue: 0,
        Basic: 0,
        Pro: 0,
        Premium: 0,
        "One-Day Pass": 0,
      }

      // Calculate revenue by plan
      if (payments && payments.length > 0) {
        for (const payment of payments) {
          monthRevenue.revenue += payment.amount

          // Add to the specific plan
          if (payment.plan && monthRevenue.hasOwnProperty(payment.plan)) {
            monthRevenue[payment.plan] += payment.amount
          }
        }
      }

      revenueData.push(monthRevenue)
    }

    return revenueData
  } catch (error) {
    console.error("Error fetching revenue trends:", error)
    // Return placeholder data if there's an error
    return [
      { month: "Jan", revenue: 0, Basic: 0, Pro: 0, Premium: 0, "One-Day Pass": 0 },
      { month: "Feb", revenue: 0, Basic: 0, Pro: 0, Premium: 0, "One-Day Pass": 0 },
      { month: "Mar", revenue: 0, Basic: 0, Pro: 0, Premium: 0, "One-Day Pass": 0 },
      { month: "Apr", revenue: 0, Basic: 0, Pro: 0, Premium: 0, "One-Day Pass": 0 },
      { month: "May", revenue: 0, Basic: 0, Pro: 0, Premium: 0, "One-Day Pass": 0 },
      { month: "Jun", revenue: 0, Basic: 0, Pro: 0, Premium: 0, "One-Day Pass": 0 },
      { month: "Jul", revenue: 0, Basic: 0, Pro: 0, Premium: 0, "One-Day Pass": 0 },
    ]
  }
}

// Get membership trends data
export async function getMembershipTrends() {
  try {
    const today = new Date()
    const months = []

    // Get data for the last 7 months
    for (let i = 6; i >= 0; i--) {
      const month = subMonths(today, i)
      const monthStart = startOfMonth(month)
      const monthEnd = endOfMonth(month)

      months.push({
        month: format(month, "MMM"),
        startDate: format(monthStart, "yyyy-MM-dd"),
        endDate: format(monthEnd, "yyyy-MM-dd"),
      })
    }

    // Create a placeholder for the result
    const membershipData = []

    // Process each month
    for (const monthData of months) {
      try {
        // Active members at the end of the month
        const { data: activeMembers, error: activeError } = await supabase
          .from("members")
          .select("id")
          .lte("join_date", monthData.endDate)
          .gte("expiration_date", monthData.endDate)

        if (activeError) throw activeError

        // Members who churned this month (expired during this month)
        const { data: churnedMembers, error: churnedError } = await supabase
          .from("members")
          .select("id")
          .gte("expiration_date", monthData.startDate)
          .lte("expiration_date", monthData.endDate)
          .lt("expiration_date", today.toISOString())

        if (churnedError) throw churnedError

        membershipData.push({
          month: monthData.month,
          active: activeMembers ? activeMembers.length : 0,
          churned: churnedMembers ? churnedMembers.length : 0,
        })
      } catch (error) {
        console.error(`Error processing month ${monthData.month}:`, error)
        membershipData.push({
          month: monthData.month,
          active: 0,
          churned: 0,
        })
      }
    }

    return membershipData
  } catch (error) {
    console.error("Error fetching membership trends:", error)
    // Return placeholder data if there's an error
    return [
      { month: "Jan", active: 0, churned: 0 },
      { month: "Feb", active: 0, churned: 0 },
      { month: "Mar", active: 0, churned: 0 },
      { month: "Apr", active: 0, churned: 0 },
      { month: "May", active: 0, churned: 0 },
      { month: "Jun", active: 0, churned: 0 },
      { month: "Jul", active: 0, churned: 0 },
    ]
  }
}

// Get equipment usage data
export async function getEquipmentUsage() {
  // This would ideally come from a dedicated table tracking equipment usage
  // For now, we'll return placeholder data
  return [
    { name: "Treadmills", usage: 85 },
    { name: "Bench Press", usage: 72 },
    { name: "Squat Racks", usage: 68 },
    { name: "Dumbbells", usage: 92 },
    { name: "Leg Press", usage: 55 },
    { name: "Cables", usage: 78 },
  ]
}
