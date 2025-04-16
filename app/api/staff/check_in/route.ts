import { NextResponse } from "next/server"
import db from "@/utils/postgres"

export async function POST(request: Request) {
  try {
    const { staffId, action } = await request.json()

    if (!staffId || !action || !["check-in", "check-out"].includes(action)) {
      return NextResponse.json(
        { success: false, message: "Staff ID and valid action (check-in or check-out) are required" },
        { status: 400 },
      )
    }

    // Check if staff exists
    const staffResult = await db.query("SELECT id, name FROM staff WHERE id = $1", [staffId])

    if (staffResult.rows.length === 0) {
      return NextResponse.json({ success: false, message: "Staff not found" }, { status: 404 })
    }

    const today = new Date().toISOString().split("T")[0]
    const now = new Date()

    if (action === "check-in") {
      // Check if already checked in today
      const existingResult = await db.query("SELECT * FROM staff_attendance WHERE staff_id = $1 AND date = $2", [
        staffId,
        today,
      ])

      if (existingResult.rows.length > 0 && existingResult.rows[0].check_in_time) {
        return NextResponse.json(
          {
            success: false,
            message: "Already checked in today",
            data: existingResult.rows[0],
          },
          { status: 400 },
        )
      }

      // Create or update attendance record with check-in time
      let result
      if (existingResult.rows.length > 0) {
        // Update existing record
        result = await db.query(
          `UPDATE staff_attendance 
           SET check_in_time = $1, status = 'present', updated_at = NOW() 
           WHERE id = $2 
           RETURNING *`,
          [now, existingResult.rows[0].id],
        )
      } else {
        // Create new record
        result = await db.query(
          `INSERT INTO staff_attendance 
           (staff_id, date, check_in_time, status) 
           VALUES ($1, $2, $3, 'present') 
           RETURNING *`,
          [staffId, today, now],
        )
      }

      return NextResponse.json({
        success: true,
        message: "Check-in successful",
        data: result.rows[0],
        staffName: staffResult.rows[0].name,
      })
    } else {
      // Check-out: Update existing attendance record
      const existingResult = await db.query("SELECT * FROM staff_attendance WHERE staff_id = $1 AND date = $2", [
        staffId,
        today,
      ])

      if (existingResult.rows.length === 0 || !existingResult.rows[0].check_in_time) {
        return NextResponse.json(
          {
            success: false,
            message: "Cannot check out without checking in first",
          },
          { status: 400 },
        )
      }

      if (existingResult.rows[0].check_out_time) {
        return NextResponse.json(
          {
            success: false,
            message: "Already checked out today",
            data: existingResult.rows[0],
          },
          { status: 400 },
        )
      }

      // Update with check-out time
      const result = await db.query(
        `UPDATE staff_attendance 
         SET check_out_time = $1, updated_at = NOW() 
         WHERE id = $2 
         RETURNING *`,
        [now, existingResult.rows[0].id],
      )

      return NextResponse.json({
        success: true,
        message: "Check-out successful",
        data: result.rows[0],
        staffName: staffResult.rows[0].name,
      })
    }
  } catch (error) {
    console.error("Staff check-in/out error:", error)
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 })
  }
}
