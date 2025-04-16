"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, AlertTriangle } from "lucide-react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addDays } from "date-fns"
import { supabase } from "@/utils/supabase"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { DatePicker } from "@/components/ui/date-picker"

interface StaffShiftCalendarProps {
  staff: any[]
}

export function StaffShiftCalendar({ staff }: StaffShiftCalendarProps) {
  const [shifts, setShifts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [isAddShiftOpen, setIsAddShiftOpen] = useState(false)
  const [newShift, setNewShift] = useState({
    staff_id: "",
    date: new Date(),
    start_time: "",
    end_time: "",
    shift_type: "morning",
  })
  const [conflicts, setConflicts] = useState<any[]>([])

  useEffect(() => {
    fetchShifts()
  }, [currentMonth])

  const fetchShifts = async () => {
    try {
      setLoading(true)

      const monthStart = startOfMonth(currentMonth)
      const monthEnd = endOfMonth(currentMonth)

      const { data, error } = await supabase
        .from("staff_shifts")
        .select("*")
        .gte("date", monthStart.toISOString().split("T")[0])
        .lte("date", monthEnd.toISOString().split("T")[0])

      if (error) throw error

      setShifts(data || [])

      // Check for conflicts
      const conflictingShifts = findConflicts(data || [])
      setConflicts(conflictingShifts)

      setLoading(false)
    } catch (err) {
      console.error("Error fetching shifts:", err)
      setLoading(false)
    }
  }

  const findConflicts = (shifts: any[]) => {
    const conflicts = []

    // Group shifts by date
    const shiftsByDate: Record<string, any[]> = {}

    for (const shift of shifts) {
      const dateKey = shift.date
      if (!shiftsByDate[dateKey]) {
        shiftsByDate[dateKey] = []
      }
      shiftsByDate[dateKey].push(shift)
    }

    // Check for conflicts within each date
    for (const [date, dateShifts] of Object.entries(shiftsByDate)) {
      for (let i = 0; i < dateShifts.length; i++) {
        const shift1 = dateShifts[i]
        const start1 = new Date(`${shift1.date}T${shift1.start_time}:00`)
        const end1 = new Date(`${shift1.date}T${shift1.end_time}:00`)

        for (let j = i + 1; j < dateShifts.length; j++) {
          const shift2 = dateShifts[j]

          // Skip if different staff members
          if (shift1.staff_id !== shift2.staff_id) continue

          const start2 = new Date(`${shift2.date}T${shift2.start_time}:00`)
          const end2 = new Date(`${shift2.date}T${shift2.end_time}:00`)

          // Check for overlap
          if (start1 <= end2 && start2 <= end1) {
            conflicts.push({
              id: `${shift1.id}-${shift2.id}`,
              shift1,
              shift2,
              date,
              staff_id: shift1.staff_id,
            })
          }
        }
      }
    }

    return conflicts
  }

  const handleAddShift = async () => {
    try {
      // Validate inputs
      if (!newShift.staff_id || !newShift.date || !newShift.start_time || !newShift.end_time) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields.",
          variant: "destructive",
        })
        return
      }

      // Format date
      const formattedDate = format(newShift.date, "yyyy-MM-dd")

      // Check for conflicts
      const start = new Date(`${formattedDate}T${newShift.start_time}:00`)
      const end = new Date(`${formattedDate}T${newShift.end_time}:00`)

      if (start >= end) {
        toast({
          title: "Invalid Time Range",
          description: "End time must be after start time.",
          variant: "destructive",
        })
        return
      }

      // Check for existing shifts for this staff member on this date
      const existingShifts = shifts.filter(
        (shift) => shift.staff_id === Number.parseInt(newShift.staff_id) && shift.date === formattedDate,
      )

      let hasConflict = false

      for (const shift of existingShifts) {
        const shiftStart = new Date(`${shift.date}T${shift.start_time}:00`)
        const shiftEnd = new Date(`${shift.date}T${shift.end_time}:00`)

        if (start <= shiftEnd && shiftStart <= end) {
          hasConflict = true
          break
        }
      }

      // Insert the shift
      const { data, error } = await supabase
        .from("staff_shifts")
        .insert([
          {
            staff_id: Number.parseInt(newShift.staff_id),
            date: formattedDate,
            start_time: newShift.start_time + ":00",
            end_time: newShift.end_time + ":00",
            shift_type: newShift.shift_type,
            status: hasConflict ? "conflict" : "scheduled",
          },
        ])
        .select()

      if (error) {
        console.error("Supabase error:", JSON.stringify(error))
        throw error
      }

      // Update local state
      setShifts([...shifts, ...(data || [])])

      // Close dialog and reset form
      setIsAddShiftOpen(false)
      setNewShift({
        staff_id: "",
        date: new Date(),
        start_time: "",
        end_time: "",
        shift_type: "morning",
      })

      toast({
        title: "Shift Added",
        description: hasConflict
          ? "Shift added with conflicts. Please review the schedule."
          : "Shift has been scheduled successfully.",
        variant: hasConflict ? "destructive" : "default",
      })

      // Refresh shifts to update conflicts
      fetchShifts()
    } catch (err) {
      console.error("Error adding shift:", JSON.stringify(err))
      toast({
        title: "Error",
        description: "Failed to add shift. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleResolveConflict = async (conflict: any) => {
    try {
      // Get staff member seniority
      const staffMember1 = staff.find((s) => s.id === conflict.shift1.staff_id)
      const staffMember2 = staff.find((s) => s.id === conflict.shift2.staff_id)

      if (!staffMember1 || !staffMember2) {
        toast({
          title: "Error",
          description: "Could not find staff members to resolve conflict.",
          variant: "destructive",
        })
        return
      }

      // Determine which shift to keep based on seniority
      const shiftToKeep =
        staffMember1.seniority_level >= staffMember2.seniority_level ? conflict.shift1 : conflict.shift2

      const shiftToRemove = shiftToKeep.id === conflict.shift1.id ? conflict.shift2 : conflict.shift1

      // Update the kept shift
      const { error: updateError } = await supabase
        .from("staff_shifts")
        .update({ status: "scheduled" })
        .eq("id", shiftToKeep.id)

      if (updateError) throw updateError

      // Delete the removed shift
      const { error: deleteError } = await supabase.from("staff_shifts").delete().eq("id", shiftToRemove.id)

      if (deleteError) throw deleteError

      toast({
        title: "Conflict Resolved",
        description: "The shift conflict has been automatically resolved based on staff seniority.",
      })

      // Refresh shifts
      fetchShifts()
    } catch (err) {
      console.error("Error resolving conflict:", err)
      toast({
        title: "Error",
        description: "Failed to resolve conflict. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getDaysInMonth = () => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    return eachDayOfInterval({ start: monthStart, end: monthEnd })
  }

  const getShiftsForDay = (day: Date) => {
    return shifts.filter((shift) => isSameDay(new Date(shift.date), day))
  }

  const getStaffName = (staffId: number) => {
    const staffMember = staff.find((s) => s.id === staffId)
    return staffMember ? staffMember.name : "Unknown"
  }

  const formatShiftTime = (start: string, end: string) => {
    const startTime = new Date(`2000-01-01T${start}`)
    const endTime = new Date(`2000-01-01T${end}`)
    return `${format(startTime, "h:mm a")} - ${format(endTime, "h:mm a")}`
  }

  const getShiftTypeColor = (shiftType: string) => {
    switch (shiftType) {
      case "morning":
        return "bg-blue-500/10 text-blue-500 border-blue-500"
      case "evening":
        return "bg-purple-500/10 text-purple-500 border-purple-500"
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500"
    }
  }

  const nextMonth = () => {
    setCurrentMonth(addDays(endOfMonth(currentMonth), 1))
  }

  const prevMonth = () => {
    setCurrentMonth(addDays(startOfMonth(currentMonth), -1))
  }

  return (
    <div className="space-y-4">
      {/* Conflicts Alert */}
      {conflicts.length > 0 && (
        <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 mb-4">
          <div className="flex items-center mb-2">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            <h3 className="text-lg font-bold text-red-500">Scheduling Conflicts Detected</h3>
          </div>
          <p className="text-gray-300 mb-4">
            {conflicts.length} {conflicts.length === 1 ? "conflict" : "conflicts"} found in the current schedule.
          </p>
          <div className="space-y-2">
            {conflicts.map((conflict) => (
              <div key={conflict.id} className="flex items-center justify-between bg-zinc-900 p-3 rounded-md">
                <div>
                  <p className="font-medium">{getStaffName(conflict.staff_id)}</p>
                  <p className="text-sm text-gray-400">
                    {format(new Date(conflict.date), "MMM d, yyyy")} - Overlapping shifts
                  </p>
                </div>
                <Button
                  size="sm"
                  className="bg-red-600 hover:bg-red-700"
                  onClick={() => handleResolveConflict(conflict)}
                >
                  Auto-Resolve
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Calendar Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">{format(currentMonth, "MMMM yyyy")}</h2>
        <div className="flex gap-2">
          <Button variant="outline" className="border-zinc-700" onClick={prevMonth}>
            Previous
          </Button>
          <Button variant="outline" className="border-zinc-700" onClick={nextMonth}>
            Next
          </Button>
          <Button className="bg-red-600 hover:bg-red-700" onClick={() => setIsAddShiftOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Shift
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Day headers */}
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="text-center font-medium p-2 bg-zinc-900 rounded-md">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {getDaysInMonth().map((day) => {
          const dayShifts = getShiftsForDay(day)
          const hasConflicts = dayShifts.some((shift) => shift.status === "conflict")

          return (
            <div
              key={day.toString()}
              className={`min-h-[120px] p-2 rounded-md border ${
                hasConflicts ? "border-red-500 bg-red-500/5" : "border-zinc-800 bg-zinc-900"
              }`}
            >
              <div className="text-right mb-1">
                <span className="text-sm font-medium">{format(day, "d")}</span>
              </div>
              <div className="space-y-1">
                {dayShifts.map((shift) => (
                  <div
                    key={shift.id}
                    className={`text-xs p-1 rounded ${
                      shift.status === "conflict" ? "bg-red-500/20 border border-red-500" : "bg-zinc-800"
                    }`}
                  >
                    <div className="font-medium truncate">{getStaffName(shift.staff_id)}</div>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className={getShiftTypeColor(shift.shift_type)}>
                        {shift.shift_type}
                      </Badge>
                      <span>{formatShiftTime(shift.start_time, shift.end_time)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Add Shift Dialog */}
      <Dialog open={isAddShiftOpen} onOpenChange={setIsAddShiftOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>Schedule New Shift</DialogTitle>
            <DialogDescription className="text-gray-400">Add a new shift to the schedule.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="staff">Staff Member</Label>
              <Select
                value={newShift.staff_id}
                onValueChange={(value) => setNewShift({ ...newShift, staff_id: value })}
              >
                <SelectTrigger className="bg-black border-zinc-800">
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  {staff.map((staffMember) => (
                    <SelectItem key={staffMember.id} value={staffMember.id.toString()}>
                      {staffMember.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Shift Date</Label>
              <DatePicker
                selected={newShift.date}
                onSelect={(date) => date && setNewShift({ ...newShift, date })}
                disabled={(date) => date < new Date()}
                label="Select date"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="start_time">Start Time</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={newShift.start_time}
                  onChange={(e) => setNewShift({ ...newShift, start_time: e.target.value })}
                  className="bg-black border-zinc-800"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="end_time">End Time</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={newShift.end_time}
                  onChange={(e) => setNewShift({ ...newShift, end_time: e.target.value })}
                  className="bg-black border-zinc-800"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="shift_type">Shift Type</Label>
              <Select
                value={newShift.shift_type}
                onValueChange={(value: string) => setNewShift({ ...newShift, shift_type: value })}
              >
                <SelectTrigger className="bg-black border-zinc-800">
                  <SelectValue placeholder="Select shift type" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  <SelectItem value="morning">Morning</SelectItem>
                  <SelectItem value="evening">Evening</SelectItem>
                  <SelectItem value="flexible">Flexible</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddShiftOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-red-600 hover:bg-red-700" onClick={handleAddShift}>
              Schedule Shift
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

