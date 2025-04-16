"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { QRCodeSVG } from "qrcode.react"
import { Download } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface StaffQrCodeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  staff: any
}

export function StaffQrCodeModal({ open, onOpenChange, staff }: StaffQrCodeModalProps) {
  const [qrValue, setQrValue] = useState("")
  const qrRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (staff && staff.qr_code_id) {
      // Create a unique QR code value that includes staff ID and QR code ID
      setQrValue(`GYMSYNC:STAFF:${staff.id}:${staff.qr_code_id}`)
    }
  }, [staff])

  const downloadQRCode = () => {
    if (!qrRef.current) return

    try {
      // Get the SVG element
      const svgElement = qrRef.current.querySelector("svg")
      if (!svgElement) return

      // Create a canvas element
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      // Set canvas dimensions
      const svgRect = svgElement.getBoundingClientRect()
      canvas.width = svgRect.width
      canvas.height = svgRect.height

      // Create an image from the SVG
      const img = new Image()
      const svgData = new XMLSerializer().serializeToString(svgElement)
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" })
      const svgUrl = URL.createObjectURL(svgBlob)

      img.crossOrigin = "anonymous"

      img.onload = () => {
        // Draw the image on the canvas
        ctx.fillStyle = "white"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0)

        // Convert canvas to PNG
        const pngUrl = canvas.toDataURL("image/png")

        // Create download link
        const downloadLink = document.createElement("a")
        downloadLink.href = pngUrl
        downloadLink.download = `${staff.name.replace(/\s+/g, "_")}_QR_Code.png`
        document.body.appendChild(downloadLink)
        downloadLink.click()
        document.body.removeChild(downloadLink)

        // Clean up
        URL.revokeObjectURL(svgUrl)

        toast({
          title: "QR Code Downloaded",
          description: "The QR code has been downloaded successfully.",
        })
      }

      img.src = svgUrl
    } catch (err) {
      console.error("Error downloading QR code:", err)
      toast({
        title: "Download Failed",
        description: "Failed to download QR code. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle>Staff QR Code</DialogTitle>
          <DialogDescription className="text-gray-400">
            Scan this QR code to check in and out of shifts
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-4">
          <div ref={qrRef} className="bg-white p-4 rounded-lg mb-4">
            <QRCodeSVG
              value={qrValue}
              size={200}
              level="H"
              includeMargin={true}
              imageSettings={{
                src: "/placeholder.svg?height=40&width=40",
                height: 40,
                width: 40,
                excavate: true,
              }}
            />
          </div>

          <div className="text-center mb-4">
            <h3 className="font-bold text-lg">{staff?.name}</h3>
            <p className="text-gray-400">{staff?.role}</p>
          </div>

          <Button variant="outline" className="w-full border-zinc-700" onClick={downloadQRCode}>
            <Download className="mr-2 h-4 w-4" /> Download QR Code
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

