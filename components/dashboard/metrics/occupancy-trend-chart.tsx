"use client"

import { useState, useEffect } from "react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { subDays, format } from "date-fns"

interface OccupancyTrendChartProps {
  attendanceData: any[]
}

export function OccupancyTrendChart({ attendanceData }: OccupancyTrendChartProps) {
  const [chartData, setChartData] = useState<any[]>([])

  useEffect(() => {
    if (!attendanceData.length) return

    // Generate data for the last 14 days
    const today = new Date()
    const chartData = []

    for (let i = 13; i >= 0; i--) {
      const day = subDays(today, i)
      const dayStr = format(day, "yyyy-MM-dd")
      const dayLabel = format(day, "MMM dd")

      // Count check-ins for this day
      const dayAttendance = attendanceData.filter((record) => {
        return record.check_in_time.startsWith(dayStr)
      })

      // Count unique visitors
      const uniqueVisitors = new Set(dayAttendance.map((record) => record.member_id)).size

      // Calculate morning, afternoon, and evening occupancy
      const morningAttendance = dayAttendance.filter((record) => {
        const hour = new Date(record.check_in_time).getHours()
        return hour >= 6 && hour < 12
      }).length

      const afternoonAttendance = dayAttendance.filter((record) => {
        const hour = new Date(record.check_in_time).getHours()
        return hour >= 12 && hour < 18
      }).length

      const eveningAttendance = dayAttendance.filter((record) => {
        const hour = new Date(record.check_in_time).getHours()
        return hour >= 18 || hour < 6
      }).length

      chartData.push({
        day: dayLabel,
        visitors: uniqueVisitors,
        morning: morningAttendance,
        afternoon: afternoonAttendance,
        evening: eveningAttendance,
      })
    }

    setChartData(chartData)
  }, [attendanceData])

  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis dataKey="day" stroke="#888" />
          <YAxis stroke="#888" />
          <Tooltip contentStyle={{ backgroundColor: "#222", border: "none" }} itemStyle={{ color: "#fff" }} />
          <Area
            type="monotone"
            dataKey="visitors"
            name="Unique Visitors"
            stroke="#8b5cf6"
            fill="#8b5cf6"
            fillOpacity={0.3}
          />
          <Area
            type="monotone"
            dataKey="morning"
            name="Morning (6AM-12PM)"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.3}
          />
          <Area
            type="monotone"
            dataKey="afternoon"
            name="Afternoon (12PM-6PM)"
            stroke="#f59e0b"
            fill="#f59e0b"
            fillOpacity={0.3}
          />
          <Area
            type="monotone"
            dataKey="evening"
            name="Evening (6PM-6AM)"
            stroke="#ef4444"
            fill="#ef4444"
            fillOpacity={0.3}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

