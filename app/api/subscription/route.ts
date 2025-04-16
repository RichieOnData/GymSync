import { NextResponse } from "next/server"

export async function GET() {
  // Mock data for subscription
  const subscription = {
    plan: "Gym Admin",
    renewalDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
    amount: 14999,
    status: "active",
  }

  return NextResponse.json(subscription)
}

