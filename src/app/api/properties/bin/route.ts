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

// GET /api/properties/bin — list trashed properties
export async function GET(_req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const agentId = await resolveAgentId(session.user.id, session.user.email!)
    if (!agentId) return NextResponse.json({ error: "Session expired" }, { status: 401 })

    const properties = await db.property.findMany({
      where: { agentId, deletedAt: { not: null } },
      orderBy: { deletedAt: "desc" },
    })
    return NextResponse.json({ properties })
  } catch (e) {
    console.error("GET /api/properties/bin error:", e)
    return NextResponse.json({ properties: [] })
  }
}

// DELETE /api/properties/bin — empty entire bin (permanent delete all)
export async function DELETE(_req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const agentId = await resolveAgentId(session.user.id, session.user.email!)
    if (!agentId) return NextResponse.json({ error: "Session expired" }, { status: 401 })

    await db.property.deleteMany({ where: { agentId, deletedAt: { not: null } } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("DELETE /api/properties/bin error:", e)
    return NextResponse.json({ error: "Failed to empty bin" }, { status: 500 })
  }
}
