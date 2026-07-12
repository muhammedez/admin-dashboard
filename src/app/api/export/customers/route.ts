import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { requireAdmin } from "@/lib/api-auth"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const session = await requireAdmin(request)
  if (session instanceof NextResponse) return session

  const db = await getDb()
  const rows = await db.prepare("SELECT id, name, email, totalOrders, totalSpent, joinedAt, status FROM customers ORDER BY joinedAt DESC").all()
  const headers = ["ID", "Name", "Email", "Total Orders", "Total Spent", "Joined", "Status"]
  const csvRows = rows.map((r: any) =>
    [r.id, r.name, r.email, r.totalOrders, r.totalSpent, r.joinedAt, r.status].join(",")
  )
  const csv = [headers.join(","), ...csvRows].join("\n")
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="customers.csv"`,
    },
  })
}
