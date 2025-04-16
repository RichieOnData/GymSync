import { NextResponse } from "next/server"
import { validateStaffCheckIn, recordStaffAttendance } from "@/utils/qr-code"

export const runtime = "edge"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const staffId = searchParams.get("staffId")

    if (!staffId) {
      return NextResponse.json({ success: false, message: "Staff ID is required" }, { status: 400 })
    }

    console.log("Processing staff check-in/out for:", staffId)

    // Validate the check-in/out
    const validation = await validateStaffCheckIn(staffId)
    console.log("Staff validation result:", validation)

    if (validation.valid) {
      // Record the attendance
      const recordResult = await recordStaffAttendance(staffId, validation.isCheckOut)
      console.log("Record staff attendance result:", recordResult)

      if (!recordResult) {
        return NextResponse.json(
          {
            success: false,
            message: "Failed to record attendance",
          },
          { status: 500 },
        )
      }
    }

    // Return appropriate response
    return NextResponse.json({
      success: validation.valid,
      message: validation.message,
      staffName: validation.staffName || null,
      isCheckOut: validation.isCheckOut || false,
    })
  } catch (error) {
    console.error("Staff check-in error:", error)
    return NextResponse.json({ success: false, message: "Server error", error: String(error) }, { status: 500 })
  }
}

