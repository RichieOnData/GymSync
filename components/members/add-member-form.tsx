"use client"

import type React from "react"

import { useState, useEffect } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { Cross2Icon } from "@radix-ui/react-icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { createClient } from "@supabase/supabase-js"
import { SubscriptionPlanDropdown } from "./subscription-plan-dropdown"
import { calculateExpirationDate, getPlanPrice } from "@/utils/subscription"
import type { MembershipPlan } from "@/types/member"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

declare global {
  interface Window {
    Razorpay: any
  }
}

interface AddMemberFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function AddMemberForm({ open, onOpenChange, onSuccess }: AddMemberFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    address: "",
    email: "",
    phone: "",
    registration_number: "",
    membership_plan: "Basic" as MembershipPlan,
    join_date: new Date().toISOString().split("T")[0],
    expiration_date: "",
    amount: getPlanPrice("Basic"),
    has_negotiated_price: false,
    negotiated_price: "",
    negotiation_remarks: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

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

    if (!formData.age || Number.parseInt(formData.age) <= 0) {
      newErrors.age = "Valid age is required"
    }

    if (!formData.address.trim()) {
      newErrors.address = "Address is required"
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Invalid email format"
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required"
    }

    if (!formData.registration_number.trim()) {
      newErrors.registration_number = "Registration number is required"
    }

    if (!formData.join_date) {
      newErrors.join_date = "Join date is required"
    }

    if (formData.has_negotiated_price && (!formData.negotiated_price || Number(formData.negotiated_price) <= 0)) {
      newErrors.negotiated_price = "Valid negotiated price is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script")
      script.src = "https://checkout.razorpay.com/v1/checkout.js"
      script.onload = resolve
      document.body.appendChild(script)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      setLoading(true)

      // First, add the member to the database
      const { data: member, error: memberError } = await supabase
        .from("members")
        .insert([
          {
            name: formData.name,
            age: Number.parseInt(formData.age),
            address: formData.address,
            email: formData.email,
            phone: formData.phone,
            registration_number: formData.registration_number,
            membership_plan: formData.membership_plan,
            join_date: formData.join_date,
            expiration_date: formData.expiration_date,
            status: "active",
            standard_price: formData.amount,
            negotiated_price: formData.has_negotiated_price ? Number(formData.negotiated_price) : null,
            negotiation_remarks: formData.has_negotiated_price ? formData.negotiation_remarks : null,
          },
        ])
        .select()
        .single()

      if (memberError) {
        throw new Error(memberError.message)
      }

      // Create payment order
      const finalAmount = formData.has_negotiated_price ? Number(formData.negotiated_price) : formData.amount
      const response = await fetch("/api/create-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          memberId: member.id,
          plan: formData.membership_plan,
          isRenewal: false,
          amount: finalAmount,
        }),
      })

      const { success, orderId, error } = await response.json()

      if (!success || !orderId) {
        throw new Error(error || "Failed to create payment order")
      }

      // Load Razorpay
      await loadRazorpay()

      // Initialize Razorpay payment
      const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
      if (!razorpayKeyId) {
        throw new Error("Razorpay public key is not configured")
      }

      const razorpay = new window.Razorpay({
        key: razorpayKeyId,
        amount: finalAmount * 100, // Convert to paise
        currency: "INR",
        name: "GymSync",
        description: `${formData.membership_plan} Plan Subscription${formData.has_negotiated_price ? " (Custom Price)" : ""}`,
        order_id: orderId,
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone,
        },
        theme: {
          color: "#dc2626", // Red-600 to match our theme
        },
        handler: async (response: any) => {
          // Verify payment
          const verifyResponse = await fetch("/api/verify-payment", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              memberId: member.id,
              plan: formData.membership_plan,
              isRenewal: false,
              amount: finalAmount,
            }),
          })

          const verifyData = await verifyResponse.json()

          if (!verifyData.success) {
            throw new Error(verifyData.error || "Payment verification failed")
          }

          // Reset form
          setFormData({
            name: "",
            age: "",
            address: "",
            email: "",
            phone: "",
            registration_number: "",
            membership_plan: "Basic",
            join_date: new Date().toISOString().split("T")[0],
            expiration_date: "",
            amount: getPlanPrice("Basic"),
            has_negotiated_price: false,
            negotiated_price: "",
            negotiation_remarks: "",
          })
          setErrors({})
          onOpenChange(false)
          onSuccess()

          toast({
            title: "Member Added",
            description: "New member has been added successfully with payment.",
          })
        },
      })

      razorpay.open()
    } catch (error) {
      console.error("Error adding member:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add member",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

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
        [name]: value,
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

  const handlePriceChange = (price: number) => {
    setFormData((prev) => ({
      ...prev,
      amount: price,
    }))
  }

  const handleNegotiatedPriceToggle = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      has_negotiated_price: checked,
      negotiated_price: checked ? prev.negotiated_price : "",
      negotiation_remarks: checked ? prev.negotiation_remarks : "",
    }))
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] max-h-[85vh] w-[90vw] max-w-[500px] translate-x-[-50%] translate-y-[-50%] rounded-lg bg-zinc-900 border border-zinc-800 p-6 shadow-lg focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] overflow-y-auto">
          <Dialog.Title className="text-xl font-semibold text-white">Add New Member</Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-gray-400">
            Fill in the details to add a new gym member. Payment will be processed via Razorpay.
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
                value={formData.age}
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
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={`bg-black border-zinc-800 ${errors.email ? "border-red-600" : ""}`}
              />
              {errors.email && <p className="text-red-600 text-sm">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`bg-black border-zinc-800 ${errors.phone ? "border-red-600" : ""}`}
              />
              {errors.phone && <p className="text-red-600 text-sm">{errors.phone}</p>}
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
                onPriceChange={handlePriceChange}
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

            <div className="space-y-2">
              <Label htmlFor="amount">Standard Price (₹)</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                value={formData.amount}
                readOnly
                className="bg-black border-zinc-800 opacity-70"
              />
              <p className="text-xs text-gray-400">Based on selected membership plan</p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="has_negotiated_price"
                checked={formData.has_negotiated_price}
                onCheckedChange={handleNegotiatedPriceToggle}
              />
              <Label
                htmlFor="has_negotiated_price"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Did the member negotiate a custom price?
              </Label>
            </div>

            {formData.has_negotiated_price && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="negotiated_price">Negotiated Price (₹)</Label>
                  <Input
                    id="negotiated_price"
                    name="negotiated_price"
                    type="number"
                    value={formData.negotiated_price}
                    onChange={handleChange}
                    className={`bg-black border-zinc-800 ${errors.negotiated_price ? "border-red-600" : ""}`}
                    placeholder="Enter the agreed price"
                  />
                  {errors.negotiated_price && <p className="text-red-600 text-sm">{errors.negotiated_price}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="negotiation_remarks">Remarks</Label>
                  <Textarea
                    id="negotiation_remarks"
                    name="negotiation_remarks"
                    value={formData.negotiation_remarks}
                    onChange={handleChange}
                    className="bg-black border-zinc-800"
                    placeholder="Add any notes about the price negotiation"
                    rows={3}
                  />
                </div>
              </>
            )}

            <div className="flex justify-end gap-2 mt-6">
              <Dialog.Close asChild>
                <Button type="button" variant="outline" className="border-zinc-700">
                  Cancel
                </Button>
              </Dialog.Close>
              <Button type="submit" className="bg-red-600 hover:bg-red-700" disabled={loading}>
                {loading ? "Processing..." : "Add Member & Process Payment"}
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

