"use client"

import { useEffect, useRef, useCallback } from "react"
import mapboxgl from "mapbox-gl"
import { formatPrice } from "@/lib/utils"

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

// Approximate district coordinates for Qatar
const DISTRICT_COORDS: Record<string, [number, number]> = {
  "The Pearl-Qatar":   [51.5486, 25.3724],
  "West Bay":          [51.5342, 25.3301],
  "Lusail":            [51.4905, 25.4117],
  "Al Waab":           [51.4547, 25.2606],
  "Al Sadd":           [51.5172, 25.2889],
  "Bin Mahmoud":       [51.5147, 25.2814],
  "Fereej Bin Omran":  [51.5090, 25.2756],
  "Al Thumama":        [51.5397, 25.2407],
  "Ain Khalid":        [51.5060, 25.2095],
  "Al Aziziyah":       [51.4891, 25.2563],
  "Muaither":          [51.4380, 25.2493],
  "Al Khor":           [51.4960, 25.6838],
  "Al Wakra":          [51.5991, 25.1714],
  "Mesaimeer":         [51.4784, 25.2354],
  "Industrial Area":   [51.5488, 25.2354],
  "Al Duhail":         [51.4700, 25.3060],
  "Al Rayyan":         [51.4293, 25.2516],
  "Doha":              [51.5310, 25.2854],
}

// Deterministic offset so pins don't all stack on the same spot
function pinOffset(id: string, axis: 0 | 1): number {
  let h = 2166136261
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i) + axis * 100
    h = Math.imul(h, 16777619)
  }
  return ((h & 0xffff) / 0xffff - 0.5) * 0.012
}

function getCoords(p: { id: string; district?: string | null; city: string }): [number, number] {
  const base =
    DISTRICT_COORDS[p.district || ""] ||
    DISTRICT_COORDS[p.city]           ||
    [51.5310, 25.2854]
  return [base[0] + pinOffset(p.id, 0), base[1] + pinOffset(p.id, 1)]
}

interface Property {
  id: string
  title: string
  listingType: string
  price: number
  area: number
  bedrooms?: number | null
  bathrooms?: number | null
  district?: string | null
  city: string
  photos: string[]
  type: string
}

interface Props {
  properties: Property[]
  fullscreen?: boolean
}

export function PropertyMap({ properties, fullscreen = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<mapboxgl.Map | null>(null)
  const markersRef   = useRef<mapboxgl.Marker[]>([])

  const buildMarkers = useCallback((map: mapboxgl.Map, props: Property[]) => {
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    props.forEach(p => {
      const [lng, lat] = getCoords(p)
      const isRent = p.listingType === "RENT"
      const monthly = isRent ? Math.round(p.price / 12) : null
      const priceLabel = isRent
        ? `QAR ${(monthly! / 1000).toFixed(0)}K/mo`
        : p.price >= 1_000_000
          ? `QAR ${(p.price / 1_000_000).toFixed(1)}M`
          : `QAR ${(p.price / 1000).toFixed(0)}K`

      // Custom marker element
      const el = document.createElement("div")
      el.className = "property-marker"
      el.style.cssText = `
        background: #1d4ed8; color: #fff; font-size: 11px; font-weight: 700;
        padding: 5px 9px; border-radius: 20px; white-space: nowrap; cursor: pointer;
        border: 2px solid #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.25);
        transition: transform 0.15s, background 0.15s; font-family: inherit;
      `
      el.textContent = priceLabel
      el.addEventListener("mouseenter", () => { el.style.transform = "scale(1.12)"; el.style.background = "#1e40af" })
      el.addEventListener("mouseleave", () => { el.style.transform = "scale(1)"; el.style.background = "#1d4ed8" })

      const photo = p.photos[0] || ""
      const popup = new mapboxgl.Popup({ offset: 16, maxWidth: "260px", closeButton: true })
        .setHTML(`
          <div style="font-family:system-ui,sans-serif; width:240px;">
            ${photo ? `<img src="${photo}" style="width:100%;height:130px;object-fit:cover;border-radius:10px 10px 0 0;display:block;" />` : ""}
            <div style="padding:12px;">
              <div style="font-size:16px;font-weight:800;color:#1d4ed8;margin-bottom:4px;">
                ${formatPrice(p.price)}${isRent ? "<span style='font-size:11px;color:#64748b;font-weight:500'>/mo</span>" : ""}
              </div>
              <div style="font-size:12px;color:#1e293b;font-weight:600;margin-bottom:6px;line-height:1.3">${p.title}</div>
              <div style="font-size:11px;color:#64748b;display:flex;gap:10px;margin-bottom:10px;">
                ${p.bedrooms != null ? `<span>🛏 ${p.bedrooms} Beds</span>` : ""}
                ${p.bathrooms != null ? `<span>🚿 ${p.bathrooms} Baths</span>` : ""}
                <span>📐 ${p.area} m²</span>
              </div>
              <a href="/listings/${p.id}" style="display:block;background:#1d4ed8;color:#fff;text-align:center;padding:8px;border-radius:8px;font-size:12px;font-weight:600;text-decoration:none;">
                View Details →
              </a>
            </div>
          </div>
        `)

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map)

      markersRef.current.push(marker)
    })
  }, [])

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [51.5310, 25.2854],
      zoom: 11,
      attributionControl: false,
    })

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right")
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right")

    map.on("load", () => {
      buildMarkers(map, properties)
    })

    mapRef.current = map
    return () => { map.remove(); mapRef.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update markers when properties change
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (!map.loaded()) {
      map.on("load", () => buildMarkers(map, properties))
    } else {
      buildMarkers(map, properties)
    }
  }, [properties, buildMarkers])

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ minHeight: fullscreen ? "calc(100vh - 112px)" : "100%" }}
    />
  )
}
