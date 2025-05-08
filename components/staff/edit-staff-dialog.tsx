"use client"

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import type { Staff, StaffRole } from "@/types/staff"

interface EditStaffDialogProps {
  staff: Staff
  open: boolean
  onOpenChange: (open: boolean) => void
  onStaffUpdated: (staff: Staff) => void
}

export function EditStaffDialog({ staff, open, onOpenChange, onStaffUpdated }: EditStaffDialogProps) {
  const [roles, setRoles] = useState<StaffRole[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState<Staff>(staff)

  useEffect(() => {
    if (open) {
      fetchRoles()
      setFormData(staff)
    }
  }, [open, staff])

  const fetchRoles = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/staff/roles")

      if (!res.ok) {
        throw new Error("Failed to fetch roles")
      }

      const data = await res.json()
      setRoles(data)
    } catch (error) {
      console.error("Error fetching roles:", error)
      toast({
        title: "Error",
        description: "Failed to load staff roles. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.name || !formData.email || !formData.role_id || !formData.hire_date) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)

      const res = await fetch(`/api/staff/${staff.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to update staff member")
      }

      toast({
        title: "Staff Updated",
        description: `${formData.name}'s information has been updated.`,
      })

      onStaffUpdated(data)
      onOpenChange(false)
    } catch (error) {
      console.error("Error updating staff:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update staff member. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white dark:bg-white dark:border-zinc-200 dark:text-zinc-900 max-w-md sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Staff Member</DialogTitle>
          <DialogDescription className="text-gray-400 dark:text-gray-600">
            Update the details of {staff.name}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Full Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="bg-black border-zinc-800 dark:bg-white dark:border-zinc-300"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className="bg-black border-zinc-800 dark:bg-white dark:border-zinc-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                value={formData.phone || ""}
                onChange={(e) => handleChange("phone", e.target.value)}
                className="bg-black border-zinc-800 dark:bg-white dark:border-zinc-300"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-role">Role *</Label>
              <Select value={formData.role_id.toString()} onValueChange={(value) => handleChange("role_id", value)}>
                <SelectTrigger className="bg-black border-zinc-800 dark:bg-white dark:border-zinc-300">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-white dark:bg-white dark:border-zinc-200 dark:text-zinc-900">
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleChange("status", value as any)}>
                <SelectTrigger className="bg-black border-zinc-800 dark:bg-white dark:border-zinc-300">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-white dark:bg-white dark:border-zinc-200 dark:text-zinc-900">
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="On Leave">On Leave</SelectItem>
                  <SelectItem value="Terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-hire-date">Hire Date *</Label>
              <Input
                id="edit-hire-date"
                type="date"
                value={formData.hire_date}
                onChange={(e) => handleChange("hire_date", e.target.value)}
                className="bg-black border-zinc-800 dark:bg-white dark:border-zinc-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-emergency-contact">Emergency Contact</Label>
              <Input
                id="edit-emergency-contact"
                value={formData.emergency_contact || ""}
                onChange={(e) => handleChange("emergency_contact", e.target.value)}
                className="bg-black border-zinc-800 dark:bg-white dark:border-zinc-300"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-emergency-phone">Emergency Phone</Label>
              <Input
                id="edit-emergency-phone"
                value={formData.emergency_phone || ""}
                onChange={(e) => handleChange("emergency_phone", e.target.value)}
                className="bg-black border-zinc-800 dark:bg-white dark:border-zinc-300"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea
              id="edit-notes"
              value={formData.notes || ""}
              onChange={(e) => handleChange("notes", e.target.value)}
              className="bg-black border-zinc-800 dark:bg-white dark:border-zinc-300"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button className="bg-red-600 hover:bg-red-700" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
