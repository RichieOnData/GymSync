import { NextResponse } from "next/server"
import { Resend } from "resend"

// Initialize Resend client with the provided API key
const resend = new Resend("re_HoHB99hw_PUwrCzDCK6rHyVa289L8xS7P")

export async function POST(request: Request) {
  try {
    const { email, subject, content } = await request.json()

    if (!email || !subject || !content) {
      return NextResponse.json({ error: "Email, subject, and content are required" }, { status: 400 })
    }

    // Send email using Resend
    const result = await resend.emails.send({
      from: "GymSync <notifications@gymsync.com>",
      to: email,
      subject: subject,
      html: content,
    })

    console.log(result);

    return NextResponse.json({ success: true, messageId: result.messageId })
  } catch (error) {
    console.error("Error sending email:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send email" },
      { status: 500 },
    )
  }
}

