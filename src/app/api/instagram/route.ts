import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const IG_USER_ID = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID
const IG_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN

async function generateCaption(property: {
  title: string; type: string; listingType: string; price: number
  bedrooms: number | null; bathrooms: number | null; area: number
  district: string | null; address: string; description: string
  furnishing: string | null; amenities: string[]
}): Promise<string> {
  const bedroomStr = property.bedrooms === 0 ? "Studio"
    : property.bedrooms ? `${property.bedrooms} Bedroom` : ""
  const typeLabel = property.type.charAt(0) + property.type.slice(1).toLowerCase().replace("_", " ")
  const location = property.district || property.address.split(",")[0]
  const priceStr = `QAR ${property.price.toLocaleString()}/month`
  const amenStr = property.amenities.slice(0, 4).join(", ")

  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 400,
    messages: [{
      role: "user",
      content: `Write an Instagram caption for this Qatar real estate listing. Make it engaging, use emojis, end with relevant hashtags. Max 200 words.

Property: ${bedroomStr} ${typeLabel} for ${property.listingType === "RENT" ? "Rent" : "Sale"}
Location: ${location}, Qatar
Price: ${priceStr}
Area: ${property.area} sqm
${property.bathrooms ? `Bathrooms: ${property.bathrooms}` : ""}
${property.furnishing ? `Furnishing: ${property.furnishing.replace("_", " ")}` : ""}
${amenStr ? `Amenities: ${amenStr}` : ""}
${property.description ? `Description: ${property.description.slice(0, 200)}` : ""}

Plain text only — NO markdown, NO asterisks (*), NO bold (**), NO headers (#).
Use emojis naturally within the text to highlight features.
End with: 📞 Contact us for viewing | DM for details
Add 10-15 relevant hashtags on the last line: #QatarRealEstate #Doha #Qatar and location-specific ones.`,
    }],
  })

  return (msg.content[0] as { type: string; text: string }).text
}

async function createCarouselItem(imageUrl: string): Promise<string> {
  const res = await fetch(`https://graph.facebook.com/v21.0/${IG_USER_ID}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_url: imageUrl, is_carousel_item: true, access_token: IG_TOKEN }),
  })
  const data = await res.json()
  if (!data.id) throw new Error(data.error?.message || "Failed to create carousel item")
  return data.id
}

export async function POST(req: NextRequest) {
  try {
    if (!IG_USER_ID || !IG_TOKEN) {
      return NextResponse.json({ error: "Instagram not configured." }, { status: 503 })
    }

    const body = await req.json()
    const { property, caption: customCaption } = body

    if (!property) return NextResponse.json({ error: "Property data required" }, { status: 400 })
    if (!property.photos?.length) return NextResponse.json({ error: "Property needs at least one photo" }, { status: 400 })

    const caption = customCaption || await generateCaption(property)
    const photos: string[] = property.photos.slice(0, 10)

    let postId: string

    if (photos.length === 1) {
      // Single image post
      const containerRes = await fetch(`https://graph.facebook.com/v21.0/${IG_USER_ID}/media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_url: photos[0], caption, access_token: IG_TOKEN }),
      })
      const container = await containerRes.json()
      if (!container.id) {
        return NextResponse.json({ error: container.error?.message || "Failed to create post" }, { status: 500 })
      }

      const publishRes = await fetch(`https://graph.facebook.com/v21.0/${IG_USER_ID}/media_publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creation_id: container.id, access_token: IG_TOKEN }),
      })
      const published = await publishRes.json()
      if (!published.id) {
        return NextResponse.json({ error: published.error?.message || "Failed to publish" }, { status: 500 })
      }
      postId = published.id

    } else {
      // Carousel post
      const itemIds = await Promise.all(photos.map(createCarouselItem))

      const carouselRes = await fetch(`https://graph.facebook.com/v21.0/${IG_USER_ID}/media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          media_type: "CAROUSEL",
          children: itemIds.join(","),
          caption,
          access_token: IG_TOKEN,
        }),
      })
      const carousel = await carouselRes.json()
      if (!carousel.id) {
        return NextResponse.json({ error: carousel.error?.message || "Failed to create carousel" }, { status: 500 })
      }

      const publishRes = await fetch(`https://graph.facebook.com/v21.0/${IG_USER_ID}/media_publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creation_id: carousel.id, access_token: IG_TOKEN }),
      })
      const published = await publishRes.json()
      if (!published.id) {
        return NextResponse.json({ error: published.error?.message || "Failed to publish carousel" }, { status: 500 })
      }
      postId = published.id
    }

    return NextResponse.json({ success: true, postId, caption, photoCount: photos.length })
  } catch (e) {
    console.error("Instagram post error:", e)
    return NextResponse.json({ error: "Failed to post to Instagram" }, { status: 500 })
  }
}
