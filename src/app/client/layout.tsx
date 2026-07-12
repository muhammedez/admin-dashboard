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
  const { clientName, pushNotification } = useDashboard()
  const { user } = useAuth()
  const { toast } = useToast()

  useSSE((entity, data) => {
    if (entity === "notification" && data?.message && data?.customerName) {
      if (data.customerName === clientName || data.customerName === user?.name) {
        pushNotification(data.message as string, data.transactionId as string | undefined)
        toast(data.message as string, "info")
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
          <Sidebar role="client" open={open} onClose={close} onToggle={toggle} />
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

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.push("/login")
    if (!loading && user && user.role === "admin") router.push("/admin")
  }, [user, loading, router])

  if (!user) return null

  return (
    <SidebarProvider>
      <Layout>{children}</Layout>
    </SidebarProvider>
  )
}
