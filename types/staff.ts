export interface StaffRole {
    id: number
    name: string
    description?: string
  }
  
  export interface Staff {
    id: string
    name: string
    email: string
    phone?: string
    role_id: number
    role?: StaffRole
    status: "Active" | "On Leave" | "Terminated"
    hire_date: string
    profile_image_url?: string
    emergency_contact?: string
    emergency_phone?: string
    notes?: string
    created_at?: string
    updated_at?: string
  }
  
  export interface StaffAttendance {
    id: string
    staff_id: string
    date: string
    check_in_time: string | null
    check_out_time: string | null
    total_hours: number | null
    status: "present" | "absent" | "late" | "leave"
    notes?: string
    staff?: Staff
  }
  
  export interface StaffWithAttendance extends Staff {
    attendance?: StaffAttendance[]
  }
  