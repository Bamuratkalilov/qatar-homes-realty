import { NextRequest, NextResponse } from "next/server"
import { v2 as cloudinary } from "cloudinary"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

async function resolveAgentId(sessionId: string, email: string) {
  if (sessionId !== "demo-agent") {
    const exists = await db.user.findUnique({ where: { id: sessionId }, select: { id: true } })
    if (exists) return sessionId
  }
  const user = await db.user.findUnique({ where: { email }, select: { id: true } })
  return user?.id ?? null
}

// Cloudinary fetches the URL on their own servers — nothing is downloaded on Vercel
async function uploadToCloudinary(url: string): Promise<string> {
  const result = await cloudinary.uploader.upload(url, {
    folder: "qatar-homes/properties",
    resource_type: "image",
  })
  return result.secure_url
}

// POST /api/properties/[id]/fix-photos
// Body: { url: string }  → upload one photo to Cloudinary, save to DB, return cloudinaryUrl
// Body: {}               → batch: upload all non-Cloudinary photos in parallel
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  try {
    const agentId = await resolveAgentId(session.user.id, session.user.email!)
    if (!agentId) return NextResponse.json({ error: "Session expired" }, { status: 401 })

    const property = await db.property.findUnique({ where: { id }, select: { agentId: true, photos: true } })
    if (!property) return NextResponse.json({ error: "Not found" }, { status: 404 })
    if (property.agentId !== agentId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    // Single-URL mode: process one photo at a time (called sequentially from the edit page)
    let singleUrl: string | null = null
    try { const body = await req.json(); singleUrl = body?.url ?? null } catch { /* no body = batch mode */ }

    if (singleUrl) {
      if (singleUrl.startsWith("https://res.cloudinary.com")) {
        return NextResponse.json({ cloudinaryUrl: singleUrl, photos: property.photos })
      }
      const cloudinaryUrl = await uploadToCloudinary(singleUrl)
      const updatedPhotos = property.photos.map(p => p === singleUrl ? cloudinaryUrl : p)
      await db.property.update({ where: { id }, data: { photos: updatedPhotos } })
      return NextResponse.json({ cloudinaryUrl, photos: updatedPhotos })
    }

    // Batch mode: upload all non-Cloudinary photos in parallel
    const externalPhotos = property.photos.filter(u => !u.startsWith("https://res.cloudinary.com"))
    if (externalPhotos.length === 0) return NextResponse.json({ photos: property.photos })

    const fixed = await Promise.all(
      property.photos.map(async (url) => {
        if (url.startsWith("https://res.cloudinary.com")) return url
        try { return await uploadToCloudinary(url) } catch { return url }
      })
    )

    await db.property.update({ where: { id }, data: { photos: fixed } })
    return NextResponse.json({ photos: fixed, fixed: fixed.filter(u => u.startsWith("https://res.cloudinary.com")).length })
  } catch (e) {
    console.error("fix-photos error:", e)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
