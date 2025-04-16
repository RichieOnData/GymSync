"use client"

import { useState, useEffect } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { Cross2Icon } from "@radix-ui/react-icons"
import { Button } from "@/components/ui/button"
import { generateMemberQRCode } from "@/utils/qr-code"
import { toast } from "@/components/ui/use-toast"
import type { Member } from "@/types/member"

interface MemberQRCodeProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  member: Member
}

export function MemberQRCode({ open, onOpenChange, member }: MemberQRCodeProps) {
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (open) {
      generateQRCode()
    }
  }, [open, member.id])

  const generateQRCode = async () => {
    try {
      setLoading(true)
      const qrCodeDataUrl = await generateMemberQRCode(member.id)
      setQrCode(qrCodeDataUrl)
    } catch (error) {
      console.error("Error generating QR code:", error)
      toast({
        title: "Error",
        description: "Failed to generate QR code",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const downloadQRCode = () => {
    if (!qrCode) return

    const link = document.createElement("a")
    link.href = qrCode
    link.download = `${member.name.replace(/\s+/g, "-").toLowerCase()}-qr-code.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] max-h-[85vh] w-[90vw] max-w-[500px] translate-x-[-50%] translate-y-[-50%] rounded-lg bg-zinc-900 border border-zinc-800 p-6 shadow-lg focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] overflow-y-auto">
          <Dialog.Title className="text-xl font-semibold text-white">Member QR Code</Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-gray-400">
            QR code for {member.name}. Members can scan this code to check in.
          </Dialog.Description>

          <div className="mt-6 flex flex-col items-center justify-center">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
              </div>
            ) : qrCode ? (
              <div className="flex flex-col items-center gap-4">
                <div className="bg-white p-4 rounded-lg">
                  <img src={qrCode || "/placeholder.svg"} alt={`QR Code for ${member.name}`} className="w-64 h-64" />
                </div>
                <p className="text-sm text-center text-gray-400">Scan this QR code to check in to the gym</p>
                <Button onClick={downloadQRCode} className="bg-red-600 hover:bg-red-700 mt-2">
                  Download QR Code
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p>Failed to generate QR code. Please try again.</p>
                <Button onClick={generateQRCode} className="mt-4 bg-red-600 hover:bg-red-700">
                  Retry
                </Button>
              </div>
            )}
          </div>

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

