"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { MessageSquare, Edit, CheckCircle, Clock, AlertCircle } from "lucide-react"
import { SuggestionDetailDialog } from "./suggestion-detail-dialog"
import { MessageComposer } from "../message/message-composer"
import type { SuggestionEntry } from "@/types/suggestion"

interface SuggestionsListProps {
  suggestions: SuggestionEntry[]
  onUpdateSuggestion: (id: string, updates: Partial<SuggestionEntry>) => Promise<boolean>
}

export function SuggestionsList({ suggestions, onUpdateSuggestion }: SuggestionsListProps) {
  const [selectedSuggestion, setSelectedSuggestion] = useState<SuggestionEntry | null>(null)
  const [composerOpen, setComposerOpen] = useState(false)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            New
          </Badge>
        )
      case "reviewed":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-500/10 text-yellow-500 border-yellow-500 flex items-center gap-1"
          >
            <Clock className="h-3 w-3" />
            Reviewed
          </Badge>
        )
      case "actioned":
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Actioned
          </Badge>
        )
      default:
        return null
    }
  }

  if (suggestions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <MessageSquare className="mx-auto h-12 w-12 opacity-20 mb-2" />
        <p>No suggestions found.</p>
        <p className="text-sm">Add a new suggestion to get started.</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {suggestions.map((suggestion) => (
          <Card
            key={suggestion.id}
            className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer"
            onClick={() => setSelectedSuggestion(suggestion)}
          >
            <CardHeader className="pb-2 flex flex-row justify-between items-start">
              <div>
                <h3 className="font-medium">{suggestion.member_name}</h3>
                <p className="text-sm text-gray-400">{format(new Date(suggestion.date), "MMMM d, yyyy")}</p>
              </div>
              {getStatusBadge(suggestion.status)}
            </CardHeader>
            <CardContent>
              <p className="text-sm line-clamp-3">{suggestion.content}</p>
              <div className="flex justify-end mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-zinc-700 text-xs gap-1"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedSuggestion(suggestion)
                    setComposerOpen(true)
                  }}
                >
                  <Edit className="h-3 w-3" />
                  Respond
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedSuggestion && (
        <SuggestionDetailDialog
          suggestion={selectedSuggestion}
          open={!!selectedSuggestion && !composerOpen}
          onOpenChange={(open) => {
            if (!open) setSelectedSuggestion(null)
          }}
          onUpdateSuggestion={onUpdateSuggestion}
          onRespond={() => setComposerOpen(true)}
        />
      )}

      {selectedSuggestion && (
        <MessageComposer
          open={composerOpen}
          onOpenChange={setComposerOpen}
          recipient={selectedSuggestion.member_name}
          recipientId={selectedSuggestion.member_id}
          subject={`Re: Your suggestion on ${format(new Date(selectedSuggestion.date), "MMMM d, yyyy")}`}
          onClose={() => {
            setComposerOpen(false)
            setSelectedSuggestion(null)
          }}
        />
      )}
    </>
  )
}

