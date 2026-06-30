import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { db } from "@/lib/db"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Invalid messages" }, { status: 400 })
    }

    const properties = await db.property.findMany({
      where: { status: "AVAILABLE" },
      take: 20,
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      select: {
        id: true, title: true, type: true, listingType: true, price: true,
        bedrooms: true, bathrooms: true, area: true, district: true, city: true,
        furnishing: true, utilityBillsIncluded: true,
      },
    })

    const propertyList = properties
      .map(
        (p) =>
          `ID:${p.id} | ${p.title} | ${p.type}${p.bedrooms != null ? " " + p.bedrooms + "BR" : ""} | ${p.area}sqm | ${p.district || p.city} | QAR ${p.price.toLocaleString()} ${p.listingType === "RENT" ? "/month" : "for sale"}${p.furnishing ? " | " + p.furnishing : ""}${p.utilityBillsIncluded ? " | utilities included" : ""}`,
      )
      .join("\n")

    const systemPrompt = `You are a friendly real estate assistant for Qatar Homes Realty in Doha, Qatar.

AVAILABLE PROPERTIES:
${propertyList || "No properties currently listed."}

INSTRUCTIONS:
- Help visitors find properties matching their needs (budget, bedrooms, district, type)
- When mentioning a property, link it: [Property Title](/listings/ID)
- Answer questions about Qatar neighborhoods, RERA regulations, and the rental/buying process
- Rent prices shown are monthly (per month)
- Currency is QAR (Qatari Riyal)
- When a visitor provides their name AND phone number, use the save_lead tool immediately
- After saving their lead, confirm warmly that an agent will contact them shortly
- Reply in the same language as the visitor (English or Arabic)
- Keep responses concise and helpful`

    const tools: Anthropic.Tool[] = [
      {
        name: "save_lead",
        description:
          "Save a visitor's contact details as a lead when they provide their name and phone number",
        input_schema: {
          type: "object" as const,
          properties: {
            name: { type: "string", description: "Visitor full name" },
            phone: { type: "string", description: "Visitor phone number" },
            email: { type: "string", description: "Email address if provided" },
            notes: { type: "string", description: "What they are looking for" },
          },
          required: ["name", "phone"],
        },
      },
    ]

    const apiMessages = messages.map(
      (m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }),
    )

    const response = await anthropic.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 1024,
      system: systemPrompt,
      tools,
      messages: apiMessages,
    })

    let reply = ""
    let leadSaved = false
    const toolUseBlock = response.content.find((b) => b.type === "tool_use")

    for (const block of response.content) {
      if (block.type === "text") reply += block.text
    }

    if (toolUseBlock && toolUseBlock.type === "tool_use" && toolUseBlock.name === "save_lead") {
      const input = toolUseBlock.input as {
        name: string
        phone: string
        email?: string
        notes?: string
      }
      try {
        const agent = await db.user.findFirst({
          where: { role: { in: ["ADMIN", "AGENT"] } },
          orderBy: { createdAt: "asc" },
          select: { id: true },
        })
        if (agent) {
          await db.lead.create({
            data: {
              name: input.name.trim(),
              phone: input.phone.trim(),
              email: input.email?.trim() || null,
              source: "WEBSITE",
              notes: input.notes || "Inquiry via website chat",
              agentId: agent.id,
            },
          })
          leadSaved = true
        }
      } catch (e) {
        console.error("Failed to save lead from chat:", e)
      }

      // Get Claude's reply after tool execution
      if (!reply) {
        const followUp = await anthropic.messages.create({
          model: "claude-opus-4-8",
          max_tokens: 512,
          system: systemPrompt,
          tools,
          messages: [
            ...apiMessages,
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

    return NextResponse.json({ message: reply, leadSaved })
  } catch (e) {
    console.error("POST /api/chat error:", e)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}
