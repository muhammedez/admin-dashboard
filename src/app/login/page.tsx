"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { LogIn } from "lucide-react"

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState("admin@dashboard.com")
  const [password, setPassword] = useState("admin123")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await login(email, password)
      router.push("/admin")
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
          <h1 className="text-xl font-semibold dark:text-gray-100">Welcome back</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Sign in to your dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Email</label>
            <input
              type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)}
               className="w-full border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-gray-900 dark:border-gray-800 dark:bg-gray-700 dark:text-gray-200 dark:focus:border-gray-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Password</label>
            <input
              type="password" required value={password}
              onChange={(e) => setPassword(e.target.value)}
               className="w-full border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-gray-900 dark:border-gray-800 dark:bg-gray-700 dark:text-gray-200 dark:focus:border-gray-400"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <button
            type="submit" disabled={loading}
            className="flex w-full items-center justify-center gap-2 bg-emerald-600 py-2 text-sm font-medium !text-white hover:bg-emerald-700 disabled:opacity-50 dark:bg-emerald-500 dark:text-white dark:hover:bg-emerald-600"
          >
            <LogIn className="h-4 w-4" />
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-6 border-b border-gray-100 pb-3 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
          <p className="font-medium mb-1">Demo accounts:</p>
          <p>Admin: admin@dashboard.com / admin123</p>
          <p>Client: client@dashboard.com / client123</p>
        </div>

        <p className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-gray-900 underline dark:text-gray-100">Sign up</Link>
        </p>
      </div>
    </div>
  )
}
