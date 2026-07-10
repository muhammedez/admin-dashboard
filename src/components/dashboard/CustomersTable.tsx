"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Search, Mail, Plus, Pencil, Trash2 } from "lucide-react"
import { api } from "@/lib/api"
import { useDashboard } from "@/lib/store"
import { useToast } from "@/lib/toast"
import { Pagination } from "@/components/ui/Pagination"

export function CustomersTable() {
  const { customers, customerPage, customerSearch, setCustomers } = useDashboard()
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(customerSearch)
  const [page, setPage] = useState(customerPage || 1)
  const [editing, setEditing] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const { toast } = useToast()

  const load = useCallback(async (p: number, q: string) => {
    setLoading(true)
    try {
      const result = await api.customers.list({ page: p, limit: 10, search: q || undefined })
      setCustomers(result, p, q)
    } catch { /* silent */ }
    setLoading(false)
  }, [setCustomers])

  useEffect(() => {
    if (!customers.data.length) {
      load(page, search)
    } else {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setPage(1)
      load(1, search)
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [search])

  const goToPage = (p: number) => {
    setPage(p)
    load(p, search)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this customer?")) return
    try {
      await api.customers.delete(id)
      const target = customers.data.length <= 1 && page > 1 ? page - 1 : page
      goToPage(target)
      toast("Customer deleted", "success")
    } catch (e: any) {
      toast(e.message || "Failed to delete", "error")
    }
  }

  const handleSave = async (formData: any) => {
    try {
      if (editing) {
        await api.customers.update(editing, formData)
        setEditing(null)
        toast("Customer updated", "success")
        goToPage(page)
      } else {
        await api.customers.create(formData)
        setShowForm(false)
        toast("Customer created", "success")
        goToPage(1)
      }
    } catch (e: any) {
      toast(e.message || "Failed to save", "error")
    }
  }

  return (
    <div className="rounded-md border bg-white dark:border-gray-700 dark:bg-gray-800/90">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b px-6 py-4 dark:border-gray-700">
        <div>
          <h3 className="text-lg font-semibold dark:text-gray-100">Customers</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{customers.total} total customers</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-56 rounded-sm border bg-gray-50 py-1.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-500"
            />
          </div>
          <button
            onClick={() => { setShowForm(true); setEditing(null) }}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>
      </div>

      {(showForm || editing) && (
        <CustomerForm
          customer={editing ? customers.data.find((c: any) => c.id === editing) : null}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(null) }}
        />
      )}

      <div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-xs font-medium uppercase text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
              <th className="px-6 py-3">Customer</th>
              <th className="px-6 py-3">Email</th>
              <th className="px-6 py-3">Orders</th>
              <th className="px-6 py-3">Total Spent</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Joined</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.data.map((customer: any) => (
              <tr key={customer.id} className="border-b hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400">
                      {customer.name.charAt(0)}
                    </div>
                    <span className="font-medium dark:text-gray-200">{customer.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{customer.email}</td>
                <td className="px-6 py-4 dark:text-gray-300">{customer.totalOrders}</td>
                <td className="px-6 py-4 font-medium dark:text-gray-200">${Number(customer.totalSpent).toFixed(2)}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    customer.status === "active"
                      ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${customer.status === "active" ? "bg-green-500" : "bg-gray-400 dark:bg-gray-500"}`} />
                    {customer.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{customer.joinedAt}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => setEditing(customer.id)} className="p-1.5 text-gray-400 hover:text-indigo-600 dark:text-gray-500 dark:hover:text-indigo-400">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(customer.id)} className="p-1.5 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400">
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <button className="p-1.5 text-gray-400 hover:text-indigo-600 dark:text-gray-500 dark:hover:text-indigo-400">
                    <Mail className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && !customers.data.length && (
          <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">No customers found</p>
        )}
      </div>

      <Pagination page={customerPage} totalPages={customers.totalPages} total={customers.total} onPageChange={goToPage} />
    </div>
  )
}

function CustomerForm({
  customer,
  onSave,
  onCancel,
}: {
  customer: any | null
  onSave: (p: any) => Promise<void>
  onCancel: () => void
}) {
  const [form, setForm] = useState(
    customer ?? { name: "", email: "", status: "active" }
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email) return
    setSaving(true)
    setError("")
    try {
      await onSave(form)
    } catch (err: any) {
      setError(err.message)
    }
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="border-b bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-800">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Name *</label>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Email *</label>
          <input required type="email" value={form.email} onChange={(e) => { setForm({ ...form, email: e.target.value }); setError("") }}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Status</label>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <div className="mt-4 flex gap-2">
        <button disabled={saving} type="submit"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
          {saving ? "Saving..." : "Save"}
        </button>
        <button type="button" onClick={onCancel}
          className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700">
          Cancel
        </button>
      </div>
    </form>
  )
}
