"use client"

import { useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { Cross2Icon } from "@radix-ui/react-icons"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Clock, CheckCircle, MessageSquare } from "lucide-react"
import type { SuggestionEntry } from "@/types/suggestion"

interface SuggestionDetailDialogProps {
  suggestion: SuggestionEntry
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdateSuggestion: (id: string, updates: Partial<SuggestionEntry>) => Promise<boolean>
  onRespond: () => void
}

export function SuggestionDetailDialog({
  suggestion,
  open,
  onOpenChange,
  onUpdateSuggestion,
  onRespond,
}: SuggestionDetailDialogProps) {
  const [status, setStatus] = useState(suggestion.status)
  const [adminNotes, setAdminNotes] = useState(suggestion.admin_notes || "")
  const [loading, setLoading] = useState(false)

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

  const handleSave = async () => {
    setLoading(true)
    const success = await onUpdateSuggestion(suggestion.id, {
      status,
      admin_notes: adminNotes,
    })

    if (success) {
      onOpenChange(false)
    }

    setLoading(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] max-h-[85vh] w-[90vw] max-w-[500px] translate-x-[-50%] translate-y-[-50%] rounded-lg bg-zinc-900 border border-zinc-800 p-6 shadow-lg focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] overflow-y-auto">
          <Dialog.Title className="text-xl font-semibold text-white">Suggestion Details</Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-gray-400">
            View and manage the suggestion from {suggestion.member_name}.
          </Dialog.Description>

          <div className="mt-4 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium">{suggestion.member_name}</h3>
                <p className="text-sm text-gray-400">{format(new Date(suggestion.date), "MMMM d, yyyy")}</p>
              </div>
              {getStatusBadge(suggestion.status)}
            </div>

            <div className="bg-black/30 p-4 rounded-md">
              <p className="whitespace-pre-wrap">{suggestion.content}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status" className="bg-black border-zinc-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                  <SelectItem value="actioned">Actioned</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin_notes">Admin Notes</Label>
              <Textarea
                id="admin_notes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={4}
                className="bg-black border-zinc-800"
                placeholder="Add your notes about this suggestion..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" className="border-zinc-700 gap-2" onClick={onRespond}>
              <MessageSquare className="h-4 w-4" />
              Respond
            </Button>
            <Button className="bg-red-600 hover:bg-red-700" onClick={handleSave} disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
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

