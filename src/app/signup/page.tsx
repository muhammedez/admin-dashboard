"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth"
import { UserPlus } from "lucide-react"

export default function SignupPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("client")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Signup failed" }))
        throw new Error(err.error)
      }
      const data = await res.json()
      await login(email, password)
      router.push(data.user.role === "admin" ? "/admin" : "/client")
    } catch (err: any) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white dark:bg-gray-950">
      <div className="w-full max-w-sm p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center bg-gray-900 text-lg font-bold text-white dark:bg-gray-700 dark:text-gray-100">
            D
          </div>
          <h1 className="text-xl font-semibold dark:text-gray-100">Create account</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Sign up for a new account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Name</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
                             className="w-full border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-gray-900 dark:border-gray-800 dark:bg-gray-700 dark:text-gray-200 dark:focus:border-gray-400" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                             className="w-full border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-gray-900 dark:border-gray-800 dark:bg-gray-700 dark:text-gray-200 dark:focus:border-gray-400" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Password</label>
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                             className="w-full border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-gray-900 dark:border-gray-800 dark:bg-gray-700 dark:text-gray-200 dark:focus:border-gray-400" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}
                             className="w-full border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-gray-900 dark:border-gray-800 dark:bg-gray-700 dark:text-gray-200 dark:focus:border-gray-400">
              <option value="client">Client</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <button type="submit" disabled={loading}
            className="flex w-full items-center justify-center gap-2 bg-emerald-600 py-2 text-sm font-medium !text-white hover:bg-emerald-700 disabled:opacity-50 dark:bg-emerald-500 dark:text-white dark:hover:bg-emerald-600">
            <UserPlus className="h-4 w-4" />
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-gray-900 underline dark:text-gray-100">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
