import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const upcoming = searchParams.get("upcoming") === "true"

  const where: Record<string, unknown> = { agentId: session.user.id }
  if (upcoming) where.startTime = { gte: new Date() }

  const appointments = await db.appointment.findMany({
    where,
    orderBy: { startTime: "asc" },
    include: {
      lead: { select: { name: true, phone: true } },
      client: { select: { name: true, phone: true } },
      property: { select: { title: true, address: true } },
    },
  })
  return NextResponse.json({ appointments })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const appointment = await db.appointment.create({
    data: {
      title: body.title,
      description: body.description,
      startTime: new Date(body.startTime),
      endTime: new Date(body.endTime),
      type: body.type || "VIEWING",
      location: body.location,
      notes: body.notes,
      leadId: body.leadId,
      clientId: body.clientId,
      propertyId: body.propertyId,
      agentId: session.user.id,
    },
  })
  return NextResponse.json({ appointment }, { status: 201 })
}
