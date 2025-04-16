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

interface AddStaffDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onStaffAdded: (staff: Staff) => void
}

export function AddStaffDialog({ open, onOpenChange, onStaffAdded }: AddStaffDialogProps) {
  const [roles, setRoles] = useState<StaffRole[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role_id: "",
    status: "Active",
    hire_date: new Date().toISOString().split("T")[0],
    emergency_contact: "",
    emergency_phone: "",
    notes: "",
  })

  useEffect(() => {
    if (open) {
      fetchRoles()
      // Reset form when dialog opens
      setFormData({
        name: "",
        email: "",
        phone: "",
        role_id: "",
        status: "Active",
        hire_date: new Date().toISOString().split("T")[0],
        emergency_contact: "",
        emergency_phone: "",
        notes: "",
      })
    }
  }, [open])

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

      const res = await fetch("/api/staff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to add staff member")
      }

      toast({
        title: "Staff Added",
        description: `${formData.name} has been added to the staff list.`,
      })

      onStaffAdded(data)
    } catch (error) {
      console.error("Error adding staff:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add staff member. Please try again.",
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
          <DialogTitle>Add New Staff Member</DialogTitle>
          <DialogDescription className="text-gray-400 dark:text-gray-600">
            Fill in the details to add a new staff member.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="bg-black border-zinc-800 dark:bg-white dark:border-zinc-300"
                placeholder="John Smith"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className="bg-black border-zinc-800 dark:bg-white dark:border-zinc-300"
                placeholder="john.smith@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                className="bg-black border-zinc-800 dark:bg-white dark:border-zinc-300"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="role">Role *</Label>
              <Select value={formData.role_id} onValueChange={(value) => handleChange("role_id", value)}>
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
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
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
              <Label htmlFor="hire_date">Hire Date *</Label>
              <Input
                id="hire_date"
                type="date"
                value={formData.hire_date}
                onChange={(e) => handleChange("hire_date", e.target.value)}
                className="bg-black border-zinc-800 dark:bg-white dark:border-zinc-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="emergency_contact">Emergency Contact</Label>
              <Input
                id="emergency_contact"
                value={formData.emergency_contact}
                onChange={(e) => handleChange("emergency_contact", e.target.value)}
                className="bg-black border-zinc-800 dark:bg-white dark:border-zinc-300"
                placeholder="Jane Smith"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="emergency_phone">Emergency Phone</Label>
              <Input
                id="emergency_phone"
                value={formData.emergency_phone}
                onChange={(e) => handleChange("emergency_phone", e.target.value)}
                className="bg-black border-zinc-800 dark:bg-white dark:border-zinc-300"
                placeholder="+1 (555) 987-6543"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              className="bg-black border-zinc-800 dark:bg-white dark:border-zinc-300"
              placeholder="Additional information about this staff member..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button className="bg-red-600 hover:bg-red-700" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Adding..." : "Add Staff"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
