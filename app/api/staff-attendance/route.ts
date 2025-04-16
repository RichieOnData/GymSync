import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export async function POST(request: Request) {
  try {
    const { staffId, status, date = new Date().toISOString().split("T")[0] } = await request.json()

    if (!staffId || !status) {
      return NextResponse.json({ success: false, message: "Staff ID and status are required" }, { status: 400 })
    }

    // Check if staff exists
    const { data: staff, error: staffError } = await supabase
      .from("staff")
      .select("id, name")
      .eq("id", staffId)
      .single()

    if (staffError || !staff) {
      return NextResponse.json({ success: false, message: "Staff not found" }, { status: 404 })
    }

    // Check if attendance record already exists for today
    const { data: existingRecord, error: existingError } = await supabase
      .from("staff_attendance")
      .select("*")
      .eq("staff_id", staffId)
      .eq("date", date)
      .single()

    if (existingRecord) {
      // Update existing record
      const { error: updateError } = await supabase
        .from("staff_attendance")
        .update({ status })
        .eq("id", existingRecord.id)

      if (updateError) {
        return NextResponse.json({ success: false, message: "Failed to update attendance" }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: "Attendance updated successfully",
        data: { ...existingRecord, status },
      })
    } else {
      // Create new attendance record
      const { data: newRecord, error: insertError } = await supabase
        .from("staff_attendance")
        .insert([
          {
            staff_id: staffId,
            date,
            status,
            check_in_time: status === "present" ? new Date().toISOString() : null,
          },
        ])
        .select()
        .single()

      if (insertError) {
        return NextResponse.json({ success: false, message: "Failed to record attendance" }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: "Attendance recorded successfully",
        data: newRecord,
      })
    }
  } catch (error) {
    console.error("Staff attendance error:", error)
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const staffId = searchParams.get("staffId")
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0]

    let query = supabase
      .from("staff_attendance")
      .select(`
        *,
        staff:staff_id (
          id,
          name,
          role
        )
      `)
      .eq("date", date)

    if (staffId) {
      query = query.eq("staff_id", staffId)
    }

    const { data, error } = await query.order("check_in_time", { ascending: false })

    if (error) {
      return NextResponse.json({ success: false, message: "Failed to fetch attendance records" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error("Staff attendance fetch error:", error)
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 })
  }
}

