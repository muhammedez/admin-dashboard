import { NextResponse } from "next/server"
import { getSession, getDb } from "@/lib/db"
import { getTokenFromRequest } from "@/lib/api-auth"

export async function GET(request: Request) {
  const token = getTokenFromRequest(request)

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const session = await getSession(token)
  if (!session) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 })
  }

  const db = await getDb()
  const user = await db.prepare("SELECT id, name, email, role FROM users WHERE id = ?").get(session.userId) as any
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } })
}
