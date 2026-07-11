"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth"
import { useDashboard } from "@/lib/store"
import { useToast } from "@/lib/toast"
import { Modal } from "@/components/ui/Modal"
import { TableSkeleton } from "@/components/ui/Skeleton"
import { useModalState } from "@/hooks/useModalState"

export default function CategoriesPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === "admin"
  const { categories, setCategories, notifyChange } = useDashboard()
  const modal = useModalState<string>()
  const { toast } = useToast()

  const load = async () => {
    try {
      const result = await api.categories.list()
      setCategories(result.data)
    } catch { /* silent */ }
  }

  const handleSave = async (name: string) => {
    try {
      if (modal.editingId) {
        await api.categories.update(modal.editingId, { name })
        toast("Category updated", "success")
      } else {
        await api.categories.create({ name })
        toast("Category created", "success")
      }
      modal.close()
      notifyChange()
      load()
    } catch (e: any) {
      toast(e.message || "Failed to save", "error")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category?")) return
    try {
      await api.categories.delete(id)
      notifyChange()
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
      <div className="border border-gray-200 bg-white dark:border-0 dark:bg-gray-900">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <div>
            <h3 className="text-lg font-semibold dark:text-gray-100">Categories</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{categories.length} categories</p>
          </div>
        {isAdmin && (
          <button
            onClick={modal.openAdd}
            className="flex items-center gap-1.5 bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-white dark:hover:bg-emerald-600"
          >
            <Plus className="h-4 w-4" /> Add Category
          </button>
        )}
      </div>

      <Modal
        open={modal.isOpen}
        onClose={modal.close}
        title={modal.editingId ? "Edit Category" : "Add Category"}
      >
        <CategoryForm
          category={modal.editingId ? categories.find((c: any) => c.id === modal.editingId) : null}
          onSave={handleSave}
          onCancel={modal.close}
        />
      </Modal>

      <div>
        {!categories.length ? (
          <TableSkeleton rows={3} cols={isAdmin ? 4 : 3} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="h-10 border-b border-gray-200 text-left text-xs font-medium text-gray-400 dark:border-gray-700 dark:text-gray-500">
                    <th className="px-6 py-3 w-10">No.</th>
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Created</th>
                    {isAdmin && <th className="px-6 py-3 text-right">Actions</th>}
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
                      {isAdmin && (
                        <td className="px-6 py-2.5 text-right">
                          <button onClick={() => modal.openEdit(cat.id)} className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-200">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(cat.id)} className="rounded p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-gray-500 dark:hover:bg-red-950 dark:hover:text-red-400">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!categories.length && (
              <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">No categories found</p>
            )}
          </>
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
    <form onSubmit={handleSubmit}>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Category Name *</label>
        <input required value={name} onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none ring-emerald-500/20 transition-all focus:border-emerald-500 focus:ring-2 dark:border-gray-800 dark:bg-gray-700 dark:text-gray-200 dark:focus:border-emerald-400" />
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
