import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { requireAdmin } from "@/lib/api-auth"
import { broadcastChange } from "@/lib/sse"
import { validate, createCategorySchema } from "@/lib/validation"
import type { NextRequest } from "next/server"

export async function GET() {
  const db = await getDb()
  const data = await db.prepare("SELECT * FROM categories ORDER BY name ASC").all()
  return NextResponse.json({ data })
}

export async function POST(request: Request) {
  const session = await requireAdmin(request)
  if (session instanceof NextResponse) return session
  const body = await request.json()
  const parsed = validate(createCategorySchema, body)
  if ("error" in parsed) return parsed.error
  const { name } = parsed.data

  const db = await getDb()
  const existing = await db.prepare("SELECT id FROM categories WHERE name = ?").get(name) as any
  if (existing) {
    return NextResponse.json({ error: "Category already exists" }, { status: 409 })
  }

  const id = `CAT-${Date.now()}`
  const createdAt = new Date().toISOString().split("T")[0]
  await db.prepare("INSERT INTO categories (id, name, createdAt) VALUES (?, ?, ?)").run(id, name, createdAt)
  const category = await db.prepare("SELECT * FROM categories WHERE id = ?").get(id)
  broadcastChange("categories")
  return NextResponse.json(category, { status: 201 })
}
