"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Package, Pencil } from "lucide-react"

export default function AdminProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((r) => r.json())
      .then((data) => { setProduct(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

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

        <div className="mt-8 border-t border-gray-200 pt-6 dark:border-gray-800">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">Created</p>
          <p className="mt-0.5 text-sm text-gray-700 dark:text-gray-300">{product.createdAt}</p>
        </div>
      </div>
    </div>
  )
}
