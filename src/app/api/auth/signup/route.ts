import { NextResponse } from "next/server"
import { getDb, createSession, hashPassword } from "@/lib/db"

export async function POST(request: Request) {
  const { name, email, password } = await request.json()

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 })
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
  }

  const db = await getDb()

  const existing = await db.prepare("SELECT id FROM users WHERE email = ?").get(email)
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 })
  }

  const userRole = "client"
  const result = await db.prepare(
    "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)"
  ).run(name, email, await hashPassword(password), userRole)

  const token = await createSession(Number(result.lastInsertRowid))

  return NextResponse.json({
    token,
    user: { id: Number(result.lastInsertRowid), name, email, role: userRole },
  }, { status: 201 })
}
