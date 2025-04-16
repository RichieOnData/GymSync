import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import crypto from "crypto"
import { calculateExpirationDate } from "@/utils/subscription"

// Initialize Supabase client
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export async function POST(request: Request) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, memberId, plan, isRenewal } =
      await request.json()

    // Verify payment signature
    const secret = process.env.RAZORPAY_KEY_SECRET
    if (!secret) {
      throw new Error("Razorpay secret key is not configured")
    }

    const generated_signature = crypto
      .createHmac("sha256", secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex")

    if (generated_signature !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 })
    }

    // Get member details
    const { data: member, error: memberError } = await supabase.from("members").select("*").eq("id", memberId).single()

    if (memberError || !member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    // Calculate new expiration date
    const startDate = isRenewal ? new Date().toISOString().split("T")[0] : member.join_date
    const expirationDate = calculateExpirationDate(startDate, plan)

    // Update member if renewal
    if (isRenewal) {
      const { error: updateError } = await supabase
        .from("members")
        .update({
          membership_plan: plan,
          expiration_date: expirationDate,
          status: "active",
        })
        .eq("id", memberId)

      if (updateError) {
        return NextResponse.json({ error: "Failed to update member" }, { status: 500 })
      }
    }

    // Record payment
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert([
        {
          member_id: memberId,
          amount: member.amount,
          plan: plan,
          payment_date: new Date().toISOString().split("T")[0],
          expiration_date: expirationDate,
          payment_id: razorpay_payment_id,
          order_id: razorpay_order_id,
        },
      ])
      .select()
      .single()

    if (paymentError) {
      return NextResponse.json({ error: "Failed to record payment" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      payment,
      message: isRenewal ? "Membership renewed successfully" : "Payment recorded successfully",
    })
  } catch (error) {
    console.error("Error verifying payment:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to verify payment" },
      { status: 500 },
    )
  }
}

