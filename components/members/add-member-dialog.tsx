"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { Cross2Icon } from "@radix-ui/react-icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Member, MembershipPlan } from "@/types/member"
import { SubscriptionPlanDropdown } from "./subscription-plan-dropdown"
import { calculateExpirationDate } from "@/utils/subscription"

interface AddMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (member: Omit<Member, "id">) => void
}

export function AddMemberDialog({ open, onOpenChange, onSubmit }: AddMemberDialogProps) {
  const [formData, setFormData] = useState<Omit<Member, "id">>({
    name: "",
    age: 0,
    address: "",
    registration_number: "",
    membership_plan: "Basic",
    join_date: new Date().toISOString().split("T")[0],
    expiration_date: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Calculate initial expiration date
  useEffect(() => {
    if (formData.join_date && formData.membership_plan) {
      const expirationDate = calculateExpirationDate(formData.join_date, formData.membership_plan)
      setFormData((prev) => ({ ...prev, expiration_date: expirationDate }))
    }
  }, [])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Name is required"
    }

    if (!formData.age || formData.age <= 0) {
      newErrors.age = "Valid age is required"
    }

    if (!formData.address.trim()) {
      newErrors.address = "Address is required"
    }

    if (!formData.registration_number.trim()) {
      newErrors.registration_number = "Registration number is required"
    }

    if (!formData.join_date) {
      newErrors.join_date = "Join date is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (validateForm()) {
      onSubmit(formData)
      // Reset form
      setFormData({
        name: "",
        age: 0,
        address: "",
        registration_number: "",
        membership_plan: "Basic",
        join_date: new Date().toISOString().split("T")[0],
        expiration_date: "",
      })
      setErrors({})
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target

    if (name === "join_date") {
      // When join date changes, recalculate expiration date
      const newJoinDate = value
      const expirationDate = calculateExpirationDate(newJoinDate, formData.membership_plan)

      setFormData((prev) => ({
        ...prev,
        join_date: newJoinDate,
        expiration_date: expirationDate,
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "number" ? (value ? Number.parseInt(value) : 0) : value,
      }))
    }

    // Clear error when field is edited
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handlePlanChange = (plan: MembershipPlan) => {
    setFormData((prev) => ({
      ...prev,
      membership_plan: plan,
    }))
  }

  const handleExpirationDateChange = (date: string) => {
    setFormData((prev) => ({
      ...prev,
      expiration_date: date,
    }))
  }

  const handleOpenDialog = useCallback(() => {
    if (!isDialogOpen) {
      setIsDialogOpen(true)
    }
  }, [isDialogOpen])

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] max-h-[85vh] w-[90vw] max-w-[500px] translate-x-[-50%] translate-y-[-50%] rounded-lg bg-zinc-900 border border-zinc-800 p-6 shadow-lg focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] overflow-y-auto">
          <Dialog.Title className="text-xl font-semibold text-white">Add New Member</Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-gray-400">
            Fill in the details to add a new gym member.
          </Dialog.Description>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`bg-black border-zinc-800 ${errors.name ? "border-red-600" : ""}`}
              />
              {errors.name && <p className="text-red-600 text-sm">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                name="age"
                type="number"
                value={formData.age || ""}
                onChange={handleChange}
                className={`bg-black border-zinc-800 ${errors.age ? "border-red-600" : ""}`}
              />
              {errors.age && <p className="text-red-600 text-sm">{errors.age}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className={`bg-black border-zinc-800 ${errors.address ? "border-red-600" : ""}`}
              />
              {errors.address && <p className="text-red-600 text-sm">{errors.address}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="registration_number">Registration Number</Label>
              <Input
                id="registration_number"
                name="registration_number"
                value={formData.registration_number}
                onChange={handleChange}
                className={`bg-black border-zinc-800 ${errors.registration_number ? "border-red-600" : ""}`}
              />
              {errors.registration_number && <p className="text-red-600 text-sm">{errors.registration_number}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="membership_plan">Membership Plan</Label>
              <SubscriptionPlanDropdown
                value={formData.membership_plan}
                onValueChange={handlePlanChange}
                joinDate={formData.join_date}
                onExpirationDateChange={handleExpirationDateChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="join_date">Join Date</Label>
              <Input
                id="join_date"
                name="join_date"
                type="date"
                value={formData.join_date}
                onChange={handleChange}
                className={`bg-black border-zinc-800 ${errors.join_date ? "border-red-600" : ""}`}
              />
              {errors.join_date && <p className="text-red-600 text-sm">{errors.join_date}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiration_date">Expiration Date</Label>
              <Input
                id="expiration_date"
                name="expiration_date"
                type="date"
                value={formData.expiration_date}
                readOnly
                className="bg-black border-zinc-800 opacity-70"
              />
              <p className="text-xs text-gray-400">Automatically calculated based on join date and membership plan</p>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Dialog.Close asChild>
                <Button type="button" variant="outline" className="border-zinc-700">
                  Cancel
                </Button>
              </Dialog.Close>
              <Button type="submit" className="bg-red-600 hover:bg-red-700">
                Add Member
              </Button>
            </div>
          </form>

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

