import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const article = await db.article.findUnique({ where: { id }, include: { author: { select: { name: true } } } })
  if (!article) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ article })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { title, slug, excerpt, coverImage, layout, content, tags, status, featured } = body

  const existing = await db.article.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const article = await db.article.update({
    where: { id },
    data: {
      title,
      slug,
      excerpt: excerpt || null,
      coverImage: coverImage || null,
      layout: layout || "standard",
      content,
      tags: tags || [],
      status,
      featured: featured || false,
      publishedAt: status === "PUBLISHED" && !existing.publishedAt ? new Date() : existing.publishedAt,
    },
  })
  return NextResponse.json({ article })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  await db.article.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
