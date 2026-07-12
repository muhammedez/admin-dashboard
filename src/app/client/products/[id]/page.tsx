"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Package, ShoppingCart } from "lucide-react"
import { useToast } from "@/lib/toast"

const paymentMethods = ["Credit Card", "Debit Card", "PayPal", "Cash", "Bank Transfer"]

export default function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { toast } = useToast()
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [quantityStr, setQuantityStr] = useState("1")
  const [paymentMethod, setPaymentMethod] = useState("Credit Card")
  const [ordering, setOrdering] = useState(false)

  const quantity = Math.max(1, Math.min(product?.stock ?? 1, parseInt(quantityStr) || 1))

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((r) => r.json())
      .then((data) => { setProduct(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  const handleOrder = async () => {
    if (!product || quantity < 1) return
    setOrdering(true)
    try {
      const res = await fetch("/api/client/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName: product.name, quantity, paymentMethod }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Order failed" }))
        throw new Error(err.error)
      }
      const tx = await res.json()
      toast("Order placed successfully", "success")
      router.push(`/client/transactions/${tx.id}`)
    } catch (e: any) {
      toast(e.message || "Failed to place order", "error")
    }
    setOrdering(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900 dark:border-gray-700 dark:border-t-gray-300" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="space-y-6">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-300">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <p className="py-12 text-center text-gray-400">Product not found</p>
      </div>
    )
  }

  const inStock = product.stock > 0
  const total = product.price * quantity

  return (
    <div className="space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-300">
        <ArrowLeft className="h-4 w-4" /> Back to Products
      </button>

      <div className="border border-gray-200 bg-white p-8 dark:border-0 dark:bg-gray-900">
        <div className="flex items-start gap-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
            <Package className="h-7 w-7 text-gray-500 dark:text-gray-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold dark:text-gray-100">{product.name}</h1>
                <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">ID: {product.id}</p>
              </div>
              <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                inStock
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {inStock ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">Price</p>
            <p className="text-3xl font-semibold dark:text-gray-100">${Number(product.price).toFixed(2)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">Category</p>
            <span className="inline-block rounded bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              {product.category}
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">Quantity Available</p>
            <p className="text-xl font-semibold dark:text-gray-100">{product.stock}</p>
          </div>
        </div>

        {product.description && (
          <div className="mt-8">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">Description</p>
            <p className="mt-1.5 text-sm leading-relaxed text-gray-700 dark:text-gray-300">{product.description}</p>
          </div>
        )}

        {inStock && (
          <div className="mt-8 border-t border-gray-200 pt-6 dark:border-gray-800">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              <ShoppingCart className="h-4 w-4" /> Place Order
            </h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Quantity</label>
                <input
                  type="number"
                  min={1}
                  max={product.stock}
                  value={quantityStr}
                  onChange={(e) => setQuantityStr(e.target.value)}
                  onBlur={() => {
                    const v = parseInt(quantityStr)
                    if (isNaN(v) || v < 1) setQuantityStr("1")
                    else if (v > product.stock) setQuantityStr(String(product.stock))
                  }}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none ring-emerald-500/20 transition-all focus:border-emerald-500 focus:ring-2 dark:border-gray-800 dark:bg-gray-700 dark:text-gray-200 dark:focus:border-emerald-400"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none ring-emerald-500/20 transition-all focus:border-emerald-500 focus:ring-2 dark:border-gray-800 dark:bg-gray-700 dark:text-gray-200 dark:focus:border-emerald-400"
                >
                  {paymentMethods.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end justify-between gap-4 sm:flex-col sm:items-start">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">Total</p>
                  <p className="text-xl font-semibold dark:text-gray-100">${total.toFixed(2)}</p>
                </div>
                <button
                  onClick={handleOrder}
                  disabled={ordering}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium !text-white shadow-sm transition-all hover:bg-emerald-700 disabled:opacity-50 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                >
                  <ShoppingCart className="h-4 w-4" />
                  {ordering ? "Placing Order..." : "Buy Now"}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 border-t border-gray-200 pt-6 dark:border-gray-800">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">Created</p>
          <p className="mt-0.5 text-sm text-gray-700 dark:text-gray-300">{product.createdAt}</p>
        </div>
      </div>
    </div>
  )
}
