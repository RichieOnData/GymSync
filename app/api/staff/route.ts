import { NextResponse } from "next/server"
import db from "@/utils/postgres"
import type { Staff } from "@/types/staff"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const role = searchParams.get("role")

    let queryText = `
      SELECT s.*, r.name as role_name, r.description as role_description
      FROM staff s
      LEFT JOIN staff_roles r ON s.role_id = r.id
      WHERE 1=1
    `

    const queryParams: any[] = []
    let paramIndex = 1

    if (status) {
      queryText += ` AND s.status = $${paramIndex}`
      queryParams.push(status)
      paramIndex++
    }

    if (role) {
      queryText += ` AND r.name = $${paramIndex}`
      queryParams.push(role)
      paramIndex++
    }

    queryText += " ORDER BY s.name ASC"

    const result = await db.query(queryText, queryParams)

    const staffList = result.rows.map((row) => ({
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
    }))

    return NextResponse.json(staffList)
  } catch (error) {
    console.error("Error fetching staff:", error)
    return NextResponse.json({ error: "Failed to fetch staff data" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const staffData: Omit<Staff, "id"> = await request.json()

    // Validate required fields
    if (!staffData.name || !staffData.email || !staffData.role_id || !staffData.hire_date) {
      return NextResponse.json({ error: "Name, email, role, and hire date are required" }, { status: 400 })
    }

    const queryText = `
      INSERT INTO staff (
        name, email, phone, role_id, status, hire_date, 
        profile_image_url, emergency_contact, emergency_phone, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `

    const queryParams = [
      staffData.name,
      staffData.email,
      staffData.phone || null,
      staffData.role_id,
      staffData.status || "Active",
      staffData.hire_date,
      staffData.profile_image_url || null,
      staffData.emergency_contact || null,
      staffData.emergency_phone || null,
      staffData.notes || null,
    ]

    const result = await db.query(queryText, queryParams)
    const newStaff = result.rows[0]

    // Get role information
    const roleResult = await db.query("SELECT id, name, description FROM staff_roles WHERE id = $1", [newStaff.role_id])

    const staffWithRole = {
      ...newStaff,
      role: roleResult.rows[0],
    }

    return NextResponse.json(staffWithRole, { status: 201 })
  } catch (error) {
    console.error("Error creating staff:", error)

    // Check for duplicate email
    if (error instanceof Error && error.message.includes("duplicate key")) {
      return NextResponse.json({ error: "A staff member with this email already exists" }, { status: 409 })
    }

    return NextResponse.json({ error: "Failed to create staff member" }, { status: 500 })
  }
}
