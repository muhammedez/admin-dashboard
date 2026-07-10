import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, Number(searchParams.get("page")) || 1)
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 10))
  const search = searchParams.get("search") || ""
  const category = searchParams.get("category") || ""
  const offset = (page - 1) * limit

  const db = getDb()
  const conditions: string[] = []
  const params: any[] = []

  if (search) {
    conditions.push("(name LIKE ? OR id LIKE ?)")
    params.push(`%${search}%`, `%${search}%`)
  }
  if (category) {
    conditions.push("category = ?")
    params.push(category)
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""
  const countRow = db.prepare(`SELECT COUNT(*) as c FROM products ${where}`).get(...params) as any
  const total = countRow.c
  const data = db.prepare(`SELECT * FROM products ${where} ORDER BY createdAt DESC, id DESC LIMIT ? OFFSET ?`).all(...params, limit, offset)

  return NextResponse.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) })
}

export async function POST(request: Request) {
  const body = await request.json()
  const { name, category, price, stock, description } = body

  if (!name || !category || price == null) {
    return NextResponse.json({ error: "name, category, and price are required" }, { status: 400 })
  }

  const db = getDb()
  const id = `P-${Date.now()}`
  const createdAt = new Date().toISOString().split("T")[0]

  db.prepare(
    "INSERT INTO products (id, name, category, price, stock, description, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(id, name, category, price, stock ?? 0, description ?? "", createdAt)

  const product = db.prepare("SELECT * FROM products WHERE id = ?").get(id)
  return NextResponse.json(product, { status: 201 })
}
