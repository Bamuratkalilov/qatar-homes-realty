import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const q = req.nextUrl.searchParams.get("q")?.trim()
  if (!q || q.length < 2) return NextResponse.json({ results: [] })

  const agentId = session.user.id

  const [properties, leads, clients] = await Promise.all([
    db.property.findMany({
      where: {
        agentId,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { address: { contains: q, mode: "insensitive" } },
          { district: { contains: q, mode: "insensitive" } },
          { referenceNumber: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 4,
      select: { id: true, title: true, type: true, listingType: true, price: true, status: true, photos: true, address: true },
    }),
    db.lead.findMany({
      where: {
        agentId,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { phone: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 4,
      select: { id: true, name: true, phone: true, email: true, status: true, score: true, source: true },
    }),
    db.client.findMany({
      where: {
        agentId,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { phone: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 4,
      select: { id: true, name: true, phone: true, email: true, nationality: true },
    }),
  ])

  return NextResponse.json({
    results: {
      properties: properties.map(p => ({ ...p, _type: "property" })),
      leads:      leads.map(l      => ({ ...l, _type: "lead"     })),
      clients:    clients.map(c    => ({ ...c, _type: "client"   })),
    },
    total: properties.length + leads.length + clients.length,
  })
}
