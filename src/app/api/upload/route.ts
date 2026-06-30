import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const formData = await req.formData()
  const files = formData.getAll("files") as File[]

  if (!files.length) return NextResponse.json({ error: "No files" }, { status: 400 })

  const urls: string[] = []

  for (const file of files) {
    if (!file.type.startsWith("image/")) continue

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: "qatar-homes/properties",
          resource_type: "image",
          transformation: [
            { quality: "auto:best", fetch_format: "auto" },
          ],
        },
        (error, result) => {
          if (error || !result) reject(error)
          else resolve(result)
        }
      ).end(buffer)
    })

    urls.push(result.secure_url)
  }

  return NextResponse.json({ urls })
}
