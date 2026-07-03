import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { db } from "@/lib/db"

export const maxDuration = 60

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const ACCESS_TOKEN    = process.env.WHATSAPP_ACCESS_TOKEN!
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID!
const VERIFY_TOKEN    = process.env.WHATSAPP_VERIFY_TOKEN!

// Approximate district centres — sent as WhatsApp location pins (not exact address)
const DISTRICT_COORDS: Record<string, { lat: number; lng: number }> = {
  "the pearl":            { lat: 25.3724, lng: 51.5486 },
  "the pearl-qatar":      { lat: 25.3724, lng: 51.5486 },
  "west bay":             { lat: 25.3301, lng: 51.5342 },
  "lusail":               { lat: 25.4117, lng: 51.4905 },
  "al waab":              { lat: 25.2606, lng: 51.4547 },
  "msheireb":             { lat: 25.2868, lng: 51.5317 },
  "downtown doha":        { lat: 25.2868, lng: 51.5317 },
  "al sadd":              { lat: 25.2853, lng: 51.5103 },
  "al dafna":             { lat: 25.3178, lng: 51.5286 },
  "madinat khalifa":      { lat: 25.2722, lng: 51.4528 },
  "al rayyan":            { lat: 25.2558, lng: 51.4244 },
  "al thumama":           { lat: 25.2083, lng: 51.5308 },
  "al wakra":             { lat: 25.1664, lng: 51.6024 },
  "ain khalid":           { lat: 25.2145, lng: 51.4716 },
  "muaither":             { lat: 25.2228, lng: 51.4128 },
  "doha":                 { lat: 25.2854, lng: 51.5310 },
}

// ── Webhook verification ───────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mode      = searchParams.get("hub.mode")
  const token     = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")
  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 })
  }
  return new Response("Forbidden", { status: 403 })
}

// ── Incoming messages ──────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body    = await req.json()
    const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]

    // Only handle text for now
    if (!message || message.type !== "text") {
      return NextResponse.json({ status: "ok" })
    }

    const from = message.from as string
    const text = (message.text?.body as string)?.trim()
    if (!text) return NextResponse.json({ status: "ok" })

    // Upsert conversation record
    const conversation = await db.whatsAppConversation.upsert({
      where:  { phone: from },
      create: { phone: from },
      update: { updatedAt: new Date() },
    })

    // Save this incoming message
    await db.whatsAppMessage.create({
      data: { conversationId: conversation.id, role: "user", content: text },
    })

    // ── Load conversation history (last 20 msgs for context) ──────────────────
    // Fetch DESC so we get the most recent 20, then reverse to chronological order
    const historyRaw = await db.whatsAppMessage.findMany({
      where:   { conversationId: conversation.id },
      orderBy: { createdAt: "desc" },
      take: 12,
    })
    const history = historyRaw.reverse()

    // ── Load available properties ─────────────────────────────────────────────
    const properties = await db.property.findMany({
      where:   { status: "AVAILABLE" },
      take: 30,
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      select: {
        id: true, title: true, type: true, category: true, listingType: true,
        price: true, bedrooms: true, bathrooms: true, area: true,
        district: true, city: true, furnishing: true,
        utilityBillsIncluded: true,
        referenceNumber: true, availabilityType: true, availableFrom: true,
        description: true,
      },
    })

    const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://qatar-homes-realty.vercel.app"
    const propertyList = properties.map((p, i) => {
      const freq  = p.listingType === "RENT" ? "/mo" : "sale"
      const avail = p.availabilityType === "IMMEDIATE" ? "Now"
        : p.availableFrom ? `From ${new Date(p.availableFrom).toLocaleDateString("en-QA", { day: "numeric", month: "short" })}` : "TBC"
      const beds  = p.bedrooms != null ? `${p.bedrooms}BR` : ""
      const bills = p.utilityBillsIncluded ? "Bills incl." : ""
      return `[${i + 1}] ${p.referenceNumber || p.id.slice(-6)} | ${p.title} | ${p.type}${beds ? " " + beds : ""} | ${p.area}sqm | QAR ${p.price.toLocaleString()} ${freq} | ${p.district || p.city} | ${p.furnishing || "TBC"} | ${avail}${bills ? " | " + bills : ""} | ${BASE_URL}/listings/${p.id}`
    }).join("\n")

    const todayStr = new Date().toLocaleDateString("en-QA", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    })
    const clientName = conversation.name || "the client"

    // ── System prompt ─────────────────────────────────────────────────────────
    const systemPrompt = `You are Sarah, a senior property consultant at Qatar Homes Realty in Doha, Qatar. You reply via WhatsApp. Today is ${todayStr}.

CLIENT ON RECORD: ${conversation.name ? `Name: ${conversation.name} (already captured — do NOT ask for name again)` : "New client — name not yet captured"}

AVAILABLE PROPERTIES (${properties.length} listings):
${propertyList || "No properties currently available."}

VIEWING SLOTS AVAILABLE THIS WEEK:
Morning: 9:00 AM, 10:30 AM | Afternoon: 2:00 PM, 4:00 PM | Evening: 6:00 PM, 7:00 PM

━━━ CONVERSATION RULES ━━━

1. TONE: Warm, professional, brief. Max 3-4 lines per reply. No essays.

2. NEW CLIENT FLOW — qualify before showing listings:
   Step 1: "Are you looking to rent or buy?"
   Step 2: "What is your monthly budget? (in QAR)"
   Step 3: "How many bedrooms do you need?"
   Step 4: "Any preferred area in Doha? (e.g. The Pearl, West Bay, Lusail)"
   Step 5: Show the 2-3 best matching properties from the list above.
   → Do NOT dump all listings. Show only relevant matches.

3. PRESENTING A PROPERTY: Give ref number, price, size, area, one key selling point, availability. Then ask: "Would you like to schedule a viewing?"

4. SHOW ALTERNATIVES: If client says "too expensive / too small / show more / different area / another option" — pick different properties from the list that better match and present them.

5. VIEWING SCHEDULE:
   - If client wants to view: offer 3 specific time slot options
   - Once they choose: get their name and phone number
   - Then use schedule_viewing tool to book it
   - Confirm: "Your viewing is confirmed for [date] at [time]. Our agent will meet you there."

6. LOCATION QUESTIONS: If client asks "where is it?", "which area?", "how far?", "location?" — use send_area_location tool immediately. Do NOT share exact address. Say: "I've sent you the area on the map — we'll share the exact unit address when you confirm your visit."

7. PROPERTY LINK: When presenting a match or when client asks for more details / photos — use send_listing_link with the listing link from the property data. The client can view all photos and full details on the website.

8. LEAD CAPTURE: Use save_lead as soon as you have name + phone. Also capture budget, bedrooms, preferred area in the notes.

9. PRICE OBJECTION: "Let me speak to the landlord about flexibility — may I take your name and number so our senior consultant calls you directly?"

10. CLIENT SAYS "I'LL THINK ABOUT IT": Ask one follow-up: "Of course! Is there anything specific holding you back — the price, location, or size? I may have something that works better."

11. LANGUAGE: Reply in the same language as the client. English or Arabic. If Arabic, use a warm Gulf tone.

12. FORMAT: Plain text ONLY. No asterisks, no bullet points with -, no markdown. Use simple line breaks.

13. GREET: On first message, introduce yourself: "Hi! I'm Sarah from Qatar Homes Realty. I'd love to help you find your perfect property in Qatar."

14. TOOL CALLS: ALWAYS include a short text reply in the SAME response as any tool call. Never return a tool call with no text — always say something brief alongside it (e.g. "Let me send you the location..." or "Here are the full details:").`

    // ── Claude tools ──────────────────────────────────────────────────────────
    const tools: Anthropic.Tool[] = [
      {
        name: "save_lead",
        description: "Save client contact info when you have their name and phone. Also capture budget, bedrooms, area preference.",
        input_schema: {
          type: "object" as const,
          properties: {
            name:           { type: "string",  description: "Client full name" },
            phone:          { type: "string",  description: "Client phone number" },
            email:          { type: "string",  description: "Email if provided" },
            budget:         { type: "number",  description: "Monthly budget in QAR" },
            bedrooms:       { type: "number",  description: "Number of bedrooms needed" },
            preferred_area: { type: "string",  description: "Preferred district/area" },
            notes:          { type: "string",  description: "Summary of what they are looking for" },
          },
          required: ["name", "phone"],
        },
      },
      {
        name: "schedule_viewing",
        description: "Book a property viewing appointment. Use after client confirms date, time, and shares their name and phone.",
        input_schema: {
          type: "object" as const,
          properties: {
            client_name:     { type: "string", description: "Client full name" },
            client_phone:    { type: "string", description: "Client phone number" },
            property_ref:    { type: "string", description: "Property reference number or title" },
            date:            { type: "string", description: "Date in YYYY-MM-DD format" },
            time:            { type: "string", description: "Time e.g. 10:30 AM" },
            notes:           { type: "string", description: "Any special notes or requests" },
          },
          required: ["client_name", "client_phone", "property_ref", "date", "time"],
        },
      },
      {
        name: "send_area_location",
        description: "Send a WhatsApp location pin showing the approximate neighbourhood of a property. Use when client asks where a property is located. Shows area centre — not the exact unit.",
        input_schema: {
          type: "object" as const,
          properties: {
            area: { type: "string", description: "District or area name e.g. The Pearl-Qatar, West Bay, Lusail, Al Sadd" },
          },
          required: ["area"],
        },
      },
      {
        name: "send_listing_link",
        description: "Send the property listing page link to the client. Use when presenting a match or when client asks for more details or photos. WhatsApp will show a preview with photos automatically.",
        input_schema: {
          type: "object" as const,
          properties: {
            listing_url: { type: "string", description: "The full listing URL from the property data" },
            caption:     { type: "string", description: "One short line before the link: e.g. 'Here are the full details for this property:'" },
          },
          required: ["listing_url", "caption"],
        },
      },
    ]

    // Build message history for Claude — enforce strict user/assistant alternation.
    // If the bot ever failed to reply, two user messages end up consecutive in DB,
    // which causes Claude API to throw "roles must alternate". We fix by skipping
    // any message that would repeat the same role as the previous one.
    const messages: Anthropic.MessageParam[] = []
    for (const m of history) {
      const role = m.role as "user" | "assistant"
      if (messages.length > 0 && messages[messages.length - 1].role === role) continue
      messages.push({ role, content: m.content })
    }
    // Claude requires the final message to be from the user
    while (messages.length > 0 && messages[messages.length - 1].role !== "user") {
      messages.pop()
    }
    // Safety: if history was completely broken, fall back to just the current message
    if (messages.length === 0) {
      messages.push({ role: "user", content: text })
    }

    // ── First Claude call ─────────────────────────────────────────────────────
    const response = await anthropic.messages.create({
      model:      "claude-opus-4-8",
      max_tokens: 1024,
      system:     systemPrompt,
      tools,
      messages,
    })

    let reply = ""
    for (const block of response.content) {
      if (block.type === "text") reply += block.text
    }

    // ── Execute all tools Claude requested ────────────────────────────────────
    const toolUseBlocks = response.content.filter((b) => b.type === "tool_use")
    const toolResults: { tool_use_id: string; content: string }[] = []

    for (const tb of toolUseBlocks) {
      if (tb.type !== "tool_use") continue

      // ── save_lead ──────────────────────────────────────────────────────────
      if (tb.name === "save_lead") {
        const input = tb.input as {
          name: string; phone: string; email?: string
          budget?: number; bedrooms?: number; preferred_area?: string; notes?: string
        }
        try {
          const agent = await db.user.findFirst({
            where:   { role: { in: ["ADMIN", "AGENT"] } },
            orderBy: { createdAt: "asc" },
            select:  { id: true },
          })
          if (agent) {
            const noteParts = [
              `WhatsApp inquiry from ${from}.`,
              input.preferred_area ? `Preferred area: ${input.preferred_area}.` : "",
              input.notes || "",
            ].filter(Boolean).join(" ")

            const lead = await db.lead.create({
              data: {
                name:     input.name.trim(),
                phone:    input.phone.trim(),
                email:    input.email?.trim() || null,
                source:   "WHATSAPP",
                budget:   input.budget || null,
                bedrooms: input.bedrooms || null,
                notes:    noteParts,
                agentId:  agent.id,
              },
            })
            await db.whatsAppConversation.update({
              where: { phone: from },
              data:  { name: input.name.trim(), leadId: lead.id },
            })
          }
          toolResults.push({ tool_use_id: tb.id, content: "Lead saved." })
        } catch (e) {
          console.error("save_lead error:", e)
          toolResults.push({ tool_use_id: tb.id, content: "Lead save failed." })
        }
      }

      // ── schedule_viewing ───────────────────────────────────────────────────
      else if (tb.name === "schedule_viewing") {
        const input = tb.input as {
          client_name: string; client_phone: string; property_ref: string
          date: string; time: string; notes?: string
        }
        try {
          const agent = await db.user.findFirst({
            where:   { role: { in: ["ADMIN", "AGENT"] } },
            orderBy: { createdAt: "asc" },
            select:  { id: true },
          })
          if (agent) {
            const startTime = new Date(`${input.date}T${to24h(input.time)}:00`)
            const endTime   = new Date(startTime.getTime() + 60 * 60 * 1000)
            await db.appointment.create({
              data: {
                title:       `Viewing — ${input.property_ref}`,
                description: `Booked via WhatsApp by ${input.client_name} (${input.client_phone})`,
                startTime,
                endTime,
                type:        "VIEWING",
                status:      "SCHEDULED",
                location:    input.property_ref,
                notes:       input.notes || `WhatsApp booking from ${from}`,
                agentId:     agent.id,
                leadId:      conversation.leadId || undefined,
              },
            })
          }
          toolResults.push({ tool_use_id: tb.id, content: `Viewing booked for ${input.date} at ${input.time}.` })
        } catch (e) {
          console.error("schedule_viewing error:", e)
          toolResults.push({ tool_use_id: tb.id, content: "Could not save appointment — continue confirming with the client." })
        }
      }

      // ── send_area_location ─────────────────────────────────────────────────
      else if (tb.name === "send_area_location") {
        const input  = tb.input as { area: string }
        const coords = resolveAreaCoords(input.area)
        if (coords) {
          try {
            await sendWhatsAppLocation(from, coords.lat, coords.lng, `${input.area} area`, "Doha, Qatar")
            toolResults.push({ tool_use_id: tb.id, content: `Location pin sent for ${input.area}.` })
          } catch (e) {
            console.error("send_area_location error:", e)
            toolResults.push({ tool_use_id: tb.id, content: "Location send failed — describe area verbally." })
          }
        } else {
          toolResults.push({ tool_use_id: tb.id, content: `Area coords not found for "${input.area}". Describe the area in text instead.` })
        }
      }

 
    }

    // ── Second Claude call (get reply after tool results) ─────────────────────
    if (toolUseBlocks.length > 0 && !reply && toolResults.length > 0) {
      const followUp = await anthropic.messages.create({
        model:      "claude-opus-4-8",
        max_tokens: 512,
        system:     systemPrompt,
        tools,
        messages: [
          ...messages,
          { role: "assistant" as const, content: response.content },
          {
            role: "user" as const,
            content: toolResults.map((r) => ({
              type:        "tool_result" as const,
              tool_use_id: r.tool_use_id,
              content:     r.content,
            })),
          },
        ],
      })
      reply = (followUp.content.find((b) => b.type === "text") as Anthropic.TextBlock)?.text || ""
    }

    // ── Save assistant reply and send ─────────────────────────────────────────
    if (reply) {
      await sendWhatsAppMessage(from, reply)
      await db.whatsAppMessage.create({
        data: { conversationId: conversation.id, role: "assistant", content: reply },
      })
    }

    return NextResponse.json({ status: "ok" })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error("POST /api/whatsapp error:", msg, e)
    return NextResponse.json({ status: "error", error: msg }, { status: 200 }) // always 200 to Meta
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function resolveAreaCoords(area: string): { lat: number; lng: number } | null {
  const key = area.toLowerCase().trim()
  // Exact match first, then partial
  if (DISTRICT_COORDS[key]) return DISTRICT_COORDS[key]
  const partialKey = Object.keys(DISTRICT_COORDS).find((k) => key.includes(k) || k.includes(key))
  return partialKey ? DISTRICT_COORDS[partialKey] : (DISTRICT_COORDS["doha"] ?? null)
}

// Convert "10:30 AM" → "10:30" for Date constructor
function to24h(timeStr: string): string {
  try {
    const [time, period] = timeStr.split(" ")
    let [hours, minutes] = time.split(":").map(Number)
    if (period?.toUpperCase() === "PM" && hours !== 12) hours += 12
    if (period?.toUpperCase() === "AM" && hours === 12) hours = 0
    return `${String(hours).padStart(2, "0")}:${String(minutes || 0).padStart(2, "0")}`
  } catch {
    return "10:00"
  }
}

async function sendWhatsAppMessage(to: string, text: string) {
  const res = await fetch(`https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`, {
    method:  "POST",
    headers: { Authorization: `Bearer ${ACCESS_TOKEN}`, "Content-Type": "application/json" },
    body:    JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: text } }),
  })
  const data = await res.json()
  if (!res.ok) {
    console.error("Meta send error:", JSON.stringify(data))
    throw new Error(`Meta API error: ${data?.error?.message || res.status}`)
  }
  return data
}

async function sendWhatsAppLocation(to: string, lat: number, lng: number, name: string, address: string) {
  const res = await fetch(`https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`, {
    method:  "POST",
    headers: { Authorization: `Bearer ${ACCESS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type:     "location",
      location: { latitude: lat, longitude: lng, name, address },
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(`Meta location error: ${data?.error?.message || res.status}`)
  return data
}

