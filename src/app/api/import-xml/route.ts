import { NextRequest, NextResponse } from "next/server"
import { XMLParser } from "fast-xml-parser"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import type { PropertyCategory, ListingType, PropertyType, Furnishing, AvailabilityType, PropertyStatus } from "@prisma/client"

const OFFERING_MAP: Record<string, string> = {
  "rent-monthly": "RENT", "rent-yearly": "RENT", "rent": "RENT",
  "sale": "SALE", "sell": "SALE",
}

const TYPE_MAP: Record<string, string> = {
  "apartment": "APARTMENT", "flat": "APARTMENT", "hotel-apartment": "APARTMENT",
  "villa": "VILLA", "townhouse": "TOWNHOUSE", "penthouse": "PENTHOUSE",
  "duplex": "DUPLEX", "studio": "STUDIO",
  "whole-building": "WHOLE_BUILDING", "whole_building": "WHOLE_BUILDING",
  "compound": "COMPOUND",
  "office": "OFFICE", "shop": "SHOP", "warehouse": "WAREHOUSE",
  "showroom": "SHOWROOM", "labor-camp": "LABOR_CAMP", "labor_camp": "LABOR_CAMP",
  "restaurant": "RESTAURANT",
}

const STATE_MAP: Record<string, string> = {
  "live": "AVAILABLE",
  "live_changes_pending_approval": "AVAILABLE",
  "takendown": "OFF_MARKET",
  "taken_down": "OFF_MARKET",
  "draft": "OFF_MARKET",
}

function parseLocation(loc: string) {
  // "Doha,The Pearl Island,Porto Arabia,East Porto Drive"
  const parts = loc.split(",").map(s => s.trim()).filter(Boolean)
  const city = parts[0] || "Doha"
  const district = parts[1] || ""
  const subDistrict = parts[2] || ""
  const building = parts[3] || ""
  const address = [building, subDistrict, district, city].filter(Boolean).join(", ")
  return { city, district: subDistrict || district, address }
}

function buildTitle(p: Record<string, unknown>, propType: string, loc: ReturnType<typeof parseLocation>): string {
  const bedrooms = p.bedrooms
  const bedroomStr = bedrooms === "studio" || bedrooms === 0
    ? "Studio"
    : bedrooms ? `${bedrooms} BR` : ""
  const typeLabel = propType.charAt(0) + propType.slice(1).toLowerCase()
  const where = loc.district || loc.city
  return [bedroomStr, typeLabel, "in", where].filter(Boolean).join(" ")
}

function parseBedroomsValue(val: unknown): number | null {
  if (val === "studio" || val === "Studio") return 0
  const n = Number(val)
  return isNaN(n) ? null : n
}

function normalise(p: Record<string, unknown>) {
  const offeringRaw = String(p.offering_type || "").toLowerCase()
  const typeRaw = String(p.type || "").toLowerCase()
  const categoryRaw = String(p.category || "residential").toLowerCase()
  const stateRaw = String(p.state || "live").toLowerCase()

  const listingType = (OFFERING_MAP[offeringRaw] || "RENT") as ListingType
  const propType = (TYPE_MAP[typeRaw] || "APARTMENT") as PropertyType
  const category = (categoryRaw === "commercial" ? "COMMERCIAL" : "RESIDENTIAL") as PropertyCategory
  const status = (STATE_MAP[stateRaw] || "AVAILABLE") as PropertyStatus

  const loc = parseLocation(String(p.location || "Doha"))
  const title = buildTitle(p, propType, loc)

  const bedrooms = parseBedroomsValue(p.bedrooms)
  const bathrooms = p.bathrooms != null ? Number(p.bathrooms) || null : null
  const referenceNumber = String(p.reference || p.ref || "").trim() || undefined

  return {
    title,
    description: "",
    category,
    type: propType,
    listingType,
    referenceNumber,
    price: Number(p.price || 0) || 0,
    area: Math.round(Number(p.size || p.area || 0)) || 0,
    bedrooms,
    bathrooms,
    floor: null,
    address: loc.address,
    district: loc.district || null,
    city: loc.city,
    furnishing: undefined as Furnishing | undefined,
    availabilityType: "IMMEDIATE" as AvailabilityType,
    status,
    amenities: [] as string[],
    photos: [] as string[],
    featured: false,
    utilityBillsIncluded: false,
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    let agentId = session.user.id
    if (agentId === "demo-agent") {
      const user = await db.user.findUnique({ where: { email: session.user.email! }, select: { id: true } })
      if (!user) return NextResponse.json({ error: "Session expired" }, { status: 401 })
      agentId = user.id
    }

    const formData = await req.formData()
    const file = formData.get("file") as File | null
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 })

    const xmlText = await file.text()

    const parser = new XMLParser({
      ignoreAttributes: false,
      isArray: (name) => ["listing", "property", "url", "amenity", "photo"].includes(name),
    })

    const parsed = parser.parse(xmlText)

    // Property Finder exports: <listings><listing>...</listing></listings>
    const root = parsed.listings || parsed.list || parsed.properties || parsed.feed || parsed
    const rawList: Record<string, unknown>[] =
      root.listing || root.property || root.properties || []

    if (!rawList.length) {
      return NextResponse.json({
        error: `No listings found. Keys found: ${JSON.stringify(Object.keys(root))}`,
      }, { status: 400 })
    }

    const results = { imported: 0, skipped: 0, errors: [] as string[] }

    for (const raw of rawList) {
      try {
        const data = normalise(raw)
        if (!data.title) { results.skipped++; continue }

        if (data.referenceNumber) {
          const existing = await db.property.findFirst({
            where: { referenceNumber: data.referenceNumber, agentId },
            select: { id: true },
          })
          if (existing) { results.skipped++; continue }
        }

        await db.property.create({ data: { ...data, agentId } })
        results.imported++
      } catch (e) {
        results.errors.push(e instanceof Error ? e.message : "Unknown")
        results.skipped++
      }
    }

    return NextResponse.json({ ...results, total: rawList.length })
  } catch (e) {
    console.error("import-xml error:", e)
    return NextResponse.json({ error: "Failed to parse XML. " + (e instanceof Error ? e.message : "") }, { status: 500 })
  }
}
