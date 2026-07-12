"use client"

import { TransactionList } from "@/components/dashboard/TransactionList"
import { Download } from "lucide-react"
import { useExportCSV } from "@/hooks/useExportCSV"

export default function ClientTransactions() {
  const { exporting, handleExport } = useExportCSV("/api/client/export/transactions", "my-transactions")

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">My Transactions</h1>
          <p className="text-sm text-gray-500">Your transaction history with live updates</p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-1.5 border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-medium hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
        >
          <Download className="h-4 w-4" /> {exporting ? "Exporting..." : "Export CSV"}
        </button>
      </div>
      <TransactionList />
    </div>
  )
}
