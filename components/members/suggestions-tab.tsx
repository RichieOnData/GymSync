"use client"

import { useState, useEffect } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { Cross2Icon } from "@radix-ui/react-icons"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { createClient } from "@supabase/supabase-js"
import type { Member, Suggestion } from "@/types/member"
import { format } from "date-fns"
import { MessageSquare } from "lucide-react"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface SuggestionsTabProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  member: Member
}

export function SuggestionsTab({ open, onOpenChange, member }: SuggestionsTabProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null)

  useEffect(() => {
    if (open) {
      fetchSuggestions()
    }
  }, [open, member.id])

  const fetchSuggestions = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("suggestions")
        .select("*")
        .eq("member_id", member.id)
        .order("date", { ascending: false })

      if (error) throw error

      setSuggestions(data || [])
    } catch (error) {
      console.error("Error fetching suggestions:", error)
      toast({
        title: "Error",
        description: "Failed to load suggestions data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (suggestion: Suggestion, newStatus: "New" | "Read" | "Resolved") => {
    try {
      const { error } = await supabase.from("suggestions").update({ status: newStatus }).eq("id", suggestion.id)

      if (error) throw error

      // Update local state
      setSuggestions(suggestions.map((s) => (s.id === suggestion.id ? { ...s, status: newStatus } : s)))

      toast({
        title: "Status Updated",
        description: `Suggestion status updated to ${newStatus}`,
      })
    } catch (error) {
      console.error("Error updating suggestion status:", error)
      toast({
        title: "Error",
        description: "Failed to update suggestion status",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "New":
        return <span className="bg-blue-500/10 text-blue-500 px-2 py-1 rounded-full text-xs">New</span>
      case "Read":
        return <span className="bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded-full text-xs">Read</span>
      case "Resolved":
        return <span className="bg-green-500/10 text-green-500 px-2 py-1 rounded-full text-xs">Resolved</span>
      default:
        return null
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] max-h-[85vh] w-[90vw] max-w-[500px] translate-x-[-50%] translate-y-[-50%] rounded-lg bg-zinc-900 border border-zinc-800 p-6 shadow-lg focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] overflow-y-auto">
          <Dialog.Title className="text-xl font-semibold text-white">Member Suggestions</Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-gray-400">
            View and manage suggestions from {member.name}.
          </Dialog.Description>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-600"></div>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {suggestions.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <MessageSquare className="mx-auto h-12 w-12 opacity-20 mb-2" />
                  <p>No suggestions found for this member.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedSuggestion ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">Suggestion Details</h3>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-zinc-700"
                          onClick={() => setSelectedSuggestion(null)}
                        >
                          Back to List
                        </Button>
                      </div>

                      <div className="space-y-4 bg-black/30 p-4 rounded-md">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-400">
                            {format(new Date(selectedSuggestion.date), "MMMM d, yyyy")}
                          </span>
                          {getStatusBadge(selectedSuggestion.status)}
                        </div>

                        <p className="text-white whitespace-pre-wrap">{selectedSuggestion.message}</p>

                        <div className="flex justify-end gap-2 pt-2">
                          {selectedSuggestion.status !== "Read" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-zinc-700"
                              onClick={() => handleUpdateStatus(selectedSuggestion, "Read")}
                            >
                              Mark as Read
                            </Button>
                          )}
                          {selectedSuggestion.status !== "Resolved" && (
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleUpdateStatus(selectedSuggestion, "Resolved")}
                            >
                              Mark as Resolved
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
                      {suggestions.map((suggestion) => (
                        <div
                          key={suggestion.id}
                          className={`p-3 rounded-md cursor-pointer transition-colors hover:bg-zinc-800 ${
                            suggestion.status === "New"
                              ? "bg-blue-500/5 border border-blue-500/20"
                              : suggestion.status === "Read"
                                ? "bg-yellow-500/5 border border-yellow-500/20"
                                : "bg-green-500/5 border border-green-500/20"
                          }`}
                          onClick={() => setSelectedSuggestion(suggestion)}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-400">
                              {format(new Date(suggestion.date), "MMMM d, yyyy")}
                            </span>
                            {getStatusBadge(suggestion.status)}
                          </div>
                          <p className="text-sm line-clamp-2">{suggestion.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end mt-6">
            <Dialog.Close asChild>
              <Button variant="outline" className="border-zinc-700">
                Close
              </Button>
            </Dialog.Close>
          </div>

          <Dialog.Close asChild>
            <button
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
              aria-label="Close"
            >
              <Cross2Icon className="h-4 w-4 text-white" />
              <span className="sr-only">Close</span>
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

