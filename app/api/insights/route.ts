import { NextResponse } from "next/server"

export async function GET() {
  // Mock data for AI insights
  const insights = [
    {
      id: 1,
      title: "Member Retention Risk",
      description: "We've identified 12 members at high risk of cancellation.",
      action: "View Members",
      actionLink: "/dashboard/members/at-risk",
      icon: "users",
      color: "yellow",
      priority: "high",
    },
    {
      id: 2,
      title: "Equipment Optimization",
      description: "Adding 2 more treadmills could reduce wait times by 35%.",
      action: "View Analysis",
      actionLink: "/dashboard/equipment/analysis",
      icon: "activity",
      color: "blue",
      priority: "medium",
    },
    {
      id: 3,
      title: "Revenue Opportunity",
      description: "Promoting Pro plan upgrades could increase revenue by $45,000/month.",
      action: "View Strategy",
      actionLink: "/dashboard/revenue/strategy",
      icon: "dollar",
      color: "green",
      priority: "medium",
    },
  ]

  return NextResponse.json(insights)
}

