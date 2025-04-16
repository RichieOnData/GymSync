export type MembershipPlan = "Basic" | "Pro" | "Premium" | "One-Day Pass"

export interface Member {
  id: string
  name: string
  age: number
  address: string
  email: string
  phone: string
  registration_number: string
  membership_plan: MembershipPlan
  join_date: string
  expiration_date: string
  status: "active" | "inactive" | "expired"
}

export interface SubscriptionPlanDetails {
  name: MembershipPlan
  durationMonths?: number
  durationDays?: number
  price: number
  color: string
}

export const SUBSCRIPTION_PLANS: SubscriptionPlanDetails[] = [
  { name: "Basic", durationMonths: 2, price: 1000, color: "blue" },
  { name: "Pro", durationMonths: 6, price: 4000, color: "purple" },
  { name: "Premium", durationMonths: 12, price: 7000, color: "red" },
  { name: "One-Day Pass", durationDays: 1, price: 200, color: "green" },
]

export type ExpirationStatus = "active" | "expiring-soon" | "expired"

export interface ExpirationStatusDetails {
  status: ExpirationStatus
  label: string
  color: string
}

export const EXPIRATION_STATUSES: ExpirationStatusDetails[] = [
  { status: "active", label: "Active", color: "green" },
  { status: "expiring-soon", label: "Expiring Soon", color: "yellow" },
  { status: "expired", label: "Expired", color: "red" },
]

export interface Payment {
  id: string
  member_id: string
  amount: number
  plan: MembershipPlan
  payment_date: string
  expiration_date: string
  payment_id?: string
  order_id?: string
}

export interface Attendance {
  id: string
  member_id: string
  date: string
  status: "Present" | "Absent"
}

export interface Suggestion {
  id: string
  member_id: string
  message: string
  date: string
  status: "New" | "Read" | "Resolved"
}

