import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { property, instructions } = await req.json()
    if (!property) return NextResponse.json({ error: "Property required" }, { status: 400 })

    const bedroomStr = property.bedrooms === 0 ? "Studio"
      : property.bedrooms ? `${property.bedrooms} Bedroom` : ""
    const typeLabel = property.type.charAt(0) + property.type.slice(1).toLowerCase().replace("_", " ")
    const location = property.district || property.address?.split(",")[0] || property.city
    const priceStr = `QAR ${Number(property.price).toLocaleString()}${property.listingType === "RENT" ? "/month" : ""}`
    const amenStr = (property.amenities || []).slice(0, 5).join(", ")

    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      messages: [{
        role: "user",
        content: `Write an engaging Instagram caption for this Qatar real estate listing. Use emojis, make it professional yet exciting. End with relevant hashtags.

Property: ${bedroomStr} ${typeLabel} for ${property.listingType === "RENT" ? "Rent" : "Sale"}
Location: ${location}, Qatar
Price: ${priceStr}
Area: ${property.area} sqm
${property.bathrooms ? `Bathrooms: ${property.bathrooms}` : ""}
${property.furnishing ? `Furnishing: ${property.furnishing.replace(/_/g, " ")}` : ""}
${amenStr ? `Amenities: ${amenStr}` : ""}
${property.description ? `Description: ${property.description.slice(0, 300)}` : ""}

Requirements:
- Short and clean, 3-5 sentences max
- NO emojis, NO markdown, NO asterisks, NO symbols
- Plain conversational text only
- Mention property type, location, price, and 1-2 key features
- End with: "Contact us for viewing or DM for details."
- On a new line after the caption, add 10-15 relevant hashtags (no other text between caption and hashtags)
- Max 500 characters for the caption text (excluding hashtags)
${instructions ? `\nSpecific instructions from the agent: ${instructions}` : ""}`,
      }],
    })

    const caption = (msg.content[0] as { type: string; text: string }).text
    return NextResponse.json({ caption })
  } catch (e) {
    console.error("Caption generation error:", e)
    return NextResponse.json({ error: "Failed to generate caption" }, { status: 500 })
  }
}
