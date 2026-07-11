"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth"
import { useDashboard } from "@/lib/store"
import { StatCard } from "@/components/dashboard/StatCard"
import { RevenueChart } from "@/components/dashboard/RevenueChart"
import { SalesFeed } from "@/components/dashboard/SalesFeed"
import { DollarSign, ShoppingCart, Package } from "lucide-react"

export default function ClientDashboard() {
  const { token } = useAuth()
  const { stats: globalStats } = useDashboard()
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    if (!token) return
    fetch("/api/client/stats", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch(() => {})
  }, [token])

  const cards = stats
    ? [
        { title: "My Spending", value: `$${stats.stats.totalSpent.toLocaleString()}`, change: stats.stats.revenueChange, icon: DollarSign },
        { title: "My Orders", value: stats.stats.totalTransactions.toString(), change: stats.stats.ordersChange, icon: ShoppingCart },
        { title: "Products Available", value: globalStats.totalProducts.toString(), change: globalStats.productsChange, icon: Package },
      ]
    : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Client Dashboard</h1>
        <p className="text-sm text-gray-500">Your personal analytics</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChart data={stats?.revenueData || []} />
        </div>
        {stats && <SalesFeed customerName={stats.customerName} />}
      </div>
    </div>
  )
}
