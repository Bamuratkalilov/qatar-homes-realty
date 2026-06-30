import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

function parseBudgetRange(str: string): { budget: number | null; budgetMax: number | null } {
  if (!str) return { budget: null, budgetMax: null }
  const monthly = str.includes("/mo")
  const mul = monthly ? 12 : 1
  const nums = str.replace(/,/g, "").match(/\d+/g)?.map(Number) ?? []
  if (!nums.length) return { budget: null, budgetMax: null }
  if (nums.length === 1)
    return str.toLowerCase().includes("under")
      ? { budget: null, budgetMax: nums[0] * mul }
      : { budget: nums[0] * mul, budgetMax: null }
  return { budget: nums[0] * mul, budgetMax: nums[1] * mul }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, phone, email, message, propertyId, source, propertyType, listingType, bedrooms, budget } = body

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
        source: source || "WEBSITE",
        notes: message?.trim() || null,
        propertyType: propertyType || property?.type || null,
        bedrooms: bedrooms !== undefined && bedrooms !== null ? Number(bedrooms) : null,
        ...parseBudgetRange(budget || ""),
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
