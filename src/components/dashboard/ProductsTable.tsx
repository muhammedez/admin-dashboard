"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Plus, Pencil, Trash2, Search } from "lucide-react"
import { api } from "@/lib/api"
import { useDashboard } from "@/lib/store"
import { useToast } from "@/lib/toast"
import { Pagination } from "@/components/ui/Pagination"

const categories = ["All", "Electronics", "Accessories", "Footwear", "Fitness", "Home"]

export function ProductsTable() {
  const { products, productPage, productSearch, productCategory, setProducts } = useDashboard()
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(productSearch)
  const [category, setCategory] = useState(productCategory)
  const [page, setPage] = useState(productPage || 1)
  const [editing, setEditing] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const mountedRef = useRef(false)
  const { toast } = useToast()

  const load = useCallback(async (p: number, q: string, cat: string) => {
    setLoading(true)
    try {
      const result = await api.products.list({
        page: p,
        limit: 10,
        search: q || undefined,
        category: cat !== "All" ? cat : undefined,
      })
      setProducts(result, p, q, cat)
    } catch { /* silent */ }
    setLoading(false)
  }, [setProducts])

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true
      if (!products.data.length) {
        load(page, search, category)
      } else {
        setLoading(false)
      }
      return
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setPage(1)
      load(1, search, category)
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [search, category])

  const goToPage = (p: number) => {
    setPage(p)
    load(p, search, category)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return
    try {
      await api.products.delete(id)
      const target = products.data.length <= 1 && page > 1 ? page - 1 : page
      goToPage(target)
      toast("Product deleted", "success")
    } catch (e: any) {
      toast(e.message || "Failed to delete", "error")
    }
  }

  const handleSave = async (product: any) => {
    try {
      if (editing) {
        await api.products.update(editing, product)
        setEditing(null)
        toast("Product updated", "success")
        load(page, search, category)
      } else {
        await api.products.create(product)
        setShowForm(false)
        toast("Product created", "success")
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
          <h3 className="text-lg font-semibold dark:text-gray-100">Products</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{products.total} total products</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-48 rounded-sm border bg-gray-50 py-1.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-500"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg border bg-gray-50 px-3 py-1.5 text-sm outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button
            onClick={() => { setShowForm(true); setEditing(null) }}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>
      </div>

      {(showForm || editing) && (
        <ProductForm
          product={editing ? products.data.find((p: any) => p.id === editing) : null}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(null) }}
        />
      )}

      <div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-xs font-medium uppercase text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
              <th className="px-6 py-3">Product</th>
              <th className="px-6 py-3">Category</th>
              <th className="px-6 py-3">Price</th>
              <th className="px-6 py-3">Stock</th>
              <th className="px-6 py-3">Created</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.data.map((product: any) => (
              <tr key={product.id} className="border-b hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
                <td className="px-6 py-4">
                  <span className="font-medium dark:text-gray-200">{product.name}</span>
                  <span className="ml-2 text-gray-500 dark:text-gray-400">{product.id}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400">
                    {product.category}
                  </span>
                </td>
                <td className="px-6 py-4 font-medium dark:text-gray-200">${Number(product.price).toFixed(2)}</td>
                <td className="px-6 py-4 dark:text-gray-300">{product.stock}</td>
                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{product.createdAt}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => setEditing(product.id)} className="p-1.5 text-gray-400 hover:text-indigo-600 dark:text-gray-500 dark:hover:text-indigo-400">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(product.id)} className="p-1.5 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && !products.data.length && (
          <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">No products found</p>
        )}
      </div>

      <Pagination page={productPage} totalPages={products.totalPages} total={products.total} onPageChange={goToPage} />
    </div>
  )
}

function ProductForm({
  product,
  onSave,
  onCancel,
}: {
  product: any | null
  onSave: (p: any) => Promise<void>
  onCancel: () => void
}) {
  const [form, setForm] = useState(
    product ? { ...product, price: String(product.price), stock: String(product.stock) } : { name: "", category: "Electronics", price: "", stock: "", description: "" }
  )
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const price = parseFloat(form.price)
    const stock = parseInt(form.stock, 10) || 0
    if (!form.name || !form.category || isNaN(price) || price < 0) return
    setSaving(true)
    await onSave({ ...form, price, stock })
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
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Category *</label>
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
            {categories.filter((c) => c !== "All").map((c) => (<option key={c} value={c}>{c}</option>))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Price *</label>
          <input required type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Stock</label>
          <input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200" />
        </div>
        <div className="sm:col-span-2 lg:col-span-1">
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Description</label>
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200" />
        </div>
      </div>
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
