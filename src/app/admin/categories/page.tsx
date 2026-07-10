"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { api } from "@/lib/api"
import { useDashboard } from "@/lib/store"
import { useToast } from "@/lib/toast"

export default function CategoriesPage() {
  const { categories, setCategories } = useDashboard()
  const [editing, setEditing] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const { toast } = useToast()

  const load = async () => {
    try {
      const result = await api.categories.list()
      setCategories(result.data)
    } catch { /* silent */ }
  }

  const handleSave = async (name: string) => {
    try {
      if (editing) {
        await api.categories.update(editing, { name })
        toast("Category updated", "success")
      } else {
        await api.categories.create({ name })
        toast("Category created", "success")
      }
      setEditing(null)
      setShowForm(false)
      load()
    } catch (e: any) {
      toast(e.message || "Failed to save", "error")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category?")) return
    try {
      await api.categories.delete(id)
      toast("Category deleted", "success")
      load()
    } catch (e: any) {
      toast(e.message || "Failed to delete", "error")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Categories</h1>
        <p className="text-sm text-gray-500">Organize your product categories</p>
      </div>
      <div className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <div>
            <h3 className="text-lg font-semibold dark:text-gray-100">Categories</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{categories.length} categories</p>
          </div>
        <button
          onClick={() => { setShowForm(true); setEditing(null) }}
          className="flex items-center gap-1.5 bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-white dark:hover:bg-emerald-600"
        >
          <Plus className="h-4 w-4" /> Add Category
        </button>
      </div>

      {(showForm || editing) && (
        <CategoryForm
          category={editing ? categories.find((c: any) => c.id === editing) : null}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(null) }}
        />
      )}

      <div>
        <table className="w-full text-sm">
          <thead>
            <tr className="h-10 border-b border-gray-200 text-left text-xs font-medium text-gray-400 dark:border-gray-700 dark:text-gray-500">
              <th className="px-6 py-3 w-10">No.</th>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Created</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat: any, index: number) => (
              <tr key={cat.id} className="h-10 border-b border-gray-200 dark:border-gray-700">
                <td className="px-6 py-2.5 text-gray-400 dark:text-gray-500">{index + 1}</td>
                <td className="px-6 py-2.5">
                  <span className="font-medium dark:text-gray-200">{cat.name}</span>
                </td>
                <td className="px-6 py-2.5 text-gray-500 dark:text-gray-400">{cat.createdAt}</td>
                <td className="px-6 py-2.5 text-right">
                  <button onClick={() => setEditing(cat.id)} className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-200">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(cat.id)} className="rounded p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-gray-500 dark:hover:bg-red-950 dark:hover:text-red-400">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!categories.length && (
          <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">No categories found</p>
        )}
      </div>
    </div>
    </div>
  )
}

function CategoryForm({
  category,
  onSave,
  onCancel,
}: {
  category: any | null
  onSave: (name: string) => Promise<void>
  onCancel: () => void
}) {
  const [name, setName] = useState(category?.name || "")
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    await onSave(name.trim())
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="border-b border-gray-200 bg-gray-50/50 p-6 dark:border-gray-700 dark:bg-gray-800/30">
      <div className="flex items-end gap-4">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Category Name *</label>
          <input required value={name} onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:focus:border-gray-400" />
        </div>
        <button disabled={saving} type="submit"
          className="bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 dark:bg-emerald-500 dark:text-white dark:hover:bg-emerald-600">
          {saving ? "Saving..." : "Save"}
        </button>
        <button type="button" onClick={onCancel}
          className="border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700">
          Cancel
        </button>
      </div>
    </form>
  )
}
