import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { db } from "@/lib/db"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN!
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID!
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN!

// Meta calls this to verify your webhook is real
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get("hub.mode")
  const token = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 })
  }
  return new Response("Forbidden", { status: 403 })
}

// Meta sends incoming WhatsApp messages here
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const entry = body.entry?.[0]
    const change = entry?.changes?.[0]
    const value = change?.value
    const message = value?.messages?.[0]

    // Only handle text messages
    if (!message || message.type !== "text") {
      return NextResponse.json({ status: "ok" })
    }

    const from = message.from as string
    const text = message.text.body as string

    // Upsert conversation record
    const conversation = await db.whatsAppConversation.upsert({
      where: { phone: from },
      create: { phone: from },
      update: { updatedAt: new Date() },
    })

    // Save incoming message
    await db.whatsAppMessage.create({
      data: { conversationId: conversation.id, role: "user", content: text },
    })

    // Load available properties for context
    const properties = await db.property.findMany({
      where: { status: "AVAILABLE" },
      take: 20,
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      select: {
        id: true, title: true, type: true, listingType: true, price: true,
        bedrooms: true, area: true, district: true, city: true,
        furnishing: true, utilityBillsIncluded: true,
      },
    })

    const propertyList = properties
      .map(
        (p) =>
          `- ${p.title} | ${p.type}${p.bedrooms != null ? " " + p.bedrooms + "BR" : ""} | ${p.area}sqm | ${p.district || p.city} | QAR ${p.price.toLocaleString()} ${p.listingType === "RENT" ? "/month" : "for sale"}${p.furnishing ? " | " + p.furnishing : ""}${p.utilityBillsIncluded ? " | utilities included" : ""}`,
      )
      .join("\n")

    const systemPrompt = `You are a friendly real estate assistant for Qatar Homes Realty in Doha, Qatar. You are replying via WhatsApp.

AVAILABLE PROPERTIES:
${propertyList || "No properties currently listed."}

INSTRUCTIONS:
- Help the visitor find properties matching their needs
- Keep replies short and conversational (this is WhatsApp, not email)
- Mention property details and prices in QAR
- Rent prices are monthly (per month)
- When the visitor provides their name AND phone number, use the save_lead tool
- After saving, confirm warmly that an agent will call them soon
- Reply in the visitor's language (English or Arabic)
- Do NOT use markdown formatting — plain text only for WhatsApp`

    const tools: Anthropic.Tool[] = [
      {
        name: "save_lead",
        description: "Save visitor contact info when they provide their name and phone number",
        input_schema: {
          type: "object" as const,
          properties: {
            name: { type: "string", description: "Visitor full name" },
            phone: { type: "string", description: "Visitor phone number" },
            email: { type: "string", description: "Email if provided" },
            notes: { type: "string", description: "What they are looking for" },
          },
          required: ["name", "phone"],
        },
      },
    ]

    const response = await anthropic.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 1024,
      system: systemPrompt,
      tools,
      messages: [{ role: "user", content: text }],
    })

    let reply = ""
    const toolUseBlock = response.content.find((b) => b.type === "tool_use")

    for (const block of response.content) {
      if (block.type === "text") reply += block.text
    }

    // Save lead if Claude detected contact info
    if (toolUseBlock && toolUseBlock.type === "tool_use" && toolUseBlock.name === "save_lead") {
      const input = toolUseBlock.input as {
        name: string; phone: string; email?: string; notes?: string
      }
      try {
        const agent = await db.user.findFirst({
          where: { role: { in: ["ADMIN", "AGENT"] } },
          orderBy: { createdAt: "asc" },
          select: { id: true },
        })
        if (agent) {
          const lead = await db.lead.create({
            data: {
              name: input.name.trim(),
              phone: input.phone.trim(),
              email: input.email?.trim() || null,
              source: "WHATSAPP",
              notes: `WhatsApp inquiry from ${from}. ${input.notes || ""}`.trim(),
              agentId: agent.id,
            },
          })
          // Link conversation to the new lead and save their name
          await db.whatsAppConversation.update({
            where: { phone: from },
            data: { name: input.name.trim(), leadId: lead.id },
          })
        }
      } catch (e) {
        console.error("Failed to save lead from WhatsApp:", e)
      }

      // Get Claude's reply after tool execution
      if (!reply) {
        const followUp = await anthropic.messages.create({
          model: "claude-opus-4-8",
          max_tokens: 512,
          system: systemPrompt,
          tools,
          messages: [
            { role: "user" as const, content: text },
            { role: "assistant" as const, content: response.content },
            {
              role: "user" as const,
              content: [
                {
                  type: "tool_result" as const,
                  tool_use_id: toolUseBlock.id,
                  content: "Lead saved successfully.",
                },
              ],
            },
          ],
        })
        reply = followUp.content.find((b) => b.type === "text")
          ? (followUp.content.find((b) => b.type === "text") as Anthropic.TextBlock).text
          : ""
      }
    }

    if (reply) {
      await sendWhatsAppMessage(from, reply)
      await db.whatsAppMessage.create({
        data: { conversationId: conversation.id, role: "assistant", content: reply },
      })
    }

    return NextResponse.json({ status: "ok" })
  } catch (e) {
    console.error("POST /api/whatsapp error:", e)
    return NextResponse.json({ status: "error" }, { status: 200 }) // always 200 to Meta
  }
}

async function sendWhatsAppMessage(to: string, text: string) {
  await fetch(
    `https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text },
      }),
    },
  )
}
