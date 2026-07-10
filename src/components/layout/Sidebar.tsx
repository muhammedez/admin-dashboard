"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, ShoppingBag, Users, ArrowLeftRight, PanelLeftClose, PanelLeft, Tags, type LucideIcon } from "lucide-react"

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

const adminNav: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Products", href: "/admin/products", icon: ShoppingBag },
  { label: "Customers", href: "/admin/customers", icon: Users },
  { label: "Transactions", href: "/admin/transactions", icon: ArrowLeftRight },
  { label: "Categories", href: "/admin/categories", icon: Tags },
]

const clientNav: NavItem[] = [
  { label: "Dashboard", href: "/client", icon: LayoutDashboard },
  { label: "Products", href: "/client/products", icon: ShoppingBag },
  { label: "Transactions", href: "/client/transactions", icon: ArrowLeftRight },
]

function NavLinks({ nav, pathname, onClick }: { nav: NavItem[]; pathname: string; onClick?: () => void }) {
  return (
    <>
      {nav.map((item) => {
        const active = pathname === item.href
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClick}
            className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        )
      })}
    </>
  )
}

export function Sidebar({ role = "admin", open, onClose, onToggle }: { role?: "admin" | "client"; open?: boolean; onClose?: () => void; onToggle?: () => void }) {
  const pathname = usePathname()
  const nav = role === "admin" ? adminNav : clientNav
  const brand = role === "admin" ? "Admin Panel" : "Client Portal"

  const sidebarContent = (
    <aside className="flex h-full flex-col border-r bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="flex h-16 items-center gap-2 border-b px-6 dark:border-gray-800">
        <div className="flex h-8 w-8 items-center justify-center bg-gray-900 text-sm font-bold text-white dark:bg-gray-100 dark:text-gray-900">
          {role === "admin" ? "A" : "C"}
        </div>
        <span className="text-lg font-semibold dark:text-gray-200">{brand}</span>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        <NavLinks nav={nav} pathname={pathname} />
      </nav>
      <div className="border-t p-4 dark:border-gray-800">
        <button
          onClick={onToggle}
          className="ml-auto flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          title="Collapse sidebar"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>
    </aside>
  )

  return (
    <>
      <div className={`fixed left-0 top-0 z-40 h-screen w-64 ${open ? 'lg:block' : 'lg:hidden'} hidden transition-all`}>
        {sidebarContent}
      </div>
      {!open && (
        <button
          onClick={onToggle}
          className="fixed left-0 top-1/2 z-40 hidden -translate-y-1/2 border border-l-0 bg-white p-2.5 hover:bg-gray-50 lg:block dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800"
          title="Expand sidebar"
        >
          <PanelLeft className="h-5 w-5 text-gray-400" />
        </button>
      )}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={onClose} />
          <div className="fixed inset-y-0 left-0 w-64 shadow-xl">
            <aside className="flex h-full flex-col border-r bg-white dark:border-gray-800 dark:bg-gray-900">
              <div className="flex h-16 items-center gap-2 border-b px-6 dark:border-gray-800">
                <div className="flex h-8 w-8 items-center justify-center bg-gray-900 text-sm font-bold text-white dark:bg-gray-100 dark:text-gray-900">
                  {role === "admin" ? "A" : "C"}
                </div>
                <span className="text-lg font-semibold dark:text-gray-200">{brand}</span>
              </div>
              <nav className="flex-1 space-y-1 overflow-y-auto p-4">
                <NavLinks nav={nav} pathname={pathname} onClick={onClose} />
              </nav>
            </aside>
          </div>
        </div>
      )}
    </>
  )
}
