import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { requireAdmin } from "@/lib/api-auth"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const session = requireAdmin(request)
  if (session instanceof NextResponse) return session
  const { searchParams } = new URL(request.url)
  const from = searchParams.get("from") || ""
  const to = searchParams.get("to") || ""

  const db = getDb()
  const dateFilter = (col: string) => {
    const conditions: string[] = []
    const params: any[] = []
    if (from) { conditions.push(`${col} >= ?`); params.push(from) }
    if (to) { conditions.push(`${col} <= ?`); params.push(to + "T23:59:59") }
    return { clause: conditions.length ? `AND ${conditions.join(" AND ")}` : "", params }
  }

  const pf = dateFilter("createdAt")
  const tf = dateFilter("timestamp")
  const cf = dateFilter("joinedAt")

  const productCount = (db.prepare(`SELECT COUNT(*) as c FROM products WHERE 1=1 ${pf.clause}`).get(...pf.params) as any).c
  const customerCount = (db.prepare(`SELECT COUNT(*) as c FROM customers WHERE status = 'active' ${cf.clause}`).get(...cf.params) as any).c
  const txCount = (db.prepare(`SELECT COUNT(*) as c FROM transactions WHERE status = 'completed' ${tf.clause}`).get(...tf.params) as any).c
  const totalRevenue = (db.prepare(`SELECT COALESCE(SUM(amount),0) as s FROM transactions WHERE status = 'completed' ${tf.clause}`).get(...tf.params) as any).s

  const transactions = db.prepare(`SELECT amount, timestamp FROM transactions WHERE status = 'completed' ${tf.clause} ORDER BY timestamp`).all(...tf.params) as any[]

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const dayBuckets: Record<string, { revenue: number; count: number }> = {}
  for (const d of dayNames) dayBuckets[d] = { revenue: 0, count: 0 }

  for (const tx of transactions) {
    const date = new Date(tx.timestamp)
    const day = dayNames[date.getUTCDay()]
    dayBuckets[day].revenue += tx.amount
    dayBuckets[day].count++
  }

  const revenueData = dayNames.map((day) => ({
    date: day,
    revenue: Math.round(dayBuckets[day].revenue),
    transactions: dayBuckets[day].count,
  }))

  const categoryRows = db.prepare(`
    SELECT p.category, COALESCE(SUM(t.amount),0) as revenue, COUNT(t.id) as count
    FROM products p LEFT JOIN transactions t ON p.name = t.productName AND t.status = 'completed' ${tf.clause}
    GROUP BY p.category ORDER BY revenue DESC
  `).all(...tf.params) as any[]

  const paymentRows = db.prepare(`
    SELECT paymentMethod, COUNT(*) as count, COALESCE(SUM(amount),0) as revenue
    FROM transactions WHERE status = 'completed' ${tf.clause}
    GROUP BY paymentMethod ORDER BY count DESC
  `).all(...tf.params) as any[]

  const calcChange = (current: number, previous: number) => {
    if (!previous) return current > 0 ? 100 : 0
    return Math.round(((current - previous) / previous) * 1000) / 10
  }

  let prevRevenue = totalRevenue || 1
  let prevTxCount = txCount || 1
  let prevCustomerCount = customerCount || 1
  let prevProductCount = productCount || 1

  if (from) {
    const rangeLen = to ? new Date(to).getTime() - new Date(from).getTime() : 7 * 86400000
    const prevFrom = new Date(new Date(from).getTime() - rangeLen - 86400000).toISOString().split("T")[0]
    const prevTo = new Date(new Date(from).getTime() - 86400000).toISOString().split("T")[0]

    const prevProductFilter = `createdAt >= ? AND createdAt <= ?`
    const prevTxFilter = `timestamp >= ? AND timestamp <= ?`
    const prevCustFilter = `joinedAt >= ? AND joinedAt <= ?`
    const prevParams = [prevFrom, prevTo + "T23:59:59"]

    const pc = db.prepare(`SELECT COUNT(*) as c FROM products WHERE ${prevProductFilter}`).get(...prevParams) as any
    prevProductCount = pc.c || 1

    const tc = db.prepare(`SELECT COUNT(*) as c FROM transactions WHERE status = 'completed' AND ${prevTxFilter}`).get(...prevParams) as any
    prevTxCount = tc.c || 1

    const rv = db.prepare(`SELECT COALESCE(SUM(amount),0) as s FROM transactions WHERE status = 'completed' AND ${prevTxFilter}`).get(...prevParams) as any
    prevRevenue = rv.s || 1

    const cc = db.prepare(`SELECT COUNT(*) as c FROM customers WHERE status = 'active' AND ${prevCustFilter}`).get(...prevParams) as any
    prevCustomerCount = cc.c || 1
  }

  return NextResponse.json({
    stats: {
      totalRevenue,
      totalTransactions: txCount,
      activeCustomers: customerCount,
      totalProducts: productCount,
      revenueChange: totalRevenue ? calcChange(totalRevenue, prevRevenue) : 0,
      transactionsChange: txCount ? calcChange(txCount, prevTxCount) : 0,
      customersChange: customerCount ? calcChange(customerCount, prevCustomerCount) : 0,
      productsChange: productCount ? calcChange(productCount, prevProductCount) : 0,
    },
    revenueData,
    categoryRevenue: categoryRows,
    paymentMethods: paymentRows,
  })
}
