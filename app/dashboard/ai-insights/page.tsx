"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Download, FileText, RefreshCw } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { useSearchParams } from "next/navigation"
import { InsightsSummary } from "@/components/ai-insights/insights-summary"
import { RevenueOpportunityCard } from "@/components/ai-insights/revenue-opportunity-card"
import { RetentionRiskCard } from "@/components/ai-insights/retention-risk-card"
import { ChurnForecastCard, RevenueForecastCard } from "@/components/ai-insights/forecast-card"
import { PeakHourCard } from "@/components/ai-insights/peak-hour-card"
import { RenewalOfferCard } from "@/components/ai-insights/renewal-offer-card"

export default function AIInsightsPage() {
  const searchParams = useSearchParams()
  const [insights, setInsights] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("revenue")

  useEffect(() => {
    fetchInsights()

    // Check if there's a tab parameter in the URL
    const tabParam = searchParams.get("tab")
    if (tabParam) {
      // Set the active tab based on the URL parameter
      setActiveTab(tabParam)
    }
  }, [searchParams])

  const fetchInsights = async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch("/api/ai-insights")

      if (!res.ok) {
        throw new Error("Failed to fetch insights")
      }

      const data = await res.json()
      setInsights(data)
    } catch (err) {
      console.error("Error fetching insights:", err)
      setError("Failed to load AI insights. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    try {
      setRefreshing(true)
      await fetchInsights()
      toast({
        title: "Insights Refreshed",
        description: "AI insights have been updated with the latest data.",
      })
    } catch (err) {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh insights. Please try again.",
        variant: "destructive",
      })
    } finally {
      setRefreshing(false)
    }
  }

  const handleExport = () => {
    toast({
      title: "Report Generated",
      description: "AI insights report has been generated and downloaded.",
    })
  }

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
          <Button className="mt-4 bg-red-600 hover:bg-red-700" onClick={fetchInsights}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <Toaster />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">AI Insights</h1>
          <p className="text-gray-400 mt-1">Data-driven intelligence to optimize your gym operations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-zinc-700 gap-2" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
          <Button className="bg-red-600 hover:bg-red-700 gap-2" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {insights && <InsightsSummary summary={insights.summary} />}

      {/* Tabs for different insights */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-zinc-900 border border-zinc-800">
          <TabsTrigger value="revenue">Revenue Opportunities</TabsTrigger>
          <TabsTrigger value="retention">Retention Risks</TabsTrigger>
          <TabsTrigger value="forecasts">Forecasts</TabsTrigger>
          <TabsTrigger value="peak-hours">Peak Hours</TabsTrigger>
          <TabsTrigger value="renewals">Renewal Offers</TabsTrigger>
        </TabsList>

        {/* Revenue Opportunities Tab */}
        <TabsContent value="revenue" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {insights?.revenueOpportunities.map((opportunity: any) => (
              <RevenueOpportunityCard key={opportunity.memberId} opportunity={opportunity} />
            ))}
            {insights?.revenueOpportunities.length === 0 && (
              <div className="col-span-3 text-center py-12 text-gray-400">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No revenue opportunities found at this time.</p>
                <p className="text-sm">Check back later as more member data becomes available.</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Retention Risks Tab */}
        <TabsContent value="retention" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {insights?.retentionRisks.map((risk: any) => (
              <RetentionRiskCard key={risk.memberId} risk={risk} />
            ))}
            {insights?.retentionRisks.length === 0 && (
              <div className="col-span-3 text-center py-12 text-gray-400">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No members at risk of cancellation at this time.</p>
                <p className="text-sm">Great job maintaining member satisfaction!</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Forecasts Tab */}
        <TabsContent value="forecasts" className="mt-4">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-3">Churn Forecast</h3>
              <div className="grid gap-4 md:grid-cols-3">
                {insights?.churnForecast.map((forecast: any, index: number) => (
                  <ChurnForecastCard key={index} forecast={forecast} />
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-3">Revenue Forecast</h3>
              <div className="grid gap-4 md:grid-cols-3">
                {insights?.revenueForecast.map((forecast: any, index: number) => (
                  <RevenueForecastCard key={index} forecast={forecast} />
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Peak Hours Tab */}
        <TabsContent value="peak-hours" className="mt-4">
          {insights?.peakHourForecast && insights.peakHourForecast.length > 0 ? (
            <PeakHourCard forecast={insights.peakHourForecast} />
          ) : (
            <div className="text-center py-12 text-gray-400">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No peak hour data available at this time.</p>
              <p className="text-sm">Check back after collecting more attendance data.</p>
            </div>
          )}
        </TabsContent>

        {/* Renewal Offers Tab */}
        <TabsContent value="renewals" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {insights?.renewalOffers.map((offer: any) => (
              <RenewalOfferCard key={offer.memberId} offer={offer} />
            ))}
            {insights?.renewalOffers.length === 0 && (
              <div className="col-span-3 text-center py-12 text-gray-400">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No members due for renewal in the next 30 days.</p>
                <p className="text-sm">Check back later for upcoming renewals.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
