import { NextResponse } from "next/server"

// Visit /api/whatsapp/test to diagnose webhook issues
export async function GET() {
  const checks = {
    WHATSAPP_PHONE_NUMBER_ID: !!process.env.WHATSAPP_PHONE_NUMBER_ID,
    WHATSAPP_ACCESS_TOKEN:    !!process.env.WHATSAPP_ACCESS_TOKEN,
    WHATSAPP_VERIFY_TOKEN:    !!process.env.WHATSAPP_VERIFY_TOKEN,
    ANTHROPIC_API_KEY:        !!process.env.ANTHROPIC_API_KEY,
    phone_number_id_preview:  process.env.WHATSAPP_PHONE_NUMBER_ID?.slice(0, 6) + "...",
    verify_token_preview:     process.env.WHATSAPP_VERIFY_TOKEN?.slice(0, 4) + "...",
  }

  // Test if the access token can reach Meta API
  let metaStatus = "not tested"
  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}`,
      { headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` } }
    )
    const data = await res.json()
    metaStatus = res.ok ? `OK — ${data.display_phone_number || data.id}` : `Error: ${JSON.stringify(data.error)}`
  } catch (e) {
    metaStatus = `Network error: ${e}`
  }

  return NextResponse.json({ checks, metaStatus })
}
