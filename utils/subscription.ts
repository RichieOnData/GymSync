import { addDays, addMonths, differenceInDays, isBefore } from "date-fns"
import { type MembershipPlan, SUBSCRIPTION_PLANS, type ExpirationStatus } from "@/types/member"

export function calculateExpirationDate(joinDate: string, plan: MembershipPlan): string {
  const joinDateObj = new Date(joinDate)
  const planDetails = SUBSCRIPTION_PLANS.find((p) => p.name === plan)

  if (!planDetails) {
    throw new Error(`Invalid plan: ${plan}`)
  }

  let expirationDate: Date

  if (planDetails.durationDays) {
    expirationDate = addDays(joinDateObj, planDetails.durationDays)
  } else {
    expirationDate = addMonths(joinDateObj, planDetails.durationMonths!)
  }

  return expirationDate.toISOString().split("T")[0]
}

export function getExpirationStatus(expirationDate: string): ExpirationStatus {
  const today = new Date()
  const expDate = new Date(expirationDate)

  if (isBefore(expDate, today)) {
    return "expired"
  }

  const daysUntilExpiration = differenceInDays(expDate, today)

  if (daysUntilExpiration <= 7) {
    return "expiring-soon"
  }

  return "active"
}

export function getDaysUntilExpiration(expirationDate: string): number {
  const today = new Date()
  const expDate = new Date(expirationDate)

  return Math.max(0, differenceInDays(expDate, today))
}

export function getPlanPrice(plan: MembershipPlan): number {
  const planDetails = SUBSCRIPTION_PLANS.find((p) => p.name === plan)
  if (!planDetails) {
    throw new Error(`Invalid plan: ${plan}`)
  }
  return planDetails.price
}

