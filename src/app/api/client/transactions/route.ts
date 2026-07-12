import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { getSessionUser } from "@/lib/api-auth"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const session = await getSessionUser(request)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!session) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 })
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

  const where = "WHERE " + conditions.join(" AND ")
  const countRow = await db.prepare(`SELECT COUNT(*) as c FROM transactions ${where}`).get(...params) as any
  const total = countRow.c
  const data = await db.prepare(`SELECT * FROM transactions ${where} ORDER BY timestamp DESC, id DESC LIMIT ? OFFSET ?`).all(...params, limit, offset)

  return NextResponse.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) })
}
