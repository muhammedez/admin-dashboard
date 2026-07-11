"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import { DashboardProvider } from "@/lib/store"
import { ToastProvider } from "@/lib/toast"
import { ToastContainer } from "@/components/ui/ToastContainer"
import { SidebarProvider, useSidebar } from "@/lib/sidebar"

function Layout({ children }: { children: React.ReactNode }) {
  const { open, toggle, close } = useSidebar()

  return (
    <ToastProvider>
      <DashboardProvider>
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
