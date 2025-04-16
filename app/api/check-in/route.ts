import { NextResponse } from "next/server"
import { validateCheckIn, recordCheckIn } from "@/utils/qr-code"
import { sendEmailNotification } from "@/utils/notification"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export const runtime = "edge"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get("memberId")

    if (!memberId) {
      return NextResponse.json({ success: false, message: "Member ID is required" }, { status: 400 })
    }

    console.log("Processing check-in for member:", memberId)

    // Validate the check-in
    const validation = await validateCheckIn(memberId)
    console.log("Validation result:", validation)

    // Record the check-in if valid
    if (validation.valid) {
      const recordResult = await recordCheckIn(memberId, validation.anomaly)
      console.log("Record check-in result:", recordResult)

      // If there's an anomaly, record it and notify staff
      if (validation.anomaly) {
        try {
          // Record anomaly in a separate table for tracking
          const { error: anomalyError } = await supabase.from("anomalies").insert([
            {
              member_id: memberId,
              type: validation.anomaly,
              date: new Date().toISOString(),
              resolved: false,
            },
          ])

          if (anomalyError) {
            console.error("Error recording anomaly:", anomalyError)
          }

          // Send notification to staff about the anomaly
          const anomalyMessages: Record<string, string> = {
            duplicate_scan: `Duplicate scan detected for ${validation.memberName}`,
            unusual_hours: `Unusual hours check-in detected for ${validation.memberName}`,
            expired_membership: `Expired membership check-in attempt by ${validation.memberName}`,
          }

          const anomalyMessage = anomalyMessages[validation.anomaly as keyof typeof anomalyMessages]

          // Send email to staff (assuming staff email is configured)
          if (process.env.STAFF_EMAIL) {
            await sendEmailNotification(
              process.env.STAFF_EMAIL,
              "Gym Check-In Anomaly Detected",
              `<h1>Anomaly Alert</h1><p>${anomalyMessage}</p><p>Time: ${new Date().toLocaleString()}</p>`,
            )
          }
        } catch (anomalyError) {
          console.error("Error handling anomaly:", anomalyError)
        }
      }
    }

    // Return appropriate response
    return NextResponse.json({
      success: validation.valid,
      message: validation.message,
      anomaly: validation.anomaly || null,
      memberName: validation.memberName || null,
    })
  } catch (error) {
    console.error("Check-in error:", error)
    return NextResponse.json({ success: false, message: "Server error", error: String(error) }, { status: 500 })
  }
}

