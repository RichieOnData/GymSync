"use client"

import { useState, useEffect } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { Cross2Icon } from "@radix-ui/react-icons"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { createClient } from "@supabase/supabase-js"
import { Calendar } from "@/components/ui/calendar"
import type { Member, Attendance } from "@/types/member"
import { format, isSameDay } from "date-fns"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface AttendanceCalendarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  member: Member
}

export function AttendanceCalendar({ open, onOpenChange, member }: AttendanceCalendarProps) {
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [selectedStatus, setSelectedStatus] = useState<"Present" | "Absent">("Present")

  useEffect(() => {
    if (open) {
      fetchAttendance()
    }
  }, [open, member.id])

  const fetchAttendance = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("member_id", member.id)
        .order("date", { ascending: false })

      if (error) throw error

      setAttendance(data || [])
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

  const handleMarkAttendance = async () => {
    if (!selectedDate) return

    try {
      const formattedDate = format(selectedDate, "yyyy-MM-dd")

      // Check if attendance already exists for this date
      const existingAttendance = attendance.find((a) => isSameDay(new Date(a.date), selectedDate))

      if (existingAttendance) {
        // Update existing attendance
        const { error } = await supabase
          .from("attendance")
          .update({ status: selectedStatus })
          .eq("id", existingAttendance.id)

        if (error) throw error

        // Update local state
        setAttendance(attendance.map((a) => (a.id === existingAttendance.id ? { ...a, status: selectedStatus } : a)))

        toast({
          title: "Attendance Updated",
          description: `Attendance for ${format(selectedDate, "MMMM d, yyyy")} updated to ${selectedStatus}`,
        })
      } else {
        // Create new attendance record
        const { data, error } = await supabase
          .from("attendance")
          .insert([
            {
              member_id: member.id,
              date: formattedDate,
              status: selectedStatus,
            },
          ])
          .select()
          .single()

        if (error) throw error

        // Update local state
        setAttendance([data, ...attendance])

        toast({
          title: "Attendance Marked",
          description: `Attendance for ${format(selectedDate, "MMMM d, yyyy")} marked as ${selectedStatus}`,
        })
      }
    } catch (error) {
      console.error("Error marking attendance:", error)
      toast({
        title: "Error",
        description: "Failed to mark attendance",
        variant: "destructive",
      })
    }
  }

  const getAttendanceForDate = (date: Date) => {
    return attendance.find((a) => isSameDay(new Date(a.date), date))
  }

  const getDayClass = (date: Date) => {
    const attendanceRecord = getAttendanceForDate(date)
    if (!attendanceRecord) return ""

    return attendanceRecord.status === "Present"
      ? "bg-green-500/20 text-green-500 font-bold"
      : "bg-red-500/20 text-red-500 font-bold"
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] max-h-[85vh] w-[90vw] max-w-[500px] translate-x-[-50%] translate-y-[-50%] rounded-lg bg-zinc-900 border border-zinc-800 p-6 shadow-lg focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] overflow-y-auto">
          <Dialog.Title className="text-xl font-semibold text-white">Attendance Tracker</Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-gray-400">
            Track attendance for {member.name}. Select a date and mark as present or absent.
          </Dialog.Description>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-600"></div>
            </div>
          ) : (
            <div className="mt-4 space-y-6">
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="border border-zinc-800 rounded-md p-3"
                  modifiers={{
                    customStyles: attendance.map((a) => new Date(a.date)),
                  }}
                  modifiersStyles={{
                    customStyles: (date) => ({
                      className: getDayClass(date),
                    }),
                  }}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium">
                      {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Select a date"}
                    </h3>
                    {selectedDate && (
                      <p className="text-xs text-gray-400">
                        {getAttendanceForDate(selectedDate)
                          ? `Currently marked as ${getAttendanceForDate(selectedDate)?.status}`
                          : "No attendance record"}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={selectedStatus === "Present" ? "default" : "outline"}
                      className={selectedStatus === "Present" ? "bg-green-600 hover:bg-green-700" : "border-zinc-700"}
                      onClick={() => setSelectedStatus("Present")}
                    >
                      Present
                    </Button>
                    <Button
                      size="sm"
                      variant={selectedStatus === "Absent" ? "default" : "outline"}
                      className={selectedStatus === "Absent" ? "bg-red-600 hover:bg-red-700" : "border-zinc-700"}
                      onClick={() => setSelectedStatus("Absent")}
                    >
                      Absent
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={handleMarkAttendance}
                  className="w-full bg-red-600 hover:bg-red-700"
                  disabled={!selectedDate}
                >
                  {getAttendanceForDate(selectedDate!) ? "Update Attendance" : "Mark Attendance"}
                </Button>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium">Recent Attendance</h3>
                <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2">
                  {attendance.length === 0 ? (
                    <p className="text-sm text-gray-400">No attendance records found</p>
                  ) : (
                    attendance.slice(0, 10).map((record) => (
                      <div
                        key={record.id}
                        className={`flex justify-between items-center p-2 rounded-md ${
                          record.status === "Present"
                            ? "bg-green-500/10 border border-green-500/20"
                            : "bg-red-500/10 border border-red-500/20"
                        }`}
                      >
                        <span className="text-sm">{format(new Date(record.date), "MMMM d, yyyy")}</span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            record.status === "Present"
                              ? "bg-green-500/20 text-green-500"
                              : "bg-red-500/20 text-red-500"
                          }`}
                        >
                          {record.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end mt-6">
            <Dialog.Close asChild>
              <Button variant="outline" className="border-zinc-700">
                Close
              </Button>
            </Dialog.Close>
          </div>

          <Dialog.Close asChild>
            <button
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
              aria-label="Close"
            >
              <Cross2Icon className="h-4 w-4 text-white" />
              <span className="sr-only">Close</span>
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

