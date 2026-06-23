import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const body = await req.json()

  const data: Record<string, unknown> = { updatedAt: new Date() }
  if (body.status !== undefined)     data.status = body.status
  if (body.notes !== undefined)      data.notes = body.notes
  if (body.score !== undefined)      data.score = body.score
  if (body.aiSummary !== undefined)  data.aiSummary = body.aiSummary
  // propertyId: allow null to unlink, string to link
  if ("propertyId" in body)          data.propertyId = body.propertyId ?? null

  const lead = await db.lead.update({
    where: { id, agentId: session.user.id },
    data,
    include: {
      property: {
        select: { id: true, title: true, referenceNumber: true, type: true, listingType: true, price: true, photos: true, address: true },
      },
    },
  })
  return NextResponse.json({ lead })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  await db.lead.delete({ where: { id, agentId: session.user.id } })
  return NextResponse.json({ success: true })
}
