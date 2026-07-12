import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { requireAdmin } from "@/lib/api-auth"
import { broadcastChange } from "@/lib/sse"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin(request)
  if (session instanceof NextResponse) return session
  const { id } = await params
  const db = await getDb()

  const existing = await db.prepare("SELECT * FROM transactions WHERE id = ? AND status = 'pending'").get(id) as any
  if (!existing) return NextResponse.json({ error: "Order not found or already processed" }, { status: 404 })

  const body = await request.json()
  const { action } = body as { action: string }
  if (!action || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Invalid action. Use 'approve' or 'reject'" }, { status: 400 })
  }

  const newStatus = action === "approve" ? "completed" : "rejected"
  const msg = action === "approve" ? "Order approved" : "Order rejected"

  await db.prepare("UPDATE transactions SET status = ? WHERE id = ?").run(newStatus, id)

  const customer = await db.prepare("SELECT * FROM customers WHERE name = ?").get(existing.customerName) as any
  if (customer && action === "reject") {
    await db.prepare("UPDATE customers SET totalOrders = MAX(0, totalOrders - 1), totalSpent = MAX(0, totalSpent - ?) WHERE name = ?").run(existing.amount, existing.customerName)
    const product = await db.prepare("SELECT * FROM products WHERE name = ?").get(existing.productName) as any
    if (product) {
      await db.prepare("UPDATE products SET stock = stock + ? WHERE name = ?").run(existing.quantity || 1, existing.productName)
    }
  }

  const updated = await db.prepare("SELECT * FROM transactions WHERE id = ?").get(id)
  broadcastChange("products")
  broadcastChange("customers")
  broadcastChange("transactions")
  broadcastChange("notification", {
    customerName: existing.customerName,
    message: msg,
    transactionId: id,
    productName: existing.productName,
    amount: existing.amount,
  })

  return NextResponse.json(updated)
}
