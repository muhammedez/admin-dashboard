"use client"

import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { api } from "@/lib/api"
import { useToast } from "@/lib/toast"

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const { toast } = useToast()

  const load = async () => {
    try {
      const result = await api.categories.list()
      setCategories(result.data)
    } catch { /* silent */ }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

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
    <div className="rounded-md border bg-white dark:border-gray-700 dark:bg-gray-800/90">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b px-6 py-4 dark:border-gray-700">
        <div>
          <h3 className="text-lg font-semibold dark:text-gray-100">Categories</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{categories.length} categories</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditing(null) }}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
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
            <tr className="border-b bg-gray-50 text-left text-xs font-medium uppercase text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Created</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat: any) => (
              <tr key={cat.id} className="border-b hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
                <td className="px-6 py-4">
                  <span className="font-medium dark:text-gray-200">{cat.name}</span>
                </td>
                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{cat.createdAt}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => setEditing(cat.id)} className="p-1.5 text-gray-400 hover:text-indigo-600 dark:text-gray-500 dark:hover:text-indigo-400">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(cat.id)} className="p-1.5 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && !categories.length && (
          <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">No categories found</p>
        )}
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
    <form onSubmit={handleSubmit} className="border-b bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-end gap-4">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Category Name *</label>
          <input required value={name} onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200" />
        </div>
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
