import { NextResponse } from "next/server"

export async function GET() {
  // Mock data for billing
  const billing = {
    activeSubscriptions: [
      {
        id: 1,
        plan: "Gym Admin",
        startDate: "2023-01-15",
        renewalDate: "2023-08-15",
        amount: 14999,
        status: "active",
      },
    ],
    paymentHistory: [
      {
        id: 1,
        date: "2023-07-15",
        amount: 14999,
        method: "Credit Card",
        status: "completed",
      },
      {
        id: 2,
        date: "2023-06-15",
        amount: 14999,
        method: "Credit Card",
        status: "completed",
      },
      {
        id: 3,
        date: "2023-05-15",
        amount: 14999,
        method: "Credit Card",
        status: "completed",
      },
      {
        id: 4,
        date: "2023-04-15",
        amount: 14999,
        method: "Credit Card",
        status: "completed",
      },
      {
        id: 5,
        date: "2023-03-15",
        amount: 14999,
        method: "Credit Card",
        status: "completed",
      },
      {
        id: 6,
        date: "2023-02-15",
        amount: 14999,
        method: "Credit Card",
        status: "completed",
      },
      {
        id: 7,
        date: "2023-01-15",
        amount: 14999,
        method: "Credit Card",
        status: "completed",
      },
    ],
    revenueTrends: [
      { month: "Jan", revenue: 14999 },
      { month: "Feb", revenue: 14999 },
      { month: "Mar", revenue: 14999 },
      { month: "Apr", revenue: 14999 },
      { month: "May", revenue: 14999 },
      { month: "Jun", revenue: 14999 },
      { month: "Jul", revenue: 14999 },
    ],
  }

  return NextResponse.json(billing)
}

