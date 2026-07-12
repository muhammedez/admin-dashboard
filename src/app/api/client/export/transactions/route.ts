import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { getSessionUser } from "@/lib/api-auth"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const session = await getSessionUser(request)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const db = await getDb()
  const customer = await db.prepare("SELECT name FROM customers WHERE userId = ?").get(session.userId) as any
  if (!customer) {
    return NextResponse.json({ error: "No customer profile" }, { status: 404 })
  }

  const rows = await db.prepare(
    "SELECT id, productName, amount, status, timestamp, paymentMethod FROM transactions WHERE customerName = ? ORDER BY timestamp DESC"
  ).all(customer.name)

  const headers = ["ID", "Product", "Amount", "Status", "Timestamp", "Payment Method"]
  const csvRows = (rows as any[]).map((r: any) =>
    [r.id, r.productName, r.amount, r.status, r.timestamp, r.paymentMethod].join(",")
  )
  const csv = [headers.join(","), ...csvRows].join("\n")
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="my-transactions.csv"`,
    },
  })
}
