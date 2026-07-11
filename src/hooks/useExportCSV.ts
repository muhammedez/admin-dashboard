"use client"

import { useState, useCallback } from "react"
import { downloadCSV } from "@/lib/csv"

export function useExportCSV<T extends Record<string, any>>(fetcher: () => Promise<{ data: T[] }>, filename: string) {
  const [exporting, setExporting] = useState(false)

  const handleExport = useCallback(async () => {
    setExporting(true)
    try {
      const result = await fetcher()
      downloadCSV(result.data, filename)
    } catch (e: any) {
      alert(e.message || "Export failed")
    }
    setExporting(false)
  }, [fetcher, filename])

  return { exporting, handleExport }
}
