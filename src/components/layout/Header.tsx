"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Bell, Moon, Sun, LogOut, Menu } from "lucide-react"
import { useTheme } from "@/lib/theme"
import { useAuth } from "@/lib/auth"
import { useSidebar } from "@/lib/sidebar"

export function Header() {
  const { dark, toggle } = useTheme()
  const { user, logout } = useAuth()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)
  const { toggle: toggleSidebar } = useSidebar()

  const handleLogout = async () => {
    setLoggingOut(true)
    await logout()
    router.push("/login")
  }

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

      <button className="relative p-2 hover:bg-gray-50 dark:hover:bg-gray-800">
        <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
      </button>

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
