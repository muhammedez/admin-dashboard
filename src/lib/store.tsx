"use client"

import { createContext, useContext, useEffect, useState, useCallback, useMemo, type ReactNode } from "react"
import { api } from "./api"


interface EntityState {
  data: any[]
  total: number
  totalPages: number
}

export interface Notification {
  id: number
  message: string
  transactionId?: string
  read: boolean
  timestamp: number
  productName?: string
  amount?: number
  customerName?: string
}

interface DashboardStore {
  stats: any
  revenueData: any[]
  categoryRevenue: any[]
  paymentMethods: any[]
  dateRange: { from: string; to: string }
  setDateRange: (range: { from: string; to: string }) => void
  clientDateRange: { from: string; to: string }
  setClientDateRange: (range: { from: string; to: string }) => void
  products: EntityState
  customers: EntityState
  transactions: EntityState
  adminOrders: EntityState
  clientOrders: EntityState
  categories: any[]
  recentTransactions: any[]
  clientStats: any
  clientRevenueData: any[]
  clientCategoryRevenue: any[]
  clientPaymentMethods: any[]
  clientName: string
  clientTotalProducts: number
  clientLoading: boolean
  productPage: number
  customerPage: number
  transactionPage: number
  adminOrderPage: number
  clientOrderPage: number
  productSearch: string
  customerSearch: string
  transactionSearch: string
  adminOrderSearch: string
  clientOrderSearch: string
  productCategory: string
  transactionFilter: string
  setProducts: (state: EntityState, page: number, search: string, category: string) => void
  setCustomers: (state: EntityState, page: number, search: string) => void
  setTransactions: (state: EntityState, page: number, search: string, filter: string) => void
  setAdminOrders: (state: EntityState, page: number, search: string) => void
  setClientOrders: (state: EntityState, page: number, search: string) => void
  setCategories: (data: any[]) => void
  refreshRecentTransactions: () => Promise<void>
  notifyChange: () => void
  fetchAdminOrders: (page: number, search: string) => Promise<void>
  fetchClientOrders: (page: number, search: string, customerName: string) => Promise<void>
  notifications: Notification[]
  pushNotification: (message: string, transactionId?: string, productName?: string, amount?: number, customerName?: string) => void
  markNotificationRead: (id: number) => void
}

const empty: EntityState = { data: [], total: 0, totalPages: 0 }

const StoreContext = createContext<DashboardStore | null>(null)

export function DashboardProvider({ children, role: providerRole }: { children: ReactNode; role?: string }) {

  const [stats, setStats] = useState<any>({
    totalRevenue: 0, totalTransactions: 0, activeCustomers: 0, totalProducts: 0,
    revenueChange: 0, transactionsChange: 0, customersChange: 0, productsChange: 0,
  })
  const [revenueData, setRevenueData] = useState<any[]>([])
  const [categoryRevenue, setCategoryRevenue] = useState<any[]>([])
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [dateRange, setDateRange] = useState({ from: "", to: "" })
  const [clientDateRange, setClientDateRangeState] = useState({ from: "", to: "" })

  const [products, setProductsState] = useState<EntityState>(empty)
  const [customers, setCustomersState] = useState<EntityState>(empty)
  const [transactions, setTransactionsState] = useState<EntityState>(empty)
  const [adminOrders, setAdminOrdersState] = useState<EntityState>(empty)
  const [clientOrders, setClientOrdersState] = useState<EntityState>(empty)
  const [categories, setCategories] = useState<any[]>([])
  const [recentTransactions, setRecentTransactions] = useState<any[]>([])
  const [clientStats, setClientStats] = useState<any>({ totalSpent: 0, totalTransactions: 0, totalRevenue: 0, revenueChange: 0, ordersChange: 0 })
  const [clientRevenueData, setClientRevenueData] = useState<any[]>([])
  const [clientCategoryRevenue, setClientCategoryRevenue] = useState<any[]>([])
  const [clientPaymentMethods, setClientPaymentMethods] = useState<any[]>([])
  const [clientName, setClientName] = useState("")
  const [clientLoading, setClientLoading] = useState(true)
  const [notifications, setNotifications] = useState<Notification[]>([])

  const pushNotification = useCallback((message: string, transactionId?: string, productName?: string, amount?: number, customerName?: string) => {
    const id = Date.now() + Math.random()
    setNotifications((prev) => [{ id, message, transactionId, read: false, timestamp: Date.now(), productName, amount, customerName }, ...prev])
  }, [])

  const markNotificationRead = useCallback((id: number) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n))
  }, [])
  const [clientTotalProducts, setClientTotalProducts] = useState(0)
  const [productPage, setProductPage] = useState(1)
  const [customerPage, setCustomerPage] = useState(1)
  const [transactionPage, setTransactionPage] = useState(1)
  const [adminOrderPage, setAdminOrderPage] = useState(1)
  const [clientOrderPage, setClientOrderPage] = useState(1)
  const [productSearch, setProductSearch] = useState("")
  const [customerSearch, setCustomerSearch] = useState("")
  const [transactionSearch, setTransactionSearch] = useState("")
  const [adminOrderSearch, setAdminOrderSearch] = useState("")
  const [clientOrderSearch, setClientOrderSearch] = useState("")
  const [productCategory, setProductCategory] = useState("All")
  const [transactionFilter, setTransactionFilter] = useState("all")

  const fetchStats = useCallback(async (from: string, to: string) => {
    try {
      const data = await api.stats.get({ from, to })
      setStats(data.stats)
      setRevenueData(data.revenueData)
      setCategoryRevenue(data.categoryRevenue)
      setPaymentMethods(data.paymentMethods)
    } catch { /* silent */ }
  }, [])

  const refreshRecentTransactions = useCallback(async () => {
    if (providerRole !== "admin") return
    try {
      const result = await api.transactions.list({ limit: 50, excludeStatus: "pending" })
      setRecentTransactions(result.data)
    } catch { /* silent */ }
  }, [providerRole])

  const fetchClientTransactions = useCallback(async () => {
    try {
      const res = await fetch("/api/client/transactions?page=1&limit=10")
      const result = await res.json()
      setTransactionsState(result)
    } catch { /* silent */ }
  }, [])

  const fetchClientStats = useCallback(async (from?: string, to?: string) => {
    try {
      const params = new URLSearchParams()
      if (from) params.set("from", from)
      if (to) params.set("to", to)
      const qs = params.toString()
      const res = await fetch(`/api/client/stats${qs ? `?${qs}` : ""}`)
      const data = await res.json()
      if (data.stats) {
        setClientStats(data.stats)
        setClientRevenueData(data.revenueData || [])
        setClientCategoryRevenue(data.categoryRevenue || [])
        setClientPaymentMethods(data.paymentMethods || [])
        setClientName(data.customerName || "")
        setClientTotalProducts(data.totalProducts || 0)
      }
    } catch { /* silent */ }
    setClientLoading(false)
  }, [])

  const refreshAll = useCallback(async () => {
    const promises: Promise<any>[] = [
      api.products.list({ page: 1, limit: 10 }).then((p) => setProductsState(p)).catch(() => {}),
      api.categories.list().then((cat) => setCategories(cat.data)).catch(() => {}),
    ]
    if (providerRole === "admin") {
      promises.push(
        api.customers.list({ page: 1, limit: 10 }).then((c) => setCustomersState(c)).catch(() => {}),
        api.transactions.list({ page: 1, limit: 10, excludeStatus: "pending" }).then((t) => setTransactionsState(t)).catch(() => {}),
      )
    }
    await Promise.all(promises)
    if (providerRole === "admin") {
      await fetchStats(dateRange.from, dateRange.to)
    }
  }, [fetchStats, dateRange, providerRole])

  const fetchAdminOrders = useCallback(async (page: number, search: string) => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: "10" })
      if (search) params.set("search", search)
      const res = await fetch(`/api/admin/orders?${params}`)
      const result = await res.json()
      setAdminOrdersState(result)
    } catch { /* silent */ }
  }, [])

  const fetchClientOrders = useCallback(async (page: number, search: string, customerName: string) => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: "10", status: "pending" })
      if (search) params.set("search", search)
      const res = await fetch(`/api/client/transactions?${params}`)
      const result = await res.json()
      setClientOrdersState(result)
    } catch { /* silent */ }
  }, [])

  const notifyChange = useCallback(() => {
    refreshAll()
    if (providerRole === "admin") {
      refreshRecentTransactions()
      fetchAdminOrders(adminOrderPage, adminOrderSearch)
    } else {
      fetchClientTransactions()
      if (clientName) fetchClientOrders(clientOrderPage, clientOrderSearch, clientName)
    }
    fetchClientStats(clientDateRange.from, clientDateRange.to)
  }, [refreshAll, refreshRecentTransactions, fetchClientStats, fetchClientTransactions, clientDateRange, adminOrderPage, adminOrderSearch, clientOrderPage, clientOrderSearch, clientName, providerRole])

  useEffect(() => {
    refreshAll()
    refreshRecentTransactions()
    fetchClientTransactions()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchClientStats(clientDateRange.from, clientDateRange.to)
  }, [clientDateRange, fetchClientStats])

  useEffect(() => {
    let id: ReturnType<typeof setInterval>
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        id = setInterval(() => notifyChange(), 30000)
        notifyChange()
      } else {
        clearInterval(id)
      }
    }
    id = setInterval(() => notifyChange(), 30000)
    document.addEventListener("visibilitychange", onVisibility)
    return () => {
      clearInterval(id)
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [notifyChange])

  const handleSetDateRange = useCallback((range: { from: string; to: string }) => {
    setDateRange(range)
  }, [])

  const handleSetClientDateRange = useCallback((range: { from: string; to: string }) => {
    setClientDateRangeState(range)
  }, [])

  const handleSetProducts = useCallback((state: EntityState, page: number, search: string, category: string) => {
    setProductsState(state); setProductPage(page); setProductSearch(search); setProductCategory(category)
  }, [])
  const handleSetCustomers = useCallback((state: EntityState, page: number, search: string) => {
    setCustomersState(state); setCustomerPage(page); setCustomerSearch(search)
  }, [])
  const handleSetTransactions = useCallback((state: EntityState, page: number, search: string, filter: string) => {
    setTransactionsState(state); setTransactionPage(page); setTransactionSearch(search); setTransactionFilter(filter)
  }, [])
  const handleSetAdminOrders = useCallback((state: EntityState, page: number, search: string) => {
    setAdminOrdersState(state); setAdminOrderPage(page); setAdminOrderSearch(search)
  }, [])
  const handleSetClientOrders = useCallback((state: EntityState, page: number, search: string) => {
    setClientOrdersState(state); setClientOrderPage(page); setClientOrderSearch(search)
  }, [])
  const handleSetCategories = useCallback((data: any[]) => setCategories(data), [])

  const ctx = useMemo(() => ({
    stats, revenueData, categoryRevenue, paymentMethods, dateRange, setDateRange: handleSetDateRange,
    clientDateRange, setClientDateRange: handleSetClientDateRange,
    products, customers, transactions, adminOrders, clientOrders, categories, recentTransactions,
    clientStats, clientRevenueData, clientCategoryRevenue, clientPaymentMethods, clientName, clientTotalProducts, clientLoading,
    productPage, customerPage, transactionPage, adminOrderPage, clientOrderPage,
    productSearch, customerSearch, transactionSearch, adminOrderSearch, clientOrderSearch,
    productCategory, transactionFilter,
    setProducts: handleSetProducts,
    setCustomers: handleSetCustomers,
    setTransactions: handleSetTransactions,
    setAdminOrders: handleSetAdminOrders,
    setClientOrders: handleSetClientOrders,
    setCategories: handleSetCategories,
    refreshRecentTransactions,
    notifyChange,
    fetchAdminOrders,
    fetchClientOrders,
    notifications, pushNotification, markNotificationRead,
  }), [
    stats, revenueData, categoryRevenue, paymentMethods, dateRange, clientDateRange,
    products, customers, transactions, adminOrders, clientOrders, categories, recentTransactions,
    clientStats, clientRevenueData, clientCategoryRevenue, clientPaymentMethods, clientName, clientTotalProducts, clientLoading,
    productPage, customerPage, transactionPage, adminOrderPage, clientOrderPage,
    productSearch, customerSearch, transactionSearch, adminOrderSearch, clientOrderSearch,
    productCategory, transactionFilter,
    handleSetDateRange, handleSetClientDateRange,
    handleSetProducts, handleSetCustomers, handleSetTransactions, handleSetAdminOrders, handleSetClientOrders, handleSetCategories,
    refreshRecentTransactions, notifyChange, fetchAdminOrders, fetchClientOrders,
    notifications, pushNotification, markNotificationRead,
  ])

  return (
    <StoreContext.Provider value={ctx}>
      {children}
    </StoreContext.Provider>
  )
}

export function useDashboard() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error("useDashboard must be used within DashboardProvider")
  return ctx
}
