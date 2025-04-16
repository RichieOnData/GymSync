import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { differenceInDays } from "date-fns"

interface SubscriptionAlertProps {
  renewalDate: string
  amount: number
}

export function SubscriptionAlert({ renewalDate, amount }: SubscriptionAlertProps) {
  const daysUntilRenewal = differenceInDays(new Date(renewalDate), new Date())

  return (
    <Alert className="bg-red-600/10 border-red-600 text-white">
      <AlertCircle className="h-4 w-4 text-red-600" />
      <AlertTitle className="text-red-600">Attention Required</AlertTitle>
      <AlertDescription>
        Your subscription will renew in {daysUntilRenewal} days. Please ensure your payment method is up to date. The
        renewal amount is ₹{amount.toLocaleString()}.
      </AlertDescription>
    </Alert>
  )
}

