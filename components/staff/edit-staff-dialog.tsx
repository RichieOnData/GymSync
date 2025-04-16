"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/utils/supabase"
import { toast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"

interface EditStaffDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  staff: any
}

export function EditStaffDialog({ open, onOpenChange, staff }: EditStaffDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    email: "",
    phone: "",
    status: "",
    shift_type: "",
    hire_date: new Date(),
    qualifications: "",
    seniority_level: 1,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize form data when staff changes
  useEffect(() => {
    if (staff) {
      setFormData({
        name: staff.name || "",
        role: staff.role || "",
        email: staff.email || "",
        phone: staff.phone || "",
        status: staff.status || "active",
        shift_type: staff.shift_type || "flexible",
        hire_date: staff.hire_date ? new Date(staff.hire_date) : new Date(),
        qualifications: Array.isArray(staff.qualifications) ? staff.qualifications.join(", ") : "",
        seniority_level: staff.seniority_level || 1,
      })
    }
  }, [staff])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Convert qualifications string to array
      const qualificationsArray = formData.qualifications
        .split(",")
        .map((q) => q.trim())
        .filter((q) => q !== "")

      const { error } = await supabase
        .from("staff")
        .update({
          name: formData.name,
          role: formData.role,
          email: formData.email,
          phone: formData.phone,
          status: formData.status,
          shift_type: formData.shift_type,
          hire_date: formData.hire_date.toISOString().split("T")[0],
          qualifications: qualificationsArray,
          seniority_level: formData.seniority_level,
        })
        .eq("id", staff.id)

      if (error) throw error

      toast({
        title: "Staff Updated",
        description: `${formData.name}'s information has been updated.`,
      })

      onOpenChange(false)
    } catch (error: any) {
      console.error("Error updating staff:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update staff member. Please try again.",
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
          <DialogTitle>Edit Staff Member</DialogTitle>
          <DialogDescription className="text-gray-400">Update the staff member's information.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Full Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-black border-zinc-800"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-role">Role</Label>
                <Input
                  id="edit-role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="bg-black border-zinc-800"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-black border-zinc-800"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="bg-black border-zinc-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger className="bg-black border-zinc-800">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="on_leave">On Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-shift_type">Shift Type</Label>
                <Select
                  value={formData.shift_type}
                  onValueChange={(value) => setFormData({ ...formData, shift_type: value })}
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Hire Date</Label>
                <DatePicker
                  selected={formData.hire_date}
                  onSelect={(date) => date && setFormData({ ...formData, hire_date: date })}
                  label="Select hire date"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-seniority_level">Seniority Level (1-5)</Label>
                <Input
                  id="edit-seniority_level"
                  type="number"
                  min="1"
                  max="5"
                  value={formData.seniority_level}
                  onChange={(e) => setFormData({ ...formData, seniority_level: Number.parseInt(e.target.value) || 1 })}
                  className="bg-black border-zinc-800"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-qualifications">Qualifications (comma-separated)</Label>
              <Input
                id="edit-qualifications"
                value={formData.qualifications}
                onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
                className="bg-black border-zinc-800"
                placeholder="e.g. Certified Trainer, Nutrition Specialist"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" className="bg-red-600 hover:bg-red-700" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

