"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowUpRight, Mail } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import type { RevenueOpportunity } from "@/utils/ai-insights"

interface RevenueOpportunityCardProps {
  opportunity: RevenueOpportunity
}

export function RevenueOpportunityCard({ opportunity }: RevenueOpportunityCardProps) {
  const [sending, setSending] = useState(false)

  const revenueIncrease = opportunity.potentialRevenue - opportunity.currentRevenue
  const percentIncrease = Math.round((revenueIncrease / opportunity.currentRevenue) * 100)

  const handleSendOffer = async () => {
    setSending(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    toast({
      title: "Offer Sent",
      description: `Upgrade offer sent to ${opportunity.memberName}`,
    })

    setSending(false)
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{opportunity.memberName}</CardTitle>
          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500">
            {opportunity.upgradeScore}% Match
          </Badge>
        </div>
        <CardDescription>
          Current Plan: <span className="font-medium">{opportunity.currentPlan}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Current Revenue</span>
            <span>₹{opportunity.currentRevenue.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Potential Revenue</span>
            <span className="font-medium text-green-500">₹{opportunity.potentialRevenue.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center pt-1">
            <span className="text-sm font-medium">Revenue Increase</span>
            <div className="flex items-center text-green-500">
              <ArrowUpRight className="mr-1 h-4 w-4" />
              <span>
                ₹{revenueIncrease.toLocaleString()} (+{percentIncrease}%)
              </span>
            </div>
          </div>
          <div className="pt-2">
            <p className="text-sm text-gray-400">
              Suggested Plan: <span className="text-white font-medium">{opportunity.suggestedPlan}</span>
            </p>
            <p className="text-sm text-gray-400 mt-1">Reason: {opportunity.upgradeReason}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full bg-green-600 hover:bg-green-700 gap-2" onClick={handleSendOffer} disabled={sending}>
          <Mail className="h-4 w-4" />
          {sending ? "Sending..." : "Send Upgrade Offer"}
        </Button>
      </CardFooter>
    </Card>
  )
}

