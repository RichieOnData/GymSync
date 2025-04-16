"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { QrScanner } from "@/components/staff/qr-scanner"
import { supabase } from "@/utils/supabase"
import { CheckCircle, AlertTriangle } from "lucide-react"

interface StaffAttendanceScannerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  staff: any[]
}

export function StaffAttendanceScanner({ open, onOpenChange, staff }: StaffAttendanceScannerProps) {
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState<{
    success: boolean
    message: string
    staffName?: string
    action?: string
  } | null>(null)

  const handleScan = async (data: string) => {
    if (!data) return

    try {
      setScanning(false)

      // Parse QR code data
      // Expected format: GYMSYNC:STAFF:staffId:qrCodeId
      const parts = data.split(":")

      if (parts.length !== 4 || parts[0] !== "GYMSYNC" || parts[1] !== "STAFF") {
        setScanResult({
          success: false,
          message: "Invalid QR code format. Please scan a valid staff QR code.",
        })
        return
      }

      const staffId = parts[2]
      const qrCodeId = parts[3]

      // Find staff member
      const staffMember = staff.find((s) => s.id.toString() === staffId && s.qr_code_id === qrCodeId)

      if (!staffMember) {
        setScanResult({
          success: false,
          message: "Staff member not found. Please scan a valid QR code.",
        })
        return
      }

      // Get today's date
      const today = new Date().toISOString().split("T")[0]

      // Check if there's an existing attendance record for today
      const { data: existingRecord, error: fetchError } = await supabase
        .from("attendance")
        .select("*")
        .eq("staff_id", staffId)
        .eq("date", today)
        .single()

      if (fetchError && fetchError.code !== "PGRST116") {
        // PGRST116 is "no rows returned"
        throw fetchError
      }

      const now = new Date().toISOString()

      if (!existingRecord) {
        // First scan of the day - check in
        const { error } = await supabase.from("attendance").insert([
          {
            staff_id: staffId,
            date: today,
            checkin_time: now,
            status: "present",
            shift_type: staffMember.shift_type,
          },
        ])

        if (error) throw error

        setScanResult({
          success: true,
          message: "Check-in successful!",
          staffName: staffMember.name,
          action: "check-in",
        })
      } else if (existingRecord.checkin_time && !existingRecord.checkout_time) {
        // Second scan - check out
        const { error } = await supabase
          .from("attendance")
          .update({
            checkout_time: now,
            updated_at: now,
          })
          .eq("id", existingRecord.id)

        if (error) throw error

        setScanResult({
          success: true,
          message: "Check-out successful!",
          staffName: staffMember.name,
          action: "check-out",
        })
      } else if (existingRecord.checkin_time && existingRecord.checkout_time) {
        // Already checked in and out
        setScanResult({
          success: false,
          message: "You have already checked in and out for today.",
          staffName: staffMember.name,
        })
      }
    } catch (err) {
      console.error("Error processing scan:", err)
      setScanResult({
        success: false,
        message: "An error occurred while processing the scan. Please try again.",
      })
    }
  }

  const handleError = (err: any) => {
    console.error("QR scan error:", err)
    setScanResult({
      success: false,
      message: "Error scanning QR code. Please try again.",
    })
    setScanning(false)
  }

  const resetScan = () => {
    setScanResult(null)
    setScanning(true)
  }

  useEffect(() => {
    if (open) {
      setScanning(true)
      setScanResult(null)
    } else {
      setScanning(false)
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle>Scan Attendance QR Code</DialogTitle>
          <DialogDescription className="text-gray-400">
            Scan a staff member's QR code to record attendance
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-4">
          {scanning ? (
            <div className="w-full max-w-sm mx-auto">
              <QrScanner
                onScan={handleScan}
                onError={handleError}
                constraints={{
                  facingMode: "environment",
                }}
              />
              <p className="text-center mt-4 text-gray-400">Position the QR code within the frame to scan</p>
            </div>
          ) : scanResult ? (
            <div className="text-center space-y-4">
              {scanResult.success ? (
                <div className="bg-green-500/10 border border-green-500 rounded-lg p-6">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-green-500 mb-2">Success!</h3>
                  <p className="text-gray-300 mb-2">{scanResult.message}</p>
                  {scanResult.staffName && <p className="font-medium text-white">{scanResult.staffName}</p>}
                  {scanResult.action && (
                    <div className="mt-4">
                      <div className="bg-zinc-800 rounded-md p-3">
                        <p className="text-gray-400">Action</p>
                        <p className="text-lg font-bold">
                          {scanResult.action === "check-in" ? "Check In" : "Check Out"}
                        </p>
                        <p className="text-sm text-gray-400">{new Date().toLocaleTimeString()}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-red-500/10 border border-red-500 rounded-lg p-6">
                  <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-red-500 mb-2">Error</h3>
                  <p className="text-gray-300">{scanResult.message}</p>
                  {scanResult.staffName && <p className="font-medium text-white mt-2">{scanResult.staffName}</p>}
                </div>
              )}

              <div className="flex gap-2 justify-center mt-4">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
                <Button className="bg-red-600 hover:bg-red-700" onClick={resetScan}>
                  Scan Again
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <p>Initializing camera...</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

