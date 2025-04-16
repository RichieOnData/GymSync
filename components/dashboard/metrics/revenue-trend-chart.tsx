"use client"

import { useState, useEffect } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { subMonths, format, startOfMonth, endOfMonth } from "date-fns"
import type { Member } from "@/types/member"

interface RevenueTrendChartProps {
  paymentsData: any[]
  members: Member[]
}

export function RevenueTrendChart({ paymentsData, members }: RevenueTrendChartProps) {
  const [chartData, setChartData] = useState<any[]>([])

  useEffect(() => {
    if (!paymentsData.length) return

    // Generate data for the last 6 months
    const today = new Date()
    const chartData = []

    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(today, i)
      const monthStart = startOfMonth(monthDate)
      const monthEnd = endOfMonth(monthDate)
      const monthLabel = format(monthDate, "MMM yyyy")

      // Filter payments for this month
      const monthPayments = paymentsData.filter((payment) => {
        const paymentDate = new Date(payment.payment_date)
        return paymentDate >= monthStart && paymentDate <= monthEnd
      })

      // Calculate revenue by plan
      const basicRevenue = monthPayments
        .filter((payment) => payment.membership_plan === "Basic")
        .reduce((sum, payment) => sum + payment.amount, 0)

      const proRevenue = monthPayments
        .filter((payment) => payment.membership_plan === "Pro")
        .reduce((sum, payment) => sum + payment.amount, 0)

      const premiumRevenue = monthPayments
        .filter((payment) => payment.membership_plan === "Premium")
        .reduce((sum, payment) => sum + payment.amount, 0)

      const oneDayPassRevenue = monthPayments
        .filter((payment) => payment.membership_plan === "One-Day Pass")
        .reduce((sum, payment) => sum + payment.amount, 0)

      chartData.push({
        month: monthLabel,
        Basic: basicRevenue,
        Pro: proRevenue,
        Premium: premiumRevenue,
        "One-Day Pass": oneDayPassRevenue,
        total: basicRevenue + proRevenue + premiumRevenue + oneDayPassRevenue,
      })
    }

    setChartData(chartData)
  }, [paymentsData])

  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis dataKey="month" stroke="#888" />
          <YAxis stroke="#888" />
          <Tooltip
            contentStyle={{ backgroundColor: "#222", border: "none" }}
            itemStyle={{ color: "#fff" }}
            formatter={(value) => [`₹${value.toLocaleString()}`, ""]}
          />
          <Legend />
          <Bar dataKey="Basic" name="Basic Plan" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Pro" name="Pro Plan" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Premium" name="Premium Plan" fill="#ef4444" radius={[4, 4, 0, 0]} />
          <Bar dataKey="One-Day Pass" name="One-Day Pass" fill="#10b981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

