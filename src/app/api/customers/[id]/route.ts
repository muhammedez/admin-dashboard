import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { requireAdmin } from "@/lib/api-auth"
import { broadcastChange } from "@/lib/sse"
import { validate, updateCustomerSchema } from "@/lib/validation"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin(request)
  if (session instanceof NextResponse) return session
  const { id } = await params
  const db = await getDb()
  const customer = await db.prepare("SELECT * FROM customers WHERE id = ?").get(id)
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const transactions = await db.prepare("SELECT * FROM transactions WHERE customerName = ? ORDER BY timestamp DESC LIMIT 20").all((customer as any).name)
  return NextResponse.json({ customer, transactions })
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin(request)
  if (session instanceof NextResponse) return session
  const { id } = await params
  const body = await request.json()
  const parsed = validate(updateCustomerSchema, body)
  if ("error" in parsed) return parsed.error
  const { name, email, status, totalOrders, totalSpent } = parsed.data
  const db = await getDb()

  const existing = await db.prepare("SELECT * FROM customers WHERE id = ?").get(id) as any
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await db.prepare(
    "UPDATE customers SET name = ?, email = ?, status = ?, totalOrders = ?, totalSpent = ? WHERE id = ?"
  ).run(
    name ?? existing.name,
    email ?? existing.email,
    status ?? existing.status,
    totalOrders ?? existing.totalOrders,
    totalSpent ?? existing.totalSpent,
    id,
  )

  const updated = await db.prepare("SELECT * FROM customers WHERE id = ?").get(id)
  broadcastChange("customers")
  return NextResponse.json(updated)
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin(request)
  if (session instanceof NextResponse) return session
  const { id } = await params
  const db = await getDb()
  const existing = await db.prepare("SELECT * FROM customers WHERE id = ?").get(id)
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await db.prepare("DELETE FROM customers WHERE id = ?").run(id)
  broadcastChange("customers")
  return NextResponse.json({ success: true })
}
