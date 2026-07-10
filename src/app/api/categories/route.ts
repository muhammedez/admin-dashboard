import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import type { NextRequest } from "next/server"

export async function GET() {
  const db = getDb()
  const data = db.prepare("SELECT * FROM categories ORDER BY name ASC").all()
  return NextResponse.json({ data })
}

export async function POST(request: Request) {
  const body = await request.json()
  const { name } = body

  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 })
  }

  const db = getDb()
  const existing = db.prepare("SELECT id FROM categories WHERE name = ?").get(name.trim()) as any
  if (existing) {
    return NextResponse.json({ error: "Category already exists" }, { status: 409 })
  }

  const id = `CAT-${Date.now()}`
  const createdAt = new Date().toISOString().split("T")[0]
  db.prepare("INSERT INTO categories (id, name, createdAt) VALUES (?, ?, ?)").run(id, name.trim(), createdAt)
  const category = db.prepare("SELECT * FROM categories WHERE id = ?").get(id)
  return NextResponse.json(category, { status: 201 })
}
