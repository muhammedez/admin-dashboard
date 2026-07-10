"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import type { RevenueEntry } from "@/lib/types"
import { useTheme } from "@/lib/theme"

export function RevenueChart({ data }: { data: RevenueEntry[] }) {
  const { dark } = useTheme()

  return (
    <div className="border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
      <h3 className="mb-1 text-lg font-semibold dark:text-gray-100">Revenue Overview</h3>
      <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">Weekly revenue and transaction trends</p>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#374151" : "#f1f5f9"} />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: dark ? "#9ca3af" : "#6b7280" }} tickLine={false} axisLine={false} />
            <YAxis yAxisId="left" tick={{ fontSize: 12, fill: dark ? "#9ca3af" : "#6b7280" }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: dark ? "#9ca3af" : "#6b7280" }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: dark ? "1px solid #374151" : "1px solid #e2e8f0",
                backgroundColor: dark ? "#1f2937" : "#fff",
                color: dark ? "#f1f5f9" : "#0f172a",
              }}
              formatter={(value, name) => [
                name === "revenue" ? `$${Number(value).toLocaleString()}` : value,
                name === "revenue" ? "Revenue" : "Transactions",
              ]}
            />
            <Legend wrapperStyle={{ color: dark ? "#9ca3af" : "#6b7280" }} />
            <Bar yAxisId="left" dataKey="revenue" fill="#6366f1" name="Revenue" />
            <Bar yAxisId="right" dataKey="transactions" fill="#22c55e" name="Transactions" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
