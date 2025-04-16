"use client"

import { useToast } from "@/components/ui/use-toast"
import { X } from "lucide-react"

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <div className="fixed top-0 right-0 z-50 p-4 space-y-4 w-full max-w-md">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            p-4 rounded-lg shadow-lg border transition-all transform translate-x-0 opacity-100
            ${
              toast.variant === "destructive"
                ? "bg-red-600 border-red-800 text-white"
                : "bg-zinc-900 border-zinc-800 text-white"
            }
          `}
          role="alert"
        >
          <div className="flex justify-between items-start">
            <div>
              {toast.title && <h3 className="font-medium">{toast.title}</h3>}
              {toast.description && <p className="text-sm mt-1 opacity-90">{toast.description}</p>}
            </div>
            <button
              onClick={() => dismiss(toast.id)}
              className="ml-4 inline-flex shrink-0 rounded-md p-1 text-white/50 hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

