import Anthropic from "@anthropic-ai/sdk"
import { NextResponse } from "next/server"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: Request) {
  const { prompt } = await req.json()
  if (!prompt?.trim()) return NextResponse.json({ error: "No prompt" }, { status: 400 })

  try {
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      messages: [{
        role: "user",
        content: `You are an image editing assistant for real estate photos. Convert the user's instruction into CSS filter adjustment values. Return ONLY a valid JSON object with these exact keys:
- brightness: integer 50–150 (default 100)
- contrast: integer 50–175 (default 100)
- saturation: integer 0–200 (default 100)
- warmth: integer -50 to 50 (default 0, positive = warm/orange, negative = cool/blue)
- sharpness: integer 0–100 (default 0)

User instruction: "${prompt}"

Examples:
"make it brighter and cleaner" → {"brightness":115,"contrast":112,"saturation":95,"warmth":-5,"sharpness":20}
"warm luxury look" → {"brightness":102,"contrast":118,"saturation":108,"warmth":20,"sharpness":15}
"cool modern feel" → {"brightness":105,"contrast":115,"saturation":100,"warmth":-20,"sharpness":10}
"improve quality" → {"brightness":105,"contrast":110,"saturation":105,"warmth":5,"sharpness":30}
"natural daylight" → {"brightness":112,"contrast":105,"saturation":108,"warmth":8,"sharpness":10}

Return ONLY the JSON object, no explanation.`,
      }],
    })

    const text = (msg.content[0] as { type: string; text: string }).text.trim()
    // Extract JSON even if there's surrounding text
    const match = text.match(/\{[^}]+\}/)
    if (!match) return NextResponse.json({ error: "Could not parse response" }, { status: 500 })

    const adj = JSON.parse(match[0])
    // Clamp all values to safe ranges
    return NextResponse.json({
      adj: {
        brightness: Math.min(150, Math.max(50,  Math.round(adj.brightness  ?? 100))),
        contrast:   Math.min(175, Math.max(50,  Math.round(adj.contrast    ?? 100))),
        saturation: Math.min(200, Math.max(0,   Math.round(adj.saturation  ?? 100))),
        warmth:     Math.min(50,  Math.max(-50, Math.round(adj.warmth      ?? 0))),
        sharpness:  Math.min(100, Math.max(0,   Math.round(adj.sharpness   ?? 0))),
      }
    })
  } catch {
    return NextResponse.json({ error: "AI enhancement failed" }, { status: 500 })
  }
}
