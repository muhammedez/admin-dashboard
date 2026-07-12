"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Plus, Pencil, Trash2, Search, X } from "lucide-react"
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
import { useSSE } from "@/hooks/useSSE"

export function ProductsTable() {
  const { products, productPage, productSearch, productCategory, setProducts, categories, notifyChange } = useDashboard()
  const { user } = useAuth()
  const isAdmin = user?.role === "admin"
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(productSearch)
  const [category, setCategory] = useState(productCategory)
  const [page, setPage] = useState(productPage || 1)
  const modal = useModalState<string>()
  const categoryNames = categories.map((c: any) => c.name)
  const { toast } = useToast()
  const [optimisticStock, setOptimisticStock] = useState<Record<string, number>>({})

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

  const loadRef = useRef(load)
  loadRef.current = load

  const { skipNext } = useDebouncedSearch(() => {
    setPage(1)
    load(1, search, category)
  }, [search, category])

  useEffect(() => {
    const q = searchParams.get("search") || ""
    if (q) {
      skipNext()
      setSearch(q)
      load(1, q, category)
    } else if (!products.data.length) {
      load(page, search, category)
    } else {
      setLoading(false)
    }
  }, [])

  useSSE((entity) => {
    if (entity === "products") loadRef.current(page, search, category)
  })

  useEffect(() => {
    let id: ReturnType<typeof setInterval>
    const tick = () => { loadRef.current(page, search, category) }
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        id = setInterval(tick, 30000)
        tick()
      } else {
        clearInterval(id)
      }
    }
    id = setInterval(tick, 30000)
    document.addEventListener("visibilitychange", onVisibility)
    return () => {
      clearInterval(id)
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [page, search, category])

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
      notifyChange()
      toast("Product deleted", "success")
    } catch (e: any) {
      toast(e.message || "Failed to delete", "error")
    }
  }

  const handleToggleStock = async (product: any) => {
    const newStock = product.stock > 0 ? 0 : 10
    setOptimisticStock((prev) => ({ ...prev, [product.id]: newStock }))
    try {
      await api.products.update(product.id, { stock: newStock })
      toast(newStock > 0 ? "Product marked in stock" : "Product marked out of stock", "success")
      load(page, search, category)
    } catch (e: any) {
      setOptimisticStock((prev) => {
        const next = { ...prev }
        delete next[product.id]
        return next
      })
      toast(e.message || "Failed to update stock", "error")
    }
  }

  const handleSave = async (product: any) => {
    try {
      if (modal.editingId) {
        await api.products.update(modal.editingId, product)
        modal.close()
        notifyChange()
        toast("Product updated", "success")
        load(page, search, category)
      } else {
        await api.products.create(product)
        modal.close()
        notifyChange()
        toast("Product created", "success")
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
              className="w-48 border border-gray-200 bg-gray-50 py-1.5 pl-9 pr-8 text-sm outline-none focus:border-gray-900 dark:border-gray-800 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-500 dark:focus:border-gray-400"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm outline-none focus:border-gray-900 dark:border-gray-800 dark:bg-gray-700 dark:text-gray-200 dark:focus:border-gray-400"
          >
            <option value="All">All</option>
            {categoryNames.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
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
        title={modal.editingId ? "Edit Product" : "Add Product"}
      >
        <ProductForm
          categories={categoryNames}
          product={modal.editingId ? products.data.find((p: any) => p.id === modal.editingId) : null}
          onSave={handleSave}
          onCancel={modal.close}
        />
      </Modal>

      <div>
        {loading && !products.data.length ? (
          <TableSkeleton rows={5} cols={isAdmin ? 8 : 7} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="h-10 border-b border-gray-200 text-left text-xs font-medium text-gray-400 dark:border-gray-700 dark:text-gray-500">
                    <th className="px-6 py-3 w-10">No.</th>
                    <th className="px-6 py-3">Product</th>
                    <th className="px-6 py-3">Category</th>
                    <th className="px-6 py-3">Price</th>
                    <th className="px-6 py-3">Qty</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Created</th>
                    {isAdmin && <th className="px-6 py-3 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {products.data.map((product: any, index: number) => {
                    const stockValue = optimisticStock[product.id] ?? product.stock
                    return (
                    <tr key={product.id} className="h-10 border-b border-gray-200 dark:border-gray-700">
                      <td className="px-6 py-2.5 text-gray-400 dark:text-gray-500">{(page - 1) * 10 + index + 1}</td>
                      <td className="px-6 py-2.5">
                        <span className="font-medium dark:text-gray-200">{product.name}</span>
                        <span className="ml-2 text-gray-500 dark:text-gray-400">{product.id}</span>
                      </td>
                      <td className="px-6 py-2.5">
                        <span className="bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-2.5 font-medium dark:text-gray-200">${Number(product.price).toFixed(2)}</td>
                      <td className="px-6 py-2.5 font-medium dark:text-gray-200">{stockValue}</td>
                      <td className="px-6 py-2.5">
                        <div className="flex items-center gap-2">
                          {isAdmin && (
                            <button
                              onClick={() => handleToggleStock(product)}
                              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors ${
                                stockValue > 0 ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
                              }`}
                            >
                              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                                stockValue > 0 ? 'translate-x-4' : 'translate-x-0.5'
                              }`} />
                            </button>
                          )}
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            stockValue > 0
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {stockValue > 0 ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-2.5 text-gray-500 dark:text-gray-400">{product.createdAt}</td>
                      {isAdmin && (
                        <td className="px-6 py-2.5 text-right">
                          <button onClick={() => modal.openEdit(product.id)} className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-200">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(product.id)} className="rounded p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-gray-500 dark:hover:bg-red-950 dark:hover:text-red-400">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {!loading && !products.data.length && (
              <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">No products found</p>
            )}
          </>
        )}
      </div>

      <Pagination page={productPage} totalPages={products.totalPages} total={products.total} onPageChange={goToPage} />
    </div>
  )
}

function ProductForm({
  categories,
  product,
  onSave,
  onCancel,
}: {
  categories: string[]
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
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Name *</label>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none ring-emerald-500/20 transition-all focus:border-emerald-500 focus:ring-2 dark:border-gray-800 dark:bg-gray-700 dark:text-gray-200 dark:focus:border-emerald-400" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Category *</label>
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none ring-emerald-500/20 transition-all focus:border-emerald-500 focus:ring-2 dark:border-gray-800 dark:bg-gray-700 dark:text-gray-200 dark:focus:border-emerald-400">
            {categories.map((c) => (<option key={c} value={c}>{c}</option>))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Price *</label>
          <input required type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none ring-emerald-500/20 transition-all focus:border-emerald-500 focus:ring-2 dark:border-gray-800 dark:bg-gray-700 dark:text-gray-200 dark:focus:border-emerald-400" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Stock</label>
          <input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none ring-emerald-500/20 transition-all focus:border-emerald-500 focus:ring-2 dark:border-gray-800 dark:bg-gray-700 dark:text-gray-200 dark:focus:border-emerald-400" />
        </div>
        <div className="sm:col-span-2 lg:col-span-1">
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none ring-emerald-500/20 transition-all focus:border-emerald-500 focus:ring-2 dark:border-gray-800 dark:bg-gray-700 dark:text-gray-200 dark:focus:border-emerald-400" rows={3} />
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
