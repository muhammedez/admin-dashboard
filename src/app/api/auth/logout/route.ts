import { NextResponse } from "next/server"
import { deleteSession } from "@/lib/db"

export async function POST(request: Request) {
  const auth = request.headers.get("authorization")
  if (auth?.startsWith("Bearer ")) {
    deleteSession(auth.slice(7))
  }
  return NextResponse.json({ success: true })
}
