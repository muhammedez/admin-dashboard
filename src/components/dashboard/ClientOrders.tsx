"use client"

import { useEffect, useCallback, useRef } from "react"
import { Clock, Search } from "lucide-react"
import { useDashboard } from "@/lib/store"
import { useToast } from "@/lib/toast"
import { Pagination } from "@/components/ui/Pagination"
import { TableSkeleton } from "@/components/ui/Skeleton"
import { useSSE } from "@/hooks/useSSE"

export function ClientOrders({ customerName }: { customerName: string }) {
  const { clientOrders, clientOrderPage, clientOrderSearch, setClientOrders, notifyChange, fetchClientOrders } = useDashboard()
  const { toast } = useToast()

  const loadRef = useRef(fetchClientOrders)
  loadRef.current = fetchClientOrders

  useSSE((entity) => {
    if (["products", "customers", "transactions"].includes(entity)) {
      loadRef.current(clientOrderPage, clientOrderSearch, customerName)
    }
  })

  useEffect(() => {
    fetchClientOrders(clientOrderPage, clientOrderSearch, customerName)
  }, [clientOrderPage]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCancel = async (id: string) => {
    if (!confirm("Cancel this order?")) return
    try {
      const res = await fetch(`/api/client/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to cancel")
      }
      notifyChange()
      toast("Order cancelled", "success")
      fetchClientOrders(clientOrderPage, clientOrderSearch, customerName)
    } catch (e: any) {
      toast(e.message || "Failed to cancel order", "error")
    }
  }

  return (
    <div className="border border-gray-200 bg-white dark:border-0 dark:bg-gray-900">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 px-6 py-4 dark:border-gray-800">
        <div>
          <h3 className="text-lg font-semibold dark:text-gray-100">My Orders</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{clientOrders.total} pending {clientOrders.total === 1 ? "order" : "orders"}</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search orders..."
            value={clientOrderSearch}
            onChange={(e) => { setClientOrders(clientOrders, 1, e.target.value); fetchClientOrders(1, e.target.value, customerName) }}
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
                    <th className="px-6 py-3">Product</th>
                    <th className="px-6 py-3">Amount</th>
                    <th className="px-6 py-3">Time</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clientOrders.data.map((tx: any, index: number) => (
                    <tr key={tx.id} className="h-10 border-b border-gray-200 dark:border-gray-700">
                      <td className="px-6 py-2.5 text-gray-400 dark:text-gray-500">{(clientOrderPage - 1) * 10 + index + 1}</td>
                      <td className="px-6 py-2.5 font-medium dark:text-gray-200">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-amber-500" />
                          {tx.id}
                        </span>
                      </td>
                      <td className="px-6 py-2.5 text-gray-600 dark:text-gray-400">{tx.productName}</td>
                      <td className="px-6 py-2.5 font-medium dark:text-gray-200">${Number(tx.amount).toFixed(2)}</td>
                      <td className="px-6 py-2.5 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {new Date(tx.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-2.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleCancel(tx.id)}
                          className="rounded bg-red-600 px-3 py-1.5 text-xs font-medium !text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
                        >
                          Cancel
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!clientOrders.data.length && (
              <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">No pending orders</p>
            )}
          </>
        )}
      </div>
      <Pagination page={clientOrderPage} totalPages={clientOrders.totalPages} total={clientOrders.total} onPageChange={(p) => { setClientOrders(clientOrders, p, clientOrderSearch); fetchClientOrders(p, clientOrderSearch, customerName) }} />
    </div>
  )
}
