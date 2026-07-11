"use client"

import { useState } from "react"
import { ProductsTable } from "@/components/dashboard/ProductsTable"
import { Download } from "lucide-react"
import { api } from "@/lib/api"
import { downloadCSV } from "@/lib/csv"

export default function AdminProducts() {
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      const result = await api.products.list({ limit: 9999 })
      downloadCSV(result.data, "products")
    } catch (e: any) {
      alert(e.message || "Export failed")
    }
    setExporting(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Product Catalogue</h1>
          <p className="text-sm text-gray-500">Manage your product inventory</p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-1.5 border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-medium hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
        >
          <Download className="h-4 w-4" /> {exporting ? "Exporting..." : "Export CSV"}
        </button>
      </div>
      <ProductsTable />
    </div>
  )
}
