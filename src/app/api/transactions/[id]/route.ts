import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { requireAdmin } from "@/lib/api-auth"
import { broadcastChange } from "@/lib/sse"
import { validate, updateTransactionSchema } from "@/lib/validation"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin(request)
  if (session instanceof NextResponse) return session
  const { id } = await params
  const db = await getDb()
  const transaction = await db.prepare("SELECT * FROM transactions WHERE id = ?").get(id)
  if (!transaction) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(transaction)
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin(request)
  if (session instanceof NextResponse) return session
  const { id } = await params
  const body = await request.json()
  const parsed = validate(updateTransactionSchema, body)
  if ("error" in parsed) return parsed.error
  const { customerName, productName, amount, status, paymentMethod } = parsed.data
  const db = await getDb()

  const existing = await db.prepare("SELECT * FROM transactions WHERE id = ?").get(id) as any
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const newAmount = amount ?? existing.amount
  await db.prepare(
    "UPDATE transactions SET customerName = ?, productName = ?, amount = ?, status = ?, paymentMethod = ? WHERE id = ?"
  ).run(
    customerName ?? existing.customerName,
    productName ?? existing.productName,
    newAmount,
    status ?? existing.status,
    paymentMethod ?? existing.paymentMethod,
    id,
  )

  const customer = await db.prepare("SELECT * FROM customers WHERE name = ?").get(existing.customerName) as any
  if (customer) {
    await db.prepare("UPDATE customers SET totalSpent = totalSpent - ? + ? WHERE name = ?").run(existing.amount, newAmount, existing.customerName)
  }

  const updated = await db.prepare("SELECT * FROM transactions WHERE id = ?").get(id) as any
  broadcastChange("products")
  broadcastChange("customers")
  broadcastChange("transactions")
  if (status && status !== existing.status) {
    const msg = status === "completed" ? "Order approved" : status === "failed" ? "Order rejected" : ""
    if (msg) {
      broadcastChange("notification", { customerName: existing.customerName, message: msg, transactionId: id, productName: existing.productName, amount: existing.amount })
    }
  }
  return NextResponse.json(updated)
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin(request)
  if (session instanceof NextResponse) return session
  const { id } = await params
  const db = await getDb()
  const existing = await db.prepare("SELECT * FROM transactions WHERE id = ?").get(id) as any
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const customer = await db.prepare("SELECT * FROM customers WHERE name = ?").get(existing.customerName) as any
  if (customer) {
    await db.prepare("UPDATE customers SET totalOrders = MAX(0, totalOrders - 1), totalSpent = MAX(0, totalSpent - ?) WHERE name = ?").run(existing.amount, existing.customerName)
  }

  await db.prepare("DELETE FROM transactions WHERE id = ?").run(id)
  broadcastChange("products")
  broadcastChange("customers")
  broadcastChange("transactions")
  return NextResponse.json({ success: true })
}
