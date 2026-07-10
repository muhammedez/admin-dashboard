"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { useTheme } from "@/lib/theme"

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#3b82f6", "#a855f7"]

export function CategoryChart({ data }: { data: { category: string; revenue: number; count: number }[] }) {
  const { dark } = useTheme()

  if (!data.length) return null

  return (
    <div className="bg-white p-6 dark:bg-gray-900">
      <h3 className="mb-1 text-lg font-semibold dark:text-gray-100">Revenue by Category</h3>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">Breakdown across product categories</p>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="revenue"
              nameKey="category"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={3}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: dark ? "1px solid #374151" : "1px solid #e2e8f0",
                backgroundColor: dark ? "#1f2937" : "#fff",
                color: dark ? "#f1f5f9" : "#0f172a",
              }}
              formatter={(value: any) => [`$${Number(value).toLocaleString()}`, "Revenue"]}
            />
            <Legend
              wrapperStyle={{ color: dark ? "#9ca3af" : "#6b7280", fontSize: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
