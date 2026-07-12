import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { getSessionUser } from "@/lib/api-auth"
import { broadcastChange } from "@/lib/sse"
import { validate, placeOrderSchema } from "@/lib/validation"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const session = await getSessionUser(request)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const db = await getDb()
  const customer = await db.prepare("SELECT name FROM customers WHERE userId = ?").get(session.userId) as any

  if (!customer) {
    return NextResponse.json({ data: [], total: 0, page: 1, limit: 10, totalPages: 0 })
  }

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, Number(searchParams.get("page")) || 1)
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 10))
  const search = searchParams.get("search") || ""
  const status = searchParams.get("status") || ""
  const excludeStatus = searchParams.get("excludeStatus") || ""
  const offset = (page - 1) * limit

  const conditions: string[] = ["customerName = ?"]
  const params: any[] = [customer.name]

  if (search) {
    conditions.push("(productName LIKE ? OR id LIKE ?)")
    params.push(`%${search}%`, `%${search}%`)
  }
  if (status && status !== "all") {
    conditions.push("status = ?")
    params.push(status)
  }
  if (excludeStatus) {
    conditions.push("status != ?")
    params.push(excludeStatus)
  }

  const where = "WHERE " + conditions.join(" AND ")
  const countRow = await db.prepare(`SELECT COUNT(*) as c FROM transactions ${where}`).get(...params) as any
  const total = countRow.c
  const data = await db.prepare(`SELECT * FROM transactions ${where} ORDER BY timestamp DESC, id DESC LIMIT ? OFFSET ?`).all(...params, limit, offset)

  return NextResponse.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) })
}

export async function POST(request: NextRequest) {
  const session = await getSessionUser(request)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const db = await getDb()
  const customer = await db.prepare("SELECT name FROM customers WHERE userId = ?").get(session.userId) as any
  if (!customer) {
    return NextResponse.json({ error: "No customer profile" }, { status: 404 })
  }

  const body = await request.json()
  const parsed = validate(placeOrderSchema, body)
  if ("error" in parsed) return parsed.error

  const { productName, quantity, paymentMethod } = parsed.data

  const product = await db.prepare("SELECT * FROM products WHERE name = ?").get(productName) as any
  if (!product) return NextResponse.json({ error: `Product "${productName}" not found` }, { status: 404 })
  if (product.stock < quantity) {
    return NextResponse.json({ error: `Insufficient stock. Only ${product.stock} available` }, { status: 400 })
  }

  const amount = product.price * quantity
  const id = `T-${Date.now()}`
  const timestamp = new Date().toISOString()

  await db.prepare(
    "INSERT INTO transactions (id, customerName, productName, amount, status, timestamp, paymentMethod, quantity) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(id, customer.name, productName, amount, "pending", timestamp, paymentMethod, quantity)

  await db.prepare("UPDATE products SET stock = stock - ? WHERE name = ?").run(quantity, productName)

  await db.prepare("UPDATE customers SET totalOrders = totalOrders + 1, totalSpent = totalSpent + ? WHERE name = ?").run(amount, customer.name)

  const transaction = await db.prepare("SELECT * FROM transactions WHERE id = ?").get(id)
  broadcastChange("products")
  broadcastChange("customers")
  broadcastChange("transactions")
  broadcastChange("notification", {
    customerName: customer.name,
    message: `New order from ${customer.name}`,
    transactionId: id,
    productName,
    amount,
  })
  return NextResponse.json(transaction, { status: 201 })
}
