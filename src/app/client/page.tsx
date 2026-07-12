"use client"

import { useDashboard } from "@/lib/store"
import { StatCard } from "@/components/dashboard/StatCard"
import { RevenueChart } from "@/components/dashboard/RevenueChart"
import { CategoryChart } from "@/components/dashboard/CategoryChart"
import { PaymentChart } from "@/components/dashboard/PaymentChart"
import { SalesFeed } from "@/components/dashboard/SalesFeed"
import { DollarSign, ShoppingCart, Package } from "lucide-react"

export default function ClientDashboard() {
  const { clientStats, clientRevenueData, clientCategoryRevenue, clientPaymentMethods, clientName, clientTotalProducts, clientDateRange, setClientDateRange, clientLoading } = useDashboard()

  const cards = [
    { title: "My Spending", value: `$${(clientStats.totalSpent || 0).toLocaleString()}`, change: clientStats.revenueChange || 0, icon: DollarSign },
    { title: "My Orders", value: (clientStats.totalTransactions || 0).toString(), change: clientStats.ordersChange || 0, icon: ShoppingCart },
    { title: "Products Available", value: (clientTotalProducts || 0).toString(), change: 0, icon: Package },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Client Dashboard</h1>
          <p className="text-sm text-gray-500">Your personal analytics</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">From</label>
            <input
              type="date"
              value={clientDateRange.from}
              onChange={(e) => setClientDateRange({ ...clientDateRange, from: e.target.value })}
              className="border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm outline-none focus:border-gray-900 dark:border-gray-800 dark:bg-gray-700 dark:text-gray-200 dark:focus:border-gray-400 dark:[color-scheme:dark]"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">To</label>
            <input
              type="date"
              value={clientDateRange.to}
              onChange={(e) => setClientDateRange({ ...clientDateRange, to: e.target.value })}
              className="border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm outline-none focus:border-gray-900 dark:border-gray-800 dark:bg-gray-700 dark:text-gray-200 dark:focus:border-gray-400 dark:[color-scheme:dark]"
            />
          </div>
        </div>
      </div>
      {clientLoading ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 h-72 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
            <div className="h-72 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
          </div>
        </>
      ) : (
        <>
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

          <div className="grid gap-6 lg:grid-cols-2">
            <CategoryChart data={clientCategoryRevenue} />
            <PaymentChart data={clientPaymentMethods} />
          </div>
        </>
      )}
    </div>
  )
}
