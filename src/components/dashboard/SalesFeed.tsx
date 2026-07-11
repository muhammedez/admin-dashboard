"use client"

import { useDashboard } from "@/lib/store"
import { ArrowUpRight, Clock, CheckCircle, XCircle } from "lucide-react"

const statusIcon = {
  completed: CheckCircle,
  pending: Clock,
  failed: XCircle,
}

export function SalesFeed() {
  const { recentTransactions: transactions } = useDashboard()

  return (
    <div className="border border-gray-200 bg-white dark:border-0 dark:bg-gray-900">
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
        <div>
          <h3 className="text-lg font-semibold dark:text-gray-100">Live Sales Feed</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Real-time transaction activity</p>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
          <span className="h-2 w-2 bg-green-500 animate-pulse" />
          Live
        </span>
      </div>
      <div className="h-80 overflow-y-auto p-4 space-y-2">
        {transactions.slice(0, 15).map((tx: any) => {
          const StatusIcon = statusIcon[tx.status as keyof typeof statusIcon]
          return (
            <div key={tx.id} className="flex items-center gap-4 border-b border-gray-50 p-3 text-sm dark:border-gray-800">
              <div>
                <StatusIcon className={`h-5 w-5 ${tx.status === "completed" ? "text-green-500" : tx.status === "pending" ? "text-amber-500" : "text-red-500"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate dark:text-gray-200">{tx.customerName}</p>
                <p className="text-gray-500 truncate dark:text-gray-400">{tx.productName}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold dark:text-gray-100">${tx.amount.toFixed(2)}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {new Date(tx.timestamp).toLocaleTimeString()}
                </p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-gray-300 dark:text-gray-600" />
            </div>
          )
        })}
      </div>
    </div>
  )
}
