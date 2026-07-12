import { NextResponse } from "next/server"
import { getSession } from "./db"

const COOKIE_NAME = "auth_token"

export function getTokenFromRequest(request: Request): string | null {
  const cookie = request.headers.get("cookie")
  if (cookie) {
    const match = cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]*)`))
    if (match) return match[1]
  }
  const auth = request.headers.get("Authorization")
  if (auth?.startsWith("Bearer ")) return auth.slice(7)
  return null
}

export function setTokenCookie(response: NextResponse, token: string): void {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  })
}

export function clearTokenCookie(response: NextResponse): void {
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  })
}

export async function requireAdmin(request: Request): Promise<{ userId: number; role: string } | NextResponse> {
  const token = getTokenFromRequest(request)
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 }) as any
  }
  const session = await getSession(token)
  if (!session) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 }) as any
  }
  if (session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 }) as any
  }
  return session
}

export async function getSessionUser(request: Request): Promise<{ userId: number; role: string } | null> {
  const token = getTokenFromRequest(request)
  if (!token) return null
  return getSession(token)
}
