"use client"

import { useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { Cross2Icon } from "@radix-ui/react-icons"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { SubscriptionPlanDropdown } from "./subscription-plan-dropdown"
import { getPlanPrice } from "@/utils/subscription"
import type { Member, MembershipPlan } from "@/types/member"

declare global {
  interface Window {
    Razorpay: any
  }
}

interface RenewMembershipProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  member: Member
  onSuccess: () => void
}

export function RenewMembership({ open, onOpenChange, member, onSuccess }: RenewMembershipProps) {
  const [plan, setPlan] = useState<MembershipPlan>(member.membership_plan)
  const [expirationDate, setExpirationDate] = useState("")
  const [amount, setAmount] = useState(getPlanPrice(member.membership_plan))
  const [loading, setLoading] = useState(false)

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script")
      script.src = "https://checkout.razorpay.com/v1/checkout.js"
      script.onload = resolve
      document.body.appendChild(script)
    })
  }

  const handleRenew = async () => {
    try {
      setLoading(true)

      // Create payment order
      const response = await fetch("/api/create-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          memberId: member.id,
          plan: plan,
          isRenewal: true,
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
        amount: amount * 100, // Convert to paise
        currency: "INR",
        name: "GymSync",
        description: `${plan} Plan Renewal`,
        order_id: orderId,
        prefill: {
          name: member.name,
          email: member.email,
          contact: member.phone,
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
              plan: plan,
              isRenewal: true,
            }),
          })

          const verifyData = await verifyResponse.json()

          if (!verifyData.success) {
            throw new Error(verifyData.error || "Payment verification failed")
          }

          onOpenChange(false)
          onSuccess()

          toast({
            title: "Membership Renewed",
            description: `${member.name}'s membership has been renewed successfully.`,
          })
        },
      })

      razorpay.open()
    } catch (error) {
      console.error("Error renewing membership:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to renew membership",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePlanChange = (newPlan: MembershipPlan) => {
    setPlan(newPlan)
  }

  const handleExpirationDateChange = (date: string) => {
    setExpirationDate(date)
  }

  const handlePriceChange = (price: number) => {
    setAmount(price)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] max-h-[85vh] w-[90vw] max-w-[500px] translate-x-[-50%] translate-y-[-50%] rounded-lg bg-zinc-900 border border-zinc-800 p-6 shadow-lg focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] overflow-y-auto">
          <Dialog.Title className="text-xl font-semibold text-white">Renew Membership</Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-gray-400">
            Renew {member.name}'s membership by selecting a plan and processing payment.
          </Dialog.Description>

          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current_plan">Current Plan</Label>
              <div className="px-4 py-2 bg-black border border-zinc-800 rounded-md">{member.membership_plan}</div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="current_expiration">Current Expiration Date</Label>
              <div className="px-4 py-2 bg-black border border-zinc-800 rounded-md">
                {new Date(member.expiration_date).toLocaleDateString()}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new_plan">New Plan</Label>
              <SubscriptionPlanDropdown
                value={plan}
                onValueChange={handlePlanChange}
                joinDate={new Date().toISOString().split("T")[0]}
                onExpirationDateChange={handleExpirationDateChange}
                onPriceChange={handlePriceChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new_expiration">New Expiration Date</Label>
              <div className="px-4 py-2 bg-black border border-zinc-800 rounded-md">
                {expirationDate ? new Date(expirationDate).toLocaleDateString() : "Select a plan"}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹)</Label>
              <div className="px-4 py-2 bg-black border border-zinc-800 rounded-md">{amount}</div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Dialog.Close asChild>
                <Button type="button" variant="outline" className="border-zinc-700">
                  Cancel
                </Button>
              </Dialog.Close>
              <Button onClick={handleRenew} className="bg-red-600 hover:bg-red-700" disabled={loading}>
                {loading ? "Processing..." : "Renew & Process Payment"}
              </Button>
            </div>
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

