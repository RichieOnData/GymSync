"use client"

// Adapted from https://ui.shadcn.com/docs/components/toast
import { useState, useEffect } from "react"

export type ToastProps = {
  title?: string
  description?: string
  variant?: "default" | "destructive"
  duration?: number
}

type ToastState = {
  toasts: (ToastProps & { id: string })[]
  toast: (props: ToastProps) => void
  dismiss: (id: string) => void
}

let toastState: ToastState = {
  toasts: [],
  toast: () => {},
  dismiss: () => {},
}

let listeners: Array<(state: ToastState) => void> = []

const updateState = (newState: Partial<ToastState>) => {
  toastState = { ...toastState, ...newState }
  listeners.forEach((listener) => listener(toastState))
}

export const toast = (props: ToastProps) => {
  const id = Math.random().toString(36).substring(2, 9)
  updateState({
    toasts: [...toastState.toasts, { ...props, id }],
  })

  if (props.duration !== Number.POSITIVE_INFINITY) {
    setTimeout(() => {
      updateState({
        toasts: toastState.toasts.filter((t) => t.id !== id),
      })
    }, props.duration || 5000)
  }

  return {
    id,
    dismiss: () =>
      updateState({
        toasts: toastState.toasts.filter((t) => t.id !== id),
      }),
  }
}

export const useToast = () => {
  const [state, setState] = useState<ToastState>(toastState)

  useEffect(() => {
    const listener = (newState: ToastState) => {
      setState(newState)
    }
    listeners.push(listener)
    return () => {
      listeners = listeners.filter((l) => l !== listener)
    }
  }, [])

  return {
    ...state,
    dismiss: (id: string) =>
      updateState({
        toasts: toastState.toasts.filter((t) => t.id !== id),
      }),
  }
}

