import { NextResponse } from "next/server"
import { getSession } from "@/lib/db"
import { getDb } from "@/lib/db"

export async function GET(request: Request) {
  const auth = request.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const token = auth.slice(7)
  const session = getSession(token)
  if (!session) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 })
  }

  const db = getDb()
  const user = db.prepare("SELECT id, name, email, role FROM users WHERE id = ?").get(session.userId) as any
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } })
}
