import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { requireAdmin } from "@/lib/api-auth"
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
  const conditions: string[] = ["status = 'pending'"]
  const params: any[] = []

  if (search) {
    conditions.push("(customerName LIKE ? OR productName LIKE ? OR id LIKE ?)")
    params.push(`%${search}%`, `%${search}%`, `%${search}%`)
  }

  const where = "WHERE " + conditions.join(" AND ")
  const countRow = await db.prepare(`SELECT COUNT(*) as c FROM transactions ${where}`).get(...params) as any
  const total = countRow.c
  const data = await db.prepare(`SELECT * FROM transactions ${where} ORDER BY timestamp DESC, id DESC LIMIT ? OFFSET ?`).all(...params, limit, offset)

  return NextResponse.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) })
}
