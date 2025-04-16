import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export async function GET() {
  try {
    // Get all suggestions
    const { data: suggestions, error: suggestionsError } = await supabase.from("suggestions").select("*")

    if (suggestionsError) {
      console.error("Error fetching suggestions:", suggestionsError)
      return NextResponse.json({ success: false, message: suggestionsError.message }, { status: 500 })
    }

    // Get existing insights
    const { data: existingInsights, error: insightsError } = await supabase.from("suggestion_insights").select("*")

    if (insightsError) {
      console.error("Error fetching insights:", insightsError)
      return NextResponse.json({ success: false, message: insightsError.message }, { status: 500 })
    }

    // Process suggestions to generate insights
    const categoryCount: Record<string, number> = {}
    const categoryTrend: Record<string, string> = {}

    suggestions?.forEach((suggestion) => {
      const category = suggestion.category || "Uncategorized"
      categoryCount[category] = (categoryCount[category] || 0) + 1

      // Simple trend analysis based on date (last 30 days vs older)
      const suggestionDate = new Date(suggestion.date)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      if (suggestionDate >= thirtyDaysAgo) {
        categoryTrend[category] = "increasing"
      } else {
        categoryTrend[category] = categoryTrend[category] || "stable"
      }
    })

    // Generate insights
    const insights = Object.keys(categoryCount).map((category) => {
      const existingInsight = existingInsights?.find((insight) => insight.category === category)

      return {
        id: existingInsight?.id || crypto.randomUUID(),
        title: `${category} Feedback Trend`,
        description: `${categoryCount[category]} members have provided feedback related to ${category.toLowerCase()}.`,
        category,
        priority: categoryCount[category] > 5 ? "high" : categoryCount[category] > 2 ? "medium" : "low",
        count: categoryCount[category],
        trend: categoryTrend[category],
        action_items: existingInsight?.action_items || [
          `Review all ${category.toLowerCase()} suggestions`,
          `Develop action plan for ${category.toLowerCase()} improvements`,
        ],
      }
    })

    // Update or insert insights
    for (const insight of insights) {
      const { error } = await supabase.from("suggestion_insights").upsert(insight, { onConflict: "id" })

      if (error) {
        console.error(`Error upserting insight for ${insight.category}:`, error)
      }
    }

    // Return the latest insights
    const { data: updatedInsights, error: finalError } = await supabase
      .from("suggestion_insights")
      .select("*")
      .order("priority", { ascending: false })

    if (finalError) {
      console.error("Error fetching final insights:", finalError)
      return NextResponse.json({ success: false, message: finalError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: updatedInsights })
  } catch (error) {
    console.error("Error in suggestion insights API:", error)
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 })
  }
}

