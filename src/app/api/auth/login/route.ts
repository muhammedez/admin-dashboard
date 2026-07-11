import { NextResponse } from "next/server"
import { getDb, createSession, hashPassword } from "@/lib/db"

export async function POST(request: Request) {
  const { email, password } = await request.json()

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
  }

  const db = await getDb()
  const user = await db.prepare("SELECT id, name, email, password, role FROM users WHERE email = ?").get(email) as any

  if (!user || user.password !== hashPassword(password)) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
  }

  const token = await createSession(user.id)

  return NextResponse.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  })
}
