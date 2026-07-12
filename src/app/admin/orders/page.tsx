"use client"

import { AdminOrders } from "@/components/dashboard/AdminOrders"

export default function AdminOrdersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Active Orders</h1>
        <p className="text-sm text-gray-500">Manage pending orders</p>
      </div>
      <AdminOrders />
    </div>
  )
}
