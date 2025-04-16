import { type MembershipPlan, SUBSCRIPTION_PLANS } from "@/types/member"

interface MembershipBadgeProps {
  plan: MembershipPlan
}

export function MembershipBadge({ plan }: MembershipBadgeProps) {
  const planDetails = SUBSCRIPTION_PLANS.find((p) => p.name === plan)

  if (!planDetails) {
    return null
  }

  const getBadgeClasses = () => {
    switch (planDetails.color) {
      case "blue":
        return "bg-blue-500/10 text-blue-500"
      case "purple":
        return "bg-purple-500/10 text-purple-500"
      case "red":
        return "bg-red-500/10 text-red-500"
      case "green":
        return "bg-green-500/10 text-green-500"
      default:
        return "bg-gray-500/10 text-gray-500"
    }
  }

  return <span className={`px-2 py-1 rounded-full text-xs ${getBadgeClasses()}`}>{plan}</span>
}

