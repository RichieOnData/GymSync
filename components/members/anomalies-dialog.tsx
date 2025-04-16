"use client"

import { useState, useEffect } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { Cross2Icon } from "@radix-ui/react-icons"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { createClient } from "@supabase/supabase-js"
import { format } from "date-fns"
import { AlertTriangle, CheckCircle } from "lucide-react"
import type { Member } from "@/types/member"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface Anomaly {
  id: string
  member_id: string
  type: "duplicate_scan" | "unusual_hours" | "expired_membership"
  date: string
  resolved: boolean
  created_at: string
}

interface AnomaliesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  member: Member
}

export function AnomaliesDialog({ open, onOpenChange, member }: AnomaliesDialogProps) {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (open) {
      fetchAnomalies()
    }
  }, [open, member.id])

  const fetchAnomalies = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("anomalies")
        .select("*")
        .eq("member_id", member.id)
        .order("date", { ascending: false })

      if (error) throw error

      setAnomalies(data || [])
    } catch (error) {
      console.error("Error fetching anomalies:", error)
      toast({
        title: "Error",
        description: "Failed to load anomaly data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const resolveAnomaly = async (anomalyId: string) => {
    try {
      const { error } = await supabase.from("anomalies").update({ resolved: true }).eq("id", anomalyId)

      if (error) throw error

      // Update local state
      setAnomalies(anomalies.map((a) => (a.id === anomalyId ? { ...a, resolved: true } : a)))

      toast({
        title: "Anomaly Resolved",
        description: "The anomaly has been marked as resolved",
      })
    } catch (error) {
      console.error("Error resolving anomaly:", error)
      toast({
        title: "Error",
        description: "Failed to resolve anomaly",
        variant: "destructive",
      })
    }
  }

  const getAnomalyLabel = (type: string) => {
    switch (type) {
      case "duplicate_scan":
        return "Duplicate Scan"
      case "unusual_hours":
        return "Unusual Hours"
      case "expired_membership":
        return "Expired Membership"
      default:
        return "Unknown Anomaly"
    }
  }

  const getAnomalyDescription = (type: string) => {
    switch (type) {
      case "duplicate_scan":
        return "Member checked in multiple times within a short period"
      case "unusual_hours":
        return "Member checked in outside normal operating hours"
      case "expired_membership":
        return "Member attempted to check in with an expired membership"
      default:
        return "Unrecognized anomaly type detected"
    }
  }

  const getAnomalyColor = (type: string) => {
    switch (type) {
      case "duplicate_scan":
        return "text-yellow-500 bg-yellow-500/10"
      case "unusual_hours":
        return "text-blue-500 bg-blue-500/10"
      case "expired_membership":
        return "text-red-500 bg-red-500/10"
      default:
        return "text-gray-500 bg-gray-500/10"
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] max-h-[85vh] w-[90vw] max-w-[600px] translate-x-[-50%] translate-y-[-50%] rounded-lg bg-zinc-900 border border-zinc-800 p-6 shadow-lg focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] overflow-y-auto">
          <Dialog.Title className="text-xl font-semibold text-white">Anomaly Detection</Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-gray-400">
            Review and manage detected anomalies for {member.name}.
          </Dialog.Description>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
            </div>
          ) : anomalies.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500 opacity-50 mb-2" />
              <p>No anomalies detected for this member.</p>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Recent Anomalies</h3>
                <div className="text-sm text-gray-400">{anomalies.filter((a) => !a.resolved).length} unresolved</div>
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {anomalies.map((anomaly) => (
                  <div
                    key={anomaly.id}
                    className={`p-4 rounded-lg border ${
                      anomaly.resolved ? "border-zinc-700 opacity-60" : "border-zinc-700"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${getAnomalyColor(anomaly.type)}`}>
                          <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-medium">
                            {getAnomalyLabel(anomaly.type)}
                            {anomaly.resolved && (
                              <span className="ml-2 text-xs bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full">
                                Resolved
                              </span>
                            )}
                          </h4>
                          <p className="text-sm text-gray-400 mt-1">{getAnomalyDescription(anomaly.type)}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {format(new Date(anomaly.date), "MMM d, yyyy • h:mm a")}
                          </p>
                        </div>
                      </div>

                      {!anomaly.resolved && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-zinc-700 text-xs"
                          onClick={() => resolveAnomaly(anomaly.id)}
                        >
                          Mark Resolved
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
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

