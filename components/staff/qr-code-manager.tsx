"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { QrCode, Download, RefreshCw, Eye } from "lucide-react"
import { format } from "date-fns"
import { StaffQrCodeDialog } from "./staff-qr-code-dialog"

interface QrCodeManagerProps {
  staff: any[]
  qrCodes: any[]
  isLoading: boolean
  onGenerateQRCodes: () => Promise<void>
}

export function QrCodeManager({ staff, qrCodes, isLoading, onGenerateQRCodes }: QrCodeManagerProps) {
  const [selectedStaff, setSelectedStaff] = useState<any | null>(null)
  const [isQrCodeDialogOpen, setIsQrCodeDialogOpen] = useState(false)

  const getStaffName = (staffId: string) => {
    const staffMember = staff.find((s) => s.id === staffId)
    return staffMember ? staffMember.name : "Unknown"
  }

  const getStaffRole = (staffId: string) => {
    const staffMember = staff.find((s) => s.id === staffId)
    return staffMember ? staffMember.role : "Unknown"
  }

  const handleViewQrCode = (staffId: string) => {
    const staffMember = staff.find((s) => s.id === staffId)
    if (staffMember) {
      setSelectedStaff(staffMember)
      setIsQrCodeDialogOpen(true)
    }
  }

  const downloadAllQrCodes = () => {
    // In a real implementation, this would generate a ZIP file with all QR codes
    // For now, we'll just show a toast message
    alert("This would download a ZIP file containing all QR codes for today.")
  }

  if (isLoading) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Daily QR Codes</CardTitle>
              <CardDescription>QR codes for {format(new Date(), "MMMM d, yyyy")}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="border-zinc-700"
                onClick={downloadAllQrCodes}
                disabled={qrCodes.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Download All
              </Button>
              <Button className="bg-red-600 hover:bg-red-700" onClick={onGenerateQRCodes}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Generate QR Codes
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {qrCodes.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No QR codes have been generated for today. Click the "Generate QR Codes" button to create them.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-800">
                      <TableHead>Staff</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Generated At</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {qrCodes.map((qrCode) => (
                      <TableRow key={qrCode.id} className="border-zinc-800">
                        <TableCell className="font-medium">{getStaffName(qrCode.staff_id)}</TableCell>
                        <TableCell>{getStaffRole(qrCode.staff_id)}</TableCell>
                        <TableCell>{format(new Date(qrCode.created_at), "h:mm a")}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              qrCode.is_used
                                ? "bg-green-500/10 text-green-500 border-green-500"
                                : "bg-blue-500/10 text-blue-500 border-blue-500"
                            }
                          >
                            {qrCode.is_used ? "Used" : "Active"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => handleViewQrCode(qrCode.staff_id)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle>QR Code System Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-zinc-800 p-4 rounded-lg">
                <h3 className="font-medium mb-2 flex items-center">
                  <QrCode className="h-5 w-5 mr-2 text-red-600" />
                  Daily QR Code System
                </h3>
                <p className="text-gray-400 text-sm">
                  QR codes are automatically generated each day for all active staff members. These codes expire at
                  midnight and new ones are generated for the next day.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-zinc-800 p-4 rounded-lg">
                  <h3 className="font-medium mb-2">Staff Check-in Process</h3>
                  <ol className="text-gray-400 text-sm space-y-2 list-decimal list-inside">
                    <li>Staff member receives their daily QR code</li>
                    <li>They scan the QR code at the check-in terminal when arriving</li>
                    <li>The system records their attendance as "present" or "late"</li>
                    <li>They scan again when leaving to check out</li>
                  </ol>
                </div>

                <div className="bg-zinc-800 p-4 rounded-lg">
                  <h3 className="font-medium mb-2">Automatic Attendance Rules</h3>
                  <ul className="text-gray-400 text-sm space-y-2 list-disc list-inside">
                    <li>Staff arriving more than 15 minutes late are marked as "late"</li>
                    <li>
                      Staff who don't check in within 30 minutes of their shift are automatically marked as "absent"
                    </li>
                    <li>Admins can manually override attendance status if needed</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* QR Code Dialog */}
      {selectedStaff && (
        <StaffQrCodeDialog open={isQrCodeDialogOpen} onOpenChange={setIsQrCodeDialogOpen} staff={selectedStaff} />
      )}
    </>
  )
}

