import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { requireAdmin } from "@/lib/api-auth"
import { broadcastChange } from "@/lib/sse"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const session = await requireAdmin(request)
  if (session instanceof NextResponse) return session
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, Number(searchParams.get("page")) || 1)
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 10))
  const search = searchParams.get("search") || ""
  const status = searchParams.get("status") || ""
  const customerName = searchParams.get("customerName") || ""
  const offset = (page - 1) * limit

  const db = await getDb()
  const conditions: string[] = []
  const params: any[] = []

  if (search) {
    conditions.push("(customerName LIKE ? OR productName LIKE ? OR id LIKE ?)")
    params.push(`%${search}%`, `%${search}%`, `%${search}%`)
  }
  if (status && status !== "all") {
    conditions.push("status = ?")
    params.push(status)
  }
  if (customerName) {
    conditions.push("customerName = ?")
    params.push(customerName)
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""
  const countRow = await db.prepare(`SELECT COUNT(*) as c FROM transactions ${where}`).get(...params) as any
  const total = countRow.c
  const data = await db.prepare(`SELECT * FROM transactions ${where} ORDER BY timestamp DESC, id DESC LIMIT ? OFFSET ?`).all(...params, limit, offset)

  return NextResponse.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) })
}

export async function POST(request: Request) {
  const session = await requireAdmin(request)
  if (session instanceof NextResponse) return session
  const body = await request.json()
  const { customerName, productName, amount, quantity, status, paymentMethod } = body

  if (!customerName || !productName || amount == null) {
    return NextResponse.json({ error: "customerName, productName, and amount are required" }, { status: 400 })
  }

  const db = await getDb()
  const qty = Math.max(1, parseInt(quantity, 10) || 1)

  const product = await db.prepare("SELECT * FROM products WHERE name = ?").get(productName) as any
  if (product && product.stock < qty) {
    return NextResponse.json({ error: `Insufficient stock. Only ${product.stock} available for ${productName}` }, { status: 400 })
  }

  const id = `T-${Date.now()}`
  const timestamp = new Date().toISOString()

  await db.prepare(
    "INSERT INTO transactions (id, customerName, productName, amount, status, timestamp, paymentMethod) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(id, customerName, productName, amount, status ?? "completed", timestamp, paymentMethod ?? "Credit Card")

  if (product) {
    await db.prepare("UPDATE products SET stock = stock - ? WHERE name = ?").run(qty, productName)
  }

  const customer = await db.prepare("SELECT * FROM customers WHERE name = ?").get(customerName) as any
  if (customer) {
    await db.prepare("UPDATE customers SET totalOrders = totalOrders + 1, totalSpent = totalSpent + ? WHERE name = ?").run(amount, customerName)
  }

  const transaction = await db.prepare("SELECT * FROM transactions WHERE id = ?").get(id)
  broadcastChange("products")
  broadcastChange("customers")
  broadcastChange("transactions")
  return NextResponse.json(transaction, { status: 201 })
}
