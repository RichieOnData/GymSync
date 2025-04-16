import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const category = searchParams.get("category")

    let query = supabase.from("suggestions").select("*").order("date", { ascending: false })

    if (status) {
      query = query.eq("status", status)
    }

    if (category) {
      query = query.eq("category", category)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching suggestions:", error)
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error in suggestions API:", error)
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const { data, error } = await supabase
      .from("suggestions")
      .insert([
        {
          member_id: body.member_id,
          member_name: body.member_name,
          suggestion: body.suggestion,
          date: body.date || new Date().toISOString(),
          status: body.status || "new",
          category: body.category,
          priority: body.priority || "medium",
          notes: body.notes,
        },
      ])
      .select()

    if (error) {
      console.error("Error adding suggestion:", error)
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: data[0] })
  } catch (error) {
    console.error("Error in suggestions API:", error)
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()

    if (!body.id) {
      return NextResponse.json({ success: false, message: "Suggestion ID is required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("suggestions")
      .update({
        status: body.status,
        category: body.category,
        priority: body.priority,
        notes: body.notes,
      })
      .eq("id", body.id)
      .select()

    if (error) {
      console.error("Error updating suggestion:", error)
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: data[0] })
  } catch (error) {
    console.error("Error in suggestions API:", error)
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 })
  }
}

