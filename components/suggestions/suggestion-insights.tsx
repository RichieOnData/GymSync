"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Lightbulb, TrendingUp, AlertTriangle } from "lucide-react"
import type { SuggestionInsight } from "@/types/suggestion"

interface SuggestionInsightsProps {
  insights: SuggestionInsight[]
}

export function SuggestionInsights({ insights }: SuggestionInsightsProps) {
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            High Priority
          </Badge>
        )
      case "medium":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-500/10 text-yellow-500 border-yellow-500 flex items-center gap-1"
          >
            <TrendingUp className="h-3 w-3" />
            Medium Priority
          </Badge>
        )
      case "low":
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500 flex items-center gap-1">
            <Lightbulb className="h-3 w-3" />
            Low Priority
          </Badge>
        )
      default:
        return null
    }
  }

  const getActionTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      equipment: "bg-purple-500/10 text-purple-500 border-purple-500",
      class: "bg-blue-500/10 text-blue-500 border-blue-500",
      membership: "bg-pink-500/10 text-pink-500 border-pink-500",
      facility: "bg-orange-500/10 text-orange-500 border-orange-500",
      staff: "bg-cyan-500/10 text-cyan-500 border-cyan-500",
      other: "bg-gray-500/10 text-gray-500 border-gray-500",
    }

    return (
      <Badge variant="outline" className={colors[type] || colors.other}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    )
  }

  if (insights.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <Lightbulb className="mx-auto h-12 w-12 opacity-20 mb-2" />
        <p>No insights available yet.</p>
        <p className="text-sm">Add more suggestions to generate AI insights.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {insights.map((insight) => (
        <Card key={insight.id} className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg">{insight.title}</CardTitle>
              {getPriorityBadge(insight.priority)}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-300 mb-4">{insight.description}</p>

            <div className="flex flex-wrap gap-2 mb-4">
              {getActionTypeBadge(insight.actionType)}
              {insight.themes.map((theme, index) => (
                <Badge key={index} variant="outline" className="bg-zinc-800 text-gray-300 border-zinc-700">
                  {theme}
                </Badge>
              ))}
            </div>

            <div className="bg-black/30 p-3 rounded-md">
              <p className="text-sm font-medium text-gray-300">Suggested Action:</p>
              <p className="text-sm text-gray-400 mt-1">{insight.suggestedAction}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

