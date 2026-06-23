import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const clients = await db.client.findMany({
    where: { agentId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { leads: true, documents: true, appointments: true } },
      leads: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true, status: true, propertyType: true, budget: true, createdAt: true,
          property: {
            select: { id: true, title: true, referenceNumber: true, photos: true, price: true, listingType: true },
          },
        },
      },
    },
  })
  return NextResponse.json({ clients })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const client = await db.client.create({
    data: {
      name: body.name,
      phone: body.phone,
      email: body.email || null,
      nationality: body.nationality || null,
      idNumber: body.idNumber || null,
      notes: body.notes || null,
      agentId: session.user.id,
    },
    include: {
      _count: { select: { leads: true, documents: true, appointments: true } },
      leads: { take: 1, select: { id: true, status: true, propertyType: true } },
    },
  })

  // If converting from a lead, mark it converted and link to this client
  if (body.leadId) {
    await db.lead.update({
      where: { id: body.leadId },
      data: { status: "CONVERTED", clientId: client.id },
    })
  }

  return NextResponse.json({ client }, { status: 201 })
}
