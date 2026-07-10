"use client"

import { ProductsTable } from "@/components/dashboard/ProductsTable"

export default function ClientProducts() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Browse Products</h1>
        <p className="text-sm text-gray-500">Explore our product catalogue</p>
      </div>
      <ProductsTable />
    </div>
  )
}
