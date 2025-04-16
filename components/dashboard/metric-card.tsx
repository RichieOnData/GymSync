import { ArrowUpRight, ArrowDownRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface MetricCardProps {
  title: string
  value: string | number
  percentageChange: number
  prefix?: string
  suffix?: string
  subtitle?: string
}

export function MetricCard({ title, value, percentageChange, prefix = "", suffix = "", subtitle }: MetricCardProps) {
  const isPositive = percentageChange >= 0

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-400">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-3xl font-bold">
            {prefix}
            {typeof value === "number" ? value.toLocaleString() : value}
            {suffix}
          </div>
          <div className={`flex items-center ${isPositive ? "text-green-500" : "text-red-500"}`}>
            {isPositive ? <ArrowUpRight className="mr-1 h-4 w-4" /> : <ArrowDownRight className="mr-1 h-4 w-4" />}
            <span className="text-sm">
              {isPositive ? "+" : ""}
              {percentageChange.toFixed(1)}%
            </span>
          </div>
        </div>
        {subtitle ? (
          <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
        ) : (
          <p className="text-xs text-gray-400 mt-1">vs. previous month</p>
        )}
      </CardContent>
    </Card>
  )
}

