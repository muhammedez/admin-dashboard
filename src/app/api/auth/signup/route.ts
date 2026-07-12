import { NextResponse } from "next/server"
import { getDb, createSession, hashPassword } from "@/lib/db"
import { validate, signupSchema } from "@/lib/validation"

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = validate(signupSchema, body)
  if ("error" in parsed) return parsed.error
  const { name, email, password } = parsed.data

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
