import { NextResponse } from "next/server"

export async function GET() {
  // Mock data for metrics
  const metrics = {
    activeMembers: {
      current: 192,
      previous: 183,
      percentageChange: 4.9,
    },
    revenue: {
      current: 22000,
      previous: 19500,
      percentageChange: 12.8,
    },
    occupancy: {
      current: 68,
      previous: 70,
      percentageChange: -2.9,
    },
  }

  return NextResponse.json(metrics)
}

