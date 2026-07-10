import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
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

  return NextResponse.json({
    stats: {
      totalRevenue,
      totalTransactions: txCount,
      activeCustomers: customerCount,
      totalProducts: productCount,
      revenueChange: 12.5,
      transactionsChange: 8.3,
      customersChange: 5.2,
      productsChange: 0,
    },
    revenueData,
    categoryRevenue: categoryRows,
    paymentMethods: paymentRows,
  })
}
