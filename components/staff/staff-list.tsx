"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Search, MoreVertical, Edit, Trash, Mail, Phone, QrCode } from "lucide-react"
import type { Staff } from "@/types/staff"
import { EditStaffDialog } from "./edit-staff-dialog"
import { DeleteStaffDialog } from "./delete-staff-dialog"
import { StaffQRCodeDialog } from "./staff-qr-code-dialog"
import { toast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"

interface StaffListProps {
  staff: Staff[]
  isLoading: boolean
  onStaffUpdated: (staff: Staff) => void
  onStaffDeleted: (staffId: string) => void
}

export function StaffList({ staff, isLoading, onStaffUpdated, onStaffDeleted }: StaffListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)
  const [staffToDelete, setStaffToDelete] = useState<Staff | null>(null)
  const [staffForQRCode, setStaffForQRCode] = useState<Staff | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isQRCodeDialogOpen, setIsQRCodeDialogOpen] = useState(false)

  const filteredStaff = staff.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.role?.name && s.role.name.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const handleEditClick = (staffMember: Staff) => {
    setEditingStaff(staffMember)
    setIsEditDialogOpen(true)
  }

  const handleDeleteClick = (staffMember: Staff) => {
    setStaffToDelete(staffMember)
    setIsDeleteDialogOpen(true)
  }

  const handleQRCodeClick = (staffMember: Staff) => {
    setStaffForQRCode(staffMember)
    setIsQRCodeDialogOpen(true)
  }

  const handleEmailClick = (email: string) => {
    window.open(`mailto:${email}`)
    toast({
      title: "Email Client Opened",
      description: `Composing email to ${email}`,
    })
  }

  const handlePhoneClick = (phone: string) => {
    window.open(`tel:${phone}`)
    toast({
      title: "Phone Call Initiated",
      description: `Calling ${phone}`,
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
            Active
          </Badge>
        )
      case "On Leave":
        return (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
            On Leave
          </Badge>
        )
      case "Terminated":
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
            Terminated
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <Card className="bg-zinc-900 border-zinc-800 dark:bg-white dark:border-zinc-200">
        <CardContent className="pt-6">
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="bg-zinc-900 border-zinc-800 dark:bg-white dark:border-zinc-200">
        <CardHeader>
          <CardTitle className="text-white dark:text-zinc-900">Staff Members</CardTitle>
          <CardDescription className="text-gray-400 dark:text-gray-600">
            Manage your gym staff and their roles.
          </CardDescription>
          <div className="relative flex mt-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search staff by name, role, or email..."
              className="pl-8 bg-zinc-900 border-zinc-800 dark:bg-white dark:border-zinc-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 dark:border-zinc-200">
                <TableHead className="text-white dark:text-zinc-900">Name</TableHead>
                <TableHead className="text-white dark:text-zinc-900">Role</TableHead>
                <TableHead className="hidden md:table-cell text-white dark:text-zinc-900">Email</TableHead>
                <TableHead className="hidden md:table-cell text-white dark:text-zinc-900">Phone</TableHead>
                <TableHead className="text-white dark:text-zinc-900">Status</TableHead>
                <TableHead className="text-right text-white dark:text-zinc-900">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStaff.length > 0 ? (
                filteredStaff.map((staffMember) => (
                  <TableRow key={staffMember.id} className="border-zinc-800 dark:border-zinc-200">
                    <TableCell className="font-medium text-white dark:text-zinc-900">{staffMember.name}</TableCell>
                    <TableCell className="text-white dark:text-zinc-900">{staffMember.role?.name || "—"}</TableCell>
                    <TableCell className="hidden md:table-cell text-white dark:text-zinc-900">
                      {staffMember.email}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-white dark:text-zinc-900">
                      {staffMember.phone || "—"}
                    </TableCell>
                    <TableCell>{getStatusBadge(staffMember.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="bg-zinc-900 border-zinc-800 text-white dark:bg-white dark:border-zinc-200 dark:text-zinc-900"
                        >
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator className="bg-zinc-800 dark:bg-zinc-200" />
                          <DropdownMenuItem
                            className="flex items-center cursor-pointer"
                            onClick={() => handleEditClick(staffMember)}
                          >
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="flex items-center cursor-pointer text-red-500 focus:text-red-500"
                            onClick={() => handleDeleteClick(staffMember)}
                          >
                            <Trash className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="flex items-center cursor-pointer"
                            onClick={() => handleQRCodeClick(staffMember)}
                          >
                            <QrCode className="mr-2 h-4 w-4" /> QR Code
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-zinc-800 dark:bg-zinc-200" />
                          <DropdownMenuItem
                            className="flex items-center cursor-pointer"
                            onClick={() => handleEmailClick(staffMember.email)}
                          >
                            <Mail className="mr-2 h-4 w-4" /> Email
                          </DropdownMenuItem>
                          {staffMember.phone && (
                            <DropdownMenuItem
                              className="flex items-center cursor-pointer"
                              onClick={() => handlePhoneClick(staffMember.phone!)}
                            >
                              <Phone className="mr-2 h-4 w-4" /> Call
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-white dark:text-zinc-900">
                    {searchTerm ? "No staff members found matching your search." : "No staff members found."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Staff Dialog */}
      {editingStaff && (
        <EditStaffDialog
          staff={editingStaff}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onStaffUpdated={onStaffUpdated}
        />
      )}

      {/* Delete Staff Dialog */}
      {staffToDelete && (
        <DeleteStaffDialog
          staff={staffToDelete}
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onStaffDeleted={onStaffDeleted}
        />
      )}

      {/* QR Code Dialog */}
      {staffForQRCode && (
        <StaffQRCodeDialog staff={staffForQRCode} open={isQRCodeDialogOpen} onOpenChange={setIsQRCodeDialogOpen} />
      )}
    </>
  )
}
