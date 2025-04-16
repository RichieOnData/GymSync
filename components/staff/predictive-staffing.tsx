"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns"
import { AlertTriangle, Calendar } from "lucide-react"

interface PredictiveStaffingProps {
  staff: any[]
  attendance: any[]
  shifts: any[]
  isLoading: boolean
}

export function PredictiveStaffing({ staff, attendance, shifts, isLoading }: PredictiveStaffingProps) {
  const [staffingNeeds, setStaffingNeeds] = useState<any[]>([])
  const [staffingAlerts, setStaffingAlerts] = useState<any[]>([])

  // Generate predictive staffing data
  useEffect(() => {
    if (isLoading) return

    // Get the next 7 days
    const today = new Date()
    const nextWeekStart = startOfWeek(addDays(today, 1))
    const nextWeekEnd = endOfWeek(addDays(today, 7))
    const nextWeekDays = eachDayOfInterval({ start: nextWeekStart, end: nextWeekEnd })

    // Generate staffing needs for each day
    const needs = nextWeekDays.map((day) => {
      const dayOfWeek = day.getDay()
      const dayName = format(day, "EEEE")
      const formattedDate = format(day, "MMM d")

      // Calculate morning and evening staff needs based on historical data
      // This is a simplified model - in a real app, this would use more sophisticated algorithms
      const morningStaffNeeded = Math.max(2, Math.floor(Math.random() * 3) + 2)
      const eveningStaffNeeded = Math.max(2, Math.floor(Math.random() * 3) + 2)

      // Count available staff for each shift
      const morningStaffAvailable = staff.filter(
        (s) => s.status === "active" && (s.shift_type === "morning" || s.shift_type === "flexible"),
      ).length

      const eveningStaffAvailable = staff.filter(
        (s) => s.status === "active" && (s.shift_type === "evening" || s.shift_type === "flexible"),
      ).length

      // Check for understaffing
      const isMorningUnderstaffed = morningStaffNeeded > morningStaffAvailable
      const isEveningUnderstaffed = eveningStaffNeeded > eveningStaffAvailable

      return {
        date: day,
        dayName,
        formattedDate,
        morningStaffNeeded,
        eveningStaffNeeded,
        morningStaffAvailable,
        eveningStaffAvailable,
        isMorningUnderstaffed,
        isEveningUnderstaffed,
      }
    })

    setStaffingNeeds(needs)

    // Generate staffing alerts
    const alerts = needs
      .filter((day) => day.isMorningUnderstaffed || day.isEveningUnderstaffed)
      .map((day) => ({
        date: day.date,
        dayName: day.dayName,
        formattedDate: day.formattedDate,
        shift: day.isMorningUnderstaffed ? "morning" : "evening",
        staffNeeded: day.isMorningUnderstaffed ? day.morningStaffNeeded : day.eveningStaffNeeded,
        staffAvailable: day.isMorningUnderstaffed ? day.morningStaffAvailable : day.eveningStaffAvailable,
        shortfall: day.isMorningUnderstaffed
          ? day.morningStaffNeeded - day.morningStaffAvailable
          : day.eveningStaffNeeded - day.eveningStaffAvailable,
      }))

    setStaffingAlerts(alerts)
  }, [staff, attendance, shifts, isLoading])

  const getAvailableStaffForAlert = (shift: string) => {
    return staff
      .filter((s) => s.status === "active" && s.shift_type !== shift && s.shift_type !== "flexible")
      .map((s) => ({
        id: s.id,
        name: s.name,
        currentShift: s.shift_type,
      }))
  }

  if (isLoading) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Staffing Alerts */}
      {staffingAlerts.length > 0 && (
        <Card className="bg-red-500/10 border-red-500">
          <CardHeader>
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              <CardTitle>Staffing Alerts</CardTitle>
            </div>
            <CardDescription className="text-gray-300">
              The following days are predicted to be understaffed based on historical data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {staffingAlerts.map((alert, index) => {
                const availableStaff = getAvailableStaffForAlert(alert.shift)

                return (
                  <div key={index} className="bg-zinc-900 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          {alert.dayName}, {alert.formattedDate}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {alert.shift.charAt(0).toUpperCase() + alert.shift.slice(1)} shift
                        </p>
                      </div>
                      <Badge className="bg-red-500/10 text-red-500 border-red-500">
                        {alert.shortfall} staff shortage
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-zinc-800 p-3 rounded-md">
                        <p className="text-sm text-gray-400">Staff Needed</p>
                        <p className="text-xl font-bold">{alert.staffNeeded}</p>
                      </div>
                      <div className="bg-zinc-800 p-3 rounded-md">
                        <p className="text-sm text-gray-400">Staff Available</p>
                        <p className="text-xl font-bold">{alert.staffAvailable}</p>
                      </div>
                    </div>

                    {availableStaff.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Suggested Staff to Reassign:</h4>
                        <div className="space-y-2">
                          {availableStaff.slice(0, 3).map((staff) => (
                            <div
                              key={staff.id}
                              className="flex items-center justify-between bg-zinc-800 p-2 rounded-md"
                            >
                              <div className="flex items-center">
                                <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center mr-2">
                                  {staff.name.charAt(0).toUpperCase()}
                                </div>
                                <span>{staff.name}</span>
                              </div>
                              <Badge
                                variant="outline"
                                className={
                                  staff.currentShift === "morning"
                                    ? "bg-blue-500/10 text-blue-500 border-blue-500"
                                    : "bg-purple-500/10 text-purple-500 border-purple-500"
                                }
                              >
                                {staff.currentShift.charAt(0).toUpperCase() + staff.currentShift.slice(1)}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <Button className="w-full bg-red-600 hover:bg-red-700">Send Alert to Management</Button>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weekly Staffing Forecast */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle>Weekly Staffing Forecast</CardTitle>
          <CardDescription>Predicted staffing needs for the upcoming week based on historical data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={staffingNeeds} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="formattedDate" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip contentStyle={{ backgroundColor: "#222", border: "none" }} itemStyle={{ color: "#fff" }} />
                  <Legend />
                  <Bar name="Morning Staff Needed" dataKey="morningStaffNeeded" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar
                    name="Morning Staff Available"
                    dataKey="morningStaffAvailable"
                    fill="#93c5fd"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar name="Evening Staff Needed" dataKey="eveningStaffNeeded" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  <Bar
                    name="Evening Staff Available"
                    dataKey="eveningStaffAvailable"
                    fill="#c4b5fd"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-zinc-800 border-zinc-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Morning Shift Staffing</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {staffingNeeds.map((day, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          <span>
                            {day.formattedDate} ({day.dayName.substring(0, 3)})
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span className="mr-2">
                            {day.morningStaffAvailable} / {day.morningStaffNeeded}
                          </span>
                          {day.isMorningUnderstaffed ? (
                            <Badge className="bg-red-500/10 text-red-500 border-red-500">Understaffed</Badge>
                          ) : (
                            <Badge className="bg-green-500/10 text-green-500 border-green-500">Adequate</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-800 border-zinc-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Evening Shift Staffing</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {staffingNeeds.map((day, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          <span>
                            {day.formattedDate} ({day.dayName.substring(0, 3)})
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span className="mr-2">
                            {day.eveningStaffAvailable} / {day.eveningStaffNeeded}
                          </span>
                          {day.isEveningUnderstaffed ? (
                            <Badge className="bg-red-500/10 text-red-500 border-red-500">Understaffed</Badge>
                          ) : (
                            <Badge className="bg-green-500/10 text-green-500 border-green-500">Adequate</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Historical Occupancy Patterns */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle>Historical Occupancy Patterns</CardTitle>
          <CardDescription>Average gym occupancy by day and hour based on the last 90 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="hour" type="category" allowDuplicatedCategory={false} stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip contentStyle={{ backgroundColor: "#222", border: "none" }} itemStyle={{ color: "#fff" }} />
                <Legend />

                {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day, index) => {
                  const color = [
                    "#ef4444", // Sunday - red
                    "#3b82f6", // Monday - blue
                    "#10b981", // Tuesday - green
                    "#f59e0b", // Wednesday - amber
                    "#8b5cf6", // Thursday - purple
                    "#ec4899", // Friday - pink
                    "#6366f1", // Saturday - indigo
                  ][index]

                  // Generate sample data for each day
                  const data = Array.from({ length: 24 }, (_, i) => {
                    // Create a pattern that peaks during typical gym hours
                    let value = 0
                    if (i >= 6 && i <= 22) {
                      // Morning peak (6-10 AM)
                      if (i >= 6 && i <= 10) {
                        value = 30 + Math.floor(Math.random() * 30)
                      }
                      // Afternoon lull (11 AM - 3 PM)
                      else if (i >= 11 && i <= 15) {
                        value = 20 + Math.floor(Math.random() * 20)
                      }
                      // Evening peak (4-8 PM)
                      else if (i >= 16 && i <= 20) {
                        value = 40 + Math.floor(Math.random() * 40)
                      }
                      // Late night (9-10 PM)
                      else {
                        value = 15 + Math.floor(Math.random() * 15)
                      }
                    } else {
                      // Early morning/late night (11 PM - 5 AM)
                      value = Math.floor(Math.random() * 10)
                    }

                    // Add day-specific variations
                    if (index === 1 || index === 3) {
                      // Monday and Wednesday
                      value = Math.floor(value * 1.2) // 20% busier
                    } else if (index === 0 || index === 6) {
                      // Sunday and Saturday
                      value = Math.floor(value * 0.8) // 20% less busy
                    }

                    return {
                      hour: `${i}:00`,
                      value,
                    }
                  })

                  return (
                    <Line
                      key={day}
                      name={day}
                      data={data}
                      dataKey="value"
                      stroke={color}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      type="monotone"
                    />
                  )
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

