"use client"

import { useEffect, useCallback, useRef } from "react"
import { Clock, Search } from "lucide-react"
import { useDashboard } from "@/lib/store"
import { useToast } from "@/lib/toast"
import { Pagination } from "@/components/ui/Pagination"
import { TableSkeleton } from "@/components/ui/Skeleton"
import { useSSE } from "@/hooks/useSSE"

const BASE = "/api/admin/orders"

export function AdminOrders() {
  const { adminOrders, adminOrderPage, adminOrderSearch, setAdminOrders, notifyChange, fetchAdminOrders } = useDashboard()
  const { toast } = useToast()

  const loadRef = useRef(fetchAdminOrders)
  loadRef.current = fetchAdminOrders

  useSSE((entity) => {
    if (["products", "customers", "transactions"].includes(entity)) {
      loadRef.current(adminOrderPage, adminOrderSearch)
    }
  })

  useEffect(() => {
    fetchAdminOrders(adminOrderPage, adminOrderSearch)
  }, [adminOrderPage]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleAction = async (id: string, action: "approve" | "reject") => {
    try {
      const res = await fetch(`${BASE}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Action failed")
      }
      notifyChange()
      toast(action === "approve" ? "Order approved" : "Order rejected", "success")
      fetchAdminOrders(adminOrderPage, adminOrderSearch)
    } catch (e: any) {
      toast(e.message || "Failed to process order", "error")
    }
  }

  return (
    <div className="border border-gray-200 bg-white dark:border-0 dark:bg-gray-900">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 px-6 py-4 dark:border-gray-800">
        <div>
          <h3 className="text-lg font-semibold dark:text-gray-100">Active Orders</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{adminOrders.total} pending {adminOrders.total === 1 ? "order" : "orders"}</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search orders..."
            value={adminOrderSearch}
            onChange={(e) => { setAdminOrders(adminOrders, 1, e.target.value); fetchAdminOrders(1, e.target.value) }}
            className="w-48 border border-gray-200 bg-gray-50 py-1.5 pl-9 pr-3 text-sm outline-none focus:border-gray-900 dark:border-gray-800 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-500 dark:focus:border-gray-400"
          />
        </div>
      </div>
      <div>
        {false ? null : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="h-10 border-b border-gray-200 text-left text-xs font-medium text-gray-400 dark:border-gray-700 dark:text-gray-500">
                    <th className="px-6 py-3 w-10">No.</th>
                    <th className="px-6 py-3">Order</th>
                    <th className="px-6 py-3">Customer</th>
                    <th className="px-6 py-3">Product</th>
                    <th className="px-6 py-3">Amount</th>
                    <th className="px-6 py-3">Time</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {adminOrders.data.map((tx: any, index: number) => (
                    <tr key={tx.id} className="h-10 border-b border-gray-200 dark:border-gray-700">
                      <td className="px-6 py-2.5 text-gray-400 dark:text-gray-500">{(adminOrderPage - 1) * 10 + index + 1}</td>
                      <td className="px-6 py-2.5 font-medium dark:text-gray-200">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-amber-500" />
                          {tx.id}
                        </span>
                      </td>
                      <td className="px-6 py-2.5 dark:text-gray-300">{tx.customerName}</td>
                      <td className="px-6 py-2.5 text-gray-600 dark:text-gray-400">{tx.productName}</td>
                      <td className="px-6 py-2.5 font-medium dark:text-gray-200">${Number(tx.amount).toFixed(2)}</td>
                      <td className="px-6 py-2.5 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {new Date(tx.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-2.5 text-right whitespace-nowrap space-x-2">
                        <button
                          onClick={() => handleAction(tx.id, "approve")}
                          className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-medium !text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleAction(tx.id, "reject")}
                          className="rounded bg-red-600 px-3 py-1.5 text-xs font-medium !text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!adminOrders.data.length && (
              <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">No active orders</p>
            )}
          </>
        )}
      </div>
      <Pagination page={adminOrderPage} totalPages={adminOrders.totalPages} total={adminOrders.total} onPageChange={(p) => { setAdminOrders(adminOrders, p, adminOrderSearch); fetchAdminOrders(p, adminOrderSearch) }} />
    </div>
  )
}
