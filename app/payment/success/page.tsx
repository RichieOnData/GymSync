import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"

export default function PaymentSuccess() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="w-full max-w-md p-8 rounded-lg bg-zinc-900 border border-zinc-800 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
        <h1 className="text-2xl font-bold mb-4">Payment Successful!</h1>
        <p className="text-gray-400 mb-8">
          Thank you for subscribing to GymSync. Your account has been upgraded and you now have access to all the
          features of your chosen plan.
        </p>
        <Link href="/dashboard">
          <Button className="bg-red-600 hover:bg-red-700">Go to Dashboard</Button>
        </Link>
      </div>
    </div>
  )
}

