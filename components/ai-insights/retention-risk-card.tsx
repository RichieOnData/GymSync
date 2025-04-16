"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Calendar, Mail, MessageSquare } from "lucide-react"
import { format } from "date-fns"
import { toast } from "@/components/ui/use-toast"
import type { RetentionRisk } from "@/utils/ai-insights"

interface RetentionRiskCardProps {
  risk: RetentionRisk
}

export function RetentionRiskCard({ risk }: RetentionRiskCardProps) {
  const handleSendEmail = () => {
    toast({
      title: "Email Sent",
      description: `Re-engagement email sent to ${risk.memberName}`,
    })
  }

  const handleScheduleCall = () => {
    toast({
      title: "Call Scheduled",
      description: `Follow-up call scheduled for ${risk.memberName}`,
    })
  }

  // Determine badge color based on risk score
  const getBadgeColor = () => {
    if (risk.riskScore >= 75) return "bg-red-500/10 text-red-500 border-red-500"
    if (risk.riskScore >= 50) return "bg-yellow-500/10 text-yellow-500 border-yellow-500"
    return "bg-blue-500/10 text-blue-500 border-blue-500"
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{risk.memberName}</CardTitle>
          <Badge variant="outline" className={getBadgeColor()}>
            {risk.riskScore}% Risk
          </Badge>
        </div>
        <CardDescription>Member since {format(new Date(risk.joinDate), "MMM d, yyyy")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center text-sm">
            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
            <span>Last check-in: {format(new Date(risk.lastCheckIn), "MMM d, yyyy")}</span>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium">Risk Factors:</p>
            <ul className="space-y-1">
              {risk.riskFactors.map((factor, index) => (
                <li key={index} className="text-sm text-gray-400 flex items-start">
                  <AlertTriangle className="h-3.5 w-3.5 mr-2 mt-0.5 text-yellow-500" />
                  {factor}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button variant="outline" className="flex-1 border-zinc-700 gap-2" onClick={handleSendEmail}>
          <Mail className="h-4 w-4" />
          Email
        </Button>
        <Button className="flex-1 bg-red-600 hover:bg-red-700 gap-2" onClick={handleScheduleCall}>
          <MessageSquare className="h-4 w-4" />
          Call
        </Button>
      </CardFooter>
    </Card>
  )
}

