import { NextResponse } from "next/server"
import db from "@/utils/postgres"
import type { StaffRole } from "@/types/staff"

export async function GET() {
  try {
    const result = await db.query("SELECT id, name, description FROM staff_roles ORDER BY name ASC")

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Error fetching staff roles:", error)
    return NextResponse.json({ error: "Failed to fetch staff roles" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const roleData: Omit<StaffRole, "id"> = await request.json()

    if (!roleData.name) {
      return NextResponse.json({ error: "Role name is required" }, { status: 400 })
    }

    const result = await db.query("INSERT INTO staff_roles (name, description) VALUES ($1, $2) RETURNING *", [
      roleData.name,
      roleData.description || null,
    ])

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error("Error creating staff role:", error)

    // Check for duplicate role name
    if (error instanceof Error && error.message.includes("duplicate key")) {
      return NextResponse.json({ error: "A role with this name already exists" }, { status: 409 })
    }

    return NextResponse.json({ error: "Failed to create staff role" }, { status: 500 })
  }
}
