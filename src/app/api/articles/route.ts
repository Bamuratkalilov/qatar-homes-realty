import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status")
  const where = status ? { status: status as "DRAFT" | "PUBLISHED" | "ARCHIVED" } : {}
  const articles = await db.article.findMany({
    where,
    include: { author: { select: { name: true } } },
    orderBy: { updatedAt: "desc" },
  })
  return NextResponse.json({ articles })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { title, slug, excerpt, coverImage, layout, content, tags, status, featured } = body

  if (!title?.trim() || !slug?.trim()) {
    return NextResponse.json({ error: "Title and slug required" }, { status: 400 })
  }

  const article = await db.article.create({
    data: {
      title,
      slug,
      excerpt: excerpt || null,
      coverImage: coverImage || null,
      layout: layout || "standard",
      content: content || { blocks: [] },
      tags: tags || [],
      status: status || "DRAFT",
      featured: featured || false,
      authorId: session.user.id,
      publishedAt: status === "PUBLISHED" ? new Date() : null,
    },
  })
  return NextResponse.json({ article })
}
