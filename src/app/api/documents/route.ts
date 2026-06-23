import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const documents = await db.document.findMany({
    where: { client: { agentId: session.user.id } },
    orderBy: { createdAt: "desc" },
    include: { client: { select: { name: true } } },
  })
  return NextResponse.json({ documents })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const document = await db.document.create({
    data: {
      title: body.title,
      type: body.type,
      clientId: body.clientId,
    },
    include: { client: { select: { name: true } } },
  })
  return NextResponse.json({ document }, { status: 201 })
}
