"use client"

import { useState, useEffect } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import type { Member } from "@/types/member"
import { subMonths, format, startOfMonth, endOfMonth } from "date-fns"

interface MembershipTrendChartProps {
  members: Member[]
}

export function MembershipTrendChart({ members }: MembershipTrendChartProps) {
  const [chartData, setChartData] = useState<any[]>([])

  useEffect(() => {
    if (!members.length) return

    // Generate data for the last 6 months
    const today = new Date()
    const chartData = []

    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(today, i)
      const monthStart = startOfMonth(monthDate)
      const monthEnd = endOfMonth(monthDate)
      const monthLabel = format(monthDate, "MMM yyyy")

      // Count active members for this month
      const activeMembersCount = members.filter((member) => {
        const joinDate = new Date(member.join_date)
        const expirationDate = new Date(member.expiration_date)

        // Member was active during this month if:
        // 1. They joined before or during this month
        // 2. Their membership expires after this month started
        return joinDate <= monthEnd && expirationDate >= monthStart
      }).length

      // Count new signups for this month
      const newSignupsCount = members.filter((member) => {
        const joinDate = new Date(member.join_date)
        return joinDate >= monthStart && joinDate <= monthEnd
      }).length

      // Count expired members for this month
      const expiredMembersCount = members.filter((member) => {
        const expirationDate = new Date(member.expiration_date)
        return expirationDate >= monthStart && expirationDate <= monthEnd
      }).length

      chartData.push({
        month: monthLabel,
        active: activeMembersCount,
        newSignups: newSignupsCount,
        expired: expiredMembersCount,
      })
    }

    setChartData(chartData)
  }, [members])

  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis dataKey="month" stroke="#888" />
          <YAxis stroke="#888" />
          <Tooltip contentStyle={{ backgroundColor: "#222", border: "none" }} itemStyle={{ color: "#fff" }} />
          <Legend />
          <Line
            type="monotone"
            dataKey="active"
            name="Active Members"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="newSignups"
            name="New Sign-ups"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="expired"
            name="Expired Memberships"
            stroke="#ef4444"
            strokeWidth={2}
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

