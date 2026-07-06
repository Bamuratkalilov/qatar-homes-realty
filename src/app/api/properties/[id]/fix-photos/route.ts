import { NextRequest, NextResponse } from "next/server"
import { v2 as cloudinary } from "cloudinary"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export const maxDuration = 120

async function resolveAgentId(sessionId: string, email: string) {
  if (sessionId !== "demo-agent") {
    const exists = await db.user.findUnique({ where: { id: sessionId }, select: { id: true } })
    if (exists) return sessionId
  }
  const user = await db.user.findUnique({ where: { email }, select: { id: true } })
  return user?.id ?? null
}

async function uploadToCloudinary(url: string): Promise<string> {
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), 25000)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "Referer": "https://www.propertyfinder.qa/",
        Accept: "image/*,*/*;q=0.8",
      },
    })
    if (!res.ok) return url
    const buffer = Buffer.from(await res.arrayBuffer())
    return await new Promise<string>((resolve) => {
      cloudinary.uploader.upload_stream(
        { folder: "qatar-homes/properties", resource_type: "image", transformation: [{ quality: "auto:best", fetch_format: "auto" }] },
        (err, result) => resolve(result?.secure_url ?? url)
      ).end(buffer)
    })
  } catch {
    return url
  } finally {
    clearTimeout(t)
  }
}

// POST /api/properties/[id]/fix-photos
// Re-uploads any non-Cloudinary photos to Cloudinary and saves the new URLs to DB
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  try {
    const agentId = await resolveAgentId(session.user.id, session.user.email!)
    if (!agentId) return NextResponse.json({ error: "Session expired" }, { status: 401 })

    const property = await db.property.findUnique({ where: { id }, select: { agentId: true, photos: true } })
    if (!property) return NextResponse.json({ error: "Not found" }, { status: 404 })
    if (property.agentId !== agentId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const externalPhotos = property.photos.filter(u => !u.startsWith("https://res.cloudinary.com"))
    if (externalPhotos.length === 0) return NextResponse.json({ photos: property.photos })

    // Re-upload all non-Cloudinary photos in parallel
    const fixed = await Promise.all(
      property.photos.map(url =>
        url.startsWith("https://res.cloudinary.com") ? Promise.resolve(url) : uploadToCloudinary(url)
      )
    )

    await db.property.update({ where: { id }, data: { photos: fixed } })
    return NextResponse.json({ photos: fixed, fixed: fixed.filter(u => u.startsWith("https://res.cloudinary.com")).length })
  } catch (e) {
    console.error("fix-photos error:", e)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
