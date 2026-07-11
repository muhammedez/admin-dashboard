"use client"

import { useDashboard } from "@/lib/store"
import { StatCard } from "@/components/dashboard/StatCard"
import { RevenueChart } from "@/components/dashboard/RevenueChart"
import { SalesFeed } from "@/components/dashboard/SalesFeed"
import { CategoryChart } from "@/components/dashboard/CategoryChart"
import { PaymentChart } from "@/components/dashboard/PaymentChart"
import { downloadCSV } from "@/lib/csv"
import { DollarSign, ShoppingCart, Users, Package, Download } from "lucide-react"

export default function AdminDashboard() {
  const { stats, revenueData, categoryRevenue, paymentMethods, dateRange, setDateRange } = useDashboard()

  const cards = [
    { title: "Total Revenue", value: `$${stats.totalRevenue.toLocaleString()}`, change: stats.revenueChange, icon: DollarSign },
    { title: "Transactions", value: stats.totalTransactions.toLocaleString(), change: stats.transactionsChange, icon: ShoppingCart },
    { title: "Active Customers", value: stats.activeCustomers.toLocaleString(), change: stats.customersChange, icon: Users },
    { title: "Total Products", value: stats.totalProducts.toString(), change: stats.productsChange, icon: Package },
  ]

  const handleExportCSV = () => {
    downloadCSV(revenueData, "revenue-data")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
          <p className="text-sm text-gray-500">Overview of your business metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">From</label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
               className="border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm outline-none focus:border-gray-900 dark:border-gray-800 dark:bg-gray-700 dark:text-gray-200 dark:focus:border-gray-400 dark:[color-scheme:dark]"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">To</label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              className="border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm outline-none focus:border-gray-900 dark:border-gray-800 dark:bg-gray-700 dark:text-gray-200 dark:focus:border-gray-400 dark:[color-scheme:dark]"
            />
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-medium hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>
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

      <div className="grid gap-6 lg:grid-cols-2">
        <CategoryChart data={categoryRevenue} />
        <PaymentChart data={paymentMethods} />
      </div>
    </div>
  )
}
