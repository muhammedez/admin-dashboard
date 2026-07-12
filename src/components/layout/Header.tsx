"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Bell, Moon, Sun, LogOut, Menu, ArrowLeftRight } from "lucide-react"
import { useTheme } from "@/lib/theme"
import { useAuth } from "@/lib/auth"
import { useSidebar } from "@/lib/sidebar"
import { useDashboard } from "@/lib/store"

export function Header() {
  const { dark, toggle } = useTheme()
  const { user, logout } = useAuth()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const { toggle: toggleSidebar } = useSidebar()
  const { recentTransactions } = useDashboard()

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const handleLogout = async () => {
    setLoggingOut(true)
    await logout()
    router.push("/login")
  }

  const notifications = recentTransactions.slice(0, 10)

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white px-6 dark:border-gray-800 dark:bg-gray-900">
      <button onClick={toggleSidebar} className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800 lg:hidden" title="Toggle sidebar">
        <Menu className="h-5 w-5 text-gray-600 dark:text-gray-400" />
      </button>

      <div className="ml-auto" />

      <button
        onClick={toggle}
        className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800"
        title={dark ? "Light mode" : "Dark mode"}
      >
        {dark ? <Sun className="h-5 w-5 text-gray-400" /> : <Moon className="h-5 w-5 text-gray-600" />}
      </button>

      <div className="relative" ref={notifRef}>
        <button onClick={() => setNotifOpen(!notifOpen)} className="relative p-2 hover:bg-gray-50 dark:hover:bg-gray-800">
          <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          {notifications.length > 0 && (
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
          )}
        </button>
        {notifOpen && (
          <div className="absolute right-0 top-full mt-2 w-80 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
            <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
              <p className="text-sm font-semibold dark:text-gray-100">Recent Activity</p>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-gray-400">No recent activity</p>
              ) : (
                notifications.map((tx: any) => (
                  <button
                    key={tx.id}
                    onClick={() => {
                      setNotifOpen(false)
                      router.push(`/client/transactions/${tx.id}`)
                    }}
                    className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                      <ArrowLeftRight className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium dark:text-gray-200">{tx.productName}</p>
                      <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                        {tx.customerName} &middot; ${Number(tx.amount).toFixed(2)}
                      </p>
                    </div>
                    <span className={`shrink-0 self-center rounded px-2 py-0.5 text-xs font-medium ${
                      tx.status === "completed" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                      tx.status === "pending" ? "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                      "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}>
                      {tx.status}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 border-l pl-4 dark:border-gray-800">
        <div className="flex h-8 w-8 items-center justify-center bg-gray-900 text-sm font-medium text-white dark:bg-gray-700 dark:text-gray-100">
          {user?.name?.charAt(0) || "U"}
        </div>
        <div className="hidden sm:block text-sm">
          <p className="font-medium dark:text-gray-200">{user?.name || "User"}</p>
          <p className="text-gray-500 capitalize dark:text-gray-400">{user?.role || "guest"}</p>
        </div>
      </div>

      <button
        onClick={handleLogout}
        disabled={loggingOut}
        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
        title="Log out"
      >
        <LogOut className="h-5 w-5" />
      </button>
    </header>
  )
}
