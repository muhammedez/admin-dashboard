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
  const offset = (page - 1) * limit

  const db = await getDb()
  const conditions: string[] = []
  const params: any[] = []

  if (search) {
    conditions.push("(name LIKE ? OR email LIKE ? OR id LIKE ?)")
    params.push(`%${search}%`, `%${search}%`, `%${search}%`)
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""
  const countRow = await db.prepare(`SELECT COUNT(*) as c FROM customers ${where}`).get(...params) as any
  const total = countRow.c
  const data = await db.prepare(`SELECT * FROM customers ${where} ORDER BY joinedAt DESC, id DESC LIMIT ? OFFSET ?`).all(...params, limit, offset)

  return NextResponse.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) })
}

export async function POST(request: Request) {
  const session = await requireAdmin(request)
  if (session instanceof NextResponse) return session
  const body = await request.json()
  const { name, email, status } = body

  if (!name || !email) {
    return NextResponse.json({ error: "name and email are required" }, { status: 400 })
  }

  const db = await getDb()
  const id = `C-${Date.now().toString().slice(-6)}`
  const joinedAt = new Date().toISOString().split("T")[0]

  try {
    await db.prepare(
      "INSERT INTO customers (id, name, email, totalOrders, totalSpent, joinedAt, status) VALUES (?, ?, ?, 0, 0, ?, ?)"
    ).run(id, name, email, joinedAt, status ?? "active")
  } catch (err: any) {
    if (err.message?.includes("UNIQUE")) {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 })
    }
    throw err
  }

  const customer = await db.prepare("SELECT * FROM customers WHERE id = ?").get(id)
  broadcastChange("customers")
  return NextResponse.json(customer, { status: 201 })
}
