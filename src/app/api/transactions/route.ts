import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, Number(searchParams.get("page")) || 1)
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 10))
  const search = searchParams.get("search") || ""
  const status = searchParams.get("status") || ""
  const offset = (page - 1) * limit

  const db = getDb()
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

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""
  const countRow = db.prepare(`SELECT COUNT(*) as c FROM transactions ${where}`).get(...params) as any
  const total = countRow.c
  const data = db.prepare(`SELECT * FROM transactions ${where} ORDER BY timestamp DESC, id DESC LIMIT ? OFFSET ?`).all(...params, limit, offset)

  return NextResponse.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) })
}

export async function POST(request: Request) {
  const body = await request.json()
  const { customerName, productName, amount, status, paymentMethod } = body

  if (!customerName || !productName || amount == null) {
    return NextResponse.json({ error: "customerName, productName, and amount are required" }, { status: 400 })
  }

  const db = getDb()
  const id = `T-${Date.now()}`
  const timestamp = new Date().toISOString()

  db.prepare(
    "INSERT INTO transactions (id, customerName, productName, amount, status, timestamp, paymentMethod) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(id, customerName, productName, amount, status ?? "completed", timestamp, paymentMethod ?? "Credit Card")

  const transaction = db.prepare("SELECT * FROM transactions WHERE id = ?").get(id)
  return NextResponse.json(transaction, { status: 201 })
}
