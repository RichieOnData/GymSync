"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Search, Plus, MoreVertical, Edit, Trash, Mail, Phone } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { StaffAttendance } from "@/components/staff/staff-attendance"

interface StaffMember {
  id: number
  name: string
  role: string
  email: string
  phone: string
  status: string
  hireDate?: string
}

export default function StaffManagement() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [newStaff, setNewStaff] = useState<Omit<StaffMember, "id">>({
    name: "",
    role: "",
    email: "",
    phone: "",
    status: "Active",
    hireDate: new Date().toISOString().split("T")[0],
  })
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [staffToDelete, setStaffToDelete] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        setLoading(true)
        const res = await fetch("/api/staff")
        const data = await res.json()
        setStaff(Array.isArray(data) ? data : [])
        setLoading(false)
      } catch (err) {
        console.error("Error fetching staff:", err)
        setError("Failed to load staff data. Please try again later.")
        setLoading(false)
      }
    }

    fetchStaff()
  }, [])

  // Fixed the filtering function to ensure staff is an array
  const filteredStaff = Array.isArray(staff)
    ? staff.filter(
        (s) =>
          s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.email.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : []

  const handleAddStaff = async () => {
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newStaff),
      })

      const data = await res.json()
      setStaff([...staff, data])
      setNewStaff({
        name: "",
        role: "",
        email: "",
        phone: "",
        status: "Active",
        hireDate: new Date().toISOString().split("T")[0],
      })
      setIsAddDialogOpen(false)
      toast({
        title: "Staff Added",
        description: `${data.name} has been added to the staff list.`,
      })
    } catch (err) {
      console.error("Error adding staff:", err)
      toast({
        title: "Error",
        description: "Failed to add staff member. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleEditStaff = async () => {
    if (!editingStaff) return

    try {
      const res = await fetch(`/api/staff/${editingStaff.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editingStaff),
      })

      const data = await res.json()
      setStaff(staff.map((s) => (s.id === editingStaff.id ? editingStaff : s)))
      setIsEditDialogOpen(false)
      toast({
        title: "Staff Updated",
        description: `${editingStaff.name}'s information has been updated.`,
      })
    } catch (err) {
      console.error("Error updating staff:", err)
      toast({
        title: "Error",
        description: "Failed to update staff member. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteStaff = async () => {
    if (!staffToDelete) return

    try {
      const res = await fetch(`/api/staff/${staffToDelete}`, {
        method: "DELETE",
      })

      const data = await res.json()
      setStaff(staff.filter((s) => s.id !== staffToDelete))
      setIsDeleteDialogOpen(false)
      toast({
        title: "Staff Deleted",
        description: "The staff member has been removed.",
      })
    } catch (err) {
      console.error("Error deleting staff:", err)
      toast({
        title: "Error",
        description: "Failed to delete staff member. Please try again.",
        variant: "destructive",
      })
    }
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
          <p className="text-gray-400 dark:text-gray-500">{error}</p>
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
        <h1 className="text-3xl font-bold">Staff Management</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700">
              <Plus className="mr-2 h-4 w-4" /> Add Staff
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-white dark:bg-white dark:border-zinc-200 dark:text-zinc-900">
            <DialogHeader>
              <DialogTitle>Add New Staff Member</DialogTitle>
              <DialogDescription className="text-gray-400 dark:text-gray-600">
                Fill in the details to add a new staff member.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                  className="bg-black border-zinc-800 dark:bg-white dark:border-zinc-300"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Input
                  id="role"
                  value={newStaff.role}
                  onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                  className="bg-black border-zinc-800 dark:bg-white dark:border-zinc-300"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                  className="bg-black border-zinc-800 dark:bg-white dark:border-zinc-300"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={newStaff.phone}
                  onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                  className="bg-black border-zinc-800 dark:bg-white dark:border-zinc-300"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={newStaff.status}
                  onChange={(e) => setNewStaff({ ...newStaff, status: e.target.value })}
                  className="bg-black border border-zinc-800 rounded-md p-2 text-white dark:bg-white dark:border-zinc-300 dark:text-zinc-900"
                >
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button className="bg-red-600 hover:bg-red-700" onClick={handleAddStaff}>
                Add Staff
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search staff by name, role, or email..."
            className="pl-8 bg-zinc-900 border-zinc-800 dark:bg-white dark:border-zinc-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Staff Table */}
      <Card className="bg-zinc-900 border-zinc-800 dark:bg-white dark:border-zinc-200">
        <CardHeader>
          <CardTitle className="text-white dark:text-zinc-900">Staff Members</CardTitle>
          <CardDescription className="text-gray-400 dark:text-gray-600">
            Manage your gym staff and their roles.
          </CardDescription>
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
                    <TableCell className="text-white dark:text-zinc-900">{staffMember.role}</TableCell>
                    <TableCell className="hidden md:table-cell text-white dark:text-zinc-900">
                      {staffMember.email}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-white dark:text-zinc-900">
                      {staffMember.phone}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          staffMember.status === "Active"
                            ? "bg-green-500/10 text-green-500"
                            : "bg-yellow-500/10 text-yellow-500"
                        }`}
                      >
                        {staffMember.status}
                      </span>
                    </TableCell>
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
                            onClick={() => {
                              setEditingStaff(staffMember)
                              setIsEditDialogOpen(true)
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="flex items-center cursor-pointer text-red-500 focus:text-red-500"
                            onClick={() => {
                              setStaffToDelete(staffMember.id)
                              setIsDeleteDialogOpen(true)
                            }}
                          >
                            <Trash className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-zinc-800 dark:bg-zinc-200" />
                          <DropdownMenuItem className="flex items-center cursor-pointer">
                            <Mail className="mr-2 h-4 w-4" /> Email
                          </DropdownMenuItem>
                          <DropdownMenuItem className="flex items-center cursor-pointer">
                            <Phone className="mr-2 h-4 w-4" /> Call
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-white dark:text-zinc-900">
                    No staff members found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add the Staff Attendance component */}
      <StaffAttendance />

      {/* Edit Staff Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white dark:bg-white dark:border-zinc-200 dark:text-zinc-900">
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
            <DialogDescription className="text-gray-400 dark:text-gray-600">
              Update the details of the staff member.
            </DialogDescription>
          </DialogHeader>
          {editingStaff && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Full Name</Label>
                <Input
                  id="edit-name"
                  value={editingStaff.name}
                  onChange={(e) => setEditingStaff({ ...editingStaff, name: e.target.value })}
                  className="bg-black border-zinc-800 dark:bg-white dark:border-zinc-300"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-role">Role</Label>
                <Input
                  id="edit-role"
                  value={editingStaff.role}
                  onChange={(e) => setEditingStaff({ ...editingStaff, role: e.target.value })}
                  className="bg-black border-zinc-800 dark:bg-white dark:border-zinc-300"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingStaff.email}
                  onChange={(e) => setEditingStaff({ ...editingStaff, email: e.target.value })}
                  className="bg-black border-zinc-800 dark:bg-white dark:border-zinc-300"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={editingStaff.phone}
                  onChange={(e) => setEditingStaff({ ...editingStaff, phone: e.target.value })}
                  className="bg-black border-zinc-800 dark:bg-white dark:border-zinc-300"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-status">Status</Label>
                <select
                  id="edit-status"
                  value={editingStaff.status}
                  onChange={(e) => setEditingStaff({ ...editingStaff, status: e.target.value })}
                  className="bg-black border border-zinc-800 rounded-md p-2 text-white dark:bg-white dark:border-zinc-300 dark:text-zinc-900"
                >
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                </select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-red-600 hover:bg-red-700" onClick={handleEditStaff}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white dark:bg-white dark:border-zinc-200 dark:text-zinc-900">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription className="text-gray-400 dark:text-gray-600">
              Are you sure you want to delete this staff member? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteStaff}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

