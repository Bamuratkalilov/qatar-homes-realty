import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { anthropic, SYSTEM_PROMPT } from "@/lib/claude"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { messages } = await req.json()

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: messages.map((m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  })

  const message = response.content[0].type === "text" ? response.content[0].text : ""
  return NextResponse.json({ message })
}
