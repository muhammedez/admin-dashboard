import { NextResponse } from "next/server"
import { getSession } from "./db"

export async function requireAdmin(request: Request): Promise<{ userId: number; role: string } | NextResponse> {
  const auth = request.headers.get("Authorization")
  if (!auth || !auth.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 }) as any
  }
  const session = await getSession(auth.slice(7))
  if (!session) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 }) as any
  }
  if (session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 }) as any
  }
  return session
}

export async function getSessionUser(request: Request): Promise<{ userId: number; role: string } | null> {
  const auth = request.headers.get("Authorization")
  if (!auth || !auth.startsWith("Bearer ")) return null
  return getSession(auth.slice(7))
}
