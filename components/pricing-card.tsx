"use client"

import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, ReactNode } from "react"
import { createOrder } from "@/app/actions/create-order"
import { useRouter } from "next/navigation"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

declare global {
  interface Window {
    Razorpay: any
  }
}

interface PricingCardProps {
  title: string
  subtitle: string
  price: string
  features: string[]
  buttonText: ReactNode
}

export function PricingCard({ title, subtitle, price, features, buttonText }: PricingCardProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script")
      script.src = "https://checkout.razorpay.com/v1/checkout.js"
      script.onload = resolve
      document.body.appendChild(script)
    })
  }

  const handlePayment = async () => {
    try {
      setLoading(true)

      // Check if user is logged in
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }

      // Load Razorpay SDK
      await loadRazorpay()

      // Only create order if it's not the Enterprise plan
      if (price !== "Custom Pricing") {
        const amount = Number.parseInt(price.replace(/,/g, ""))
        const { success, orderId, error } = await createOrder(amount)

        if (!success || !orderId) {
          throw new Error(error || "Failed to create order")
        }

        // Initialize Razorpay payment
        const razorpay = new window.Razorpay({
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: amount * 100, // Convert to paise
          currency: "INR",
          name: "GymSync",
          description: `${title} Plan Subscription`,
          order_id: orderId,
          prefill: {
            email: user.email,
          },
          theme: {
            color: "#dc2626", // Red-600 to match our theme
          },
          handler: (response: any) => {
            // Handle successful payment
            console.log("Payment successful:", response)
            router.push("/payment/success")
          },
        })

        razorpay.open()
      } else {
        // Handle Enterprise plan
        router.push("/contact-sales")
      }
    } catch (error) {
      console.error("Payment error:", error)
      alert("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl bg-[#0A0A0A] p-8 border border-zinc-800/50">
      <h3 className="text-2xl font-bold text-red-600 mb-2">{title}</h3>
      <p className="text-gray-400 mb-4">{subtitle}</p>
      <div className="mb-6">
        {price === "Custom Pricing" ? (
          <div className="text-3xl font-bold text-red-600">{price}</div>
        ) : (
          <div className="flex items-baseline">
            <span className="text-3xl font-bold text-red-600">₹{price}</span>
            <span className="text-gray-400 ml-1">/month</span>
          </div>
        )}
      </div>
      <ul className="space-y-4 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <Check className="h-5 w-5 text-blue-400 mr-2 mt-0.5 shrink-0" />
            <span className="text-gray-300">{feature}</span>
          </li>
        ))}
      </ul>
      <Button
        onClick={handlePayment}
        disabled={loading}
        className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-6"
      >
        {loading ? "Processing..." : buttonText}
      </Button>
    </div>
  )
}

