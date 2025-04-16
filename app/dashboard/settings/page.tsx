"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

interface Settings {
  profile: {
    name: string
    email: string
    role: string
  }
  aiRules: {
    id: number
    name: string
    description: string
    enabled: boolean
  }[]
  notifications: {
    email: boolean
    push: boolean
    sms: boolean
  }
}

export default function Settings() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [password, setPassword] = useState({
    current: "",
    new: "",
    confirm: "",
  })

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true)
        const res = await fetch("/api/settings")
        const data = await res.json()
        setSettings(data)
        setLoading(false)
      } catch (err) {
        console.error("Error fetching settings:", err)
        setError("Failed to load settings. Please try again later.")
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!settings) return

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      })

      const data = await res.json()
      toast({
        title: "Profile Updated",
        description: "Your profile information has been updated successfully.",
      })
    } catch (err) {
      console.error("Error updating profile:", err)
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password.new !== password.confirm) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive",
      })
      return
    }

    try {
      // In a real app, you would call an API to update the password
      // For now, we'll just show a success message
      toast({
        title: "Password Updated",
        description: "Your password has been updated successfully.",
      })
      setPassword({
        current: "",
        new: "",
        confirm: "",
      })
    } catch (err) {
      console.error("Error updating password:", err)
      toast({
        title: "Error",
        description: "Failed to update password. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleAIRuleToggle = (id: number) => {
    if (!settings) return

    const updatedRules = settings.aiRules.map((rule) => (rule.id === id ? { ...rule, enabled: !rule.enabled } : rule))

    setSettings({
      ...settings,
      aiRules: updatedRules,
    })
  }

  const handleNotificationToggle = (type: keyof Settings["notifications"]) => {
    if (!settings) return

    setSettings({
      ...settings,
      notifications: {
        ...settings.notifications,
        [type]: !settings.notifications[type],
      },
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-white">{error}</p>
          <Button className="mt-4 bg-red-600 hover:bg-red-700" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <Toaster />
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="bg-zinc-900 border border-zinc-800">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="ai-rules">AI Rules</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile" className="mt-4 space-y-6">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-red-600">Profile Information</CardTitle>
              <CardDescription className="text-gray-400">Update your account information.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="name" className="text-red-600">Full Name</Label>
                  <Input
                    id="name"
                    value={settings?.profile.name || ""}
                    onChange={(e) =>
                      setSettings(
                        settings
                          ? {
                              ...settings,
                              profile: {
                                ...settings.profile,
                                name: e.target.value,
                              },
                            }
                          : null,
                      )
                    }
                    className="bg-black border-zinc-800 text-red-600"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-red-600">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings?.profile.email || ""}
                    onChange={(e) =>
                      setSettings(
                        settings
                          ? {
                              ...settings,
                              profile: {
                                ...settings.profile,
                                email: e.target.value,
                              },
                            }
                          : null,
                      )
                    }
                    className="bg-black border-zinc-800 text-red-600"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role" className="text-red-600">Role</Label>
                  <Input
                    id="role"
                    value={settings?.profile.role || ""}
                    onChange={(e) =>
                      setSettings(
                        settings
                          ? {
                              ...settings,
                              profile: {
                                ...settings.profile,
                                role: e.target.value,
                              },
                            }
                          : null,
                      )
                    }
                    className="bg-black border-zinc-800 text-red-600"
                  />
                </div>
                <Button type="submit" className="bg-red-600 hover:bg-red-700">
                  Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Change Password</CardTitle>
              <CardDescription className="text-gray-400">Update your account password.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="current-password" className="text-white">Current Password</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={password.current}
                    onChange={(e) => setPassword({ ...password, current: e.target.value })}
                    className="bg-black border-zinc-800"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="new-password" className="text-white">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={password.new}
                    onChange={(e) => setPassword({ ...password, new: e.target.value })}
                    className="bg-black border-zinc-800"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirm-password" className="text-white">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={password.confirm}
                    onChange={(e) => setPassword({ ...password, confirm: e.target.value })}
                    className="bg-black border-zinc-800"
                  />
                </div>
                <Button type="submit" className="bg-red-600 hover:bg-red-700">
                  Update Password
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Rules Settings */}
        <TabsContent value="ai-rules" className="mt-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">AI Rules Configuration</CardTitle>
              <CardDescription className="text-gray-400">Customize how AI features work in your gym.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {settings?.aiRules.map((rule) => (
                  <div key={rule.id} className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h4 className="font-medium text-white">{rule.name}</h4>
                      <p className="text-sm text-white">{rule.description}</p>
                    </div>
                    <Switch checked={rule.enabled} onCheckedChange={() => handleAIRuleToggle(rule.id)} />
                  </div>
                ))}
                <Button className="w-full bg-red-600 hover:bg-red-700 mt-4" onClick={handleProfileUpdate}>
                  Save AI Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="mt-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Notification Preferences</CardTitle>
              <CardDescription className="text-gray-400">Control how you receive notifications.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h4 className="font-medium text-white">Email Notifications</h4>
                    <p className="text-sm text-white">Receive notifications via email.</p>
                  </div>
                  <Switch
                    checked={settings?.notifications.email || false}
                    onCheckedChange={() => handleNotificationToggle("email")}
                  />
                </div>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h4 className="font-medium text-white">Push Notifications</h4>
                    <p className="text-sm text-white">Receive notifications on your device.</p>
                  </div>
                  <Switch
                    checked={settings?.notifications.push || false}
                    onCheckedChange={() => handleNotificationToggle("push")}
                  />
                </div>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h4 className="font-medium text-white">SMS Notifications</h4>
                    <p className="text-sm text-white">Receive notifications via text message.</p>
                  </div>
                  <Switch
                    checked={settings?.notifications.sms || false}
                    onCheckedChange={() => handleNotificationToggle("sms")}
                  />
                </div>
                <Button className="w-full bg-red-600 hover:bg-red-700 mt-4" onClick={handleProfileUpdate}>
                  Save Notification Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

