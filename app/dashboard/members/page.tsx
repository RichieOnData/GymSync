"use client"

import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  AlertTriangle,
  Calendar,
  MessageSquare,
  RefreshCw,
  Trash,
  QrCode,
  UserCheck,
} from "lucide-react"
import { format } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { AddMemberForm } from "@/components/members/add-member-form"
import { RenewMembership } from "@/components/members/renew-membership"
import { AttendanceCalendar } from "@/components/members/attendance-calendar"
import { SuggestionsTab } from "@/components/members/suggestions-tab"
import { DeleteMemberDialog } from "@/components/members/delete-member-dialog"
import { MemberQRCode } from "@/components/members/member-qr-code"
import { AnomaliesDialog } from "@/components/members/anomalies-dialog"
import { CheckInMonitor } from "@/components/members/check-in-monitor"
import { MembershipBadge } from "@/components/members/membership-badge"
import  ExpirationBadge  from "@/components/members/expiration-badge"
import { type MembershipPlan, SUBSCRIPTION_PLANS, type ExpirationStatus } from "@/types/member"
import { getExpirationStatus } from "@/utils/subscription"
import { Badge } from "@/components/ui/badge"
import { checkExpiringMemberships, sendEmailNotification } from "@/utils/notification"

// Initialize Supabase client
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface MemberWithAnomalies extends Member {
  anomalies_count: number
}

export default function MembersPage() {
  const [members, setMembers] = useState<MemberWithAnomalies[]>([])
  const [filteredMembers, setFilteredMembers] = useState<MemberWithAnomalies[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isRenewDialogOpen, setIsRenewDialogOpen] = useState(false)
  const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false)
  const [isSuggestionsDialogOpen, setIsSuggestionsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isQRCodeDialogOpen, setIsQRCodeDialogOpen] = useState(false)
  const [isAnomaliesDialogOpen, setIsAnomaliesDialogOpen] = useState(false)
  const [isCheckInMonitorOpen, setIsCheckInMonitorOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [membershipFilter, setMembershipFilter] = useState<MembershipPlan | null>(null)
  const [expirationFilter, setExpirationFilter] = useState<ExpirationStatus | null>(null)
  const [expiringCount, setExpiringCount] = useState(0)
  const [anomalyCount, setAnomalyCount] = useState(0)

  // Fetch members from Supabase
  useEffect(() => {
    fetchMembers()

    // Set up real-time subscription for anomalies
    const subscription = supabase
      .channel("anomalies-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "anomalies",
        },
        () => {
          // Refresh members to update anomaly counts
          fetchMembers()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [])

  // Check for expiring memberships
  useEffect(() => {
    const checkExpirations = async () => {
      const expiringMembers = await checkExpiringMemberships()

      // Send notifications for expiring memberships
      for (const member of expiringMembers) {
        // Send email notification
        if (member.email) {
          const subject = "Your Gym Membership is Expiring Soon"
          const content = `
            <h1>Membership Expiration Notice</h1>
            <p>Dear ${member.name},</p>
            <p>Your gym membership will expire on ${new Date(member.expiration_date).toLocaleDateString()}.</p>
            <p>You joined on ${new Date(member.join_date).toLocaleDateString()}.</p>
            <p>Please renew your membership to continue enjoying our services.</p>
            <p>Thank you for being a valued member!</p>
          `
          await sendEmailNotification(member.email, subject, content)
        }
      }
    }

    // Run once on page load
    checkExpirations()

    // Set up interval to check daily (in a real app, this would be a cron job)
    const interval = setInterval(checkExpirations, 24 * 60 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  const fetchMembers = async () => {
    try {
      setLoading(true)

      // Get members with anomaly counts
      const { data, error } = await supabase
        .from("members")
        .select(`
          *,
          anomalies:anomalies(count)
        `)
        .order("join_date", { ascending: false })

      if (error) throw error

      // Process the data to include anomaly counts
      const membersWithAnomalies = data.map((member) => ({
        ...member,
        anomalies_count: member.anomalies[0]?.count || 0,
      })) as MemberWithAnomalies[]

      setMembers(membersWithAnomalies)
      setFilteredMembers(membersWithAnomalies)

      // Count expiring memberships
      const expiringSoon =
        membersWithAnomalies.filter((member) => getExpirationStatus(member.expiration_date) === "expiring-soon") || []
      setExpiringCount(expiringSoon.length)

      // Count unresolved anomalies
      const { count, error: anomalyError } = await supabase
        .from("anomalies")
        .select("*", { count: "exact", head: true })
        .eq("resolved", false)

      if (!anomalyError) {
        setAnomalyCount(count || 0)
      }

      setLoading(false)
    } catch (err: any) {
      console.error("Error fetching members:", err)
      setError(err.message || "Failed to load members")
      setLoading(false)
    }
  }

  // Filter members based on search term, membership filter, and expiration filter
  useEffect(() => {
    let filtered = members

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (member) =>
          member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.registration_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.phone.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Apply membership filter
    if (membershipFilter) {
      filtered = filtered.filter((member) => member.membership_plan === membershipFilter)
    }

    // Apply expiration filter
    if (expirationFilter) {
      filtered = filtered.filter((member) => getExpirationStatus(member.expiration_date) === expirationFilter)
    }

    setFilteredMembers(filtered)
  }, [searchTerm, membershipFilter, expirationFilter, members])

  // Handle deleting a member
  const handleDeleteMember = async (id: string) => {
    try {
      const { error } = await supabase.from("members").delete().eq("id", id)

      if (error) throw error

      // Update the local state
      const updatedMembers = members.filter((member) => member.id !== id)
      setMembers(updatedMembers)
      setIsDeleteDialogOpen(false)

      // Update expiring count
      const expiringSoon = updatedMembers.filter(
        (member) => getExpirationStatus(member.expiration_date) === "expiring-soon",
      )
      setExpiringCount(expiringSoon.length)

      toast({
        title: "Member Deleted",
        description: "The member has been removed successfully.",
      })
    } catch (err: any) {
      console.error("Error deleting member:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to delete member",
        variant: "destructive",
      })
    }
  }

  // Handle opening the renew dialog
  const handleRenewClick = (member: Member) => {
    setSelectedMember(member)
    setIsRenewDialogOpen(true)
  }

  // Handle opening the attendance dialog
  const handleAttendanceClick = (member: Member) => {
    setSelectedMember(member)
    setIsAttendanceDialogOpen(true)
  }

  // Handle opening the suggestions dialog
  const handleSuggestionsClick = (member: Member) => {
    setSelectedMember(member)
    setIsSuggestionsDialogOpen(true)
  }

  // Handle opening the delete dialog
  const handleDeleteClick = (member: Member) => {
    setSelectedMember(member)
    setIsDeleteDialogOpen(true)
  }

  // Handle opening the QR code dialog
  const handleQRCodeClick = (member: Member) => {
    setSelectedMember(member)
    setIsQRCodeDialogOpen(true)
  }

  // Handle opening the anomalies dialog
  const handleAnomaliesClick = (member: Member) => {
    setSelectedMember(member)
    setIsAnomaliesDialogOpen(true)
  }

  // Clear filters
  const clearFilters = () => {
    setMembershipFilter(null)
    setExpirationFilter(null)
  }

  // Show expiring memberships
  const showExpiringMemberships = () => {
    setExpirationFilter("expiring-soon")
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
      <Toaster />
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">Member Management</h1>
          <div className="flex gap-2">
            {expiringCount > 0 && (
              <Badge
                variant="outline"
                className="bg-yellow-500/10 text-yellow-500 border-yellow-500 flex items-center gap-1 cursor-pointer hover:bg-yellow-500/20"
                onClick={showExpiringMemberships}
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                {expiringCount} {expiringCount === 1 ? "subscription" : "subscriptions"} expiring soon
              </Badge>
            )}
            {anomalyCount > 0 && (
              <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500 flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                {anomalyCount} {anomalyCount === 1 ? "anomaly" : "anomalies"} detected
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-zinc-700" onClick={() => setIsCheckInMonitorOpen(true)}>
            <UserCheck className="mr-2 h-4 w-4" />
            Check-In Monitor
          </Button>
          <Button className="bg-red-600 hover:bg-red-700" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Member
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search by name, registration number, email, phone..."
            className="pl-8 bg-zinc-900 border-zinc-800 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="border-zinc-700">
                <Filter className="mr-2 h-4 w-4" />
                {membershipFilter ? `Plan: ${membershipFilter}` : "Filter by Plan"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-white">
              <DropdownMenuLabel>Membership Plans</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-zinc-800" />
              {SUBSCRIPTION_PLANS.map((plan) => (
                <DropdownMenuItem
                  key={plan.name}
                  className="cursor-pointer"
                  onClick={() => setMembershipFilter(plan.name)}
                >
                  {plan.name}
                </DropdownMenuItem>
              ))}
              {membershipFilter && (
                <>
                  <DropdownMenuSeparator className="bg-zinc-800" />
                  <DropdownMenuItem className="cursor-pointer text-red-500" onClick={() => setMembershipFilter(null)}>
                    Clear Plan Filter
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="border-zinc-700">
                <Filter className="mr-2 h-4 w-4" />
                {expirationFilter ? `Status: ${expirationFilter.replace("-", " ")}` : "Filter by Status"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-white">
              <DropdownMenuLabel>Subscription Status</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-zinc-800" />
              <DropdownMenuItem className="cursor-pointer" onClick={() => setExpirationFilter("active")}>
                Active
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={() => setExpirationFilter("expiring-soon")}>
                Expiring Soon
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={() => setExpirationFilter("expired")}>
                Expired
              </DropdownMenuItem>
              {expirationFilter && (
                <>
                  <DropdownMenuSeparator className="bg-zinc-800" />
                  <DropdownMenuItem className="cursor-pointer text-red-500" onClick={() => setExpirationFilter(null)}>
                    Clear Status Filter
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {(membershipFilter || expirationFilter) && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-gray-400 hover:text-white">
              Clear All Filters
            </Button>
          )}
        </div>
      </div>

      {/* Members Table */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle>Gym Members</CardTitle>
          <CardDescription>
            {filteredMembers.length} {filteredMembers.length === 1 ? "member" : "members"} found
            {membershipFilter && ` with ${membershipFilter} plan`}
            {expirationFilter && ` (${expirationFilter.replace("-", " ")})`}
            {searchTerm && ` matching "${searchTerm}"`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredMembers.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              {members.length === 0
                ? "No members found. Add your first member to get started."
                : "No members match your search criteria."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800">
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead className="hidden md:table-cell">Join Date</TableHead>
                    <TableHead className="hidden md:table-cell">Expires</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => {
                    const expirationStatus = getExpirationStatus(member.expiration_date)
                    const isExpiringSoon = expirationStatus === "expiring-soon"
                    const isExpired = expirationStatus === "expired"
                    const hasAnomalies = member.anomalies_count > 0

                    return (
                      <TableRow
                        key={member.id}
                        className={`border-zinc-800 ${
                          hasAnomalies
                            ? "bg-red-500/5"
                            : isExpiringSoon
                              ? "bg-yellow-500/5"
                              : isExpired
                                ? "bg-red-500/5"
                                : ""
                        }`}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {member.name}
                            {hasAnomalies && (
                              <span
                                className="text-red-500 cursor-pointer"
                                title="Anomalies detected"
                                onClick={() => handleAnomaliesClick(member)}
                              >
                                <AlertTriangle className="h-4 w-4" />
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{member.email}</div>
                            <div className="text-gray-400">{member.phone}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <MembershipBadge plan={member.membership_plan} />
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {format(new Date(member.join_date), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {format(new Date(member.expiration_date), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <ExpirationBadge expirationDate={member.expiration_date} />
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-white">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator className="bg-zinc-800" />
                              <DropdownMenuItem
                                className="flex items-center cursor-pointer"
                                onClick={() => handleQRCodeClick(member)}
                              >
                                <QrCode className="mr-2 h-4 w-4" /> QR Code
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="flex items-center cursor-pointer"
                                onClick={() => handleRenewClick(member)}
                              >
                                <RefreshCw className="mr-2 h-4 w-4" /> Renew Membership
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="flex items-center cursor-pointer"
                                onClick={() => handleAttendanceClick(member)}
                              >
                                <Calendar className="mr-2 h-4 w-4" /> Attendance
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="flex items-center cursor-pointer"
                                onClick={() => handleSuggestionsClick(member)}
                              >
                                <MessageSquare className="mr-2 h-4 w-4" /> Suggestions
                              </DropdownMenuItem>
                              {hasAnomalies && (
                                <DropdownMenuItem
                                  className="flex items-center cursor-pointer text-red-500"
                                  onClick={() => handleAnomaliesClick(member)}
                                >
                                  <AlertTriangle className="mr-2 h-4 w-4" /> View Anomalies
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator className="bg-zinc-800" />
                              <DropdownMenuItem
                                className="flex items-center cursor-pointer text-red-500 focus:text-red-500"
                                onClick={() => handleDeleteClick(member)}
                              >
                                <Trash className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Member Dialog */}
      <AddMemberForm open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} onSuccess={fetchMembers} />

      {/* Renew Membership Dialog */}
      {selectedMember && (
        <RenewMembership
          open={isRenewDialogOpen}
          onOpenChange={setIsRenewDialogOpen}
          member={selectedMember}
          onSuccess={fetchMembers}
        />
      )}

      {/* Attendance Calendar Dialog */}
      {selectedMember && (
        <AttendanceCalendar
          open={isAttendanceDialogOpen}
          onOpenChange={setIsAttendanceDialogOpen}
          member={selectedMember}
        />
      )}

      {/* Suggestions Tab Dialog */}
      {selectedMember && (
        <SuggestionsTab
          open={isSuggestionsDialogOpen}
          onOpenChange={setIsSuggestionsDialogOpen}
          member={selectedMember}
        />
      )}

      {/* QR Code Dialog */}
      {selectedMember && (
        <MemberQRCode open={isQRCodeDialogOpen} onOpenChange={setIsQRCodeDialogOpen} member={selectedMember} />
      )}

      {/* Anomalies Dialog */}
      {selectedMember && (
        <AnomaliesDialog open={isAnomaliesDialogOpen} onOpenChange={setIsAnomaliesDialogOpen} member={selectedMember} />
      )}

      {/* Check-In Monitor Dialog */}
      <CheckInMonitor open={isCheckInMonitorOpen} onOpenChange={setIsCheckInMonitorOpen} />

      {/* Delete Member Dialog */}
      {selectedMember && (
        <DeleteMemberDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          member={selectedMember}
          onDelete={() => handleDeleteMember(selectedMember.id)}
        />
      )}
    </div>
  )
}

export type { Member }

