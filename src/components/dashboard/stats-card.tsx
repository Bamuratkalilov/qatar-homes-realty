import { cn } from "@/lib/utils"
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react"

interface StatsCardProps {
  title: string
  value: string | number
  change?: number
  icon: LucideIcon
  color?: "blue" | "green" | "amber" | "purple" | "red"
}

const colors = {
  blue: { bg: "bg-blue-50", icon: "text-blue-600", border: "border-blue-100" },
  green: { bg: "bg-green-50", icon: "text-green-600", border: "border-green-100" },
  amber: { bg: "bg-amber-50", icon: "text-amber-600", border: "border-amber-100" },
  purple: { bg: "bg-purple-50", icon: "text-purple-600", border: "border-purple-100" },
  red: { bg: "bg-red-50", icon: "text-red-600", border: "border-red-100" },
}

export function StatsCard({ title, value, change, icon: Icon, color = "blue" }: StatsCardProps) {
  const c = colors[color]
  return (
    <div className={cn("rounded-xl border p-5 bg-white", c.border)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          {change !== undefined && (
            <div className={cn("flex items-center gap-1 mt-1 text-xs font-medium", change >= 0 ? "text-green-600" : "text-red-600")}>
              {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(change)}% this month
            </div>
          )}
        </div>
        <div className={cn("p-3 rounded-xl", c.bg)}>
          <Icon className={cn("w-5 h-5", c.icon)} />
        </div>
      </div>
    </div>
  )
}
