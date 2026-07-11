"use client"

import { useDashboard } from "@/lib/store"
import { TransactionList } from "@/components/dashboard/TransactionList"

export default function ClientTransactions() {
  const { clientName } = useDashboard()

  if (!clientName) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">My Transactions</h1>
        <p className="text-sm text-gray-500">Your transaction history with live updates</p>
      </div>
      <TransactionList customerName={clientName} />
    </div>
  )
}
