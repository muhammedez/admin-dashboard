"use client"

import { useDashboard } from "@/lib/store"
import { ClientOrders } from "@/components/dashboard/ClientOrders"

export default function ClientOrdersPage() {
  const { clientName } = useDashboard()

  if (!clientName) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">My Orders</h1>
          <p className="text-sm text-gray-500">Loading your orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">My Orders</h1>
        <p className="text-sm text-gray-500">Your pending orders</p>
      </div>
      <ClientOrders customerName={clientName} />
    </div>
  )
}
