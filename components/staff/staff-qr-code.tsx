"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { generateStaffQRCode } from "@/utils/qr-code"
import { Loader2 } from "lucide-react"

interface StaffQRCodeProps {
  staffId: string
  staffName: string
}

export function StaffQRCode({ staffId, staffName }: StaffQRCodeProps) {
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (staffId) {
      generateQRCode()
    }
  }, [staffId])

  const generateQRCode = async () => {
    try {
      setLoading(true)
      const qrCodeDataUrl = await generateStaffQRCode(staffId)
      setQrCode(qrCodeDataUrl)
    } catch (error) {
      console.error("Error generating QR code:", error)
      toast({
        title: "Error",
        description: "Failed to generate QR code. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!qrCode) return

    const link = document.createElement("a")
    link.href = qrCode
    link.download = `${staffName.replace(/\s+/g, "-").toLowerCase()}-qr-code.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800 dark:bg-white dark:border-zinc-200">
      <CardHeader>
        <CardTitle className="text-white dark:text-zinc-900">Staff QR Code</CardTitle>
        <CardDescription className="text-gray-400 dark:text-gray-600">
          Use this QR code for staff check-in and check-out
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        {loading ? (
          <div className="flex justify-center items-center h-64 w-64">
            <Loader2 className="h-12 w-12 animate-spin text-red-600" />
          </div>
        ) : qrCode ? (
          <div className="flex flex-col items-center gap-4">
            <div className="bg-white p-4 rounded-lg">
              <img src={qrCode || "/placeholder.svg"} alt="Staff QR Code" className="h-64 w-64" />
            </div>
            <div className="text-center text-white dark:text-zinc-900">
              <p className="font-semibold">{staffName}</p>
              <p className="text-sm text-gray-400 dark:text-gray-600">Staff ID: {staffId}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleDownload} className="bg-red-600 hover:bg-red-700">
                Download QR Code
              </Button>
              <Button variant="outline" onClick={generateQRCode} className="border-zinc-700 dark:border-zinc-300">
                Regenerate
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex justify-center items-center h-64 w-64 bg-zinc-800 dark:bg-zinc-200 rounded-lg">
            <p className="text-gray-400 dark:text-gray-600">No QR code generated</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

