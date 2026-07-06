import { NextRequest, NextResponse } from "next/server"

// Block requests to private/loopback networks (SSRF protection)
const PRIVATE_HOST = /^(localhost|127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/i

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url")
  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 })

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 })
  }

  if (parsed.protocol !== "https:") return NextResponse.json({ error: "HTTPS only" }, { status: 400 })
  if (PRIVATE_HOST.test(parsed.hostname)) return NextResponse.json({ error: "Blocked" }, { status: 403 })

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "Referer": "https://www.propertyfinder.qa/",
        Accept: "image/*,*/*;q=0.8",
      },
    })

    if (!res.ok) return new NextResponse(null, { status: res.status })

    const ct = res.headers.get("content-type") || "image/jpeg"
    if (!ct.startsWith("image/")) return NextResponse.json({ error: "Not an image" }, { status: 415 })

    const buffer = await res.arrayBuffer()
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": ct,
        "Cache-Control": "public, max-age=86400",
        "Access-Control-Allow-Origin": "*",
      },
    })
  } catch {
    return new NextResponse(null, { status: 502 })
  }
}
