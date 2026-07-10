import type { LucideIcon } from "lucide-react"

interface StatCardProps {
  title: string
  value: string
  change: number
  icon: LucideIcon
}

export function StatCard({ title, value, change, icon: Icon }: StatCardProps) {
  const isPositive = change >= 0
  return (
    <div className="border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between">
        <div className="flex h-12 w-12 items-center justify-center bg-gray-100 dark:bg-gray-800">
          <Icon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
        </div>
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium ${
            isPositive
              ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400"
              : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400"
          }`}
        >
          {isPositive ? "+" : ""}{change}%
        </span>
      </div>
      <p className="mt-4 text-2xl font-semibold dark:text-gray-100">{value}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
    </div>
  )
}
