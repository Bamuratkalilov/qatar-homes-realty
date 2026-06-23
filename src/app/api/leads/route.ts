import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status")
  const where: Record<string, unknown> = { agentId: session.user.id }
  if (status) where.status = status

  const leads = await db.lead.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      property: {
        select: { id: true, title: true, referenceNumber: true, type: true, listingType: true, price: true, photos: true, address: true },
      },
    },
  })
  return NextResponse.json({ leads })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const lead = await db.lead.create({
    data: {
      name: body.name,
      phone: body.phone,
      email: body.email,
      source: body.source || "WEBSITE",
      budget: body.budget,
      budgetMax: body.budgetMax,
      propertyType: body.propertyType || undefined,
      notes: body.notes,
      agentId: session.user.id,
    },
  })
  return NextResponse.json({ lead }, { status: 201 })
}
