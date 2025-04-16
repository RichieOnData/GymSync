"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { PlusCircle, RefreshCw, Filter } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { AddSuggestionDialog } from "@/components/suggestions/add-suggestion-dialog"
import { SuggestionsList } from "@/components/suggestions/suggestions-list"
import { SuggestionInsights } from "@/components/suggestions/suggestion-insights"
import { DraftOffersList } from "@/components/suggestions/draft-offers-list"
import { createClient } from "@supabase/supabase-js"
import type { SuggestionEntry, SuggestionInsight, DraftOffer } from "@/types/suggestion"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function SuggestionsPage() {
  const [suggestions, setSuggestions] = useState<SuggestionEntry[]>([])
  const [insights, setInsights] = useState<SuggestionInsight[]>([])
  const [draftOffers, setDraftOffers] = useState<DraftOffer[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState("all")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch suggestions
      const { data: suggestionsData, error: suggestionsError } = await supabase
        .from("suggestions")
        .select("*")
        .order("date", { ascending: false })

      if (suggestionsError) throw suggestionsError

      // Fetch insights (in a real app, this might come from an AI analysis endpoint)
      const { data: insightsData, error: insightsError } = await supabase
        .from("suggestion_insights")
        .select("*")
        .order("priority", { ascending: false })

      if (insightsError) throw insightsError

      // Fetch draft offers
      const { data: offersData, error: offersError } = await supabase
        .from("draft_offers")
        .select("*")
        .eq("status", "draft")
        .order("created_at", { ascending: false })

      if (offersError) throw offersError

      setSuggestions(suggestionsData || [])
      setInsights(insightsData || [])
      setDraftOffers(offersData || [])
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to load suggestions data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    try {
      setRefreshing(true)
      await fetchData()
      toast({
        title: "Data Refreshed",
        description: "Suggestions and insights have been updated.",
      })
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setRefreshing(false)
    }
  }

  const handleAddSuggestion = async (newSuggestion: Omit<SuggestionEntry, "id">) => {
    try {
      const { data, error } = await supabase.from("suggestions").insert([newSuggestion]).select()

      if (error) throw error

      setSuggestions([data[0], ...suggestions])
      toast({
        title: "Suggestion Added",
        description: "The member suggestion has been recorded successfully.",
      })
      return true
    } catch (error) {
      console.error("Error adding suggestion:", error)
      toast({
        title: "Error",
        description: "Failed to add suggestion. Please try again.",
        variant: "destructive",
      })
      return false
    }
  }

  const handleUpdateSuggestion = async (id: string, updates: Partial<SuggestionEntry>) => {
    try {
      const { error } = await supabase.from("suggestions").update(updates).eq("id", id)

      if (error) throw error

      setSuggestions(suggestions.map((s) => (s.id === id ? { ...s, ...updates } : s)))
      toast({
        title: "Suggestion Updated",
        description: "The suggestion has been updated successfully.",
      })
      return true
    } catch (error) {
      console.error("Error updating suggestion:", error)
      toast({
        title: "Error",
        description: "Failed to update suggestion. Please try again.",
        variant: "destructive",
      })
      return false
    }
  }

  const handleUpdateOffer = async (id: string, updates: Partial<DraftOffer>) => {
    try {
      const { error } = await supabase.from("draft_offers").update(updates).eq("id", id)

      if (error) throw error

      setDraftOffers(draftOffers.map((o) => (o.id === id ? { ...o, ...updates } : o)))
      toast({
        title: "Offer Updated",
        description: "The offer has been updated successfully.",
      })
      return true
    } catch (error) {
      console.error("Error updating offer:", error)
      toast({
        title: "Error",
        description: "Failed to update offer. Please try again.",
        variant: "destructive",
      })
      return false
    }
  }

  const filteredSuggestions =
    activeFilter === "all" ? suggestions : suggestions.filter((s) => s.status === activeFilter)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <Toaster />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Member Suggestions</h1>
          <p className="text-gray-400 mt-1">Manage and analyze member feedback to improve your gym</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-zinc-700 gap-2" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
          <Button className="bg-red-600 hover:bg-red-700 gap-2" onClick={() => setAddDialogOpen(true)}>
            <PlusCircle className="h-4 w-4" />
            Add Suggestion
          </Button>
        </div>
      </div>

      <Tabs defaultValue="suggestions" className="w-full">
        <TabsList className="bg-zinc-900 border border-zinc-800">
          <TabsTrigger value="suggestions">All Suggestions</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="offers">Draft Offers</TabsTrigger>
        </TabsList>

        <TabsContent value="suggestions" className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-400">Filter:</span>
              <div className="flex bg-zinc-900 border border-zinc-800 rounded-md overflow-hidden">
                <button
                  className={`px-3 py-1 text-sm ${activeFilter === "all" ? "bg-zinc-800 text-white" : "text-gray-400"}`}
                  onClick={() => setActiveFilter("all")}
                >
                  All
                </button>
                <button
                  className={`px-3 py-1 text-sm ${activeFilter === "new" ? "bg-zinc-800 text-white" : "text-gray-400"}`}
                  onClick={() => setActiveFilter("new")}
                >
                  New
                </button>
                <button
                  className={`px-3 py-1 text-sm ${activeFilter === "reviewed" ? "bg-zinc-800 text-white" : "text-gray-400"}`}
                  onClick={() => setActiveFilter("reviewed")}
                >
                  Reviewed
                </button>
                <button
                  className={`px-3 py-1 text-sm ${activeFilter === "actioned" ? "bg-zinc-800 text-white" : "text-gray-400"}`}
                  onClick={() => setActiveFilter("actioned")}
                >
                  Actioned
                </button>
              </div>
            </div>
            <span className="text-sm text-gray-400">{filteredSuggestions.length} suggestions</span>
          </div>

          <SuggestionsList suggestions={filteredSuggestions} onUpdateSuggestion={handleUpdateSuggestion} />
        </TabsContent>

        <TabsContent value="insights" className="mt-4">
          <SuggestionInsights insights={insights} />
        </TabsContent>

        <TabsContent value="offers" className="mt-4">
          <DraftOffersList offers={draftOffers} onUpdateOffer={handleUpdateOffer} />
        </TabsContent>
      </Tabs>

      <AddSuggestionDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} onAddSuggestion={handleAddSuggestion} />
    </div>
  )
}

