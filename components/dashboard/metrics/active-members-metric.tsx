"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserPlus, UserCheck } from "lucide-react"

interface ActiveMembersMetricProps {
  activeMembers: number
  totalMembers: number
  newSignups: number
}

export function ActiveMembersMetric({ activeMembers, totalMembers, newSignups }: ActiveMembersMetricProps) {
  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Active Members</CardTitle>
        <CardDescription>Current membership status</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="p-2 bg-green-500/10 rounded-lg">
            <UserCheck className="h-6 w-6 text-green-500" />
          </div>
          <div>
            <div className="text-2xl font-bold">{activeMembers}</div>
            <div className="text-sm text-gray-400">of {totalMembers} total members</div>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 text-sm text-gray-400">
          <UserPlus className="h-4 w-4" />
          <span>{newSignups} new signups this month</span>
        </div>
      </CardContent>
    </Card>
  )
}

