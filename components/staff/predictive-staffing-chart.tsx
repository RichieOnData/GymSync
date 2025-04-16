"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { format, subDays, eachDayOfInterval, addDays, startOfWeek, endOfWeek, getDay } from "date-fns"
import { AlertTriangle, Calendar } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface PredictiveStaffingChartProps {
  staff: any[]
  attendanceRecords: any[]
}

export function PredictiveStaffingChart({ staff, attendanceRecords }: PredictiveStaffingChartProps) {
  const [occupancyData, setOccupancyData] = useState<any[]>([])
  const [predictedStaffingNeeds, setPredictedStaffingNeeds] = useState<any[]>([])
  const [staffingAlerts, setStaffingAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Process attendance data to generate occupancy patterns
    processAttendanceData()

    // Generate predicted staffing needs
    generatePredictedStaffingNeeds()
  }, [staff, attendanceRecords])

  const processAttendanceData = () => {
    // Get last 90 days of data
    const endDate = new Date()
    const startDate = subDays(endDate, 90)

    // Create a map of day of week -> hour -> count
    const dayHourMap: Record<string, Record<number, number>> = {}

    // Initialize the map
    for (let i = 0; i < 7; i++) {
      dayHourMap[i] = {}
      for (let j = 0; j < 24; j++) {
        dayHourMap[i][j] = 0
      }
    }

    // Count check-ins by day of week and hour
    attendanceRecords.forEach((record) => {
      if (!record.checkin_time) return

      const checkInDate = new Date(record.checkin_time)

      // Skip if outside our date range
      if (checkInDate < startDate || checkInDate > endDate) return

      const dayOfWeek = getDay(checkInDate) // 0 = Sunday, 6 = Saturday
      const hour = checkInDate.getHours()

      dayHourMap[dayOfWeek][hour] = (dayHourMap[dayOfWeek][hour] || 0) + 1
    })

    // Convert to chart data
    const occupancyByDayAndHour = []

    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const count = dayHourMap[day][hour]
        const dayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][day]
        const formattedHour =
          hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`

        occupancyByDayAndHour.push({
          day,
          dayName,
          hour,
          formattedHour,
          count,
          isPeak: count > 10, // Arbitrary threshold for demonstration
        })
      }
    }

    setOccupancyData(occupancyByDayAndHour)
    setLoading(false)
  }

  const generatePredictedStaffingNeeds = () => {
    // Get the next 7 days
    const today = new Date()
    const nextWeekStart = startOfWeek(addDays(today, 1))
    const nextWeekEnd = endOfWeek(addDays(today, 7))
    const nextWeekDays = eachDayOfInterval({ start: nextWeekStart, end: nextWeekEnd })

    // Generate staffing needs for each day
    const staffingNeeds = nextWeekDays.map((day) => {
      const dayOfWeek = getDay(day)
      const dayName = format(day, "EEEE")
      const formattedDate = format(day, "MMM d")

      // Calculate morning and evening staff needs based on historical data
      const morningHours = [8, 9, 10, 11, 12, 13]
      const eveningHours = [14, 15, 16, 17, 18, 19, 20]

      let morningTotal = 0
      let eveningTotal = 0

      morningHours.forEach((hour) => {
        const hourData = occupancyData.find((d) => d.day === dayOfWeek && d.hour === hour)
        morningTotal += hourData ? hourData.count : 0
      })

      eveningHours.forEach((hour) => {
        const hourData = occupancyData.find((d) => d.day === dayOfWeek && d.hour === hour)
        eveningTotal += hourData ? hourData.count : 0
      })

      // Calculate staff needed (1 staff per 10 members, minimum 2)
      const morningStaffNeeded = Math.max(2, Math.ceil(morningTotal / (morningHours.length * 10)))
      const eveningStaffNeeded = Math.max(2, Math.ceil(eveningTotal / (eveningHours.length * 10)))

      // Count available staff for each shift
      const morningStaffAvailable = staff.filter(
        (s) => s.status === "Active" && (s.shift_type === "morning" || s.shift_type === "flexible"),
      ).length
      const eveningStaffAvailable = staff.filter(
        (s) => s.status === "Active" && (s.shift_type === "evening" || s.shift_type === "flexible"),
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

    setPredictedStaffingNeeds(staffingNeeds)

    // Generate staffing alerts
    const alerts = staffingNeeds
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
  }

  const getAvailableStaffForAlert = (shift: string) => {
    return staff
      .filter((s) => s.status === "Active" && s.shift_type !== shift && s.shift_type !== "flexible")
      .map((s) => ({
        id: s.id,
        name: s.name,
        currentShift: s.shift_type,
      }))
  }

  const handleSendStaffingAlert = (alert: any) => {
    toast({
      title: "Alert Sent",
      description: `Staffing alert for ${alert.formattedDate} (${alert.shift} shift) has been sent to management.`,
    })
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
                        {alert.staffNeeded - alert.staffAvailable} staff shortage
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
                        <h4 className="text-sm font-medium mb-2">Suggested On-Call Staff:</h4>
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

                    <Button
                      className="w-full bg-red-600 hover:bg-red-700"
                      onClick={() => handleSendStaffingAlert(alert)}
                    >
                      Send Alert to Management
                    </Button>
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
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={predictedStaffingNeeds} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="formattedDate" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip contentStyle={{ backgroundColor: "#222", border: "none" }} itemStyle={{ color: "#fff" }} />
                    <Legend />
                    <Bar
                      name="Morning Staff Needed"
                      dataKey="morningStaffNeeded"
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      name="Morning Staff Available"
                      dataKey="morningStaffAvailable"
                      fill="#93c5fd"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      name="Evening Staff Needed"
                      dataKey="eveningStaffNeeded"
                      fill="#8b5cf6"
                      radius={[4, 4, 0, 0]}
                    />
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
                      {predictedStaffingNeeds.map((day, index) => (
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
                      {predictedStaffingNeeds.map((day, index) => (
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
          )}
        </CardContent>
      </Card>

      {/* Occupancy Patterns */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle>Historical Occupancy Patterns</CardTitle>
          <CardDescription>Average gym occupancy by day and hour based on the last 90 days</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
            </div>
          ) : (
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="formattedHour" type="category" allowDuplicatedCategory={false} stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip contentStyle={{ backgroundColor: "#222", border: "none" }} itemStyle={{ color: "#fff" }} />
                  <Legend />

                  {[0, 1, 2, 3, 4, 5, 6].map((day, index) => {
                    const dayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][day]
                    const color = [
                      "#ef4444", // Sunday - red
                      "#3b82f6", // Monday - blue
                      "#10b981", // Tuesday - green
                      "#f59e0b", // Wednesday - amber
                      "#8b5cf6", // Thursday - purple
                      "#ec4899", // Friday - pink
                      "#6366f1", // Saturday - indigo
                    ][day]

                    const dayData = occupancyData.filter((d) => d.day === day)

                    return (
                      <Line
                        key={day}
                        name={dayName}
                        data={dayData}
                        dataKey="count"
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}

