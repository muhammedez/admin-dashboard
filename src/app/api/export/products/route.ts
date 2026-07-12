import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { requireAdmin } from "@/lib/api-auth"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const session = await requireAdmin(request)
  if (session instanceof NextResponse) return session

  const db = await getDb()
  const rows = await db.prepare("SELECT id, name, category, price, stock, description, createdAt FROM products ORDER BY createdAt DESC").all()
  const headers = ["ID", "Name", "Category", "Price", "Stock", "Description", "Created"]
  const csvRows = rows.map((r: any) =>
    [r.id, r.name, r.category, r.price, r.stock, `"${(r.description || "").replace(/"/g, '""')}"`, r.createdAt].join(",")
  )
  const csv = [headers.join(","), ...csvRows].join("\n")
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="products.csv"`,
    },
  })
}
