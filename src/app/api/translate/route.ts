import Anthropic from "@anthropic-ai/sdk"
import { NextResponse } from "next/server"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: Request) {
  const { text } = await req.json()
  if (!text?.trim()) return NextResponse.json({ translated: text })

  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    messages: [{
      role: "user",
      content: `Translate the following Arabic text to English. Return ONLY the translated text, no explanations:\n\n${text}`,
    }],
  })

  const translated = (msg.content[0] as { type: string; text: string }).text
  return NextResponse.json({ translated })
}
