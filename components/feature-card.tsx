import { BarChart3, Users, TrendingUp, Zap, Shield, Settings } from "lucide-react"

const icons = {
  analytics: BarChart3,
  retention: Users,
  equipment: TrendingUp,
  staffing: Zap,
  fraud: Shield,
  rules: Settings,
}

interface FeatureCardProps {
  title: string
  description: string
  icon: keyof typeof icons
}

export function FeatureCard({ title, description, icon }: FeatureCardProps) {
  const Icon = icons[icon]

  return (
    <div className="relative overflow-hidden rounded-2xl bg-black p-6 shadow-lg transition-all hover:scale-[1.02] border border-zinc-900">
      <div className="mb-4">
        <Icon className="h-8 w-8 text-red-600" />
      </div>
      <h3 className="mb-2 text-xl font-semibold text-red-600">{title}</h3>
      <p className="text-gray-300">{description}</p>
    </div>
  )
}

