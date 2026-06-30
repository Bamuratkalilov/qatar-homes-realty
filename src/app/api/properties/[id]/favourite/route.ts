import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { action } = await req.json() // "add" | "remove"

  try {
    const property = await db.property.update({
      where: { id },
      data: { favorites: { [action === "add" ? "increment" : "decrement"]: 1 } },
      select: { favorites: true },
    })
    return NextResponse.json({ favorites: property.favorites })
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
}
