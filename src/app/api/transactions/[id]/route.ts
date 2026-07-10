import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = getDb()
  const transaction = db.prepare("SELECT * FROM transactions WHERE id = ?").get(id)
  if (!transaction) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(transaction)
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const db = getDb()

  const existing = db.prepare("SELECT * FROM transactions WHERE id = ?").get(id)
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { customerName, productName, amount, status, paymentMethod } = body
  db.prepare(
    "UPDATE transactions SET customerName = ?, productName = ?, amount = ?, status = ?, paymentMethod = ? WHERE id = ?"
  ).run(
    customerName ?? (existing as any).customerName,
    productName ?? (existing as any).productName,
    amount ?? (existing as any).amount,
    status ?? (existing as any).status,
    paymentMethod ?? (existing as any).paymentMethod,
    id,
  )

  const updated = db.prepare("SELECT * FROM transactions WHERE id = ?").get(id)
  return NextResponse.json(updated)
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = getDb()
  const existing = db.prepare("SELECT * FROM transactions WHERE id = ?").get(id)
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  db.prepare("DELETE FROM transactions WHERE id = ?").run(id)
  return NextResponse.json({ success: true })
}
