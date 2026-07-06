import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status   = searchParams.get("status")
  const type     = searchParams.get("type")       // property type e.g. APARTMENT
  const maxPrice = searchParams.get("maxPrice")
  const bedrooms = searchParams.get("bedrooms")

  try {
    // Resolve agent ID — same fallback logic as POST (handles stale JWT / demo session)
    let agentId = session.user.id
    if (agentId === "demo-agent" || !(await db.user.findUnique({ where: { id: agentId }, select: { id: true } }))) {
      const user = await db.user.findUnique({ where: { email: session.user.email! }, select: { id: true } })
      if (!user) return NextResponse.json({ error: "Session expired — please sign out and sign in again." }, { status: 401 })
      agentId = user.id
    }

    const where: Record<string, unknown> = { agentId }
    if (status)   where.status = status
    if (type)     where.type   = type
    if (maxPrice) where.price  = { lte: Number(maxPrice) }
    if (bedrooms) where.bedrooms = Number(bedrooms)
    const properties = await db.property.findMany({ where, orderBy: { createdAt: "desc" } })
    return NextResponse.json({ properties })
  } catch (e) {
    console.error("GET /api/properties error:", e)
    return NextResponse.json({ properties: [] })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const isDraft = body.status === "OFF_MARKET"

    // Drafts only need a title; published listings need all required fields
    if (!body.title?.trim()) {
      return NextResponse.json({ error: isDraft ? "Add a title before saving a draft" : "Title is required" }, { status: 400 })
    }
    if (!isDraft) {
      if (!body.price || isNaN(Number(body.price))) return NextResponse.json({ error: "Valid price is required" }, { status: 400 })
      if (!body.area || isNaN(Number(body.area))) return NextResponse.json({ error: "Valid area is required" }, { status: 400 })
      if (!body.address?.trim()) return NextResponse.json({ error: "Address is required" }, { status: 400 })
    }

    // Resolve agent ID — handle demo session or stale JWT
    let agentId = session.user.id
    const agentExists = agentId !== "demo-agent" && await db.user.findUnique({ where: { id: agentId }, select: { id: true } })
    if (!agentExists) {
      const user = await db.user.findUnique({ where: { email: session.user.email! }, select: { id: true } })
      if (!user) return NextResponse.json({ error: "Session expired — please sign out and sign in again." }, { status: 401 })
      agentId = user.id
    }

    const property = await db.property.create({
      data: {
        title: body.title.trim(),
        description: body.description?.trim() || "",
        category: body.category || "RESIDENTIAL",
        type: body.type || "APARTMENT",
        listingType: body.listingType || "RENT",
        referenceNumber: body.referenceNumber?.trim() || undefined,
        // Use 0 as placeholder for draft saves with missing price/area
        price: Number(body.price) || 0,
        rentFrequency: body.rentFrequency || null,
        area: Number(body.area) || 0,
        bedrooms: body.bedrooms ? Number(body.bedrooms) : undefined,
        bathrooms: body.bathrooms ? Number(body.bathrooms) : undefined,
        floor: body.floor ? Number(body.floor) : undefined,
        address: body.address?.trim() || "",
        district: body.district || undefined,
        subDistrict: body.subDistrict || undefined,
        furnishing: body.furnishing || undefined,
        availabilityType: body.availabilityType || "IMMEDIATE",
        availableFrom: body.availableFrom ? new Date(body.availableFrom) : undefined,
        utilityBillsIncluded: body.utilityBillsIncluded || false,
        status: body.status || "AVAILABLE",
        amenities: body.amenities || [],
        photos: body.photos || [],
        featured: body.featured || false,
        agentId,
      },
    })
    return NextResponse.json({ property }, { status: 201 })
  } catch (e) {
    console.error("POST /api/properties error:", e)
    const message = e instanceof Error ? e.message : "Failed to save property"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
