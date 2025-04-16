import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpRight, Users, DollarSign, TrendingDown, Calendar } from "lucide-react"

interface InsightsSummaryProps {
  summary: {
    potentialRevenueIncrease: number
    highRiskMemberCount: number
    averageChurnRate: number
    nextMonthRevenue: number
    upcomingRenewals: number
  }
}

export function InsightsSummary({ summary }: InsightsSummaryProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
            <DollarSign className="h-4 w-4 mr-1 text-green-500" />
            Revenue Opportunity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold flex items-center">
            ₹{summary.potentialRevenueIncrease.toLocaleString()}
            <ArrowUpRight className="ml-1 h-4 w-4 text-green-500" />
          </div>
          <p className="text-xs text-gray-400">Potential monthly increase</p>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
            <Users className="h-4 w-4 mr-1 text-yellow-500" />
            At-Risk Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.highRiskMemberCount}</div>
          <p className="text-xs text-gray-400">Members needing attention</p>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
            <TrendingDown className="h-4 w-4 mr-1 text-red-500" />
            Predicted Churn
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.averageChurnRate.toFixed(1)}%</div>
          <p className="text-xs text-gray-400">Average monthly rate</p>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
            <DollarSign className="h-4 w-4 mr-1 text-blue-500" />
            Next Month Revenue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₹{summary.nextMonthRevenue.toLocaleString()}</div>
          <p className="text-xs text-gray-400">Forecasted billing</p>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
            <Calendar className="h-4 w-4 mr-1 text-purple-500" />
            Upcoming Renewals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.upcomingRenewals}</div>
          <p className="text-xs text-gray-400">In the next 30 days</p>
        </CardContent>
      </Card>
    </div>
  )
}

