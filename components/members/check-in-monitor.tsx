"use client"

import { useState, useEffect } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { Cross2Icon } from "@radix-ui/react-icons"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { createClient } from "@supabase/supabase-js"
import { format } from "date-fns"
import { UserCheck, AlertTriangle } from "lucide-react"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface CheckIn {
  id: string
  member_id: string
  date: string
  status: string
  anomaly: string | null
  created_at: string
  member: {
    name: string
  }
}

interface CheckInMonitorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CheckInMonitor({ open, onOpenChange }: CheckInMonitorProps) {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (open) {
      fetchRecentCheckIns()

      // Set up real-time subscription
      const subscription = supabase
        .channel("attendance-changes")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "attendance",
          },
          (payload) => {
            // Fetch the member name for the new check-in
            fetchCheckInWithMember(payload.new.id)
          },
        )
        .subscribe()

      return () => {
        supabase.removeChannel(subscription)
      }
    }
  }, [open])

  const fetchRecentCheckIns = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("attendance")
        .select(`
          *,
          member:member_id (
            name
          )
        `)
        .eq("date", new Date().toISOString().split("T")[0])
        .order("created_at", { ascending: false })
        .limit(50)

      if (error) throw error

      setCheckIns(data || [])
    } catch (error) {
      console.error("Error fetching check-ins:", error)
      toast({
        title: "Error",
        description: "Failed to load check-in data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchCheckInWithMember = async (checkInId: string) => {
    try {
      const { data, error } = await supabase
        .from("attendance")
        .select(`
          *,
          member:member_id (
            name
          )
        `)
        .eq("id", checkInId)
        .single()

      if (error) throw error

      if (data) {
        // Add the new check-in to the top of the list
        setCheckIns((prevCheckIns) => [data, ...prevCheckIns])

        // Show a toast notification for the new check-in
        toast({
          title: "New Check-In",
          description: `${data.member.name} just checked in`,
        })
      }
    } catch (error) {
      console.error("Error fetching check-in with member:", error)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] max-h-[85vh] w-[90vw] max-w-[700px] translate-x-[-50%] translate-y-[-50%] rounded-lg bg-zinc-900 border border-zinc-800 p-6 shadow-lg focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] overflow-y-auto">
          <Dialog.Title className="text-xl font-semibold text-white">Check-In Monitor</Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-gray-400">
            Real-time monitoring of member check-ins. New check-ins appear automatically.
          </Dialog.Description>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
            </div>
          ) : checkIns.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <UserCheck className="mx-auto h-12 w-12 opacity-20 mb-2" />
              <p>No check-ins recorded today.</p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Today's Check-Ins</h3>
                <div className="text-sm text-gray-400">{checkIns.length} total</div>
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {checkIns.map((checkIn) => (
                  <div
                    key={checkIn.id}
                    className={`p-4  => (
                  <div 
                    key={checkIn.id} 
                    className={\`p-4 rounded-lg border border-zinc-700 ${checkIn.anomaly ? "bg-red-500/5" : ""}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-3">
                        {checkIn.anomaly ? (
                          <div className="p-2 rounded-full bg-red-500/10 text-red-500">
                            <AlertTriangle className="h-5 w-5" />
                          </div>
                        ) : (
                          <div className="p-2 rounded-full bg-green-500/10 text-green-500">
                            <UserCheck className="h-5 w-5" />
                          </div>
                        )}
                        <div>
                          <h4 className="font-medium">{checkIn.member.name}</h4>
                          <p className="text-xs text-gray-500 mt-1">{format(new Date(checkIn.created_at), "h:mm a")}</p>
                          {checkIn.anomaly && (
                            <p className="text-sm text-red-400 mt-1">Anomaly: {checkIn.anomaly.replace("_", " ")}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end mt-6">
            <Button onClick={fetchRecentCheckIns} variant="outline" className="border-zinc-700 mr-2">
              Refresh
            </Button>
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

