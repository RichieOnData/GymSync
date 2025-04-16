"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function SignUp() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    gymName: "",
  })
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            gym_name: formData.gymName,
          },
        },
      })

      if (error) throw error

      router.push("/dashboard")
    } catch (error: any) {
      setError(error.message)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="w-full max-w-md p-8 rounded-lg bg-zinc-900 border border-zinc-800">
        <h1 className="text-2xl font-bold mb-6 text-center">Create your GymSync Account</h1>
        {error && <div className="bg-red-600/20 border border-red-600 text-red-100 p-3 rounded mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Full Name
            </label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="bg-black border-zinc-800 focus:border-red-600"
            />
          </div>
          <div>
            <label htmlFor="gymName" className="block text-sm font-medium mb-2">
              Gym Name
            </label>
            <Input
              id="gymName"
              type="text"
              value={formData.gymName}
              onChange={(e) => setFormData({ ...formData, gymName: e.target.value })}
              required
              className="bg-black border-zinc-800 focus:border-red-600"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="bg-black border-zinc-800 focus:border-red-600"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              className="bg-black border-zinc-800 focus:border-red-600"
            />
          </div>
          <Button type="submit" className="w-full bg-red-600 hover:bg-red-700">
            Sign Up
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-400">
          Already have an account?{" "}
          <Link href="/login" className="text-red-600 hover:text-red-500">
            Login here
          </Link>
        </p>
      </div>
    </div>
  )
}

