import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { anthropic, SYSTEM_PROMPT } from "@/lib/claude"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { type, clientName, agentName, context } = await req.json()

  const typeLabels: Record<string, string> = {
    follow_up: "professional follow-up email after a property viewing",
    welcome: "warm welcome email for a new lead",
    offer: "property offer email presenting a listing",
    reminder: "appointment reminder email",
    thank_you: "thank you email after a meeting",
  }

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 600,
    system: SYSTEM_PROMPT,
    messages: [{
      role: "user",
      content: `Write a ${typeLabels[type] || "professional email"} for a Qatar real estate agent.
Client name: ${clientName || "[Client Name]"}
Agent name: ${agentName || "[Agent Name]"}
Additional context: ${context || "N/A"}

Write ONLY the email body (no subject line). Be professional, warm, and concise. End with a clear call to action.`,
    }],
  })

  const email = response.content[0].type === "text" ? response.content[0].text : ""
  return NextResponse.json({ email })
}
