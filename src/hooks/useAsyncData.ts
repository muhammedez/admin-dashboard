"use client"

import { useState, useCallback } from "react"

export function useAsyncData<T>() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = useCallback(async (fetcher: () => Promise<T>): Promise<T | null> => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetcher()
      return result
    } catch (e: any) {
      setError(e.message || "Request failed")
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { loading, error, run }
}
