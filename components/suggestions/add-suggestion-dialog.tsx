"use client"

import type React from "react"

import { useState, useEffect } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { Cross2Icon } from "@radix-ui/react-icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@supabase/supabase-js"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { SuggestionEntry } from "@/types/suggestion"
import type { Member } from "@/types/member"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface AddSuggestionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddSuggestion: (suggestion: Omit<SuggestionEntry, "id">) => Promise<boolean>
}

export function AddSuggestionDialog({ open, onOpenChange, onAddSuggestion }: AddSuggestionDialogProps) {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    member_id: "",
    member_name: "",
    content: "",
    date: new Date().toISOString().split("T")[0],
    status: "new" as const,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open) {
      fetchMembers()
    }
  }, [open])

  const fetchMembers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from("members").select("id, name").order("name")

      if (error) throw error

      setMembers(data || [])
    } catch (error) {
      console.error("Error fetching members:", error)
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.member_id) {
      newErrors.member_id = "Member is required"
    }

    if (!formData.content.trim()) {
      newErrors.content = "Suggestion content is required"
    }

    if (!formData.date) {
      newErrors.date = "Date is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)
    const success = await onAddSuggestion(formData)

    if (success) {
      setFormData({
        member_id: "",
        member_name: "",
        content: "",
        date: new Date().toISOString().split("T")[0],
        status: "new",
      })
      onOpenChange(false)
    }

    setLoading(false)
  }

  const handleMemberChange = (value: string) => {
    const selectedMember = members.find((m) => m.id === value)
    setFormData({
      ...formData,
      member_id: value,
      member_name: selectedMember?.name || "",
    })

    // Clear error when field is edited
    if (errors.member_id) {
      setErrors({ ...errors, member_id: "" })
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })

    // Clear error when field is edited
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" })
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] max-h-[85vh] w-[90vw] max-w-[500px] translate-x-[-50%] translate-y-[-50%] rounded-lg bg-zinc-900 border border-zinc-800 p-6 shadow-lg focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] overflow-y-auto">
          <Dialog.Title className="text-xl font-semibold text-white">Add Member Suggestion</Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-gray-400">
            Record feedback or suggestions provided by a member.
          </Dialog.Description>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="member_id">Member</Label>
              <Select value={formData.member_id} onValueChange={handleMemberChange}>
                <SelectTrigger
                  id="member_id"
                  className={`bg-black border-zinc-800 ${errors.member_id ? "border-red-600" : ""}`}
                >
                  <SelectValue placeholder="Select a member" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.member_id && <p className="text-red-600 text-sm">{errors.member_id}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                className={`bg-black border-zinc-800 ${errors.date ? "border-red-600" : ""}`}
              />
              {errors.date && <p className="text-red-600 text-sm">{errors.date}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Suggestion</Label>
              <Textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleChange}
                rows={5}
                className={`bg-black border-zinc-800 ${errors.content ? "border-red-600" : ""}`}
                placeholder="Enter the member's feedback or suggestion..."
              />
              {errors.content && <p className="text-red-600 text-sm">{errors.content}</p>}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Dialog.Close asChild>
                <Button type="button" variant="outline" className="border-zinc-700">
                  Cancel
                </Button>
              </Dialog.Close>
              <Button type="submit" className="bg-red-600 hover:bg-red-700" disabled={loading}>
                {loading ? "Saving..." : "Save Suggestion"}
              </Button>
            </div>
          </form>

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

