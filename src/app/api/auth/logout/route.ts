import { NextResponse } from "next/server"
import { deleteSession } from "@/lib/db"
import { getTokenFromRequest, clearTokenCookie } from "@/lib/api-auth"

export async function POST(request: Request) {
  const token = getTokenFromRequest(request)
  if (token) {
    await deleteSession(token)
  }
  const res = NextResponse.json({ success: true })
  clearTokenCookie(res)
  return res
}
