export interface SuggestionEntry {
  id: string
  member_id: string
  member_name: string
  suggestion: string
  date: string
  status: "new" | "reviewed" | "actioned"
  category: string
  priority: "low" | "medium" | "high"
  notes?: string
}

export interface SuggestionInsight {
  id: string
  title: string
  description: string
  category: string
  priority: "low" | "medium" | "high"
  count: number
  trend: "increasing" | "decreasing" | "stable"
  action_items?: string[]
}

export interface DraftOffer {
  id: string
  member_id: string
  member_name: string
  offer_type: string
  description: string
  discount_amount?: number
  valid_until?: string
  status: "draft" | "sent" | "accepted" | "declined"
  created_at: string
}

