import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { requireAdmin } from "@/lib/api-auth"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin(request)
  if (session instanceof NextResponse) return session

  const { id } = await params
  const db = await getDb()
  const customer = await db.prepare("SELECT * FROM customers WHERE id = ?").get(id)
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(customer)
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin(request)
  if (session instanceof NextResponse) return session
  const { id } = await params
  const body = await request.json()
  const db = await getDb()

  const existing = await db.prepare("SELECT * FROM customers WHERE id = ?").get(id)
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { name, email, status, totalOrders, totalSpent } = body

  if (email && email !== (existing as any).email) {
    const dup = await db.prepare("SELECT id FROM customers WHERE email = ? AND id != ?").get(email, id)
    if (dup) return NextResponse.json({ error: "Email already in use" }, { status: 409 })
  }

  await db.prepare(
    "UPDATE customers SET name = ?, email = ?, status = ?, totalOrders = ?, totalSpent = ? WHERE id = ?"
  ).run(
    name ?? (existing as any).name,
    email ?? (existing as any).email,
    status ?? (existing as any).status,
    totalOrders ?? (existing as any).totalOrders,
    totalSpent ?? (existing as any).totalSpent,
    id,
  )

  const updated = await db.prepare("SELECT * FROM customers WHERE id = ?").get(id)
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
  return NextResponse.json({ success: true })
}
