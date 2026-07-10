"use client"

import { useDashboard } from "@/lib/store"
import { StatCard } from "@/components/dashboard/StatCard"
import { RevenueChart } from "@/components/dashboard/RevenueChart"
import { SalesFeed } from "@/components/dashboard/SalesFeed"
import { DollarSign, ShoppingCart, TrendingUp, Activity } from "lucide-react"

export default function ClientDashboard() {
  const { stats, revenueData } = useDashboard()

  const cards = [
    { title: "My Spending", value: `$${(stats.totalRevenue * 0.15).toLocaleString()}`, change: 18.2, icon: DollarSign },
    { title: "My Orders", value: "24", change: 12.5, icon: ShoppingCart },
    { title: "Wishlist Items", value: "8", change: -3.1, icon: TrendingUp },
    { title: "Active Sessions", value: "3", change: 0, icon: Activity },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Client Dashboard</h1>
        <p className="text-sm text-gray-500">Your personal analytics overview</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChart data={revenueData} />
        </div>
        <SalesFeed />
      </div>
    </div>
  )
}
