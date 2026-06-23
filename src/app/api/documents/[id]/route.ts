import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const body = await req.json()

  const updateData: Record<string, unknown> = { ...body }
  if (body.status === "SIGNED") updateData.signedAt = new Date()

  const document = await db.document.update({
    where: { id },
    data: updateData,
  })
  return NextResponse.json({ document })
}
