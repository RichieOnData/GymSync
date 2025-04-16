"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { makePayment } from "@/utils/razorpay"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface PaymentButtonProps {
  plan: {
    name: string
    price: string
    description: string
  }
  className?: string
}

export function PaymentButton({ plan, className }: PaymentButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handlePayment = async () => {
    try {
      setIsLoading(true)

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("Please login to continue")
      }

      // Create order
      const response = await fetch("/api/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Number.parseInt(plan.price.replace(/,/g, "")),
          receipt: `${plan.name}-${Date.now()}`,
        }),
      })

      const { orderId } = await response.json()

      if (!orderId) {
        throw new Error("Failed to create order")
      }

      // Initialize payment
      await makePayment({
        amount: Number.parseInt(plan.price.replace(/,/g, "")),
        name: "GymSync",
        description: `${plan.name} Plan - ${plan.description}`,
        orderId,
        email: user.email || "",
      })
    } catch (error: any) {
      console.error("Payment error:", error)
      alert(error.message || "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handlePayment} disabled={isLoading} className={className}>
      {isLoading ? "Processing..." : "Choose Plan"}
    </Button>
  )
}

