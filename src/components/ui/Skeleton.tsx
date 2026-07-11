export function TableSkeleton({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="animate-pulse">
      <div className="h-10 border-b border-gray-200 dark:border-gray-700" />
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 border-b border-gray-100 px-6 py-3 dark:border-gray-800">
          {Array.from({ length: cols }).map((_, c) => (
            <div
              key={c}
              className="h-4 rounded bg-gray-200 dark:bg-gray-700"
              style={{ width: `${c === 0 ? 32 : c === cols - 1 ? 80 : 100 + Math.random() * 80}px` }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
