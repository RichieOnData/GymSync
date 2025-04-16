"use client"

import * as Select from "@radix-ui/react-select"
import { ChevronDownIcon, ChevronUpIcon } from "@radix-ui/react-icons"
import { type MembershipPlan, SUBSCRIPTION_PLANS } from "@/types/member"
import { calculateExpirationDate, getPlanPrice } from "@/utils/subscription"

interface SubscriptionPlanDropdownProps {
  value: MembershipPlan
  onValueChange: (value: MembershipPlan) => void
  joinDate: string
  onExpirationDateChange: (date: string) => void
  onPriceChange?: (price: number) => void
}

export function SubscriptionPlanDropdown({
  value,
  onValueChange,
  joinDate,
  onExpirationDateChange,
  onPriceChange,
}: SubscriptionPlanDropdownProps) {
  const handleValueChange = (newValue: MembershipPlan) => {
    onValueChange(newValue)

    // Calculate and update expiration date
    if (joinDate) {
      const expirationDate = calculateExpirationDate(joinDate, newValue)
      onExpirationDateChange(expirationDate)
    }

    // Update price if callback provided
    if (onPriceChange) {
      const price = getPlanPrice(newValue)
      onPriceChange(price)
    }
  }

  return (
    <Select.Root value={value} onValueChange={handleValueChange as any}>
      <Select.Trigger
        className="inline-flex items-center justify-between rounded-md px-4 py-2 text-sm bg-black border border-zinc-800 w-full"
        aria-label="Membership Plan"
      >
        <Select.Value />
        <Select.Icon>
          <ChevronDownIcon />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          className="overflow-hidden rounded-md bg-zinc-900 border border-zinc-800 text-white"
          position="popper"
        >
          <Select.ScrollUpButton className="flex items-center justify-center h-6 bg-zinc-900 text-white cursor-default">
            <ChevronUpIcon />
          </Select.ScrollUpButton>
          <Select.Viewport className="p-1">
            {SUBSCRIPTION_PLANS.map((plan) => (
              <Select.Item
                key={plan.name}
                value={plan.name}
                className="relative flex items-center px-8 py-2 rounded-sm text-sm data-[highlighted]:bg-zinc-800 data-[highlighted]:text-white outline-none select-none"
              >
                <Select.ItemText>
                  {plan.name} - ₹{plan.price}
                </Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
          <Select.ScrollDownButton className="flex items-center justify-center h-6 bg-zinc-900 text-white cursor-default">
            <ChevronDownIcon />
          </Select.ScrollDownButton>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  )
}

