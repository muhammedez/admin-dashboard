"use client"

import { useState, useCallback } from "react"

export function useExportCSV(url: string, filename: string) {
  const [exporting, setExporting] = useState(false)

  const handleExport = useCallback(async () => {
    setExporting(true)
    try {
      const res = await fetch(url)
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Export failed" }))
        throw new Error(err.error)
      }
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = blobUrl
      a.download = `${filename}.csv`
      a.click()
      URL.revokeObjectURL(blobUrl)
    } catch (e: any) {
      alert(e.message || "Export failed")
    }
    setExporting(false)
  }, [url, filename])

  return { exporting, handleExport }
}
