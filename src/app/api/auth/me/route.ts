import { NextResponse } from "next/server"
import { getDb, getSession, verifyPassword } from "@/lib/db"
import { getTokenFromRequest } from "@/lib/api-auth"
import { validate, updateProfileSchema } from "@/lib/validation"
import { hash as bcryptHash } from "bcrypt-ts"

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

export async function PUT(request: Request) {
  const token = getTokenFromRequest(request)
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const session = await getSession(token)
  if (!session) return NextResponse.json({ error: "Invalid session" }, { status: 401 })

  const body = await request.json()
  const parsed = validate(updateProfileSchema, body)
  if ("error" in parsed) return parsed.error

  const { name, currentPassword, newPassword } = parsed.data

  const db = await getDb()
  const user = await db.prepare("SELECT id, name, email, password FROM users WHERE id = ?").get(session.userId) as any
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  if (newPassword) {
    if (!currentPassword) {
      return NextResponse.json({ error: "Current password is required to set a new password" }, { status: 400 })
    }
    const valid = await verifyPassword(currentPassword, user.password)
    if (!valid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })
    }
    const hashed = await bcryptHash(newPassword, 10)
    await db.prepare("UPDATE users SET password = ? WHERE id = ?").run(hashed, user.id)
  }

  if (name && name !== user.name) {
    await db.prepare("UPDATE users SET name = ? WHERE id = ?").run(name, user.id)
  }

  const updated = await db.prepare("SELECT id, name, email, role FROM users WHERE id = ?").get(user.id) as any
  return NextResponse.json({ user: { id: updated.id, name: updated.name, email: updated.email, role: updated.role } })
}
