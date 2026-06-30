import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const property = await db.property.findUnique({ where: { id }, select: { views: true } })
    if (!property) return NextResponse.json({ views: 0 })
    return NextResponse.json({ views: property.views })
  } catch {
    return NextResponse.json({ views: 0 })
  }
}
