import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle } from "lucide-react"
import type { ChurnForecast, RevenueForecast } from "@/utils/ai-insights"

interface ChurnForecastCardProps {
  forecast: ChurnForecast
}

export function ChurnForecastCard({ forecast }: ChurnForecastCardProps) {
  // Determine badge color based on churn rate
  const getBadgeColor = () => {
    if (forecast.predictedChurnRate >= 10) return "bg-red-500/10 text-red-500"
    if (forecast.predictedChurnRate >= 5) return "bg-yellow-500/10 text-yellow-500"
    return "bg-green-500/10 text-green-500"
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{forecast.month}</CardTitle>
          <Badge className={getBadgeColor()}>{forecast.predictedChurnRate}% Churn Rate</Badge>
        </div>
        <CardDescription>Confidence: {forecast.confidence}%</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Predicted Churns</span>
            <span className="font-medium">{forecast.predictedChurnCount} members</span>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium">Contributing Factors:</p>
            <ul className="space-y-1">
              {forecast.contributingFactors.map((factor, index) => (
                <li key={index} className="text-sm text-gray-400 flex items-start">
                  <AlertTriangle className="h-3.5 w-3.5 mr-2 mt-0.5 text-yellow-500" />
                  {factor}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface RevenueForecastCardProps {
  forecast: RevenueForecast
}

export function RevenueForecastCard({ forecast }: RevenueForecastCardProps) {
  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{forecast.month}</CardTitle>
          <Badge className="bg-green-500/10 text-green-500">₹{forecast.totalRevenue.toLocaleString()}</Badge>
        </div>
        <CardDescription>Confidence: {forecast.confidence}%</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Expected Renewals</span>
            <span className="font-medium">{forecast.renewalCount} members</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">New Members</span>
            <span className="font-medium">{forecast.newMemberCount} members</span>
          </div>

          <div className="space-y-1 pt-1">
            <p className="text-sm font-medium">Revenue by Plan:</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(forecast.revenueByPlan).map(([plan, amount]) => (
                <div key={plan} className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">{plan}</span>
                  <span className="text-xs font-medium">₹{amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

