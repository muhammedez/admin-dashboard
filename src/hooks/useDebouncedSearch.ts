"use client"

import { useEffect, useRef, useCallback } from "react"

export function useDebouncedSearch(callback: () => void, deps: any[], delay = 300) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const skipNextRef = useRef(false)

  const skipNext = useCallback(() => {
    skipNextRef.current = true
  }, [])

  useEffect(() => {
    if (skipNextRef.current) {
      skipNextRef.current = false
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(callback, delay)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, deps)

  return { skipNext }
}
