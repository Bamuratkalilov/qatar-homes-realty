import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await params
  const { searchParams } = new URL(req.url)
  const district = searchParams.get("district") || ""
  const city     = searchParams.get("city") || "Doha"
  const area     = district || city

  try {
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      messages: [{
        role: "user",
        content: `Write a short 3-4 sentence neighbourhood description for "${area}", Qatar.
Focus on: what kind of area it is, lifestyle, key landmarks or character, who it appeals to.
Plain text only. No markdown, no emojis, no bullet points.`,
      }],
    })

    const description = (msg.content[0] as { type: string; text: string }).text.trim()
    return NextResponse.json({ area, description }, {
      headers: { "Cache-Control": "public, s-maxage=604800" }, // cache 1 week
    })
  } catch {
    return NextResponse.json({ area, description: "" }, { status: 500 })
  }
}
