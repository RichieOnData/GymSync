"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export default function ContactSales() {
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // Add your form submission logic here
    setTimeout(() => setLoading(false), 1000)
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md p-8 rounded-lg bg-zinc-900 border border-zinc-800">
        <h1 className="text-2xl font-bold mb-6">Contact Sales</h1>
        <p className="text-gray-400 mb-8">
          Please fill out the form below and our enterprise sales team will get back to you shortly.
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Company Name
            </label>
            <Input id="name" required className="bg-black border-zinc-800 focus:border-red-600" />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Business Email
            </label>
            <Input id="email" type="email" required className="bg-black border-zinc-800 focus:border-red-600" />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium mb-2">
              Phone Number
            </label>
            <Input id="phone" type="tel" required className="bg-black border-zinc-800 focus:border-red-600" />
          </div>
          <div>
            <label htmlFor="message" className="block text-sm font-medium mb-2">
              Message
            </label>
            <Textarea
              id="message"
              required
              className="bg-black border-zinc-800 focus:border-red-600 min-h-[100px]"
              placeholder="Tell us about your gym chain and requirements..."
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-red-600 hover:bg-red-700">
            {loading ? "Sending..." : "Send Message"}
          </Button>
        </form>
      </div>
    </div>
  )
}

