"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Send, Calendar, Edit } from "lucide-react"
import { MessageComposer } from "../message/message-composer"
import type { DraftOffer } from "@/types/suggestion"

interface DraftOffersListProps {
  offers: DraftOffer[]
  onUpdateOffer: (id: string, updates: Partial<DraftOffer>) => Promise<boolean>
}

export function DraftOffersList({ offers, onUpdateOffer }: DraftOffersListProps) {
  const [selectedOffer, setSelectedOffer] = useState<DraftOffer | null>(null)
  const [composerOpen, setComposerOpen] = useState(false)

  if (offers.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <Calendar className="mx-auto h-12 w-12 opacity-20 mb-2" />
        <p>No draft offers available.</p>
        <p className="text-sm">Offers will appear here when members are due for renewal.</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {offers.map((offer) => (
          <Card key={offer.id} className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{offer.member_name}</CardTitle>
                <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500">
                  {offer.current_plan}
                </Badge>
              </div>
              <p className="text-sm text-gray-400">Renewal: {format(new Date(offer.renewal_date), "MMM d, yyyy")}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium">{offer.offer_type}</p>
                  <p className="text-sm text-gray-400 mt-1">{offer.offer_description}</p>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-zinc-700 text-xs gap-1"
                    onClick={() => {
                      setSelectedOffer(offer)
                      setComposerOpen(true)
                    }}
                  >
                    <Edit className="h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-xs gap-1"
                    onClick={() => {
                      setSelectedOffer(offer)
                      setComposerOpen(true)
                    }}
                  >
                    <Send className="h-3 w-3" />
                    Send Offer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedOffer && (
        <MessageComposer
          open={composerOpen}
          onOpenChange={setComposerOpen}
          recipient={selectedOffer.member_name}
          recipientId={selectedOffer.member_id}
          subject={`Special Offer: ${selectedOffer.offer_type}`}
          initialContent={`Dear ${selectedOffer.member_name},\n\nWe're pleased to offer you: ${selectedOffer.offer_description}\n\nThis offer is available because your ${selectedOffer.current_plan} membership is coming up for renewal on ${format(new Date(selectedOffer.renewal_date), "MMMM d, yyyy")}.\n\nPlease let us know if you'd like to take advantage of this special offer.\n\nBest regards,\nGymSync Team`}
          onClose={() => {
            setComposerOpen(false)
            setSelectedOffer(null)
          }}
          onSend={async () => {
            await onUpdateOffer(selectedOffer.id, { status: "sent" })
          }}
        />
      )}
    </>
  )
}

