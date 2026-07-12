import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { requireAdmin } from "@/lib/api-auth"
import { broadcastChange } from "@/lib/sse"
import { validate, createProductSchema } from "@/lib/validation"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, Number(searchParams.get("page")) || 1)
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 10))
  const search = searchParams.get("search") || ""
  const category = searchParams.get("category") || ""
  const offset = (page - 1) * limit

  const db = await getDb()
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
  const countRow = await db.prepare(`SELECT COUNT(*) as c FROM products ${where}`).get(...params) as any
  const total = countRow.c
  const data = await db.prepare(`SELECT * FROM products ${where} ORDER BY createdAt DESC, id DESC LIMIT ? OFFSET ?`).all(...params, limit, offset)

  return NextResponse.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) })
}

export async function POST(request: Request) {
  const session = await requireAdmin(request)
  if (session instanceof NextResponse) return session
  const body = await request.json()
  const parsed = validate(createProductSchema, body)
  if ("error" in parsed) return parsed.error
  const { name, category, price, stock, description } = parsed.data

  const db = await getDb()
  const id = `P-${Date.now()}`
  const createdAt = new Date().toISOString().split("T")[0]

  await db.prepare(
    "INSERT INTO products (id, name, category, price, stock, description, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(id, name, category, price, stock, description, createdAt)

  const product = await db.prepare("SELECT * FROM products WHERE id = ?").get(id)
  broadcastChange("products")
  return NextResponse.json(product, { status: 201 })
}
