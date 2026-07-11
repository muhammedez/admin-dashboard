import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface PaginationProps {
  page: number
  totalPages: number
  total: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, totalPages, total, onPageChange }: PaginationProps) {
  const [jump, setJump] = useState("")
  if (totalPages <= 1) return null

  const handleJump = (e: React.FormEvent) => {
    e.preventDefault()
    const p = parseInt(jump, 10)
    if (p >= 1 && p <= totalPages) {
      onPageChange(p)
      setJump("")
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-700">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {total} total result{total !== 1 ? "s" : ""}
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-gray-800 dark:hover:text-gray-200"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-gray-800 dark:hover:text-gray-200"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
        <form onSubmit={handleJump} className="flex items-center gap-1">
          <span className="text-xs text-gray-400 dark:text-gray-500">Go to</span>
          <input
            type="number"
            min={1}
            max={totalPages}
            value={jump}
            onChange={(e) => setJump(e.target.value)}
            placeholder="#"
            className="w-12 rounded border border-gray-200 bg-gray-50 px-1.5 py-1 text-xs outline-none focus:border-gray-900 dark:border-gray-800 dark:bg-gray-700 dark:text-gray-200 dark:focus:border-gray-400"
          />
        </form>
      </div>
    </div>
  )
}
