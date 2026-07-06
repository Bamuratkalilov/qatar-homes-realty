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

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  try {
    const property = await db.property.findUnique({ where: { id } })
    if (!property) return NextResponse.json({ error: "Not found" }, { status: 404 })
    if (property.agentId !== session.user.id) {
      // allow if session is demo-agent and property belongs to seeded user
      const agentId = await resolveAgentId(session.user.id, session.user.email!)
      if (property.agentId !== agentId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    return NextResponse.json({ property })
  } catch (e) {
    console.error("GET /api/properties/[id] error:", e)
    return NextResponse.json({ error: "Failed to load property" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  try {
    const body = await req.json()
    const isDraft = body.status === "OFF_MARKET"

    if (!isDraft) {
      if (!body.title?.trim()) return NextResponse.json({ error: "Title is required" }, { status: 400 })
      if (!body.price || isNaN(Number(body.price))) return NextResponse.json({ error: "Valid price is required" }, { status: 400 })
      if (!body.area || isNaN(Number(body.area))) return NextResponse.json({ error: "Valid area is required" }, { status: 400 })
    }

    const agentId = await resolveAgentId(session.user.id, session.user.email!)
    if (!agentId) return NextResponse.json({ error: "Session expired" }, { status: 401 })

    // Verify ownership
    const existing = await db.property.findUnique({ where: { id }, select: { agentId: true } })
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })
    if (existing.agentId !== agentId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const property = await db.property.update({
      where: { id },
      data: {
        title: body.title?.trim(),
        description: body.description?.trim() ?? "",
        category: body.category ?? "RESIDENTIAL",
        type: body.type ?? "APARTMENT",
        listingType: body.listingType ?? "RENT",
        referenceNumber: body.referenceNumber?.trim() || undefined,
        price: Number(body.price) || 0,
        rentFrequency: body.rentFrequency || null,
        area: Number(body.area) || 0,
        bedrooms: body.bedrooms ? Number(body.bedrooms) : null,
        bathrooms: body.bathrooms ? Number(body.bathrooms) : null,
        floor: body.floor ? Number(body.floor) : null,
        address: body.address?.trim() ?? "",
        district: body.district || null,
        subDistrict: body.subDistrict || null,
        furnishing: body.furnishing || null,
        availabilityType: body.availabilityType ?? "IMMEDIATE",
        availableFrom: body.availableFrom ? new Date(body.availableFrom) : null,
        utilityBillsIncluded: body.utilityBillsIncluded ?? false,
        status: body.status ?? "AVAILABLE",
        amenities: body.amenities ?? [],
        photos: body.photos ?? [],
        featured: body.featured ?? false,
        coordinates: body.coordinates ?? undefined,
      },
    })
    return NextResponse.json({ property })
  } catch (e) {
    console.error("PATCH /api/properties/[id] error:", e)
    const message = e instanceof Error ? e.message : "Failed to update property"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const permanent = new URL(req.url).searchParams.get("permanent") === "true"

  try {
    const agentId = await resolveAgentId(session.user.id, session.user.email!)
    if (!agentId) return NextResponse.json({ error: "Session expired" }, { status: 401 })

    const existing = await db.property.findUnique({ where: { id }, select: { agentId: true } })
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })
    if (existing.agentId !== agentId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    if (permanent) {
      await db.property.delete({ where: { id } })
    } else {
      await db.property.update({ where: { id }, data: { deletedAt: new Date() } })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("DELETE /api/properties/[id] error:", e)
    return NextResponse.json({ error: "Failed to delete property" }, { status: 500 })
  }
}
