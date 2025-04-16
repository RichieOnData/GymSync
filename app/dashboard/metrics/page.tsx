"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/utils/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { InfoIcon as InfoCircle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ActiveMembersMetric } from "@/components/dashboard/metrics/active-members-metric"
import { RevenueMetric } from "@/components/dashboard/metrics/revenue-metric"
import { OccupancyMetric } from "@/components/dashboard/metrics/occupancy-metric"
import { MembershipTrendChart } from "@/components/dashboard/metrics/membership-trend-chart"
import { RevenueTrendChart } from "@/components/dashboard/metrics/revenue-trend-chart"
import { OccupancyTrendChart } from "@/components/dashboard/metrics/occupancy-trend-chart"
import { MembershipBreakdownChart } from "@/components/dashboard/metrics/membership-breakdown-chart"
import { PeakHoursChart } from "@/components/dashboard/metrics/peak-hours-chart"
import { RecentSignupsTable } from "@/components/dashboard/metrics/recent-signups-table"
import { getExpirationStatus } from "@/utils/subscription"
import type { Member } from "@/types/member"

export default function MetricsDashboard() {
  const [members, setMembers] = useState<Member[]>([])
  const [attendanceData, setAttendanceData] = useState<any[]>([])
  const [paymentsData, setPaymentsData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")

  // Calculate metrics
  const activeMembers = members.filter((member) => getExpirationStatus(member.expiration_date) === "active").length

  const expiringMembers = members.filter(
    (member) => getExpirationStatus(member.expiration_date) === "expiring-soon",
  ).length

  const expiredMembers = members.filter((member) => getExpirationStatus(member.expiration_date) === "expired").length

  // Calculate new signups in the current month
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()

  const newSignups = members.filter((member) => {
    const joinDate = new Date(member.join_date)
    return joinDate.getMonth() === currentMonth && joinDate.getFullYear() === currentYear
  })

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)

        // Fetch members
        const { data: membersData, error: membersError } = await supabase.from("members").select("*")

        if (membersError) throw membersError

        // Fetch attendance data
        const { data: attendanceData, error: attendanceError } = await supabase
          .from("attendance")
          .select("*")
          .order("check_in_time", { ascending: false })

        if (attendanceError) throw attendanceError

        // Fetch payments data
        const { data: paymentsData, error: paymentsError } = await supabase
          .from("payments")
          .select("*")
          .order("payment_date", { ascending: false })

        if (paymentsError) throw paymentsError

        setMembers(membersData || [])
        setAttendanceData(attendanceData || [])
        setPaymentsData(paymentsData || [])
        setIsLoading(false)
      } catch (err: any) {
        console.error("Error fetching dashboard data:", err)
        setError(err.message || "Failed to load dashboard data")
        setIsLoading(false)
      }
    }

    fetchData()

    // Set up real-time subscriptions
    const membersSubscription = supabase
      .channel("members-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "members",
        },
        (payload) => {
          // Update members data based on the change
          if (payload.eventType === "INSERT") {
            setMembers((prev) => [...prev, payload.new as Member])
          } else if (payload.eventType === "UPDATE") {
            setMembers((prev) =>
              prev.map((member) => (member.id === payload.new.id ? (payload.new as Member) : member)),
            )
          } else if (payload.eventType === "DELETE") {
            setMembers((prev) => prev.filter((member) => member.id !== payload.old.id))
          }
        },
      )
      .subscribe()

    const attendanceSubscription = supabase
      .channel("attendance-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "attendance",
        },
        (payload) => {
          // Update attendance data based on the change
          if (payload.eventType === "INSERT") {
            setAttendanceData((prev) => [payload.new, ...prev])
          } else if (payload.eventType === "UPDATE") {
            setAttendanceData((prev) => prev.map((record) => (record.id === payload.new.id ? payload.new : record)))
          } else if (payload.eventType === "DELETE") {
            setAttendanceData((prev) => prev.filter((record) => record.id !== payload.old.id))
          }
        },
      )
      .subscribe()

    const paymentsSubscription = supabase
      .channel("payments-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "payments",
        },
        (payload) => {
          // Update payments data based on the change
          if (payload.eventType === "INSERT") {
            setPaymentsData((prev) => [payload.new, ...prev])
          } else if (payload.eventType === "UPDATE") {
            setPaymentsData((prev) => prev.map((payment) => (payment.id === payload.new.id ? payload.new : payment)))
          } else if (payload.eventType === "DELETE") {
            setPaymentsData((prev) => prev.filter((payment) => payment.id !== payload.old.id))
          }
        },
      )
      .subscribe()

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(membersSubscription)
      supabase.removeChannel(attendanceSubscription)
      supabase.removeChannel(paymentsSubscription)
    }
  }, [])

  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-gray-400">{error}</p>
          <Button className="mt-4 bg-red-600 hover:bg-red-700" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Metrics Dashboard</h1>
          <p className="text-gray-400 mt-1">Real-time analytics and performance metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="border-zinc-700">
                  <InfoCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>All metrics update in real-time as data changes</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button className="bg-red-600 hover:bg-red-700">Export Report</Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <>
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-32 bg-zinc-800" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-20 bg-zinc-800 mb-2" />
                <Skeleton className="h-4 w-24 bg-zinc-800" />
              </CardContent>
            </Card>
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-32 bg-zinc-800" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-20 bg-zinc-800 mb-2" />
                <Skeleton className="h-4 w-24 bg-zinc-800" />
              </CardContent>
            </Card>
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-32 bg-zinc-800" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-20 bg-zinc-800 mb-2" />
                <Skeleton className="h-4 w-24 bg-zinc-800" />
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <ActiveMembersMetric
              activeMembers={activeMembers}
              totalMembers={members.length}
              newSignups={newSignups.length}
            />
            <RevenueMetric paymentsData={paymentsData} />
            <OccupancyMetric attendanceData={attendanceData} totalMembers={members.length} />
          </>
        )}
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-zinc-900 border border-zinc-800">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Membership</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="occupancy">Occupancy</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-4 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle>Membership Status</CardTitle>
                <CardDescription>Current distribution of member statuses</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
                  </div>
                ) : (
                  <MembershipBreakdownChart
                    active={activeMembers}
                    expiringSoon={expiringMembers}
                    expired={expiredMembers}
                  />
                )}
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle>Recent Sign-ups</CardTitle>
                <CardDescription>New members who joined this month</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full bg-zinc-800" />
                        <div className="space-y-1 flex-1">
                          <Skeleton className="h-4 w-3/4 bg-zinc-800" />
                          <Skeleton className="h-3 w-1/2 bg-zinc-800" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <RecentSignupsTable members={newSignups} />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Membership Tab */}
        <TabsContent value="members" className="mt-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle>Membership Trends</CardTitle>
              <CardDescription>Active and expired members over time</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[400px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
                </div>
              ) : (
                <MembershipTrendChart members={members} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="mt-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle>Revenue Trends</CardTitle>
              <CardDescription>Monthly revenue by membership tier</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[400px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
                </div>
              ) : (
                <RevenueTrendChart paymentsData={paymentsData} members={members} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Occupancy Tab */}
        <TabsContent value="occupancy" className="mt-4 space-y-6">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle>Occupancy Trends</CardTitle>
              <CardDescription>Gym usage patterns over time</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[400px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
                </div>
              ) : (
                <OccupancyTrendChart attendanceData={attendanceData} />
              )}
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle>Peak Hours Analysis</CardTitle>
              <CardDescription>Average occupancy by hour of day</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
                </div>
              ) : (
                <PeakHoursChart attendanceData={attendanceData} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

