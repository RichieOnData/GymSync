"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, Download } from "lucide-react"
import { format, subDays } from "date-fns"
import { supabase } from "@/utils/supabase"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"

interface StaffAttendanceTimelineProps {
  staff: any[]
  attendanceRecords: any[]
}

export function StaffAttendanceTimeline({ staff, attendanceRecords: initialRecords }: StaffAttendanceTimelineProps) {
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>(initialRecords || [])
  const [loading, setLoading] = useState(false)
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 7),
    to: new Date(),
  })
  const [staffFilter, setStaffFilter] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  useEffect(() => {
    fetchAttendanceRecords()
  }, [dateRange, staffFilter, statusFilter])

  const fetchAttendanceRecords = async () => {
    try {
      setLoading(true)

      let query = supabase
        .from("attendance")
        .select("*")
        .gte("date", dateRange.from.toISOString().split("T")[0])
        .lte("date", dateRange.to.toISOString().split("T")[0])
        .order("date", { ascending: false })

      if (staffFilter && staffFilter !== "all") {
        query = query.eq("staff_id", staffFilter)
      }

      if (statusFilter && statusFilter !== "all") {
        query = query.eq("status", statusFilter)
      }

      const { data, error } = await query

      if (error) {
        console.error("Supabase error:", error.message)
        throw new Error(`Failed to fetch attendance records: ${error.message}`)
      }

      setAttendanceRecords(data || [])
    } catch (err) {
      console.error("Error fetching attendance records:", err instanceof Error ? err.message : String(err))
      setAttendanceRecords([])
    } finally {
      setLoading(false)
    }
  }

  const getStaffName = (staffId: number) => {
    const staffMember = staff.find((s) => s.id === staffId)
    return staffMember ? staffMember.name : "Unknown"
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return <Badge className="bg-green-500/10 text-green-500 border-green-500">Present</Badge>
      case "late":
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500">Late</Badge>
      case "absent":
        return <Badge className="bg-red-500/10 text-red-500 border-red-500">Absent</Badge>
      default:
        return <Badge className="bg-gray-500/10 text-gray-500 border-gray-500">Pending</Badge>
    }
  }

  const formatTime = (timeString: string | null) => {
    if (!timeString) return "—"
    return format(new Date(timeString), "h:mm a")
  }

  const calculateDuration = (checkin: string | null, checkout: string | null) => {
    if (!checkin || !checkout) return "—"

    const checkinTime = new Date(checkin).getTime()
    const checkoutTime = new Date(checkout).getTime()
    const durationMs = checkoutTime - checkinTime

    if (durationMs < 0) return "Invalid"

    const hours = Math.floor(durationMs / (1000 * 60 * 60))
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))

    return `${hours}h ${minutes}m`
  }

  const exportToCSV = () => {
    if (!attendanceRecords?.length) return

    // Create CSV content
    const headers = ["Date", "Staff", "Status", "Check In", "Check Out", "Duration", "Shift Type"]
    const rows = attendanceRecords.map((record) => [
      record.date,
      getStaffName(record.staff_id),
      record.status,
      record.checkin_time ? format(new Date(record.checkin_time), "yyyy-MM-dd HH:mm:ss") : "",
      record.checkout_time ? format(new Date(record.checkout_time), "yyyy-MM-dd HH:mm:ss") : "",
      calculateDuration(record.checkin_time, record.checkout_time),
      record.shift_type || "N/A",
    ])

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `attendance_${format(new Date(), "yyyy-MM-dd")}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex gap-2 items-center">
          <DatePicker
            selected={dateRange.from}
            onSelect={(date) => date && setDateRange({ ...dateRange, from: date })}
            disabled={(date) => date > new Date() || date > dateRange.to}
            label="From"
          />
          <span className="text-gray-400">to</span>
          <DatePicker
            selected={dateRange.to}
            onSelect={(date) => date && setDateRange({ ...dateRange, to: date })}
            disabled={(date) => date > new Date() || date < dateRange.from}
            label="To"
          />
        </div>

        <div className="flex gap-2 flex-1">
          <Select value={staffFilter || ""} onValueChange={(value) => setStaffFilter(value || null)}>
            <SelectTrigger className="w-[180px] bg-zinc-900 border-zinc-800">
              <SelectValue placeholder="All Staff" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800">
              <SelectItem value="all">All Staff</SelectItem>
              {staff.map((staffMember) => (
                <SelectItem key={staffMember.id} value={staffMember.id.toString()}>
                  {staffMember.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter || ""} onValueChange={(value) => setStatusFilter(value || null)}>
            <SelectTrigger className="w-[180px] bg-zinc-900 border-zinc-800">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="present">Present</SelectItem>
              <SelectItem value="late">Late</SelectItem>
              <SelectItem value="absent">Absent</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            className="ml-auto border-zinc-700"
            onClick={exportToCSV}
            disabled={!attendanceRecords || attendanceRecords.length === 0}
          >
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      {/* Attendance Table */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
          <CardDescription>
            Showing {attendanceRecords?.length || 0} records from {format(dateRange.from, "MMM d, yyyy")} to{" "}
            {format(dateRange.to, "MMM d, yyyy")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
            </div>
          ) : !attendanceRecords?.length ? (
            <div className="text-center py-8 text-gray-400">No attendance records found for the selected period.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800">
                    <TableHead>Date</TableHead>
                    <TableHead>Staff</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Shift</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceRecords?.map((record) => {
                    const isToday = new Date(record.date).toDateString() === new Date().toDateString()

                    return (
                      <TableRow key={record.id} className="border-zinc-800">
                        <TableCell>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                            <span className={isToday ? "font-bold text-white" : ""}>
                              {format(new Date(record.date), "MMM d, yyyy")}
                              {isToday && <span className="ml-2 text-xs text-red-500">(Today)</span>}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{getStaffName(record.staff_id)}</TableCell>
                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                        <TableCell>
                          {record.checkin_time && (
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-2 text-gray-400" />
                              {formatTime(record.checkin_time)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {record.checkout_time && (
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-2 text-gray-400" />
                              {formatTime(record.checkout_time)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{calculateDuration(record.checkin_time, record.checkout_time)}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              record.shift_type === "morning"
                                ? "bg-blue-500/10 text-blue-500 border-blue-500"
                                : record.shift_type === "evening"
                                  ? "bg-purple-500/10 text-purple-500 border-purple-500"
                                  : "bg-gray-500/10 text-gray-500 border-gray-500"
                            }
                          >
                            {record.shift_type
                              ? record.shift_type.charAt(0).toUpperCase() + record.shift_type.slice(1)
                              : "Flexible"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}