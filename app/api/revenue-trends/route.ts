import { NextResponse } from "next/server"

export async function GET() {
  // Mock data for revenue trends
  const revenueTrends = [
    { month: "Jan", revenue: 12500 },
    { month: "Feb", revenue: 14200 },
    { month: "Mar", revenue: 15800 },
    { month: "Apr", revenue: 16200 },
    { month: "May", revenue: 18900 },
    { month: "Jun", revenue: 19500 },
    { month: "Jul", revenue: 22000 },
  ]

  return NextResponse.json(revenueTrends)
}

