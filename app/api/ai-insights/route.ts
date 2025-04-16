import { NextResponse } from "next/server"
import { getAllInsights } from "@/utils/ai-insights"

export async function GET() {
  try {
    const insights = await getAllInsights()
    return NextResponse.json(insights)
  } catch (error) {
    console.error("Error fetching AI insights:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch AI insights" },
      { status: 500 },
    )
  }
}

