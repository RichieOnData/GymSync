import QRCode from "qrcode"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

// Generate a QR code data URL for a member
export async function generateMemberQRCode(memberId: string): Promise<string> {
  try {
    if (!memberId) {
      throw new Error("Member ID is required")
    }

    // Create a check-in URL with the member ID
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : "")
    const checkInUrl = `${appUrl}/api/check-in?memberId=${memberId}`

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(checkInUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: "#dc2626", // Red-600 to match our theme
        light: "#ffffff",
      },
    })

    return qrCodeDataUrl
  } catch (error) {
    console.error("Error generating member QR code:", error)
    throw error
  }
}

// Generate a QR code data URL for staff
export async function generateStaffQRCode(staffId: string): Promise<string> {
  try {
    if (!staffId) {
      throw new Error("Staff ID is required")
    }

    // Create a check-in URL with the staff ID
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : "")
    const checkInUrl = `${appUrl}/api/staff-check-in?staffId=${staffId}`

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(checkInUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: "#dc2626", // Red-600 to match our theme
        light: "#ffffff",
      },
    })

    return qrCodeDataUrl
  } catch (error) {
    console.error("Error generating staff QR code:", error)
    throw error
  }
}

// Validate a member check-in attempt
export async function validateCheckIn(memberId: string): Promise<{
  valid: boolean
  message: string
  anomaly?: string
  memberName?: string
}> {
  try {
    if (!memberId) {
      return { valid: false, message: "Invalid member ID" }
    }

    // Get member details
    const { data: member, error: memberError } = await supabase.from("members").select("*").eq("id", memberId).single()

    if (memberError || !member) {
      console.error("Member lookup error:", memberError)
      return { valid: false, message: "Invalid member ID or member not found" }
    }

    // Check if membership is active
    const currentDate = new Date().toISOString().split("T")[0]
    if (member.expiration_date < currentDate) {
      return {
        valid: false,
        message: "Membership expired",
        anomaly: "expired_membership",
        memberName: member.name,
      }
    }

    // Check for duplicate check-in (within last 2 hours)
    const twoHoursAgo = new Date()
    twoHoursAgo.setHours(twoHoursAgo.getHours() - 2)

    const { data: recentCheckIns, error: checkInError } = await supabase
      .from("attendance")
      .select("*")
      .eq("member_id", memberId)
      .gte("created_at", twoHoursAgo.toISOString())
      .order("created_at", { ascending: false })

    if (checkInError) {
      return { valid: false, message: "Error checking recent attendance" }
    }

    // Check for duplicate scan
    if (recentCheckIns && recentCheckIns.length > 0) {
      return {
        valid: true,
        message: "Check-in successful (duplicate within 2 hours)",
        anomaly: "duplicate_scan",
        memberName: member.name,
      }
    }

    // Check for unusual hours (assuming gym hours are 5:00 AM to 11:00 PM)
    const currentHour = new Date().getHours()
    if (currentHour < 5 || currentHour >= 23) {
      return {
        valid: true,
        message: "Check-in successful (unusual hours)",
        anomaly: "unusual_hours",
        memberName: member.name,
      }
    }

    // All checks passed
    return {
      valid: true,
      message: "Check-in successful",
      memberName: member.name,
    }
  } catch (error) {
    console.error("Error validating check-in:", error)
    return { valid: false, message: "Server error during validation" }
  }
}

// Record a member check-in to the attendance table
export async function recordCheckIn(memberId: string, anomaly?: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("attendance").insert([
      {
        member_id: memberId,
        date: new Date().toISOString().split("T")[0],
        status: "Present",
        anomaly: anomaly || null,
        created_at: new Date().toISOString(),
      },
    ])

    if (error) {
      console.error("Error recording check-in:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error recording check-in:", error)
    return false
  }
}

// Validate a staff check-in/out attempt
export async function validateStaffCheckIn(staffId: string): Promise<{
  valid: boolean
  message: string
  staffName?: string
  isCheckOut?: boolean
}> {
  try {
    if (!staffId) {
      return { valid: false, message: "Invalid staff ID" }
    }

    // Get staff details
    const { data: staff, error: staffError } = await supabase.from("staff").select("*").eq("id", staffId).single()

    if (staffError || !staff) {
      console.error("Staff lookup error:", staffError)
      return { valid: false, message: "Invalid staff ID or staff not found" }
    }

    // Check if staff is active
    if (staff.status !== "Active") {
      return {
        valid: false,
        message: "Staff is not active",
        staffName: staff.name,
      }
    }

    // Check for existing check-in today
    const today = new Date().toISOString().split("T")[0]

    const { data: existingAttendance, error: attendanceError } = await supabase
      .from("staff_attendance")
      .select("*")
      .eq("staff_id", staffId)
      .eq("date", today)
      .single()

    if (attendanceError && attendanceError.code !== "PGRST116") {
      // PGRST116 is "no rows returned"
      console.error("Error checking staff attendance:", attendanceError)
      return { valid: false, message: "Error checking attendance records" }
    }

    // Determine if this is a check-in or check-out
    const isCheckOut = existingAttendance && existingAttendance.check_in_time && !existingAttendance.check_out_time

    return {
      valid: true,
      message: isCheckOut ? "Check-out successful" : "Check-in successful",
      staffName: staff.name,
      isCheckOut,
    }
  } catch (error) {
    console.error("Error validating staff check-in:", error)
    return { valid: false, message: "Server error during validation" }
  }
}

// Record a staff check-in or check-out
export async function recordStaffAttendance(staffId: string, isCheckOut = false): Promise<boolean> {
  try {
    const today = new Date().toISOString().split("T")[0]
    const now = new Date().toISOString()

    if (isCheckOut) {
      // Update existing record with check-out time
      const { error } = await supabase
        .from("staff_attendance")
        .update({
          check_out_time: now,
          status: "present", // Ensure status is set
        })
        .eq("staff_id", staffId)
        .eq("date", today)

      if (error) {
        console.error("Error recording staff check-out:", error)
        return false
      }
    } else {
      // Create new attendance record with check-in time
      const { error } = await supabase.from("staff_attendance").insert([
        {
          staff_id: staffId,
          date: today,
          check_in_time: now,
          status: "present",
        },
      ])

      if (error) {
        console.error("Error recording staff check-in:", error)
        return false
      }
    }

    return true
  } catch (error) {
    console.error("Error recording staff attendance:", error)
    return false
  }
}

