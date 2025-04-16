import { NextResponse } from "next/server"
import db from "@/utils/postgres"
import type { Staff } from "@/types/staff"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    const queryText = `
      SELECT s.*, r.name as role_name, r.description as role_description
      FROM staff s
      LEFT JOIN staff_roles r ON s.role_id = r.id
      WHERE s.id = $1
    `

    const result = await db.query(queryText, [id])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 })
    }

    const row = result.rows[0]
    const staff = {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      role_id: row.role_id,
      role: {
        id: row.role_id,
        name: row.role_name,
        description: row.role_description,
      },
      status: row.status,
      hire_date: row.hire_date,
      profile_image_url: row.profile_image_url,
      emergency_contact: row.emergency_contact,
      emergency_phone: row.emergency_phone,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }

    return NextResponse.json(staff)
  } catch (error) {
    console.error("Error fetching staff member:", error)
    return NextResponse.json({ error: "Failed to fetch staff member" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const staffData: Partial<Staff> = await request.json()

    // Check if staff exists
    const checkResult = await db.query("SELECT id FROM staff WHERE id = $1", [id])

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 })
    }

    // Build dynamic update query
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    // Add fields that can be updated
    const updateableFields = [
      "name",
      "email",
      "phone",
      "role_id",
      "status",
      "hire_date",
      "profile_image_url",
      "emergency_contact",
      "emergency_phone",
      "notes",
    ]

    updateableFields.forEach((field) => {
      if (field in staffData) {
        updates.push(`${field} = $${paramIndex}`)
        values.push((staffData as any)[field])
        paramIndex++
      }
    })

    // Add updated_at timestamp
    updates.push(`updated_at = $${paramIndex}`)
    values.push(new Date())
    paramIndex++

    // Add id as the last parameter
    values.push(id)

    const queryText = `
      UPDATE staff
      SET ${updates.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING *
    `

    const result = await db.query(queryText, values)
    const updatedStaff = result.rows[0]

    // Get role information
    const roleResult = await db.query("SELECT id, name, description FROM staff_roles WHERE id = $1", [
      updatedStaff.role_id,
    ])

    const staffWithRole = {
      ...updatedStaff,
      role: roleResult.rows[0],
    }

    return NextResponse.json(staffWithRole)
  } catch (error) {
    console.error("Error updating staff member:", error)

    // Check for duplicate email
    if (error instanceof Error && error.message.includes("duplicate key")) {
      return NextResponse.json({ error: "A staff member with this email already exists" }, { status: 409 })
    }

    return NextResponse.json({ error: "Failed to update staff member" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    // Check if staff exists
    const checkResult = await db.query("SELECT id FROM staff WHERE id = $1", [id])

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 })
    }

    // Delete the staff member
    await db.query("DELETE FROM staff WHERE id = $1", [id])

    return NextResponse.json({ success: true, message: "Staff member deleted successfully" })
  } catch (error) {
    console.error("Error deleting staff member:", error)
    return NextResponse.json({ error: "Failed to delete staff member" }, { status: 500 })
  }
}
