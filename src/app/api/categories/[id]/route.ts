import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { requireAdmin } from "@/lib/api-auth"
import { broadcastChange } from "@/lib/sse"
import type { NextRequest } from "next/server"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = await getDb()
  const category = await db.prepare("SELECT * FROM categories WHERE id = ?").get(id)
  if (!category) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(category)
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin(request)
  if (session instanceof NextResponse) return session
  const { id } = await params
  const body = await request.json()
  const { name } = body

  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 })
  }

  const db = await getDb()
  const existing = await db.prepare("SELECT id FROM categories WHERE name = ? AND id != ?").get(name.trim(), id) as any
  if (existing) {
    return NextResponse.json({ error: "Category already exists" }, { status: 409 })
  }

  await db.prepare("UPDATE categories SET name = ? WHERE id = ?").run(name.trim(), id)
  broadcastChange("categories")
  const category = await db.prepare("SELECT * FROM categories WHERE id = ?").get(id)
  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 })
  }
  return NextResponse.json(category)
}

export async function DELETE(request: NextRequest) {
  const session = await requireAdmin(request)
  if (session instanceof NextResponse) return session
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 })
  }

  const db = await getDb()
  const cat = await db.prepare("SELECT name FROM categories WHERE id = ?").get(id) as any
  if (!cat) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 })
  }

  const used = await db.prepare("SELECT COUNT(*) as c FROM products WHERE category = ?").get(cat.name) as any
  if (used.c > 0) {
    return NextResponse.json({ error: `Cannot delete — ${used.c} product(s) use this category` }, { status: 400 })
  }

  await db.prepare("DELETE FROM categories WHERE id = ?").run(id)
  broadcastChange("categories")
  return NextResponse.json({ success: true })
}
