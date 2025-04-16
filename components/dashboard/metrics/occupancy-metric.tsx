"use client"

import { ArrowUpRight, ArrowDownRight, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"

interface OccupancyMetricProps {
  attendanceData: any[]
  totalMembers: number
}

export function OccupancyMetric({ attendanceData, totalMembers }: OccupancyMetricProps) {
  const [currentOccupancy, setCurrentOccupancy] = useState(0)
  const [previousOccupancy, setPreviousOccupancy] = useState(0)
  const [peakHour, setPeakHour] = useState<number | null>(null)

  useEffect(() => {
    if (!attendanceData.length || totalMembers === 0) return

    const now = new Date()
    const currentDay = now.getDate()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    // Get attendance for today
    const todayAttendance = attendanceData.filter((record) => {
      const recordDate = new Date(record.check_in_time)
      return (
        recordDate.getDate() === currentDay &&
        recordDate.getMonth() === currentMonth &&
        recordDate.getFullYear() === currentYear
      )
    })

    // Calculate current occupancy as percentage of total members
    const uniqueVisitorsToday = new Set(todayAttendance.map((record) => record.member_id)).size
    const currentOccupancyRate = (uniqueVisitorsToday / totalMembers) * 100
    setCurrentOccupancy(Math.round(currentOccupancyRate))

    // Get attendance for yesterday
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayDay = yesterday.getDate()
    const yesterdayMonth = yesterday.getMonth()
    const yesterdayYear = yesterday.getFullYear()

    const yesterdayAttendance = attendanceData.filter((record) => {
      const recordDate = new Date(record.check_in_time)
      return (
        recordDate.getDate() === yesterdayDay &&
        recordDate.getMonth() === yesterdayMonth &&
        recordDate.getFullYear() === yesterdayYear
      )
    })

    // Calculate yesterday's occupancy
    const uniqueVisitorsYesterday = new Set(yesterdayAttendance.map((record) => record.member_id)).size
    const yesterdayOccupancyRate = (uniqueVisitorsYesterday / totalMembers) * 100
    setPreviousOccupancy(Math.round(yesterdayOccupancyRate))

    // Find peak hour
    const hourCounts: Record<number, number> = {}

    todayAttendance.forEach((record) => {
      const recordDate = new Date(record.check_in_time)
      const hour = recordDate.getHours()
      hourCounts[hour] = (hourCounts[hour] || 0) + 1
    })

    let maxCount = 0
    let maxHour = null

    for (const [hour, count] of Object.entries(hourCounts)) {
      if (count > maxCount) {
        maxCount = count as number
        maxHour = Number.parseInt(hour)
      }
    }

    setPeakHour(maxHour)
  }, [attendanceData, totalMembers])

  // Calculate percentage change
  const percentageChange =
    previousOccupancy > 0 ? ((currentOccupancy - previousOccupancy) / previousOccupancy) * 100 : 0

  const isPositive = percentageChange >= 0

  return (
    <Card className="bg-zinc-900 border-zinc-800 overflow-hidden relative">
      <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-purple-500/10 to-transparent" />
      <CardHeader className="pb-2 relative">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-purple-500" />
          <CardTitle className="text-sm font-medium text-gray-400">Average Occupancy</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="relative">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold">{currentOccupancy}%</div>
            <div className="text-xs text-gray-400 mt-1">Of total capacity</div>
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
                <p>Change from yesterday ({previousOccupancy}%)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {peakHour !== null && (
          <div className="mt-3">
            <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500">
              Peak hour: {peakHour}:00 - {(peakHour + 1) % 24}:00
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

