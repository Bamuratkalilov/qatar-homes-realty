import { NextRequest, NextResponse } from "next/server"

// OSM tags per category — queried via Overpass API (free, no key needed)
const CATEGORIES = [
  {
    key: "schools",
    label: "Schools",
    radius: 3000,
    filters: [
      `node["amenity"="school"]`,
      `way["amenity"="school"]`,
      `node["amenity"="university"]`,
      `way["amenity"="university"]`,
      `node["amenity"="college"]`,
      `way["amenity"="college"]`,
      `node["amenity"="kindergarten"]`,
      `way["amenity"="kindergarten"]`,
    ],
  },
  {
    key: "shops",
    label: "Shops",
    radius: 3000,
    filters: [
      `node["shop"="mall"]`,
      `way["shop"="mall"]`,
      `node["shop"="department_store"]`,
      `way["shop"="department_store"]`,
      `node["shop"="clothes"]`,
      `way["shop"="clothes"]`,
    ],
  },
  {
    key: "grocery",
    label: "Grocery",
    radius: 2000,
    filters: [
      `node["shop"="supermarket"]`,
      `way["shop"="supermarket"]`,
      `node["shop"="grocery"]`,
      `way["shop"="grocery"]`,
      `node["shop"="convenience"]`,
      `way["shop"="convenience"]`,
    ],
  },
  {
    key: "parks",
    label: "Parks",
    radius: 3000,
    filters: [
      `node["leisure"="park"]`,
      `way["leisure"="park"]`,
      `node["leisure"="garden"]`,
      `way["leisure"="garden"]`,
    ],
  },
  {
    key: "fitness",
    label: "Fitness",
    radius: 3000,
    filters: [
      `node["leisure"="fitness_centre"]`,
      `way["leisure"="fitness_centre"]`,
      `node["leisure"="sports_centre"]`,
      `way["leisure"="sports_centre"]`,
      `node["amenity"="gym"]`,
      `way["amenity"="gym"]`,
    ],
  },
  {
    key: "beauty",
    label: "Beauty",
    radius: 2000,
    filters: [
      `node["shop"="beauty"]`,
      `way["shop"="beauty"]`,
      `node["shop"="hairdresser"]`,
      `way["shop"="hairdresser"]`,
    ],
  },
  {
    key: "hospitals",
    label: "Hospitals",
    radius: 5000,
    filters: [
      `node["amenity"="hospital"]`,
      `way["amenity"="hospital"]`,
      `node["amenity"="clinic"]`,
      `way["amenity"="clinic"]`,
      `node["amenity"="pharmacy"]`,
      `way["amenity"="pharmacy"]`,
    ],
  },
  {
    key: "police",
    label: "Police",
    radius: 5000,
    filters: [
      `node["amenity"="police"]`,
      `way["amenity"="police"]`,
    ],
  },
  {
    key: "transport",
    label: "Transport",
    radius: 2000,
    filters: [
      `node["highway"="bus_stop"]`,
      `node["public_transport"="stop_position"]`,
      `node["railway"="station"]`,
      `node["railway"="halt"]`,
    ],
  },
]

function buildQuery(filters: string[], lat: number, lng: number, radius: number) {
  const parts = filters.map(f => `${f}(around:${radius},${lat},${lng});`).join("\n  ")
  return `[out:json][timeout:15];\n(\n  ${parts}\n);\nout center;`
}

function calcDist(lat1: number, lng1: number, lat2: number, lng2: number) {
  const dx = (lng2 - lng1) * 111320 * Math.cos(lat1 * Math.PI / 180)
  const dy = (lat2 - lat1) * 110540
  return Math.round(Math.sqrt(dx * dx + dy * dy))
}

interface OsmElement {
  type: string
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

const OVERPASS_MIRRORS = [
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
]

async function queryOverpass(filters: string[], lat: number, lng: number, radius: number) {
  const query = buildQuery(filters, lat, lng, radius)

  let res: Response | null = null
  for (const mirror of OVERPASS_MIRRORS) {
    try {
      res = await fetch(mirror, {
        method: "POST",
        body: query,
        headers: { "Content-Type": "text/plain" },
        signal: AbortSignal.timeout(12000),
      })
      if (res.ok) break
    } catch {
      // try next mirror
    }
  }
  if (!res?.ok) return []
  const data = await res.json()

  const seen = new Set<string>()
  return (data.elements as OsmElement[])
    .map(el => {
      const elLat = el.lat ?? el.center?.lat
      const elLng = el.lon ?? el.center?.lon
      if (elLat == null || elLng == null) return null
      // Prefer English name, fall back to any name
      const name = el.tags?.["name:en"] || el.tags?.name || ""
      if (!name) return null
      return { name, dist: calcDist(lat, lng, elLat, elLng), lat: elLat, lng: elLng }
    })
    .filter((p): p is { name: string; dist: number; lat: number; lng: number } => {
      if (!p) return false
      if (seen.has(p.name)) return false
      seen.add(p.name)
      return true
    })
    .sort((a, b) => a.dist - b.dist)
    .slice(0, 8)
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await params
  const { searchParams } = new URL(req.url)
  const lat = parseFloat(searchParams.get("lat") || "")
  const lng = parseFloat(searchParams.get("lng") || "")

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: "lat/lng required" }, { status: 400 })
  }

  const results = await Promise.all(
    CATEGORIES.map(async (cat) => {
      const places = await queryOverpass(cat.filters, lat, lng, cat.radius)
      return { key: cat.key, label: cat.label, places }
    })
  )

  return NextResponse.json({ categories: results }, {
    headers: { "Cache-Control": "public, s-maxage=3600" },
  })
}
