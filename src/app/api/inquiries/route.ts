import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, phone, email, message, propertyId } = body

    if (!name?.trim() || !phone?.trim()) {
      return NextResponse.json({ error: "Name and phone are required" }, { status: 400 })
    }

    // Look up the property to get the agent and property details
    let agentId: string | null = null
    let property = null
    if (propertyId) {
      property = await db.property.findUnique({
        where: { id: propertyId },
        select: { id: true, agentId: true, title: true, type: true, listingType: true, price: true },
      })
      if (property) agentId = property.agentId
    }

    // Fallback: assign to any available agent
    if (!agentId) {
      const agent = await db.user.findFirst({ where: { role: "AGENT" }, select: { id: true } })
      agentId = agent?.id || null
    }

    if (!agentId) {
      return NextResponse.json({ error: "No agent available" }, { status: 500 })
    }

    const lead = await db.lead.create({
      data: {
        name: name.trim(),
        phone: phone.trim(),
        email: email?.trim() || null,
        source: "WEBSITE",
        notes: message?.trim() || null,
        propertyType: property?.type || null,
        propertyId: property?.id || null,
        agentId,
      },
      include: {
        property: {
          select: { id: true, title: true, referenceNumber: true, price: true, listingType: true },
        },
      },
    })

    return NextResponse.json({ lead }, { status: 201 })
  } catch (e) {
    console.error("POST /api/inquiries error:", e)
    return NextResponse.json({ error: "Failed to submit inquiry" }, { status: 500 })
  }
}
