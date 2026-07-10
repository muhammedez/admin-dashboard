"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface SidebarContext {
  open: boolean
  toggle: () => void
  close: () => void
}

const Ctx = createContext<SidebarContext>({
  open: true,
  toggle: () => {},
  close: () => {},
})

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(true)

  useEffect(() => {
    setOpen(window.innerWidth >= 1024)
  }, [])

  const toggle = () => setOpen((prev) => !prev)
  const close = () => setOpen(false)

  return (
    <Ctx.Provider value={{ open, toggle, close }}>
      {children}
    </Ctx.Provider>
  )
}

export function useSidebar() {
  return useContext(Ctx)
}
