import { Users, Activity, DollarSign } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface InsightCardProps {
  title: string
  description: string
  action: string
  actionLink: string
  icon: string
  color: string
}

export function InsightCard({ title, description, action, actionLink, icon, color }: InsightCardProps) {
  const getIcon = () => {
    switch (icon) {
      case "users":
        return <Users className={`h-5 w-5 ${getColorClass(color)}`} />
      case "activity":
        return <Activity className={`h-5 w-5 ${getColorClass(color)}`} />
      case "dollar":
        return <DollarSign className={`h-5 w-5 ${getColorClass(color)}`} />
      default:
        return <Users className={`h-5 w-5 ${getColorClass(color)}`} />
    }
  }

  const getColorClass = (color: string) => {
    switch (color) {
      case "yellow":
        return "text-yellow-500"
      case "blue":
        return "text-blue-500"
      case "green":
        return "text-green-500"
      default:
        return "text-gray-500"
    }
  }

  const getBackgroundColorClass = (color: string) => {
    switch (color) {
      case "yellow":
        return "bg-yellow-500/10"
      case "blue":
        return "bg-blue-500/10"
      case "green":
        return "bg-green-500/10"
      default:
        return "bg-gray-500/10"
    }
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-full ${getBackgroundColorClass(color)}`}>{getIcon()}</div>
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-400 mb-4">{description}</p>
        <Link href={actionLink}>
          <Button variant="outline" className="w-full border-zinc-700 hover:bg-zinc-800">
            {action}
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}

