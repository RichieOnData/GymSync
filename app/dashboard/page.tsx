"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { MetricCard } from "@/components/dashboard/metric-card"
import { InsightCard } from "@/components/dashboard/insight-card"
import { SubscriptionAlert } from "@/components/dashboard/subscription-alert"
import {
  getActiveMembersMetrics,
  getRevenueMetrics,
  getOccupancyMetrics,
  getRevenueTrends,
  getMembershipTrends,
  getEquipmentUsage,
} from "@/utils/dashboard-data"

export default function Dashboard() {
  const [metrics, setMetrics] = useState<any>(null)
  const [revenueTrends, setRevenueTrends] = useState<any[]>([
    { month: "Jan", revenue: 0, Basic: 0, Pro: 0, Premium: 0, "One-Day Pass": 0 },
    { month: "Feb", revenue: 0, Basic: 0, Pro: 0, Premium: 0, "One-Day Pass": 0 },
    { month: "Mar", revenue: 0, Basic: 0, Pro: 0, Premium: 0, "One-Day Pass": 0 },
    { month: "Apr", revenue: 0, Basic: 0, Pro: 0, Premium: 0, "One-Day Pass": 0 },
    { month: "May", revenue: 0, Basic: 0, Pro: 0, Premium: 0, "One-Day Pass": 0 },
    { month: "Jun", revenue: 0, Basic: 0, Pro: 0, Premium: 0, "One-Day Pass": 0 },
    { month: "Jul", revenue: 0, Basic: 0, Pro: 0, Premium: 0, "One-Day Pass": 0 },
  ])
  const [membershipTrends, setMembershipTrends] = useState<any[]>([
    { month: "Jan", active: 0, churned: 0 },
    { month: "Feb", active: 0, churned: 0 },
    { month: "Mar", active: 0, churned: 0 },
    { month: "Apr", active: 0, churned: 0 },
    { month: "May", active: 0, churned: 0 },
    { month: "Jun", active: 0, churned: 0 },
    { month: "Jul", active: 0, churned: 0 },
  ])
  const [equipmentUsage, setEquipmentUsage] = useState<any[]>([])
  const [insights, setInsights] = useState<any[]>([])
  const [subscription, setSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [chartType, setChartType] = useState<"line" | "bar">("line")
  const [activePlans, setActivePlans] = useState<string[]>(["revenue", "Basic", "Pro", "Premium", "One-Day Pass"])

  const handleLegendClick = (data: any) => {
    const { dataKey } = data
    const key = dataKey === "Total Revenue" ? "revenue" : dataKey

    if (activePlans.includes(key)) {
      if (activePlans.length > 1) {
        // Prevent hiding all lines
        setActivePlans(activePlans.filter((plan) => plan !== key))
      }
    } else {
      setActivePlans([...activePlans, key])
    }
  }

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)

        // Fetch metrics one by one with error handling
        try {
          const activeMembers = await getActiveMembersMetrics()
          const revenue = await getRevenueMetrics()
          const occupancy = await getOccupancyMetrics()

          // Set metrics
          setMetrics({
            activeMembers,
            revenue,
            occupancy,
          })
        } catch (err) {
          console.error("Error fetching metrics:", err)
          // Set default metrics if there's an error
          setMetrics({
            activeMembers: { current: 0, newSignups: 0, previous: 0, percentageChange: 0 },
            revenue: { current: 0, previous: 0, percentageChange: 0 },
            occupancy: { current: 0, previous: 0, percentageChange: 0, peakHour: "N/A" },
          })
        }

        // Fetch chart data with error handling
        try {
          const revData = await getRevenueTrends()
          // Ensure all plan types have values (replace null/undefined with 0)
          const normalizedData = revData.map((item) => ({
            month: item.month,
            revenue: item.revenue || 0,
            Basic: item.Basic || 0,
            Pro: item.Pro || 0,
            Premium: item.Premium || 0,
            "One-Day Pass": item["One-Day Pass"] || 0,
          }))
          setRevenueTrends(normalizedData)
        } catch (err) {
          console.error("Error fetching revenue trends:", err)
          // Keep the default revenue trends
        }

        try {
          const memberData = await getMembershipTrends()
          setMembershipTrends(memberData)
        } catch (err) {
          console.error("Error fetching membership trends:", err)
          // Keep the default membership trends
        }

        try {
          const equipData = await getEquipmentUsage()
          setEquipmentUsage(equipData)
        } catch (err) {
          console.error("Error fetching equipment usage:", err)
          // Set default equipment usage
          setEquipmentUsage([
            { name: "Treadmills", usage: 0 },
            { name: "Bench Press", usage: 0 },
            { name: "Squat Racks", usage: 0 },
            { name: "Dumbbells", usage: 0 },
            { name: "Leg Press", usage: 0 },
            { name: "Cables", usage: 0 },
          ])
        }

        // Fetch insights (using mock data for now)
        try {
          const insightsRes = await fetch("/api/insights")
          const insightsData = await insightsRes.json()
          setInsights(insightsData)
        } catch (err) {
          console.error("Error fetching insights:", err)
          setInsights([])
        }

        // Fetch subscription (using mock data for now)
        try {
          const subscriptionRes = await fetch("/api/subscription")
          const subscriptionData = await subscriptionRes.json()
          setSubscription(subscriptionData)
        } catch (err) {
          console.error("Error fetching subscription:", err)
          setSubscription(null)
        }

        setLoading(false)
      } catch (err) {
        console.error("Error fetching dashboard data:", err)
        setError("Failed to load dashboard data. Please try again later.")
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    )
  }

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
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button className="bg-red-600 hover:bg-red-700">Generate Report</Button>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {metrics && (
          <>
            <MetricCard
              title="Active Members"
              value={metrics.activeMembers.current}
              percentageChange={metrics.activeMembers.percentageChange}
              subtitle={`${metrics.activeMembers.newSignups} new this month`}
            />
            <MetricCard
              title="Monthly Revenue"
              value={metrics.revenue.current}
              percentageChange={metrics.revenue.percentageChange}
              prefix="₹"
            />
            <MetricCard
              title="Average Occupancy"
              value={metrics.occupancy.current}
              percentageChange={metrics.occupancy.percentageChange}
              suffix="%"
              subtitle={`Peak hours: ${metrics.occupancy.peakHour}`}
            />
          </>
        )}
      </div>

      {/* Charts */}
      <Tabs defaultValue="revenue" className="w-full">
        <TabsList className="bg-zinc-900 border border-zinc-800">
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="members">Membership</TabsTrigger>
          <TabsTrigger value="equipment">Equipment Usage</TabsTrigger>
        </TabsList>
        <TabsContent value="revenue" className="mt-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Revenue Trends</CardTitle>
                <CardDescription>Monthly revenue by plan type</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className={`${chartType === "line" ? "bg-red-600 text-white hover:bg-red-700" : "bg-zinc-800 hover:bg-zinc-700"}`}
                  onClick={() => setChartType("line")}
                >
                  Line
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className={`${chartType === "bar" ? "bg-red-600 text-white hover:bg-red-700" : "bg-zinc-800 hover:bg-zinc-700"}`}
                  onClick={() => setChartType("bar")}
                >
                  Bar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === "line" ? (
                    <LineChart data={revenueTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="month" stroke="#888" />
                      <YAxis stroke="#888" />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#222", border: "none", borderRadius: "4px" }}
                        itemStyle={{ color: "#fff" }}
                        formatter={(value, name) => [`₹${value}`, name === "revenue" ? "Total Revenue" : name]}
                      />
                      <Legend onClick={handleLegendClick} />
                      {activePlans.includes("revenue") && (
                        <Line
                          type="monotone"
                          dataKey="revenue"
                          name="Total Revenue"
                          stroke="#dc2626"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                          connectNulls={true}
                        />
                      )}
                      {activePlans.includes("Basic") && (
                        <Line
                          type="monotone"
                          dataKey="Basic"
                          stroke="#3b82f6"
                          strokeWidth={1.5}
                          dot={{ r: 3 }}
                          connectNulls={true}
                        />
                      )}
                      {activePlans.includes("Pro") && (
                        <Line
                          type="monotone"
                          dataKey="Pro"
                          stroke="#8b5cf6"
                          strokeWidth={1.5}
                          dot={{ r: 3 }}
                          connectNulls={true}
                        />
                      )}
                      {activePlans.includes("Premium") && (
                        <Line
                          type="monotone"
                          dataKey="Premium"
                          stroke="#f59e0b"
                          strokeWidth={1.5}
                          dot={{ r: 3 }}
                          connectNulls={true}
                        />
                      )}
                      {activePlans.includes("One-Day Pass") && (
                        <Line
                          type="monotone"
                          dataKey="One-Day Pass"
                          stroke="#10b981"
                          strokeWidth={1.5}
                          dot={{ r: 3 }}
                          connectNulls={true}
                        />
                      )}
                    </LineChart>
                  ) : (
                    <BarChart data={revenueTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="month" stroke="#888" />
                      <YAxis stroke="#888" />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#222", border: "none", borderRadius: "4px" }}
                        itemStyle={{ color: "#fff" }}
                        formatter={(value, name) => [`₹${value}`, name === "revenue" ? "Total Revenue" : name]}
                      />
                      <Legend onClick={handleLegendClick} />
                      {activePlans.includes("revenue") && <Bar dataKey="revenue" name="Total Revenue" fill="#dc2626" />}
                      {activePlans.includes("Basic") && <Bar dataKey="Basic" fill="#3b82f6" />}
                      {activePlans.includes("Pro") && <Bar dataKey="Pro" fill="#8b5cf6" />}
                      {activePlans.includes("Premium") && <Bar dataKey="Premium" fill="#f59e0b" />}
                      {activePlans.includes("One-Day Pass") && <Bar dataKey="One-Day Pass" fill="#10b981" />}
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="members" className="mt-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle>Membership Trends</CardTitle>
              <CardDescription>Active and churned members by month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={membershipTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="month" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip contentStyle={{ backgroundColor: "#222", border: "none" }} itemStyle={{ color: "#fff" }} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="active"
                      stroke="#dc2626"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line type="monotone" dataKey="churned" stroke="#888" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="equipment" className="mt-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle>Equipment Usage</CardTitle>
              <CardDescription>Percentage usage of gym equipment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={equipmentUsage} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis type="number" stroke="#888" />
                    <YAxis dataKey="name" type="category" stroke="#888" />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#222", border: "none" }}
                      itemStyle={{ color: "#fff" }}
                      formatter={(value) => [`${value}%`, "Usage"]}
                    />
                    <Bar dataKey="usage" fill="#dc2626" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* AI Insights */}
      <div>
        <h2 className="text-2xl font-bold mb-4">AI-Powered Insights</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {insights.map((insight) => (
            <InsightCard
              key={insight.id}
              title={insight.title}
              description={insight.description}
              action={insight.action}
              actionLink={insight.actionLink}
              icon={insight.icon}
              color={insight.color}
              type={insight.title.includes("Retention") ? "retention-risk" : undefined}
            />
          ))}
        </div>
      </div>

      {/* Subscription Alert */}
      {subscription && <SubscriptionAlert renewalDate={subscription.renewalDate} amount={subscription.amount} />}
    </div>
  )
}
