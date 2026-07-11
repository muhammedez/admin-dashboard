"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth"
import { TransactionList } from "@/components/dashboard/TransactionList"

export default function ClientTransactions() {
  const { token } = useAuth()
  const [customerName, setCustomerName] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    fetch("/api/client/stats", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => setCustomerName(data.customerName || null))
      .catch(() => {})
  }, [token])

  if (!customerName) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">My Transactions</h1>
        <p className="text-sm text-gray-500">Your transaction history with live updates</p>
      </div>
      <TransactionList customerName={customerName} />
    </div>
  )
}
