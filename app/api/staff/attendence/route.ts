import { NextResponse } from "next/server"
import db from "@/utils/postgres"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const staffId = searchParams.get("staffId")
    const date = searchParams.get("date")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    let queryText = `
      SELECT a.*, 
        s.name as staff_name, 
        s.email as staff_email,
        r.name as role_name
      FROM staff_attendance a
      JOIN staff s ON a.staff_id = s.id
      LEFT JOIN staff_roles r ON s.role_id = r.id
      WHERE 1=1
    `

    const queryParams: any[] = []
    let paramIndex = 1

    if (staffId) {
      queryText += ` AND a.staff_id = $${paramIndex}`
      queryParams.push(staffId)
      paramIndex++
    }

    if (date) {
      queryText += ` AND a.date = $${paramIndex}`
      queryParams.push(date)
      paramIndex++
    }

    if (startDate && endDate) {
      queryText += ` AND a.date BETWEEN $${paramIndex} AND $${paramIndex + 1}`
      queryParams.push(startDate, endDate)
      paramIndex += 2
    } else if (startDate) {
      queryText += ` AND a.date >= $${paramIndex}`
      queryParams.push(startDate)
      paramIndex++
    } else if (endDate) {
      queryText += ` AND a.date <= $${paramIndex}`
      queryParams.push(endDate)
      paramIndex++
    }

    queryText += " ORDER BY a.date DESC, a.check_in_time DESC"

    const result = await db.query(queryText, queryParams)

    const attendanceRecords = result.rows.map((row) => ({
      id: row.id,
      staff_id: row.staff_id,
      date: row.date,
      check_in_time: row.check_in_time,
      check_out_time: row.check_out_time,
      total_hours: row.total_hours,
      status: row.status,
      notes: row.notes,
      staff: {
        id: row.staff_id,
        name: row.staff_name,
        email: row.staff_email,
        role: row.role_name,
      },
    }))

    return NextResponse.json({
      success: true,
      data: attendanceRecords,
    })
  } catch (error) {
    console.error("Error fetching attendance records:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch attendance records" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { staffId, status, date = new Date().toISOString().split("T")[0], notes } = await request.json()

    if (!staffId || !status) {
      return NextResponse.json({ success: false, message: "Staff ID and status are required" }, { status: 400 })
    }

    // Check if staff exists
    const staffResult = await db.query("SELECT id, name FROM staff WHERE id = $1", [staffId])

    if (staffResult.rows.length === 0) {
      return NextResponse.json({ success: false, message: "Staff not found" }, { status: 404 })
    }

    // Check if attendance record already exists for today
    const existingResult = await db.query("SELECT * FROM staff_attendance WHERE staff_id = $1 AND date = $2", [
      staffId,
      date,
    ])

    if (existingResult.rows.length > 0) {
      // Update existing record
      const updateResult = await db.query(
        `UPDATE staff_attendance 
         SET status = $1, notes = $2, updated_at = NOW() 
         WHERE id = $3 
         RETURNING *`,
        [status, notes || null, existingResult.rows[0].id],
      )

      return NextResponse.json({
        success: true,
        message: "Attendance updated successfully",
        data: updateResult.rows[0],
      })
    } else {
      // Create new attendance record
      const insertResult = await db.query(
        `INSERT INTO staff_attendance 
         (staff_id, date, status, check_in_time, notes) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
        [staffId, date, status, status === "present" ? new Date() : null, notes || null],
      )

      return NextResponse.json({
        success: true,
        message: "Attendance recorded successfully",
        data: insertResult.rows[0],
      })
    }
  } catch (error) {
    console.error("Staff attendance error:", error)
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 })
  }
}
