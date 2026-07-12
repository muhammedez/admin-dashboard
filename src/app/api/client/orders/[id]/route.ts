import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { getSessionUser } from "@/lib/api-auth"
import { broadcastChange } from "@/lib/sse"
import type { NextRequest } from "next/server"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser(request)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const db = await getDb()
  const customer = await db.prepare("SELECT name FROM customers WHERE userId = ?").get(session.userId) as any
  if (!customer) return NextResponse.json({ error: "No customer profile" }, { status: 404 })

  const existing = await db.prepare("SELECT * FROM transactions WHERE id = ? AND customerName = ? AND status = 'pending'").get(id, customer.name) as any
  if (!existing) return NextResponse.json({ error: "Order not found or already processed" }, { status: 404 })

  await db.prepare("UPDATE transactions SET status = 'cancelled' WHERE id = ?").run(id)

  await db.prepare("UPDATE customers SET totalOrders = MAX(0, totalOrders - 1), totalSpent = MAX(0, totalSpent - ?) WHERE name = ?").run(existing.amount, customer.name)

  const product = await db.prepare("SELECT * FROM products WHERE name = ?").get(existing.productName) as any
  if (product) {
    await db.prepare("UPDATE products SET stock = stock + 1 WHERE name = ?").run(existing.productName)
  }

  broadcastChange("products")
  broadcastChange("customers")
  broadcastChange("transactions")
  broadcastChange("notification", {
    customerName: customer.name,
    message: "Order cancelled",
    transactionId: id,
    productName: existing.productName,
    amount: existing.amount,
  })

  return NextResponse.json({ success: true })
}
