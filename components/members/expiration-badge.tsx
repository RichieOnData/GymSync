"use client"

import { Badge } from "@/components/ui/badge"
import { getExpirationStatus } from "@/utils/subscription"

interface ExpirationBadgeProps {
  expirationDate: string
}

export default function ExpirationBadge({ expirationDate }: ExpirationBadgeProps) {
  const status = getExpirationStatus(expirationDate)
  
  return (
    <Badge
      variant="outline"
      className={`
        ${status === "active" ? "border-green-500 text-green-500 bg-green-500/10" : ""}
        ${status === "expiring-soon" ? "border-yellow-500 text-yellow-500 bg-yellow-500/10" : ""}
        ${status === "expired" ? "border-red-500 text-red-500 bg-red-500/10" : ""}
      `}
    >
      {status.replace("-", " ")}
    </Badge>
  )
}

