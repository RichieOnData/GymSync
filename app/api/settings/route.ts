import { NextResponse } from "next/server"

export async function GET() {
  // Mock data for settings
  const settings = {
    profile: {
      name: "Vikram Singh",
      email: "vikram.singh@gymsync.com",
      role: "Gym Owner",
    },
    aiRules: [
      {
        id: 1,
        name: "Member Retention Alerts",
        description: "Get alerts when members are at risk of cancellation",
        enabled: true,
      },
      {
        id: 2,
        name: "Equipment Usage Optimization",
        description: "Receive suggestions for optimizing equipment placement and purchases",
        enabled: true,
      },
      {
        id: 3,
        name: "Staff Scheduling Assistance",
        description: "AI-powered recommendations for optimal staff scheduling",
        enabled: false,
      },
      {
        id: 4,
        name: "Revenue Enhancement Suggestions",
        description: "Get suggestions for increasing gym revenue",
        enabled: true,
      },
      {
        id: 5,
        name: "Automated Member Communications",
        description: "Send automated emails and notifications to members",
        enabled: false,
      },
    ],
    notifications: {
      email: true,
      push: true,
      sms: false,
    },
  }

  return NextResponse.json(settings)
}

export async function PUT(request: Request) {
  const updatedSettings = await request.json()

  // In a real app, you would update this in a database
  // For now, we'll just return the updated settings

  return NextResponse.json(updatedSettings)
}

