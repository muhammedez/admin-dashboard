export interface Product {
  id: string
  name: string
  category: string
  price: number
  stock: number
  image: string
  description: string
  createdAt: string
}

export interface Customer {
  id: string
  name: string
  email: string
  totalOrders: number
  totalSpent: number
  joinedAt: string
  status: "active" | "inactive"
}

export interface Transaction {
  id: string
  customerName: string
  productName: string
  amount: number
  status: "completed" | "pending" | "failed"
  timestamp: string
  paymentMethod: string
}

export interface RevenueEntry {
  date: string
  revenue: number
  transactions: number
}

export interface DashboardStats {
  totalRevenue: number
  totalTransactions: number
  activeCustomers: number
  totalProducts: number
  revenueChange: number
  transactionsChange: number
  customersChange: number
  productsChange: number
}
