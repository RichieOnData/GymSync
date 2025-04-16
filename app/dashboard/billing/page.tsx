"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { format } from "date-fns"
import { Download, CreditCard, Filter } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface BillingData {
  activeSubscriptions: {
    id: number
    plan: string
    startDate: string
    renewalDate: string
    amount: number
    status: string
  }[]
  paymentHistory: {
    id: number
    date: string
    amount: number
    method: string
    status: string
  }[]
  revenueTrends: {
    month: string
    revenue: number
  }[]
}

export default function Billing() {
  const [billingData, setBillingData] = useState<BillingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  useEffect(() => {
    const fetchBillingData = async () => {
      try {
        setLoading(true)
        const res = await fetch("/api/billing")
        const data = await res.json()
        setBillingData(data)
        setLoading(false)
      } catch (err) {
        console.error("Error fetching billing data:", err)
        setError("Failed to load billing data. Please try again later.")
        setLoading(false)
      }
    }

    fetchBillingData()
  }, [])

  const sortedPaymentHistory = billingData?.paymentHistory
    ? [...billingData.paymentHistory].sort((a, b) => {
        const dateA = new Date(a.date).getTime()
        const dateB = new Date(b.date).getTime()
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA
      })
    : []

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
          <p className="text-gray-400">{error}</p>
          <Button className="mt-4 bg-red-600 hover:bg-red-700" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Billing</h1>
        <Button className="bg-red-600 hover:bg-red-700">
          <CreditCard className="mr-2 h-4 w-4" /> Update Payment Method
        </Button>
      </div>

      {/* Active Subscriptions */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Active Subscriptions</CardTitle>
          <CardDescription className="text-gray-400">Your current subscription plan and details.</CardDescription>
        </CardHeader>
        <CardContent>
          {billingData?.activeSubscriptions.map((subscription) => (
            <div key={subscription.id} className="p-4 border border-zinc-800 rounded-lg">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                  <h3 className="text-xl font-bold text-red-600">{subscription.plan}</h3>
                  <p className="text-gray-400">Started on {format(new Date(subscription.startDate), "MMMM d, yyyy")}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-white">₹{subscription.amount.toLocaleString()}</p>
                  <p className="text-sm text-gray-400">
                    Renews on {format(new Date(subscription.renewalDate), "MMMM d, yyyy")}
                  </p>
                  <span
                    className={`inline-block px-2 py-1 mt-2 rounded-full text-xs ${
                      subscription.status === "active"
                        ? "bg-green-500/10 text-green-500"
                        : "bg-yellow-500/10 text-yellow-500"
                    }`}
                  >
                    {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Revenue Trends */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Revenue Trends</CardTitle>
          <CardDescription className="text-gray-400">Monthly subscription revenue</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={billingData?.revenueTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="month" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#222", border: "none" }}
                  itemStyle={{ color: "#fff" }}
                  formatter={(value) => [`₹${value}`, "Revenue"]}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#dc2626"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="text-red-600">Payment History</CardTitle>
            <CardDescription className="text-gray-400">Recent payment transactions</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 border-zinc-700">
                  <Filter className="mr-2 h-4 w-4" /> Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-white">
                <DropdownMenuLabel>Sort by Date</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-zinc-800" />
                <DropdownMenuItem className="cursor-pointer" onClick={() => setSortOrder("desc")}>
                  Newest First
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => setSortOrder("asc")}>
                  Oldest First
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="sm" className="h-8 border-zinc-700">
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800">
                <TableHead className="text-white">Date</TableHead>
                <TableHead className="text-white">Amount</TableHead>
                <TableHead className="hidden md:table-cell text-white">Payment Method</TableHead>
                <TableHead className="text-white">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPaymentHistory.map((payment) => (
                <TableRow key={payment.id} className="border-zinc-800">
                  <TableCell className="text-white">{format(new Date(payment.date), "MMM d, yyyy")}</TableCell>
                  <TableCell className="text-white">₹{payment.amount.toLocaleString()}</TableCell>
                  <TableCell className="hidden md:table-cell text-white">{payment.method}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        payment.status === "completed"
                          ? "bg-green-500/10 text-green-500"
                          : payment.status === "pending"
                            ? "bg-yellow-500/10 text-yellow-500"
                            : "bg-red-500/10 text-red-500"
                      }`}
                    >
                      {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

