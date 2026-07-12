import { NextResponse } from "next/server"
import { getDb, createSession, verifyPassword } from "@/lib/db"
import { setTokenCookie } from "@/lib/api-auth"

export async function POST(request: Request) {
  const { email, password } = await request.json()

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
  }

  const db = await getDb()
  const user = await db.prepare("SELECT id, name, email, password, role FROM users WHERE email = ?").get(email) as any

  if (!user || !(await verifyPassword(password, user.password))) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
  }

  const token = await createSession(user.id)
  const res = NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  })
  setTokenCookie(res, token)
  return res
}
