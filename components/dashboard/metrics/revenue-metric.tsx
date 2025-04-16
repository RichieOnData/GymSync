"use client"

import { ArrowUpRight, ArrowDownRight, DollarSign } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"

interface RevenueMetricProps {
  paymentsData: any[]
}

export function RevenueMetric({ paymentsData }: RevenueMetricProps) {
  const [currentMonthRevenue, setCurrentMonthRevenue] = useState(0)
  const [previousMonthRevenue, setPreviousMonthRevenue] = useState(0)
  const [topTier, setTopTier] = useState<string | null>(null)

  useEffect(() => {
    if (!paymentsData.length) return

    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear

    // Calculate current month revenue
    const currentMonthPayments = paymentsData.filter((payment) => {
      const paymentDate = new Date(payment.payment_date)
      return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear
    })

    const currentTotal = currentMonthPayments.reduce((sum, payment) => sum + payment.amount, 0)
    setCurrentMonthRevenue(currentTotal)

    // Calculate previous month revenue
    const previousMonthPayments = paymentsData.filter((payment) => {
      const paymentDate = new Date(payment.payment_date)
      return paymentDate.getMonth() === previousMonth && paymentDate.getFullYear() === previousYear
    })

    const previousTotal = previousMonthPayments.reduce((sum, payment) => sum + payment.amount, 0)
    setPreviousMonthRevenue(previousTotal)

    // Find top performing tier
    const tierRevenue: Record<string, number> = {}
    currentMonthPayments.forEach((payment) => {
      const tier = payment.membership_plan
      tierRevenue[tier] = (tierRevenue[tier] || 0) + payment.amount
    })

    let maxRevenue = 0
    let maxTier = null

    for (const [tier, revenue] of Object.entries(tierRevenue)) {
      if (revenue > maxRevenue) {
        maxRevenue = revenue
        maxTier = tier
      }
    }

    setTopTier(maxTier)
  }, [paymentsData])

  // Calculate percentage change
  const percentageChange =
    previousMonthRevenue > 0 ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 : 0

  const isPositive = percentageChange >= 0

  return (
    <Card className="bg-zinc-900 border-zinc-800 overflow-hidden relative">
      <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-green-500/10 to-transparent" />
      <CardHeader className="pb-2 relative">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-green-500" />
          <CardTitle className="text-sm font-medium text-gray-400">Monthly Revenue</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="relative">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold">₹{currentMonthRevenue.toLocaleString()}</div>
            <div className="text-xs text-gray-400 mt-1">This month's earnings</div>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={`flex items-center ${isPositive ? "text-green-500" : "text-red-500"}`}>
                  {isPositive ? <ArrowUpRight className="mr-1 h-4 w-4" /> : <ArrowDownRight className="mr-1 h-4 w-4" />}
                  <span className="text-sm">
                    {isPositive ? "+" : ""}
                    {percentageChange.toFixed(1)}%
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Change from previous month (₹{previousMonthRevenue.toLocaleString()})</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {topTier && (
          <div className="mt-3">
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500">
              Top tier: {topTier}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

