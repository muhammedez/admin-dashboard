import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { requireAdmin } from "@/lib/api-auth"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const session = await requireAdmin(request)
  if (session instanceof NextResponse) return session

  const db = await getDb()
  const rows = await db.prepare("SELECT id, customerName, productName, amount, status, timestamp, paymentMethod FROM transactions ORDER BY timestamp DESC").all()
  const headers = ["ID", "Customer", "Product", "Amount", "Status", "Timestamp", "Payment Method"]
  const csvRows = rows.map((r: any) =>
    [r.id, r.customerName, r.productName, r.amount, r.status, r.timestamp, r.paymentMethod].join(",")
  )
  const csv = [headers.join(","), ...csvRows].join("\n")
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="transactions.csv"`,
    },
  })
}
