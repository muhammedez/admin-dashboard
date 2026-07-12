"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowLeftRight, Mail, CheckCircle, Clock, XCircle } from "lucide-react"

const statusIcons: Record<string, typeof CheckCircle> = {
  completed: CheckCircle,
  pending: Clock,
  failed: XCircle,
}

const statusColors: Record<string, string> = {
  completed: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  pending: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  failed: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
}

export default function CustomerDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/customers/${id}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900 dark:border-gray-700 dark:border-t-gray-300" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-300">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <p className="py-12 text-center text-gray-400">Customer not found</p>
      </div>
    )
  }

  const { customer, transactions } = data

  return (
    <div className="space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-300">
        <ArrowLeft className="h-4 w-4" /> Back to Customers
      </button>

      <div className="border border-gray-200 bg-white p-8 dark:border-0 dark:bg-gray-900">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
            <Mail className="h-7 w-7 text-gray-500 dark:text-gray-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold dark:text-gray-100">{customer.name}</h1>
                <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{customer.email}</p>
              </div>
              <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                customer.status === "active"
                  ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${customer.status === "active" ? "bg-green-500" : "bg-gray-400"}`} />
                {customer.status}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-8 sm:grid-cols-3">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">Total Orders</p>
            <p className="text-3xl font-semibold dark:text-gray-100">{customer.totalOrders}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">Total Spent</p>
            <p className="text-3xl font-semibold dark:text-gray-100">${Number(customer.totalSpent).toFixed(2)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">Joined</p>
            <p className="text-lg font-medium dark:text-gray-100">{customer.joinedAt}</p>
          </div>
        </div>
      </div>

      <div className="border border-gray-200 bg-white dark:border-0 dark:bg-gray-900">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <h3 className="text-lg font-semibold dark:text-gray-100">Recent Transactions</h3>
        </div>
        {transactions?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="h-10 border-b border-gray-200 text-left text-xs font-medium text-gray-400 dark:border-gray-700 dark:text-gray-500">
                  <th className="px-6 py-3">Transaction</th>
                  <th className="px-6 py-3">Product</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Payment</th>
                  <th className="px-6 py-3">Time</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx: any) => {
                  const StatusIcon = statusIcons[tx.status] || Clock
                  return (
                    <tr key={tx.id} className="h-10 border-b border-gray-200 dark:border-gray-700">
                      <td className="px-6 py-2.5 font-medium dark:text-gray-200">{tx.id}</td>
                      <td className="px-6 py-2.5 text-gray-600 dark:text-gray-400">{tx.productName}</td>
                      <td className="px-6 py-2.5 font-medium dark:text-gray-200">${Number(tx.amount).toFixed(2)}</td>
                      <td className="px-6 py-2.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium ${statusColors[tx.status]}`}>
                          <StatusIcon className="h-3.5 w-3.5" />
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-6 py-2.5 text-gray-500 dark:text-gray-400">{tx.paymentMethod}</td>
                      <td className="px-6 py-2.5 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {new Date(tx.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-6 py-8 text-center text-sm text-gray-400">No transactions found</p>
        )}
      </div>
    </div>
  )
}
