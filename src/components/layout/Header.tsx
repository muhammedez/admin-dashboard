"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Bell, Moon, Sun, LogOut, Menu, Info, CheckCircle, XCircle, ShoppingCart } from "lucide-react"
import { useTheme } from "@/lib/theme"
import { useAuth } from "@/lib/auth"
import { useSidebar } from "@/lib/sidebar"
import { useDashboard } from "@/lib/store"

function notifConfig(message: string) {
  if (message.startsWith("New order from")) return { icon: ShoppingCart, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" }
  if (message === "Order approved") return { icon: CheckCircle, color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" }
  if (message === "Order rejected") return { icon: XCircle, color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" }
  return { icon: Info, color: "bg-gray-100 dark:bg-gray-800" }
}

export function Header() {
  const { dark, toggle } = useTheme()
  const { user, logout } = useAuth()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const { toggle: toggleSidebar } = useSidebar()
  const { notifications, markNotificationRead } = useDashboard()

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

  const unreadCount = notifications.filter((n) => !n.read).length

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
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
        {notifOpen && (
          <div className="absolute right-0 top-full mt-2 w-96 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
            <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
              <p className="text-sm font-semibold dark:text-gray-100">Notifications</p>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-gray-400">No notifications</p>
              ) : (
                notifications.map((n) => {
                  const { icon: Icon, color: notifColor } = notifConfig(n.message)
                  return (
                    <button
                      key={n.id}
                      onClick={() => {
                        markNotificationRead(n.id)
                        setNotifOpen(false)
                        if (n.transactionId) router.push(`/${user?.role === "admin" ? "admin" : "client"}/transactions/${n.transactionId}`)
                      }}
                      className={`flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 ${!n.read ? "bg-blue-50/50 dark:bg-blue-950/20" : ""}`}
                    >
                      <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${notifColor}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium dark:text-gray-200">{n.message}</p>
                        {(n.productName || n.amount) && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {n.productName}{n.amount ? ` — $${n.amount.toFixed(2)}` : ""}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                          {new Date(n.timestamp).toLocaleString()}
                        </p>
                      </div>
                      {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />}
                    </button>
                  )
                })
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
