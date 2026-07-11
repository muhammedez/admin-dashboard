import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { requireAdmin } from "@/lib/api-auth"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = getDb()
  const transaction = db.prepare("SELECT * FROM transactions WHERE id = ?").get(id)
  if (!transaction) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(transaction)
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = requireAdmin(request)
  if (session instanceof NextResponse) return session
  const { id } = await params
  const body = await request.json()
  const db = getDb()

  const existing = db.prepare("SELECT * FROM transactions WHERE id = ?").get(id) as any
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { customerName, productName, amount, status, paymentMethod } = body
  const newAmount = amount ?? existing.amount
  db.prepare(
    "UPDATE transactions SET customerName = ?, productName = ?, amount = ?, status = ?, paymentMethod = ? WHERE id = ?"
  ).run(
    customerName ?? existing.customerName,
    productName ?? existing.productName,
    newAmount,
    status ?? existing.status,
    paymentMethod ?? existing.paymentMethod,
    id,
  )

  const customer = db.prepare("SELECT * FROM customers WHERE name = ?").get(existing.customerName) as any
  if (customer) {
    db.prepare("UPDATE customers SET totalSpent = totalSpent - ? + ? WHERE name = ?").run(existing.amount, newAmount, existing.customerName)
  }

  const updated = db.prepare("SELECT * FROM transactions WHERE id = ?").get(id)
  return NextResponse.json(updated)
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = requireAdmin(request)
  if (session instanceof NextResponse) return session
  const { id } = await params
  const db = getDb()
  const existing = db.prepare("SELECT * FROM transactions WHERE id = ?").get(id) as any
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const customer = db.prepare("SELECT * FROM customers WHERE name = ?").get(existing.customerName) as any
  if (customer) {
    db.prepare("UPDATE customers SET totalOrders = MAX(0, totalOrders - 1), totalSpent = MAX(0, totalSpent - ?) WHERE name = ?").run(existing.amount, existing.customerName)
  }

  db.prepare("DELETE FROM transactions WHERE id = ?").run(id)
  return NextResponse.json({ success: true })
}
