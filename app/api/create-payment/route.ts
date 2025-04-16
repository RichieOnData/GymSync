import { NextResponse } from "next/server"
import Razorpay from "razorpay"
import { createClient } from "@supabase/supabase-js"
import { SUBSCRIPTION_PLANS } from "@/types/member"

// Initialize Supabase client
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

// Initialize Razorpay client
const getRazorpayClient = () => {
  const key_id = process.env.RAZORPAY_KEY_ID
  const key_secret = process.env.RAZORPAY_KEY_SECRET

  if (!key_id || !key_secret) {
    throw new Error("Razorpay API keys are not configured. Please check your environment variables.")
  }

  return new Razorpay({
    key_id,
    key_secret,
  })
}

export async function POST(request: Request) {
  try {
    const { memberId, plan, isRenewal = false } = await request.json()

    // Validate input
    if (!memberId || !plan) {
      return NextResponse.json({ error: "Member ID and plan are required" }, { status: 400 })
    }

    // Get plan details
    const planDetails = SUBSCRIPTION_PLANS.find((p) => p.name === plan)
    if (!planDetails) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
    }

    // Get Razorpay client
    const razorpay = getRazorpayClient()

    // Create order
    const order = await razorpay.orders.create({
      amount: planDetails.price * 100, // Convert to paise
      currency: "INR",
      receipt: `order_${Date.now()}`,
      notes: {
        memberId,
        plan,
        isRenewal: isRenewal.toString(),
      },
    })

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: planDetails.price,
      plan,
    })
  } catch (error) {
    console.error("Error creating payment:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create payment" },
      { status: 500 },
    )
  }
}

