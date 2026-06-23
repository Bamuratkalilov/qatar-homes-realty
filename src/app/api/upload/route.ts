import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"

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

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg"
    const filename = `${crypto.randomUUID()}.${ext}`
    const dir = join(process.cwd(), "public", "uploads")

    await mkdir(dir, { recursive: true })
    await writeFile(join(dir, filename), buffer)

    urls.push(`/uploads/${filename}`)
  }

  return NextResponse.json({ urls })
}
