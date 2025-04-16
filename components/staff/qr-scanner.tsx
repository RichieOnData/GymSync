"use client"

import { useState, useEffect, useRef } from "react"
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode"

interface QrScannerProps {
  onScan: (data: string) => void
  onError: (error: any) => void
  constraints?: MediaTrackConstraints
  fps?: number
  qrbox?: number | { width: number; height: number }
  disableFlip?: boolean
}

export function QrScanner({
  onScan,
  onError,
  constraints = { facingMode: "environment" },
  fps = 10,
  qrbox = { width: 250, height: 250 },
  disableFlip = false,
}: QrScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Initialize scanner
    if (containerRef.current && !scannerRef.current) {
      scannerRef.current = new Html5Qrcode("qr-reader")
    }

    // Start scanning
    const startScanner = async () => {
      if (!scannerRef.current) return

      try {
        await scannerRef.current.start(
          { facingMode: constraints.facingMode },
          {
            fps,
            qrbox,
            disableFlip,
          },
          (decodedText) => {
            onScan(decodedText)
          },
          (errorMessage) => {
            // Ignore frequent errors during scanning
            if (errorMessage.includes("No QR code found")) return
            console.error(errorMessage)
          },
        )
        setIsScanning(true)
      } catch (err) {
        onError(err)
      }
    }

    if (scannerRef.current && !isScanning) {
      startScanner()
    }

    // Clean up
    return () => {
      if (scannerRef.current && scannerRef.current.getState() === Html5QrcodeScannerState.SCANNING) {
        scannerRef.current.stop().catch((err) => console.error("Error stopping scanner:", err))
      }
    }
  }, [constraints, fps, qrbox, disableFlip, onScan, onError, isScanning])

  return (
    <div className="qr-scanner">
      <div id="qr-reader" ref={containerRef} className="w-full max-w-sm mx-auto overflow-hidden rounded-lg"></div>
      <style jsx global>{`
        #qr-reader {
          width: 100%;
          max-width: 100%;
        }
        #qr-reader video {
          object-fit: cover;
        }
        #qr-reader__scan_region {
          position: relative;
          min-height: 300px;
          background: black;
        }
        #qr-reader__scan_region::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border: 2px solid rgba(255, 255, 255, 0.5);
          box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
          z-index: 1;
        }
        #qr-reader__dashboard {
          padding: 0 !important;
        }
        #qr-reader__dashboard_section_swaplink {
          display: none !important;
        }
        #qr-reader__dashboard_section_csr {
          display: none !important;
        }
      `}</style>
    </div>
  )
}

