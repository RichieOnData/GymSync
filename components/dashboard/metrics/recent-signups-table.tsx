import { format } from "date-fns"
import type { Member } from "@/types/member"
import { MembershipBadge } from "@/components/members/membership-badge"

interface RecentSignupsTableProps {
  members: Member[]
}

export function RecentSignupsTable({ members }: RecentSignupsTableProps) {
  // Sort members by join date (newest first)
  const sortedMembers = [...members].sort((a, b) => {
    return new Date(b.join_date).getTime() - new Date(a.join_date).getTime()
  })

  if (sortedMembers.length === 0) {
    return <div className="text-center py-8 text-gray-400">No new sign-ups this month.</div>
  }

  return (
    <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2">
      {sortedMembers.map((member) => (
        <div key={member.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-zinc-800">
          <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white font-medium">
            {member.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="font-medium truncate">{member.name}</p>
              <MembershipBadge plan={member.membership_plan} />
            </div>
            <p className="text-sm text-gray-400">Joined {format(new Date(member.join_date), "MMM d, yyyy")}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

