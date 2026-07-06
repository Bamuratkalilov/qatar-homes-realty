import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

async function resolveAgentId(sessionId: string, email: string) {
  if (sessionId !== "demo-agent") {
    const exists = await db.user.findUnique({ where: { id: sessionId }, select: { id: true } })
    if (exists) return sessionId
  }
  const user = await db.user.findUnique({ where: { email }, select: { id: true } })
  return user?.id ?? null
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  try {
    const agentId = await resolveAgentId(session.user.id, session.user.email!)
    if (!agentId) return NextResponse.json({ error: "Session expired" }, { status: 401 })

    const existing = await db.property.findUnique({ where: { id }, select: { agentId: true } })
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })
    if (existing.agentId !== agentId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    await db.property.update({ where: { id }, data: { deletedAt: null } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("POST /api/properties/[id]/restore error:", e)
    return NextResponse.json({ error: "Failed to restore property" }, { status: 500 })
  }
}
