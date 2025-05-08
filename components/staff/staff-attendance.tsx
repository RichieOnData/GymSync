"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { CalendarIcon, CheckCircle, XCircle, Clock, QrCode } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Staff, StaffAttendance as StaffAttendanceType } from "@/types/staff"
import { StaffQRCodeDialog } from "./staff-qr-code-dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StaffCheckInDialog } from "./staff-check-in-dialog"

interface StaffAttendanceProps {
  staff: Staff[]
}

export function StaffAttendance({ staff }: StaffAttendanceProps) {
  const [date, setDate] = useState<Date>(new Date())
  const [attendanceRecords, setAttendanceRecords] = useState<StaffAttendanceType[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const [qrDialogOpen, setQrDialogOpen] = useState(false)
  const [checkInDialogOpen, setCheckInDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("daily")

  useEffect(() => {
    fetchAttendanceRecords(format(date, "yyyy-MM-dd"))
  }, [date])

  const fetchAttendanceRecords = async (selectedDate: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/staff/attendance?date=${selectedDate}`)
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
      const response = await fetch("/api/staff/attendance", {
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
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
            Present
          </Badge>
        )
      case "absent":
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
            Absent
          </Badge>
        )
      case "late":
        return (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
            Late
          </Badge>
        )
      case "leave":
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
            Leave
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-gray-500/10 text-gray-500 border-gray-500/20">
            Unknown
          </Badge>
        )
    }
  }

  const showQRCode = (staffMember: Staff) => {
    setSelectedStaff(staffMember)
    setQrDialogOpen(true)
  }

  const showCheckInDialog = () => {
    setCheckInDialogOpen(true)
  }

  const handleCheckInSuccess = () => {
    fetchAttendanceRecords(format(date, "yyyy-MM-dd"))
  }

  // Find staff members without attendance records for today
  const staffWithoutAttendance = staff.filter((s) => !attendanceRecords.some((record) => record.staff_id === s.id))

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
            <div className="flex space-x-2">
              <Button
                variant="outline"
                className="border-zinc-700 dark:border-zinc-300 dark:text-zinc-900"
                onClick={showCheckInDialog}
              >
                <Clock className="mr-2 h-4 w-4" />
                Check In/Out
              </Button>
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
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="daily" value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid w-[400px] grid-cols-2">
              <TabsTrigger value="daily">Daily View</TabsTrigger>
              <TabsTrigger value="missing">Missing Check-ins</TabsTrigger>
            </TabsList>

            <TabsContent value="daily">
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
                      <TableHead className="text-white dark:text-zinc-900">Hours</TableHead>
                      <TableHead className="text-white dark:text-zinc-900">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceRecords.length > 0 ? (
                      attendanceRecords.map((record) => (
                        <TableRow key={record.id} className="border-zinc-800 dark:border-zinc-200">
                          <TableCell className="font-medium text-white dark:text-zinc-900">
                            {record.staff?.name}
                          </TableCell>
                          <TableCell className="text-white dark:text-zinc-900">{record.staff?.role}</TableCell>
                          <TableCell>{getStatusBadge(record.status)}</TableCell>
                          <TableCell className="text-white dark:text-zinc-900">
                            {record.check_in_time ? format(new Date(record.check_in_time), "h:mm a") : "—"}
                          </TableCell>
                          <TableCell className="text-white dark:text-zinc-900">
                            {record.check_out_time ? format(new Date(record.check_out_time), "h:mm a") : "—"}
                          </TableCell>
                          <TableCell className="text-white dark:text-zinc-900">
                            {record.total_hours ? record.total_hours.toFixed(2) : "—"}
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
                                onClick={() => markAttendance(record.staff_id, "present")}
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
                                onClick={() => markAttendance(record.staff_id, "absent")}
                              >
                                <XCircle className="h-4 w-4 mr-1" /> Absent
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-zinc-700 dark:border-zinc-300"
                                onClick={() => {
                                  const staffMember = staff.find((s) => s.id === record.staff_id)
                                  if (staffMember) {
                                    showQRCode(staffMember)
                                  }
                                }}
                              >
                                <QrCode className="h-4 w-4 mr-1" /> QR Code
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-white dark:text-zinc-900">
                          No attendance records found for this date.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="missing">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800 dark:border-zinc-200">
                    <TableHead className="text-white dark:text-zinc-900">Staff Name</TableHead>
                    <TableHead className="text-white dark:text-zinc-900">Role</TableHead>
                    <TableHead className="text-white dark:text-zinc-900">Status</TableHead>
                    <TableHead className="text-white dark:text-zinc-900">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staffWithoutAttendance.length > 0 ? (
                    staffWithoutAttendance.map((staffMember) => (
                      <TableRow key={staffMember.id} className="border-zinc-800 dark:border-zinc-200">
                        <TableCell className="font-medium text-white dark:text-zinc-900">{staffMember.name}</TableCell>
                        <TableCell className="text-white dark:text-zinc-900">{staffMember.role?.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                            No Record
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-zinc-700 dark:border-zinc-300"
                              onClick={() => markAttendance(staffMember.id, "present")}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" /> Present
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-zinc-700 dark:border-zinc-300"
                              onClick={() => markAttendance(staffMember.id, "absent")}
                            >
                              <XCircle className="h-4 w-4 mr-1" /> Absent
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-zinc-700 dark:border-zinc-300"
                              onClick={() => showQRCode(staffMember)}
                            >
                              <QrCode className="h-4 w-4 mr-1" /> QR Code
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-white dark:text-zinc-900">
                        All staff members have attendance records for today.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* QR Code Dialog */}
      {selectedStaff && <StaffQRCodeDialog staff={selectedStaff} open={qrDialogOpen} onOpenChange={setQrDialogOpen} />}

      {/* Check In Dialog */}
      <StaffCheckInDialog
        staff={staff}
        open={checkInDialogOpen}
        onOpenChange={setCheckInDialogOpen}
        onSuccess={handleCheckInSuccess}
      />
    </>
  )
}
