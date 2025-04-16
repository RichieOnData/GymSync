"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { QRCodeSVG } from "qrcode.react"
import { Download, RefreshCw } from "lucide-react"
import { supabase } from "@/utils/supabase"
import { toast } from "@/components/ui/use-toast"

interface StaffQrCodeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  staff: any
}

export function StaffQrCodeDialog({ open, onOpenChange, staff }: StaffQrCodeDialogProps) {
  const [qrCode, setQrCode] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (open && staff) {
      fetchQrCode()
    }
  }, [open, staff])

  const fetchQrCode = async () => {
    setIsLoading(true)
    try {
      const today = new Date().toISOString().split("T")[0]

      // Check if QR code exists for today
      const { data, error } = await supabase
        .from("daily_qr_codes")
        .select("*")
        .eq("staff_id", staff.id)
        .eq("date", today)
        .single()

      if (error && error.code !== "PGRST116") {
        // PGRST116 is "no rows returned"
        throw error
      }

      if (data) {
        setQrCode(data)
      } else {
        // Generate new QR code
        await generateQrCode()
      }
    } catch (error) {
      console.error("Error fetching QR code:", error)
      toast({
        title: "Error",
        description: "Failed to fetch QR code. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const generateQrCode = async () => {
    setIsLoading(true)
    try {
      // Call the function to generate QR codes
      await supabase.rpc("generate_daily_qr_codes")

      // Fetch the newly generated QR code
      const today = new Date().toISOString().split("T")[0]
      const { data, error } = await supabase
        .from("daily_qr_codes")
        .select("*")
        .eq("staff_id", staff.id)
        .eq("date", today)
        .single()

      if (error) throw error

      setQrCode(data)

      toast({
        title: "QR Code Generated",
        description: "A new QR code has been generated for today.",
      })
    } catch (error) {
      console.error("Error generating QR code:", error)
      toast({
        title: "Error",
        description: "Failed to generate QR code. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const downloadQrCode = () => {
    if (!qrCode) return

    const canvas = document.getElementById("qr-canvas") as HTMLCanvasElement
    if (!canvas) return

    const pngUrl = canvas.toDataURL("image/png")
    const downloadLink = document.createElement("a")
    downloadLink.href = pngUrl
    downloadLink.download = `${staff.name.replace(/\s+/g, "_")}_QR_${new Date().toISOString().split("T")[0]}.png`
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)

    toast({
      title: "QR Code Downloaded",
      description: "The QR code has been downloaded successfully.",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle>Staff QR Code</DialogTitle>
          <DialogDescription className="text-gray-400">Daily QR code for attendance tracking</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-48 w-48">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
            </div>
          ) : qrCode ? (
            <>
              <div className="bg-white p-4 rounded-lg mb-4">
                <QRCodeSVG id="qr-canvas" value={qrCode.qr_code_id} size={200} level="H" includeMargin={true} />
              </div>

              <div className="text-center mb-4">
                <h3 className="font-bold text-lg">{staff.name}</h3>
                <p className="text-gray-400">{new Date().toLocaleDateString()}</p>
                <p className="text-xs text-gray-500 mt-2">
                  This QR code is valid for today only and will expire at midnight.
                </p>
              </div>

              <div className="flex gap-2 w-full">
                <Button
                  variant="outline"
                  className="flex-1 border-zinc-700"
                  onClick={generateQrCode}
                  disabled={isLoading}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Regenerate
                </Button>
                <Button className="flex-1 bg-red-600 hover:bg-red-700" onClick={downloadQrCode} disabled={isLoading}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-400">
              No QR code found. Click the button below to generate one.
              <Button className="mt-4 bg-red-600 hover:bg-red-700" onClick={generateQrCode} disabled={isLoading}>
                Generate QR Code
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

