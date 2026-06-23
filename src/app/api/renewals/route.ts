import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const agentId = session.user.id
  const now = new Date()
  const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)

  const clients = await db.client.findMany({
    where: { agentId, contractEnd: { gte: now, lte: in90Days } },
    orderBy: { contractEnd: "asc" },
    include: {
      leads: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          propertyType: true, budget: true, budgetMax: true, bedrooms: true,
          property: { select: { id: true, title: true, referenceNumber: true, photos: true, listingType: true, price: true, district: true } },
        },
      },
    },
  })

  const results = await Promise.all(
    clients.map(async (client) => {
      const lastLead = client.leads[0]
      const budget = lastLead?.budgetMax || lastLead?.budget
      const propertyType = lastLead?.propertyType

      const matchingProperties = await db.property.findMany({
        where: {
          agentId,
          status: "AVAILABLE",
          listingType: "RENT",
          ...(propertyType ? { type: propertyType } : {}),
          ...(budget ? { price: { lte: budget * 1.2 } } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: { id: true, title: true, referenceNumber: true, photos: true, price: true, type: true, bedrooms: true, district: true, area: true },
      })

      const daysLeft = Math.ceil((new Date(client.contractEnd!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      return { ...client, daysLeft, matchingProperties }
    })
  )

  return NextResponse.json({ renewals: results })
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const { clientId, contractStart, contractEnd, contractNotes, markRenewalSent } = body

    if (!clientId) return NextResponse.json({ error: "clientId is required" }, { status: 400 })

    // Verify this client belongs to the agent
    const existing = await db.client.findFirst({ where: { id: clientId, agentId: session.user.id } })
    if (!existing) return NextResponse.json({ error: "Client not found" }, { status: 404 })

    const updated = await db.client.update({
      where: { id: clientId },
      data: {
        ...(contractStart !== undefined ? { contractStart: contractStart && contractStart.trim() ? new Date(contractStart) : null } : {}),
        ...(contractEnd !== undefined ? { contractEnd: contractEnd && contractEnd.trim() ? new Date(contractEnd) : null } : {}),
        ...(contractNotes !== undefined ? { contractNotes: contractNotes || null } : {}),
        ...(markRenewalSent ? { renewalSentAt: new Date() } : {}),
      },
    })

    return NextResponse.json({ client: updated })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error("PATCH /api/renewals error:", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
