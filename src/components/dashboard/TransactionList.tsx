"use client"

import { useState, useEffect, useCallback } from "react"
import { CheckCircle, Clock, XCircle, Search, Filter, Plus, Pencil, Trash2, X } from "lucide-react"
import { api } from "@/lib/api"
import { useDashboard } from "@/lib/store"
import { useAuth } from "@/lib/auth"
import { useToast } from "@/lib/toast"
import { useSearchParams } from "next/navigation"
import { Pagination } from "@/components/ui/Pagination"
import { Modal } from "@/components/ui/Modal"
import { TableSkeleton } from "@/components/ui/Skeleton"
import { useDebouncedSearch } from "@/hooks/useDebouncedSearch"
import { useModalState } from "@/hooks/useModalState"

const statusIcon: Record<string, any> = {
  completed: CheckCircle,
  pending: Clock,
  failed: XCircle,
}

const statusBg: Record<string, string> = {
  completed: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400",
  pending: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  failed: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400",
}

export function TransactionList({ customerName: filterCustomer }: { customerName?: string }) {
  const { transactions, transactionPage, transactionSearch, transactionFilter, setTransactions, notifyChange } = useDashboard()
  const { user } = useAuth()
  const isAdmin = user?.role === "admin"
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(transactionSearch)
  const [filter, setFilter] = useState(transactionFilter)
  const [page, setPage] = useState(transactionPage || 1)
  const modal = useModalState<string>()
  const { toast } = useToast()

  const load = useCallback(async (p: number, q: string, f: string) => {
    setLoading(true)
    try {
      let result
      if (isAdmin) {
        result = await api.transactions.list({
          page: p,
          limit: 10,
          search: q || undefined,
          status: f !== "all" ? f : undefined,
        })
      } else {
        const params = new URLSearchParams({ page: String(p), limit: "10" })
        if (q) params.set("search", q)
        if (f && f !== "all") params.set("status", f)
        const token = localStorage.getItem("auth_token")
        const res = await fetch(`/api/client/transactions?${params}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        result = await res.json()
      }
      setTransactions(result, p, q, f)
    } catch { /* silent */ }
    setLoading(false)
  }, [setTransactions, isAdmin])

  const { skipNext } = useDebouncedSearch(() => {
    setPage(1)
    load(1, search, filter)
  }, [search, filter])

  useEffect(() => {
    const q = searchParams.get("search") || ""
    if (q) {
      skipNext()
      setSearch(q)
      load(1, q, filter)
    } else {
      load(page, search, filter)
    }
  }, [filterCustomer])

  const goToPage = (p: number) => {
    setPage(p)
    load(p, search, filter)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this transaction?")) return
    try {
      await api.transactions.delete(id)
      const target = transactions.data.length <= 1 && page > 1 ? page - 1 : page
      goToPage(target)
      notifyChange()
      toast("Transaction deleted", "success")
    } catch (e: any) {
      toast(e.message || "Failed to delete", "error")
    }
  }

  const handleSave = async (formData: any) => {
    try {
      if (modal.editingId) {
        await api.transactions.update(modal.editingId, formData)
        modal.close()
        notifyChange()
        toast("Transaction updated", "success")
        goToPage(page)
      } else {
        await api.transactions.create(formData)
        modal.close()
        notifyChange()
        toast("Transaction created", "success")
        goToPage(1)
      }
    } catch (e: any) {
      toast(e.message || "Failed to save", "error")
    }
  }

  return (
    <div className="border border-gray-200 bg-white dark:border-0 dark:bg-gray-900">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 px-6 py-4 dark:border-gray-800">
        <div>
          <h3 className="text-lg font-semibold dark:text-gray-100">Transactions</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{transactions.total} total transactions</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-48 border border-gray-200 bg-gray-50 py-1.5 pl-9 pr-8 text-sm outline-none focus:border-gray-900 dark:border-gray-800 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-500 dark:focus:border-gray-400"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-32 border border-gray-200 bg-gray-50 py-1.5 pl-9 pr-3 text-sm outline-none focus:border-gray-900 dark:border-gray-800 dark:bg-gray-700 dark:text-gray-200 dark:focus:border-gray-400"
            >
              <option value="all">All</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          {isAdmin && (
            <button
              onClick={modal.openAdd}
              className="flex items-center gap-1.5 bg-emerald-600 px-4 py-1.5 text-sm font-medium !text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-white dark:hover:bg-emerald-600"
            >
              <Plus className="h-4 w-4" /> Add
            </button>
          )}
        </div>
      </div>

      <Modal
        open={modal.isOpen}
        onClose={modal.close}
        title={modal.editingId ? "Edit Transaction" : "Add Transaction"}
      >
        <TransactionForm
          transaction={modal.editingId ? transactions.data.find((t: any) => t.id === modal.editingId) : null}
          onSave={handleSave}
          onCancel={modal.close}
        />
      </Modal>

      <div>
        {loading && !transactions.data.length ? (
          <TableSkeleton rows={5} cols={isAdmin ? 9 : 8} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="h-10 border-b border-gray-200 text-left text-xs font-medium text-gray-400 dark:border-gray-700 dark:text-gray-500">
                    <th className="px-6 py-3 w-10">No.</th>
                    <th className="px-6 py-3">Transaction</th>
                    <th className="px-6 py-3">Customer</th>
                    <th className="px-6 py-3">Product</th>
                    <th className="px-6 py-3">Amount</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Payment</th>
                    <th className="px-6 py-3">Time</th>
                    {isAdmin && <th className="px-6 py-3 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {transactions.data.map((tx: any, index: number) => {
                    const StatusIcon = statusIcon[tx.status] || statusIcon.completed
                    return (
                      <tr key={tx.id} className="h-10 border-b border-gray-200 dark:border-gray-700">
                        <td className="px-6 py-2.5 text-gray-400 dark:text-gray-500">{(page - 1) * 10 + index + 1}</td>
                        <td className="px-6 py-2.5 font-medium dark:text-gray-200">{tx.id}</td>
                        <td className="px-6 py-2.5 dark:text-gray-300">{tx.customerName}</td>
                        <td className="px-6 py-2.5 text-gray-600 dark:text-gray-400">{tx.productName}</td>
                        <td className="px-6 py-2.5 font-medium dark:text-gray-200">${Number(tx.amount).toFixed(2)}</td>
                        <td className="px-6 py-2.5">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium ${statusBg[tx.status]}`}>
                            <StatusIcon className="h-3.5 w-3.5" />
                            {tx.status}
                          </span>
                        </td>
                        <td className="px-6 py-2.5 text-gray-500 dark:text-gray-400">{tx.paymentMethod}</td>
                        <td className="px-6 py-2.5 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {new Date(tx.timestamp).toLocaleString()}
                        </td>
                        {isAdmin && (
                        <td className="px-6 py-2.5 text-right whitespace-nowrap">
                          <button onClick={() => modal.openEdit(tx.id)} className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-200">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(tx.id)} className="rounded p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-gray-500 dark:hover:bg-red-950 dark:hover:text-red-400">
                          <Trash2 className="h-4 w-4" />
                        </button>
                        </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {!loading && !transactions.data.length && (
              <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">No transactions found</p>
            )}
          </>
        )}
      </div>

      <Pagination page={transactionPage} totalPages={transactions.totalPages} total={transactions.total} onPageChange={goToPage} />
    </div>
  )
}

function TransactionForm({
  transaction,
  onSave,
  onCancel,
}: {
  transaction: any | null
  onSave: (p: any) => Promise<void>
  onCancel: () => void
}) {
  const [customers, setCustomers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [form, setForm] = useState(
    transaction ? { ...transaction, amount: String(transaction.amount), quantity: String(transaction.quantity || 1) } : { customerName: "", productName: "", quantity: "1", amount: "", status: "completed", paymentMethod: "Credit Card" }
  )
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.customers.list({ limit: 100 }).then((r) => setCustomers(r.data)).catch(() => {})
    api.products.list({ limit: 100 }).then((r) => setProducts(r.data)).catch(() => {})
  }, [])

  const handleProductChange = (productName: string) => {
    const product = products.find((p: any) => p.name === productName)
    if (product) {
      const qty = form.quantity || 1
      setForm({ ...form, productName, amount: String((product.price * qty).toFixed(2)) })
    } else {
      setForm({ ...form, productName })
    }
  }

  const handleQuantityChange = (raw: string) => {
    setForm({ ...form, quantity: raw })
    const qty = parseInt(raw, 10)
    if (qty > 0) {
      const product = products.find((p: any) => p.name === form.productName)
      if (product) {
        setForm((prev: any) => ({ ...prev, amount: (product.price * qty).toFixed(2) }))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseFloat(form.amount)
    if (!form.customerName || !form.productName || isNaN(amount) || amount <= 0) return
    setSaving(true)
    await onSave({ ...form, amount })
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Customer *</label>
          <select required value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none ring-emerald-500/20 transition-all focus:border-emerald-500 focus:ring-2 dark:border-gray-800 dark:bg-gray-700 dark:text-gray-200 dark:focus:border-emerald-400">
            <option value="">Select customer</option>
            {customers.map((c: any) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Product *</label>
          <select required value={form.productName} onChange={(e) => handleProductChange(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none ring-emerald-500/20 transition-all focus:border-emerald-500 focus:ring-2 dark:border-gray-800 dark:bg-gray-700 dark:text-gray-200 dark:focus:border-emerald-400">
            <option value="">Select product</option>
            {products.map((p: any) => (
              <option key={p.id} value={p.name}>${Number(p.price).toFixed(2)} — {p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Quantity</label>
          <input type="number" min="1" value={form.quantity} onChange={(e) => handleQuantityChange(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none ring-emerald-500/20 transition-all focus:border-emerald-500 focus:ring-2 dark:border-gray-800 dark:bg-gray-700 dark:text-gray-200 dark:focus:border-emerald-400" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Total ($) *</label>
          <input required type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none ring-emerald-500/20 transition-all focus:border-emerald-500 focus:ring-2 dark:border-gray-800 dark:bg-gray-700 dark:text-gray-200 dark:focus:border-emerald-400" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none ring-emerald-500/20 transition-all focus:border-emerald-500 focus:ring-2 dark:border-gray-800 dark:bg-gray-700 dark:text-gray-200 dark:focus:border-emerald-400">
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Payment Method</label>
          <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none ring-emerald-500/20 transition-all focus:border-emerald-500 focus:ring-2 dark:border-gray-800 dark:bg-gray-700 dark:text-gray-200 dark:focus:border-emerald-400">
            <option value="Credit Card">Credit Card</option>
            <option value="Debit Card">Debit Card</option>
            <option value="PayPal">PayPal</option>
          </select>
        </div>
      </div>
      <div className="mt-6 flex justify-start gap-3">
        <button type="button" onClick={onCancel}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
          Cancel
        </button>
        <button disabled={saving} type="submit"
          className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium !text-white shadow-sm transition-all hover:bg-emerald-700 disabled:opacity-50 dark:bg-emerald-500 dark:hover:bg-emerald-600">
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  )
}
