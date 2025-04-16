"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { CalendarIcon, CheckCircle, XCircle, QrCode } from "lucide-react"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { StaffQRCode } from "./staff-qr-code"

interface StaffAttendance {
  id: string
  staff_id: string
  date: string
  status: "present" | "absent" | "late" | "leave"
  check_in_time: string | null
  check_out_time: string | null
  staff: {
    id: string
    name: string
    role: string
  }
}

export function StaffAttendance() {
  const [date, setDate] = useState<Date>(new Date())
  const [attendanceRecords, setAttendanceRecords] = useState<StaffAttendance[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<{ id: string; name: string } | null>(null)
  const [qrDialogOpen, setQrDialogOpen] = useState(false)

  useEffect(() => {
    fetchAttendanceRecords(format(date, "yyyy-MM-dd"))
  }, [date])

  const fetchAttendanceRecords = async (selectedDate: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/staff-attendance?date=${selectedDate}`)
      const data = await response.json()

      if (data.success) {
        setAttendanceRecords(data.data || [])
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to fetch attendance records",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching attendance:", error)
      toast({
        title: "Error",
        description: "Failed to load attendance data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const markAttendance = async (staffId: string, status: "present" | "absent" | "late" | "leave") => {
    try {
      const response = await fetch("/api/staff-attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          staffId,
          status,
          date: format(date, "yyyy-MM-dd"),
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: data.message || "Attendance recorded successfully",
        })

        // Refresh attendance records
        fetchAttendanceRecords(format(date, "yyyy-MM-dd"))
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to record attendance",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error marking attendance:", error)
      toast({
        title: "Error",
        description: "Failed to record attendance",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return <span className="px-2 py-1 rounded-full text-xs bg-green-500/10 text-green-500">Present</span>
      case "absent":
        return <span className="px-2 py-1 rounded-full text-xs bg-red-500/10 text-red-500">Absent</span>
      case "late":
        return <span className="px-2 py-1 rounded-full text-xs bg-yellow-500/10 text-yellow-500">Late</span>
      case "leave":
        return <span className="px-2 py-1 rounded-full text-xs bg-blue-500/10 text-blue-500">Leave</span>
      default:
        return <span className="px-2 py-1 rounded-full text-xs bg-gray-500/10 text-gray-500">Unknown</span>
    }
  }

  const showQRCode = (staffId: string, staffName: string) => {
    setSelectedStaff({ id: staffId, name: staffName })
    setQrDialogOpen(true)
  }

  return (
    <>
      <Card className="bg-zinc-900 border-zinc-800 dark:bg-white dark:border-zinc-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white dark:text-zinc-900">Staff Attendance</CardTitle>
              <CardDescription className="text-gray-400 dark:text-gray-600">
                Track and manage staff attendance
              </CardDescription>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="border-zinc-700 dark:border-zinc-300 dark:text-zinc-900">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(date, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-zinc-900 border-zinc-800 dark:bg-white dark:border-zinc-200">
                <Calendar mode="single" selected={date} onSelect={(date) => date && setDate(date)} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 dark:border-zinc-200">
                  <TableHead className="text-white dark:text-zinc-900">Staff Name</TableHead>
                  <TableHead className="text-white dark:text-zinc-900">Role</TableHead>
                  <TableHead className="text-white dark:text-zinc-900">Status</TableHead>
                  <TableHead className="text-white dark:text-zinc-900">Check-in Time</TableHead>
                  <TableHead className="text-white dark:text-zinc-900">Check-out Time</TableHead>
                  <TableHead className="text-white dark:text-zinc-900">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceRecords.length > 0 ? (
                  attendanceRecords.map((record) => (
                    <TableRow key={record.id} className="border-zinc-800 dark:border-zinc-200">
                      <TableCell className="font-medium text-white dark:text-zinc-900">{record.staff.name}</TableCell>
                      <TableCell className="text-white dark:text-zinc-900">{record.staff.role}</TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                      <TableCell className="text-white dark:text-zinc-900">
                        {record.check_in_time ? format(new Date(record.check_in_time), "h:mm a") : "-"}
                      </TableCell>
                      <TableCell className="text-white dark:text-zinc-900">
                        {record.check_out_time ? format(new Date(record.check_out_time), "h:mm a") : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className={cn(
                              "border-zinc-700 dark:border-zinc-300",
                              record.status === "present" && "bg-green-500/10 text-green-500 border-green-500/20",
                            )}
                            onClick={() => markAttendance(record.staff.id, "present")}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" /> Present
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className={cn(
                              "border-zinc-700 dark:border-zinc-300",
                              record.status === "absent" && "bg-red-500/10 text-red-500 border-red-500/20",
                            )}
                            onClick={() => markAttendance(record.staff.id, "absent")}
                          >
                            <XCircle className="h-4 w-4 mr-1" /> Absent
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-zinc-700 dark:border-zinc-300"
                            onClick={() => showQRCode(record.staff.id, record.staff.name)}
                          >
                            <QrCode className="h-4 w-4 mr-1" /> QR Code
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-white dark:text-zinc-900">
                      No attendance records found for this date.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white dark:bg-white dark:border-zinc-200 dark:text-zinc-900 max-w-md">
          <DialogHeader>
            <DialogTitle>Staff QR Code</DialogTitle>
            <DialogDescription className="text-gray-400 dark:text-gray-600">
              Scan this QR code for staff check-in and check-out
            </DialogDescription>
          </DialogHeader>
          {selectedStaff && <StaffQRCode staffId={selectedStaff.id} staffName={selectedStaff.name} />}
        </DialogContent>
      </Dialog>
    </>
  )
}

