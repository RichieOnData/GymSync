"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Mail, Check, Clock, Eye } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import type { RenewalOffer } from "@/utils/ai-insights"

interface RenewalOfferCardProps {
  offer: RenewalOffer
}

export function RenewalOfferCard({ offer }: RenewalOfferCardProps) {
  const [sending, setSending] = useState(false)

  const handleSendOffer = async () => {
    setSending(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    toast({
      title: "Offer Sent",
      description: `Renewal offer sent to ${offer.memberName}`,
    })

    setSending(false)
  }

  // Get status icon
  const getStatusIcon = () => {
    switch (offer.emailStatus) {
      case "sent":
        return <Clock className="h-3.5 w-3.5 mr-1" />
      case "opened":
        return <Eye className="h-3.5 w-3.5 mr-1" />
      case "clicked":
        return <Check className="h-3.5 w-3.5 mr-1" />
      default:
        return null
    }
  }

  // Get status color
  const getStatusColor = () => {
    switch (offer.emailStatus) {
      case "pending":
        return "bg-gray-500/10 text-gray-500 border-gray-500"
      case "sent":
        return "bg-blue-500/10 text-blue-500 border-blue-500"
      case "opened":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500"
      case "clicked":
        return "bg-green-500/10 text-green-500 border-green-500"
      default:
        return ""
    }
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{offer.memberName}</CardTitle>
          <Badge variant="outline" className={getStatusColor()}>
            {getStatusIcon()}
            {offer.emailStatus.charAt(0).toUpperCase() + offer.emailStatus.slice(1)}
          </Badge>
        </div>
        <CardDescription>Renewal Date: {format(new Date(offer.renewalDate), "MMM d, yyyy")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Current Plan</span>
            <span>{offer.currentPlan}</span>
          </div>

          <div className="pt-2">
            <p className="text-sm font-medium">{offer.offerType}</p>
            <p className="text-sm text-gray-400 mt-1">{offer.offerDescription}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full bg-blue-600 hover:bg-blue-700 gap-2"
          onClick={handleSendOffer}
          disabled={sending || offer.emailStatus !== "pending"}
        >
          <Mail className="h-4 w-4" />
          {sending ? "Sending..." : offer.emailStatus === "pending" ? "Send Offer" : "Offer Sent"}
        </Button>
      </CardFooter>
    </Card>
  )
}

