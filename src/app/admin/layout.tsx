"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import { DashboardProvider, useDashboard } from "@/lib/store"
import { ToastProvider, useToast } from "@/lib/toast"
import { ToastContainer } from "@/components/ui/ToastContainer"
import { SidebarProvider, useSidebar } from "@/lib/sidebar"
import { useSSE } from "@/hooks/useSSE"

function NotificationListener() {
  const { pushNotification } = useDashboard()
  const { toast } = useToast()

  useSSE((entity, data) => {
    if (entity === "notification" && data?.message) {
      const msg = data.message as string
      if (msg.startsWith("New order from") || msg === "Order approved" || msg === "Order rejected" || msg === "Order cancelled") {
        pushNotification(msg, data.transactionId as string | undefined, data.productName as string | undefined, data.amount as number | undefined, data.customerName as string | undefined)
        toast(msg, "info")
      }
    }
  })

  return null
}

function Layout({ children }: { children: React.ReactNode }) {
  const { open, toggle, close } = useSidebar()

  return (
    <ToastProvider>
      <DashboardProvider>
        <NotificationListener />
        <div className="flex">
          <Sidebar role="admin" open={open} onClose={close} onToggle={toggle} />
          <div className={`flex-1 transition-all ${open ? 'lg:ml-64' : 'lg:ml-0'}`}>
            <Header />
            <main className="p-6">{children}</main>
          </div>
        </div>
        <ToastContainer />
      </DashboardProvider>
    </ToastProvider>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.push("/login")
    if (!loading && user && user.role !== "admin") router.push("/client")
  }, [user, loading, router])

  if (!user || user.role !== "admin") return null

  return (
    <SidebarProvider>
      <Layout>{children}</Layout>
    </SidebarProvider>
  )
}
