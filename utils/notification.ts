import type { Member } from "@/types/member"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export async function checkExpiringMemberships() {
  const twoDaysFromNow = new Date()
  twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2)
  const formattedDate = twoDaysFromNow.toISOString().split("T")[0]

  const { data, error } = await supabase
    .from("members")
    .select("*")
    .eq("status", "active")
    .eq("expiration_date", formattedDate)

  if (error) {
    console.error("Error checking expiring memberships:", error)
    return []
  }

  return data as Member[]
}

export async function sendEmailNotification(email: string, subject: string, content: string) {
  try {
    const response = await fetch("/api/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, subject, content }),
    })

    if (!response.ok) {
      throw new Error("Failed to send email")
    }

    return true
  } catch (error) {
    console.error("Error sending email:", error)
    return false
  }
}

export function generateExpiryMessage(member: Member): string {
  return `Dear ${member.name}, your gym membership will expire on ${new Date(
    member.expiration_date,
  ).toLocaleDateString()}. You joined on ${new Date(
    member.join_date,
  ).toLocaleDateString()}. Please renew your membership to continue enjoying our services.`
}

