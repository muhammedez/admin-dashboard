import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { getSessionUser } from "@/lib/api-auth"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser(request)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const db = await getDb()
  const customer = await db.prepare("SELECT name FROM customers WHERE userId = ?").get(session.userId) as any
  if (!customer) return NextResponse.json({ error: "No customer profile" }, { status: 404 })

  const transaction = await db.prepare("SELECT * FROM transactions WHERE id = ? AND customerName = ?").get(id, customer.name)
  if (!transaction) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json(transaction)
}
