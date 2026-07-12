"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth"
import { useToast } from "@/lib/toast"
import { User, Lock, Eye, EyeOff } from "lucide-react"

export default function AdminSettings() {
  const { user, refreshUser } = useAuth()
  const { toast } = useToast()
  const [name, setName] = useState(user?.name || "")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return
    setSaving(true)
    try {
      const body: any = { name }
      if (currentPassword || newPassword) {
        if (!currentPassword) { toast("Current password is required", "error"); setSaving(false); return }
        if (!newPassword || newPassword.length < 6) { toast("New password must be at least 6 characters", "error"); setSaving(false); return }
        body.currentPassword = currentPassword
        body.newPassword = newPassword
      }
      const res = await fetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Update failed" }))
        throw new Error(err.error)
      }
      await refreshUser()
      setCurrentPassword("")
      setNewPassword("")
      toast("Profile updated", "success")
    } catch (e: any) {
      toast(e.message || "Failed to update profile", "error")
    }
    setSaving(false)
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-gray-500">Manage your profile and password</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="border border-gray-200 bg-white p-6 dark:border-0 dark:bg-gray-900">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            <User className="h-4 w-4" /> Profile
          </h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2.5 text-sm text-gray-500 outline-none dark:border-gray-800 dark:bg-gray-800 dark:text-gray-400"
              />
              <p className="mt-1 text-xs text-gray-400">Email cannot be changed</p>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none ring-emerald-500/20 transition-all focus:border-emerald-500 focus:ring-2 dark:border-gray-800 dark:bg-gray-700 dark:text-gray-200 dark:focus:border-emerald-400"
              />
            </div>
          </div>
        </div>

        <div className="border border-gray-200 bg-white p-6 dark:border-0 dark:bg-gray-900">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            <Lock className="h-4 w-4" /> Change Password
          </h2>
          <p className="mb-4 text-xs text-gray-400">Leave blank to keep your current password</p>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 pr-10 text-sm outline-none ring-emerald-500/20 transition-all focus:border-emerald-500 focus:ring-2 dark:border-gray-800 dark:bg-gray-700 dark:text-gray-200 dark:focus:border-emerald-400"
                />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 pr-10 text-sm outline-none ring-emerald-500/20 transition-all focus:border-emerald-500 focus:ring-2 dark:border-gray-800 dark:bg-gray-700 dark:text-gray-200 dark:focus:border-emerald-400"
                />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium !text-white shadow-sm transition-all hover:bg-emerald-700 disabled:opacity-50 dark:bg-emerald-500 dark:hover:bg-emerald-600"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  )
}
