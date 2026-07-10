"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { useTheme } from "@/lib/theme"

const COLORS = ["#22c55e", "#6366f1", "#f59e0b"]

export function PaymentChart({ data }: { data: { paymentMethod: string; count: number; revenue: number }[] }) {
  const { dark } = useTheme()

  if (!data.length) return null

  return (
    <div className="rounded-md border bg-white p-6 dark:border-gray-700 dark:bg-gray-800/90">
      <h3 className="mb-1 text-lg font-semibold dark:text-gray-100">Payment Methods</h3>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">Distribution by transaction count</p>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="paymentMethod"
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
              formatter={(value: any) => [value, "Transactions"]}
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
