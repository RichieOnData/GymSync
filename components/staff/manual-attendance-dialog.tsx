"use client"

import type React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { supabase } from "@/utils/supabase"
import { toast } from "@/components/ui/use-toast"
import { format } from "date-fns"

interface ManualAttendanceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  staff: any
}

export function ManualAttendanceDialog({ open, onOpenChange, staff }: ManualAttendanceDialogProps) {
  const [formData, setFormData] = useState({
    status: "present",
    checkin_time: format(new Date(), "HH:mm"),
    checkout_time: "",
    notes: "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const today = new Date().toISOString().split("T")[0]

      // Check if attendance record exists for today
      const { data: existingRecord, error: fetchError } = await supabase
        .from("staff_attendance")
        .select("*")
        .eq("staff_id", staff.id)
        .eq("date", today)
        .single()

      const checkinDateTime = formData.checkin_time ? `${today}T${formData.checkin_time}:00` : null

      const checkoutDateTime = formData.checkout_time ? `${today}T${formData.checkout_time}:00` : null

      if (fetchError && fetchError.code !== "PGRST116") {
        // PGRST116 is "no rows returned"
        throw fetchError
      }

      if (existingRecord) {
        // Update existing record
        const { error } = await supabase
          .from("staff_attendance")
          .update({
            status: formData.status,
            checkin_time: checkinDateTime,
            checkout_time: checkoutDateTime,
            notes: formData.notes || null,
          })
          .eq("id", existingRecord.id)

        if (error) throw error
      } else {
        // Create new record
        const { error } = await supabase.from("staff_attendance").insert([
          {
            staff_id: staff.id,
            date: today,
            status: formData.status,
            checkin_time: checkinDateTime,
            checkout_time: checkoutDateTime,
            notes: formData.notes || null,
          },
        ])

        if (error) throw error
      }

      toast({
        title: "Attendance Updated",
        description: `${staff.name}'s attendance has been updated for today.`,
      })

      onOpenChange(false)
    } catch (error: any) {
      console.error("Error updating attendance:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update attendance. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle>Manual Attendance</DialogTitle>
          <DialogDescription className="text-gray-400">
            Update attendance for {staff?.name} for today.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="status">Attendance Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger className="bg-black border-zinc-800">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="checkin_time">Check-in Time</Label>
                <Input
                  id="checkin_time"
                  type="time"
                  value={formData.checkin_time}
                  onChange={(e) => setFormData({ ...formData, checkin_time: e.target.value })}
                  className="bg-black border-zinc-800"
                  disabled={formData.status === "absent"}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="checkout_time">Check-out Time</Label>
                <Input
                  id="checkout_time"
                  type="time"
                  value={formData.checkout_time}
                  onChange={(e) => setFormData({ ...formData, checkout_time: e.target.value })}
                  className="bg-black border-zinc-800"
                  disabled={formData.status === "absent"}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="bg-black border-zinc-800"
                placeholder="Optional notes about attendance"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" className="bg-red-600 hover:bg-red-700" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Attendance"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

