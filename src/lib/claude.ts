import Anthropic from "@anthropic-ai/sdk"

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export const SYSTEM_PROMPT = `You are an expert real estate assistant for a Qatar-based real estate agency. You help agents with:
- Analyzing leads and qualifying prospects
- Suggesting competitive pricing for properties in Qatar
- Writing property descriptions in English and Arabic
- Drafting professional emails and follow-up messages
- Market analysis and investment advice for Qatar real estate
- Answering questions about Qatar property laws and regulations
- Scheduling and time management advice

Key context:
- Market: Qatar (Doha, Lusail, The Pearl, West Bay, Al Rayyan, etc.)
- Currency: QAR (Qatari Riyal)
- Language: English primarily, Arabic when requested
- Regulations: Qatar Real Estate Regulatory Authority (RERA) rules apply
- Target clients: Expats, GCC nationals, Qatari nationals

Always be professional, concise, and helpful. When discussing prices, use QAR currency.
When asked for property descriptions, make them compelling and SEO-friendly.
When qualifying leads, score them 1-100 based on: budget fit, timeline urgency, seriousness, and property match.`

export async function qualifyLead(leadData: {
  name: string
  budget?: number | null
  budgetMax?: number | null
  propertyType?: string | null
  bedrooms?: number | null
  notes?: string | null
  source?: string
}) {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 500,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Qualify this real estate lead and provide a JSON response:
Name: ${leadData.name}
Budget: ${leadData.budget ? `QAR ${leadData.budget.toLocaleString()}` : "Unknown"} - ${leadData.budgetMax ? `QAR ${leadData.budgetMax.toLocaleString()}` : "Unknown"}
Property Type: ${leadData.propertyType || "Not specified"}
Bedrooms: ${leadData.bedrooms || "Not specified"}
Source: ${leadData.source || "Unknown"}
Notes: ${leadData.notes || "None"}

Respond ONLY with valid JSON in this exact format:
{
  "score": <number 1-100>,
  "priority": "<HIGH|MEDIUM|LOW>",
  "summary": "<2-3 sentence assessment>",
  "recommendedAction": "<specific next step>",
  "estimatedTimeline": "<buying timeline estimate>"
}`,
      },
    ],
  })

  try {
    const text = message.content[0].type === "text" ? message.content[0].text : ""
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) return JSON.parse(jsonMatch[0])
  } catch {
    // fallback
  }
  return { score: 50, priority: "MEDIUM", summary: "Lead needs further qualification.", recommendedAction: "Schedule a call", estimatedTimeline: "Unknown" }
}

export async function generatePropertyDescription(property: {
  title: string
  type: string
  bedrooms?: number | null
  bathrooms?: number | null
  area: number
  district?: string | null
  price: number
  listingType: string
  amenities?: string[]
}) {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 600,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Write a compelling property listing description for this Qatar property:
Type: ${property.type}
Title: ${property.title}
Bedrooms: ${property.bedrooms || "N/A"}
Bathrooms: ${property.bathrooms || "N/A"}
Area: ${property.area} sqm
District: ${property.district || "Doha"}, Qatar
Price: QAR ${property.price.toLocaleString()} ${property.listingType === "RENT" ? "per year" : ""}
Amenities: ${property.amenities?.join(", ") || "Standard"}

Write a 3-paragraph description that is professional, highlights key features, and appeals to expats and locals in Qatar. Make it SEO-friendly.`,
      },
    ],
  })

  return message.content[0].type === "text" ? message.content[0].text : ""
}

export async function suggestPrice(property: {
  type: string
  bedrooms?: number | null
  area: number
  district?: string | null
  listingType: string
  condition?: string
}) {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 400,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Suggest a competitive market price for this Qatar property based on current market conditions:
Type: ${property.type}
Bedrooms: ${property.bedrooms || "N/A"}
Area: ${property.area} sqm
District: ${property.district || "Doha"}, Qatar
Listing: ${property.listingType}
Condition: ${property.condition || "Good"}

Respond ONLY with valid JSON:
{
  "suggested": <price in QAR>,
  "min": <minimum price>,
  "max": <maximum price>,
  "reasoning": "<2 sentence explanation>",
  "marketTrend": "<UP|STABLE|DOWN>"
}`,
      },
    ],
  })

  try {
    const text = message.content[0].type === "text" ? message.content[0].text : ""
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) return JSON.parse(jsonMatch[0])
  } catch {
    // fallback
  }
  return null
}
