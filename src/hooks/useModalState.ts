"use client"

import { useState, useCallback } from "react"

export function useModalState<T = string>() {
  const [editingId, setEditingId] = useState<T | null>(null)
  const [showAdd, setShowAdd] = useState(false)

  const openAdd = useCallback(() => setShowAdd(true), [])
  const openEdit = useCallback((id: T) => setEditingId(id), [])
  const close = useCallback(() => {
    setShowAdd(false)
    setEditingId(null)
  }, [])

  return {
    isOpen: showAdd || !!editingId,
    editingId,
    openAdd,
    openEdit,
    close,
  }
}
