import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { generatePropertyDescription } from "@/lib/claude"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const description = await generatePropertyDescription(body)
  return NextResponse.json({ description })
}
