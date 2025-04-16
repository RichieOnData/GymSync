"use client"

import type React from "react"

import { useState, useRef } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { Cross2Icon } from "@radix-ui/react-icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, Image, Paperclip, Send, CalendarIcon } from "lucide-react"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"

interface MessageComposerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  recipient: string
  recipientId: string
  subject?: string
  initialContent?: string
  onClose: () => void
  onSend?: () => Promise<void>
}

export function MessageComposer({
  open,
  onOpenChange,
  recipient,
  recipientId,
  subject = "",
  initialContent = "",
  onClose,
  onSend,
}: MessageComposerProps) {
  const [loading, setLoading] = useState(false)
  const [messageSubject, setMessageSubject] = useState(subject)
  const [messageContent, setMessageContent] = useState(initialContent)
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined)
  const [scheduledTime, setScheduledTime] = useState("12:00")
  const [attachments, setAttachments] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleAttachmentClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setAttachments([...attachments, ...newFiles])
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index))
  }

  const handleSendNow = async () => {
    if (!messageSubject.trim() || !messageContent.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both a subject and message content.",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      // In a real app, you would send the message to an API endpoint
      await new Promise((resolve) => setTimeout(resolve, 1000))

      if (onSend) {
        await onSend()
      }

      toast({
        title: "Message Sent",
        description: `Your message has been sent to ${recipient}.`,
      })

      onOpenChange(false)
      onClose()
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSchedule = async () => {
    if (!messageSubject.trim() || !messageContent.trim() || !scheduledDate) {
      toast({
        title: "Missing Information",
        description: "Please provide a subject, message content, and scheduled date/time.",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      // In a real app, you would send the scheduled message to an API endpoint
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const scheduledDateTime = new Date(scheduledDate)
      const [hours, minutes] = scheduledTime.split(":").map(Number)
      scheduledDateTime.setHours(hours, minutes)

      toast({
        title: "Message Scheduled",
        description: `Your message to ${recipient} has been scheduled for ${format(scheduledDateTime, "PPpp")}.`,
      })

      onOpenChange(false)
      onClose()
    } catch (error) {
      console.error("Error scheduling message:", error)
      toast({
        title: "Error",
        description: "Failed to schedule message. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAsDraft = async () => {
    try {
      setLoading(true)

      // In a real app, you would save the draft to an API endpoint
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Draft Saved",
        description: "Your message has been saved as a draft.",
      })

      onOpenChange(false)
      onClose()
    } catch (error) {
      console.error("Error saving draft:", error)
      toast({
        title: "Error",
        description: "Failed to save draft. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] max-h-[85vh] w-[90vw] max-w-[700px] translate-x-[-50%] translate-y-[-50%] rounded-lg bg-zinc-900 border border-zinc-800 p-6 shadow-lg focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] overflow-y-auto">
          <Dialog.Title className="text-xl font-semibold text-white">Compose Message</Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-gray-400">
            Create a message to send to {recipient}.
          </Dialog.Description>

          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recipient">To</Label>
              <Input id="recipient" value={recipient} readOnly className="bg-black border-zinc-800 opacity-70" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={messageSubject}
                onChange={(e) => setMessageSubject(e.target.value)}
                className="bg-black border-zinc-800"
                placeholder="Enter message subject..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Message</Label>
              <Textarea
                id="content"
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                rows={8}
                className="bg-black border-zinc-800"
                placeholder="Enter your message..."
              />
            </div>

            {attachments.length > 0 && (
              <div className="space-y-2">
                <Label>Attachments</Label>
                <div className="space-y-2">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-black/30 p-2 rounded-md">
                      <div className="flex items-center gap-2">
                        <Paperclip className="h-4 w-4 text-gray-400" />
                        <span className="text-sm truncate max-w-[400px]">{file.name}</span>
                        <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                        onClick={() => removeAttachment(index)}
                      >
                        <Cross2Icon className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-zinc-700 gap-1"
                onClick={handleAttachmentClick}
              >
                <Paperclip className="h-4 w-4" />
                Attach File
              </Button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-zinc-700 gap-1"
                onClick={handleAttachmentClick}
              >
                <Image className="h-4 w-4" />
                Add Image
              </Button>
            </div>

            <Tabs defaultValue="send" className="w-full">
              <TabsList className="bg-zinc-900 border border-zinc-800">
                <TabsTrigger value="send" className="gap-1">
                  <Send className="h-4 w-4" />
                  Send Now
                </TabsTrigger>
                <TabsTrigger value="schedule" className="gap-1">
                  <Calendar className="h-4 w-4" />
                  Schedule
                </TabsTrigger>
                <TabsTrigger value="draft" className="gap-1">
                  <Clock className="h-4 w-4" />
                  Save as Draft
                </TabsTrigger>
              </TabsList>

              <TabsContent value="send" className="mt-4">
                <div className="flex justify-end">
                  <Button className="bg-red-600 hover:bg-red-700 gap-2" onClick={handleSendNow} disabled={loading}>
                    <Send className="h-4 w-4" />
                    {loading ? "Sending..." : "Send Message"}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="schedule" className="mt-4">
                <div className="flex flex-col gap-4">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Label htmlFor="scheduled-date" className="mb-2 block">
                        Date
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal border-zinc-800 bg-black"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {scheduledDate ? format(scheduledDate, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-zinc-900 border-zinc-800">
                          <CalendarComponent
                            mode="single"
                            selected={scheduledDate}
                            onSelect={setScheduledDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="w-1/3">
                      <Label htmlFor="scheduled-time" className="mb-2 block">
                        Time
                      </Label>
                      <Input
                        id="scheduled-time"
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="bg-black border-zinc-800"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      className="bg-blue-600 hover:bg-blue-700 gap-2"
                      onClick={handleSchedule}
                      disabled={loading || !scheduledDate}
                    >
                      <Calendar className="h-4 w-4" />
                      {loading ? "Scheduling..." : "Schedule Message"}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="draft" className="mt-4">
                <div className="flex justify-end">
                  <Button
                    className="bg-gray-600 hover:bg-gray-700 gap-2"
                    onClick={handleSaveAsDraft}
                    disabled={loading}
                  >
                    <Clock className="h-4 w-4" />
                    {loading ? "Saving..." : "Save as Draft"}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
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

