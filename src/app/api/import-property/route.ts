import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { url, text } = body

    let contentForClaude = ""

    if (url?.trim()) {
      // Fetch the listing page and extract __NEXT_DATA__
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 10000)

      let html = ""
      try {
        const res = await fetch(url.trim(), {
          signal: controller.signal,
          headers: {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Referer": "https://www.google.com/",
          },
        })
        if (res.ok) html = await res.text()
      } finally {
        clearTimeout(timer)
      }

      if (html) {
        // Extract __NEXT_DATA__ — contains full structured property data + photos
        const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/)
        if (match) {
          contentForClaude = `JSON data from property listing page:\n${match[1].slice(0, 20000)}`
        } else {
          // Fallback: strip HTML tags and use plain text
          const stripped = html
            .replace(/<script[\s\S]*?<\/script>/gi, "")
            .replace(/<style[\s\S]*?<\/style>/gi, "")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s{2,}/g, " ")
            .slice(0, 15000)
          contentForClaude = `Page text:\n${stripped}`
        }
      }
    }

    // Fall back to pasted text if URL fetch failed or text was provided
    if (!contentForClaude && text?.trim()) {
      contentForClaude = `Listing text:\n${text.slice(0, 15000)}`
    }

    if (!contentForClaude) {
      return NextResponse.json({ error: "Please provide a URL or paste the listing text." }, { status: 400 })
    }

    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      messages: [{
        role: "user",
        content: `Extract property listing details and return ONLY valid JSON, no markdown, no explanation.

{
  "title": "string",
  "listingType": "RENT or SALE",
  "category": "RESIDENTIAL or COMMERCIAL",
  "type": "APARTMENT or VILLA or STUDIO or DUPLEX or PENTHOUSE or TOWNHOUSE or COMPOUND or WHOLE_BUILDING or OFFICE or SHOP or WAREHOUSE or SHOWROOM or LABOR_CAMP or RESTAURANT or COWORKING",
  "price": number (exact as shown — do NOT convert),
  "area": number (sqm — if sqft multiply by 0.0929),
  "bedrooms": number or null (exact count),
  "bathrooms": number or null (exact count),
  "floor": number or null,
  "address": "string",
  "district": "string",
  "description": "string",
  "furnishing": "FURNISHED or SEMI_FURNISHED or UNFURNISHED or null",
  "amenities": ["string"],
  "photos": ["array of full image URLs found in the data — include all property photo URLs"]
}

${contentForClaude}`,
      }],
    })

    const raw = (msg.content[0] as { type: string; text: string }).text.trim()
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim()

    let data: Record<string, unknown>
    try {
      data = JSON.parse(cleaned)
    } catch {
      const match = cleaned.match(/\{[\s\S]*\}/)
      if (!match) {
        return NextResponse.json({ error: "Could not extract property details. Try pasting the listing text instead." }, { status: 422 })
      }
      data = JSON.parse(match[0])
    }

    if (!Array.isArray(data.photos)) data.photos = []

    return NextResponse.json({ data, photoCount: (data.photos as unknown[]).length })
  } catch (e) {
    console.error("import-property error:", e)
    return NextResponse.json({ error: "Server error — please try again." }, { status: 500 })
  }
}
