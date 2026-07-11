"use client"

import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from "react"
import { api, setApiToken } from "./api"
import { useAuth } from "./auth"

interface EntityState {
  data: any[]
  total: number
  totalPages: number
}

interface DashboardStore {
  stats: any
  revenueData: any[]
  categoryRevenue: any[]
  paymentMethods: any[]
  dateRange: { from: string; to: string }
  setDateRange: (range: { from: string; to: string }) => void
  products: EntityState
  customers: EntityState
  transactions: EntityState
  categories: any[]
  recentTransactions: any[]
  productPage: number
  customerPage: number
  transactionPage: number
  productSearch: string
  customerSearch: string
  transactionSearch: string
  productCategory: string
  transactionFilter: string
  setProducts: (state: EntityState, page: number, search: string, category: string) => void
  setCustomers: (state: EntityState, page: number, search: string) => void
  setTransactions: (state: EntityState, page: number, search: string, filter: string) => void
  setCategories: (data: any[]) => void
  refreshRecentTransactions: () => Promise<void>
}

const empty: EntityState = { data: [], total: 0, totalPages: 0 }

const StoreContext = createContext<DashboardStore | null>(null)

const today = () => new Date().toISOString().split("T")[0]
const weekAgo = () => {
  const d = new Date()
  d.setDate(d.getDate() - 7)
  return d.toISOString().split("T")[0]
}

export function DashboardProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth()

  useEffect(() => {
    setApiToken(token)
  }, [token])

  const [stats, setStats] = useState<any>({
    totalRevenue: 0, totalTransactions: 0, activeCustomers: 0, totalProducts: 0,
    revenueChange: 0, transactionsChange: 0, customersChange: 0, productsChange: 0,
  })
  const [revenueData, setRevenueData] = useState<any[]>([])
  const [categoryRevenue, setCategoryRevenue] = useState<any[]>([])
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [dateRange, setDateRange] = useState({ from: weekAgo(), to: today() })

  const [products, setProductsState] = useState<EntityState>(empty)
  const [customers, setCustomersState] = useState<EntityState>(empty)
  const [transactions, setTransactionsState] = useState<EntityState>(empty)
  const [categories, setCategories] = useState<any[]>([])
  const [recentTransactions, setRecentTransactions] = useState<any[]>([])
  const [productPage, setProductPage] = useState(1)
  const [customerPage, setCustomerPage] = useState(1)
  const [transactionPage, setTransactionPage] = useState(1)
  const [productSearch, setProductSearch] = useState("")
  const [customerSearch, setCustomerSearch] = useState("")
  const [transactionSearch, setTransactionSearch] = useState("")
  const [productCategory, setProductCategory] = useState("All")
  const [transactionFilter, setTransactionFilter] = useState("all")

  const prefetched = useRef(false)

  const fetchStats = useCallback(async (from: string, to: string) => {
    try {
      const data = await api.stats.get({ from, to })
      setStats(data.stats)
      setRevenueData(data.revenueData)
      setCategoryRevenue(data.categoryRevenue)
      setPaymentMethods(data.paymentMethods)
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    fetchStats(dateRange.from, dateRange.to)
  }, [fetchStats, dateRange])

  const refreshRecentTransactions = useCallback(async () => {
    try {
      const result = await api.transactions.list({ limit: 50 })
      setRecentTransactions(result.data)
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    refreshRecentTransactions()
    const interval = setInterval(refreshRecentTransactions, 4000)
    return () => clearInterval(interval)
  }, [refreshRecentTransactions])

  useEffect(() => {
    if (prefetched.current) return
    prefetched.current = true
    api.products.list({ page: 1, limit: 10 }).then((r) => setProductsState(r)).catch(() => {})
    api.customers.list({ page: 1, limit: 10 }).then((r) => setCustomersState(r)).catch(() => {})
    api.transactions.list({ page: 1, limit: 10 }).then((r) => setTransactionsState(r)).catch(() => {})
    api.categories.list().then((r) => setCategories(r.data)).catch(() => {})
  }, [])

  const handleSetDateRange = useCallback((range: { from: string; to: string }) => {
    setDateRange(range)
  }, [])

  return (
    <StoreContext.Provider value={{
      stats, revenueData, categoryRevenue, paymentMethods, dateRange, setDateRange: handleSetDateRange,
      products, customers, transactions, categories, recentTransactions,
      productPage, customerPage, transactionPage,
      productSearch, customerSearch, transactionSearch,
      productCategory, transactionFilter,
      setProducts: (state, page, search, category) => { setProductsState(state); setProductPage(page); setProductSearch(search); setProductCategory(category) },
      setCustomers: (state, page, search) => { setCustomersState(state); setCustomerPage(page); setCustomerSearch(search) },
      setTransactions: (state, page, search, filter) => { setTransactionsState(state); setTransactionPage(page); setTransactionSearch(search); setTransactionFilter(filter) },
      setCategories: (data) => setCategories(data),
      refreshRecentTransactions,
    }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useDashboard() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error("useDashboard must be used within DashboardProvider")
  return ctx
}
