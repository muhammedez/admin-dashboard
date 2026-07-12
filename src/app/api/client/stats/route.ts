import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { getTokenFromRequest, getSessionUser } from "@/lib/api-auth"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const session = await getSessionUser(request)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const db = await getDb()
  const customer = await db.prepare("SELECT * FROM customers WHERE userId = ?").get(session.userId) as any

  if (!customer) {
    return NextResponse.json({
      stats: { totalRevenue: 0, totalTransactions: 0, totalOrders: 0, totalSpent: 0, revenueChange: 0, ordersChange: 0 },
      revenueData: [],
    })
  }

  const { searchParams } = new URL(request.url)
  const from = searchParams.get("from") || ""
  const to = searchParams.get("to") || ""

  const dateFilter = (col: string) => {
    const conditions: string[] = [`${col} >= '1970-01-01'`]
    const params: any[] = []
    if (from) { conditions.push(`${col} >= ?`); params.push(from) }
    if (to) { conditions.push(`${col} <= ?`); params.push(to + "T23:59:59") }
    return { clause: conditions.length ? `AND ${conditions.join(" AND ")}` : "", params: params.length ? params : [] }
  }

  const tf = dateFilter("timestamp")
  const custName = customer.name

  const txCount = (await db.prepare(`SELECT COUNT(*) as c FROM transactions WHERE customerName = ? ${tf.clause}`).get(custName, ...tf.params) as any).c
  const totalSpent = (await db.prepare(`SELECT COALESCE(SUM(amount),0) as s FROM transactions WHERE customerName = ? ${tf.clause}`).get(custName, ...tf.params) as any).s

  const transactions = await db.prepare(`SELECT amount, timestamp FROM transactions WHERE customerName = ? ${tf.clause} ORDER BY timestamp`).all(custName, ...tf.params) as any[]

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

  let prevTxCount = txCount || 1
  let prevSpent = totalSpent || 1

  if (from) {
    const rangeLen = to ? new Date(to).getTime() - new Date(from).getTime() : 7 * 86400000
    const prevFrom = new Date(new Date(from).getTime() - rangeLen - 86400000).toISOString().split("T")[0]
    const prevTo = new Date(new Date(from).getTime() - 86400000).toISOString().split("T")[0]

    const tc = await db.prepare(`SELECT COUNT(*) as c FROM transactions WHERE customerName = ? AND timestamp >= ? AND timestamp <= ?`).get(custName, prevFrom, prevTo + "T23:59:59") as any
    prevTxCount = tc.c || 1

    const sp = await db.prepare(`SELECT COALESCE(SUM(amount),0) as s FROM transactions WHERE customerName = ? AND timestamp >= ? AND timestamp <= ?`).get(custName, prevFrom, prevTo + "T23:59:59") as any
    prevSpent = sp.s || 1
  }

  const productCount = (await db.prepare("SELECT COUNT(*) as c FROM products").get() as any).c

  const paymentMethods = await db.prepare(`
    SELECT paymentMethod, COUNT(*) as count, COALESCE(SUM(amount),0) as revenue
    FROM transactions WHERE customerName = ? ${tf.clause}
    GROUP BY paymentMethod ORDER BY count DESC
  `).all(custName, ...tf.params) as any[]

  const categoryRevenue = await db.prepare(`
    SELECT p.category, COALESCE(SUM(t.amount),0) as revenue, COUNT(t.id) as count
    FROM transactions t JOIN products p ON t.productName = p.name
    WHERE t.customerName = ? ${tf.clause}
    GROUP BY p.category ORDER BY revenue DESC
  `).all(custName, ...tf.params) as any[]

  const calcChange = (current: number, previous: number) => {
    if (!previous) return current > 0 ? 100 : 0
    return Math.round(((current - previous) / previous) * 1000) / 10
  }

  return NextResponse.json({
    customerName: custName,
    totalProducts: productCount,
    stats: {
      totalRevenue: totalSpent,
      totalTransactions: txCount,
      totalOrders: customer.totalOrders,
      totalSpent,
      revenueChange: totalSpent ? calcChange(totalSpent, prevSpent) : 0,
      ordersChange: txCount ? calcChange(txCount, prevTxCount) : 0,
    },
    revenueData,
    categoryRevenue,
    paymentMethods,
  })
}
