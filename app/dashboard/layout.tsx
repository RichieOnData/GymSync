"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@supabase/supabase-js"
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  Brain,
  BarChart3,
  MessageSquare,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useMediaQuery } from "@/hooks/use-media-query"
import { ThemeToggle } from "@/components/theme-toggle"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const pathname = usePathname()
  const isMobile = useMediaQuery("(max-width: 768px)")

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
    }
    getUser()
  }, [])

  useEffect(() => {
    if (isMobile) {
      setCollapsed(true)
      setMobileOpen(false)
    } else {
      setMobileOpen(true)
    }
  }, [isMobile])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = "/"
  }

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Members",
      href: "/dashboard/members",
      icon: Users,
    },
    {
      name: "Metrics",
      href: "/dashboard/metrics",
      icon: BarChart3,
    },
    {
      name: "AI Insights",
      href: "/dashboard/ai-insights",
      icon: Brain,
    },
    {
      name: "Suggestions",
      href: "/dashboard/suggestions",
      icon: MessageSquare,
    },
    {
      name: "Staff Management",
      href: "/dashboard/staff",
      icon: Users,
    },
    {
      name: "Billing",
      href: "/dashboard/billing",
      icon: CreditCard,
    },
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
    },
  ]

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Mobile Overlay */}
      {mobileOpen && isMobile && (
        <div className="fixed inset-0 bg-black/80 z-40" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 bottom-0 z-50 
          ${collapsed ? "w-[70px]" : "w-[250px]"} 
          ${mobileOpen ? "left-0" : "-left-[250px] md:left-0"}
          transition-all duration-300 ease-in-out
          bg-zinc-900 border-r border-zinc-800
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 flex items-center justify-between border-b border-zinc-800">
            {!collapsed && (
              <Link href="/dashboard" className="flex items-center gap-2">
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-aNG1E2AylxNoC1BWZ7m3CPk5AMLGvI.png"
                  alt="GymSync Logo"
                  width={30}
                  height={30}
                />
                <span className="font-bold text-xl">GymSync</span>
              </Link>
            )}
            {collapsed && (
              <Link href="/dashboard" className="mx-auto">
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-aNG1E2AylxNoC1BWZ7m3CPk5AMLGvI.png"
                  alt="GymSync Logo"
                  width={30}
                  height={30}
                />
              </Link>
            )}
            {!isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCollapsed(!collapsed)}
                className="text-gray-400 hover:text-white"
              >
                {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
              </Button>
            )}
          </div>

          {/* Nav Items */}
          <nav className="flex-1 py-6">
            <ul className="space-y-1 px-2">
              {navItems.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`
                      flex items-center gap-3 px-3 py-2 rounded-md transition-colors
                      ${pathname === item.href ? "bg-red-600 text-white" : "text-gray-400 hover:text-white hover:bg-zinc-800"}
                    `}
                  >
                    <item.icon size={20} />
                    {!collapsed && <span>{item.name}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-zinc-800">
            <div className={`flex ${collapsed ? "justify-center" : "justify-between"} items-center`}>
              {!collapsed && user && (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-medium">{user.email}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-4">
                <ThemeToggle />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSignOut}
                  className="text-gray-400 hover:text-white"
                  title="Sign Out"
                >
                  <LogOut size={20} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`
        flex-1 transition-all duration-300 ease-in-out
        ${collapsed ? "md:ml-[70px]" : "md:ml-[250px]"}
      `}
      >
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-aNG1E2AylxNoC1BWZ7m3CPk5AMLGvI.png"
              alt="GymSync Logo"
              width={30}
              height={30}
            />
            <span className="font-bold text-xl">GymSync</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="text-gray-400 hover:text-white"
          >
            <Menu size={24} />
          </Button>
        </div>
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}

