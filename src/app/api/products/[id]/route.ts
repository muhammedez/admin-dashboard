import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { requireAdmin } from "@/lib/api-auth"
import { broadcastChange } from "@/lib/sse"
import { validate, updateProductSchema } from "@/lib/validation"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = await getDb()
  const product = await db.prepare("SELECT * FROM products WHERE id = ?").get(id)
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(product)
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin(request)
  if (session instanceof NextResponse) return session
  const { id } = await params
  const body = await request.json()
  const parsed = validate(updateProductSchema, body)
  if ("error" in parsed) return parsed.error
  const { name, category, price, stock, description } = parsed.data
  const db = await getDb()

  const existing = await db.prepare("SELECT * FROM products WHERE id = ?").get(id)
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await db.prepare(
    "UPDATE products SET name = ?, category = ?, price = ?, stock = ?, description = ? WHERE id = ?"
  ).run(
    name ?? (existing as any).name,
    category ?? (existing as any).category,
    price ?? (existing as any).price,
    stock ?? (existing as any).stock,
    description ?? (existing as any).description,
    id,
  )

  const updated = await db.prepare("SELECT * FROM products WHERE id = ?").get(id)
  broadcastChange("products")
  return NextResponse.json(updated)
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin(request)
  if (session instanceof NextResponse) return session
  const { id } = await params
  const db = await getDb()
  const existing = await db.prepare("SELECT * FROM products WHERE id = ?").get(id)
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await db.prepare("DELETE FROM products WHERE id = ?").run(id)
  broadcastChange("products")
  return NextResponse.json({ success: true })
}
