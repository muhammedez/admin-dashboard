"use client"

import { useDashboard } from "@/lib/store"
import { StatCard } from "@/components/dashboard/StatCard"
import { RevenueChart } from "@/components/dashboard/RevenueChart"
import { SalesFeed } from "@/components/dashboard/SalesFeed"
import { DollarSign, ShoppingCart, Package } from "lucide-react"

export default function ClientDashboard() {
  const { clientStats, clientRevenueData, clientName, clientTotalProducts } = useDashboard()

  const cards = [
    { title: "My Spending", value: `$${(clientStats.totalSpent || 0).toLocaleString()}`, change: clientStats.revenueChange || 0, icon: DollarSign },
    { title: "My Orders", value: (clientStats.totalTransactions || 0).toString(), change: clientStats.ordersChange || 0, icon: ShoppingCart },
    { title: "Products Available", value: (clientTotalProducts || 0).toString(), change: 0, icon: Package },
  ]

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
          <RevenueChart data={clientRevenueData} />
        </div>
        {clientName && <SalesFeed customerName={clientName} />}
      </div>
    </div>
  )
}
