"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowLeftRight, CheckCircle, Clock, XCircle } from "lucide-react"

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

export default function TransactionDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [tx, setTx] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/client/transactions/${id}`)
      .then((r) => r.json())
      .then((data) => { setTx(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900 dark:border-gray-700 dark:border-t-gray-300" />
      </div>
    )
  }

  if (!tx) {
    return (
      <div className="space-y-6">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-300">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <p className="py-12 text-center text-gray-400">Transaction not found</p>
      </div>
    )
  }

  const StatusIcon = statusIcons[tx.status] || Clock

  return (
    <div className="space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-300">
        <ArrowLeft className="h-4 w-4" /> Back to Transactions
      </button>

      <div className="border border-gray-200 bg-white p-8 dark:border-0 dark:bg-gray-900">
        <div className="flex items-start gap-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
            <ArrowLeftRight className="h-7 w-7 text-gray-500 dark:text-gray-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold dark:text-gray-100">Transaction {tx.id}</h1>
                <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{tx.timestamp}</p>
              </div>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${statusColors[tx.status] || ""}`}>
                <StatusIcon className="h-3.5 w-3.5" />
                {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">Amount</p>
            <p className="text-3xl font-semibold dark:text-gray-100">${Number(tx.amount).toFixed(2)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">Product</p>
            <p className="text-lg font-medium dark:text-gray-100">{tx.productName}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">Payment Method</p>
            <span className="inline-block rounded bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              {tx.paymentMethod}
            </span>
          </div>
        </div>

        {tx.customerName && (
          <div className="mt-8 border-t border-gray-200 pt-6 dark:border-gray-800">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">Customer</p>
            <p className="mt-0.5 text-sm text-gray-700 dark:text-gray-300">{tx.customerName}</p>
          </div>
        )}
      </div>
    </div>
  )
}
