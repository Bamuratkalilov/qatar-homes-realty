"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { MapPin, X, ArrowRight, Home, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface Community {
  id: string
  slug: string
  name: string
  nameAr: string | null
  district: string
  tags: string[]
  liveAvgRent: number | null
  liveAvgSale: number | null
  listingCount: number
  centerLat: number | null
  centerLng: number | null
  polygon: unknown
  featured: boolean
}

const TAG_COLORS: Record<string, string> = {
  waterfront:        "#0ea5e9",
  luxury:            "#a855f7",
  family:            "#22c55e",
  urban:             "#f59e0b",
  affordable:        "#10b981",
  modern:            "#3b82f6",
  cultural:          "#f97316",
  "expat-friendly":  "#6366f1",
  coastal:           "#06b6d4",
  quiet:             "#84cc16",
}

const FILL_COLORS = [
  "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b",
  "#ef4444", "#06b6d4", "#a855f7", "#22c55e",
  "#f97316", "#6366f1",
]

function formatQar(v: number | null) {
  if (!v) return "—"
  return v >= 1_000_000
    ? `QAR ${(v / 1_000_000).toFixed(1)}M`
    : `QAR ${v.toLocaleString()}`
}

export function ExploreMap({ communities }: { communities: Community[] }) {
  const router   = useRouter()
  const mapDiv   = useRef<HTMLDivElement>(null)
  const mapObj   = useRef<unknown>(null)
  const [active, setActive] = useState<Community | null>(null)

  useEffect(() => {
    if (!mapDiv.current || mapObj.current) return
    let cancelled = false

    import("mapbox-gl").then(mod => {
      if (cancelled || !mapDiv.current) return
      const mapboxgl = mod.default
      mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

      const map = new mapboxgl.Map({
        container: mapDiv.current,
        style: "mapbox://styles/mapbox/light-v11",
        center: [51.5, 25.28],
        zoom: 11,
        attributionControl: false,
      })

      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right")

      map.on("load", () => {
        communities.forEach((c, i) => {
          if (!c.polygon) return
          const color = FILL_COLORS[i % FILL_COLORS.length]
          const sourceId = `community-${c.slug}`

          map.addSource(sourceId, {
            type: "geojson",
            data: { type: "Feature", geometry: c.polygon as GeoJSON.Geometry, properties: { name: c.name, slug: c.slug } },
          })

          // Fill layer
          map.addLayer({
            id: `${sourceId}-fill`,
            type: "fill",
            source: sourceId,
            paint: {
              "fill-color": color,
              "fill-opacity": 0.18,
            },
          })

          // Border layer
          map.addLayer({
            id: `${sourceId}-line`,
            type: "line",
            source: sourceId,
            paint: {
              "line-color": color,
              "line-width": 2,
              "line-opacity": 0.8,
            },
          })

          // Hover fill
          map.addLayer({
            id: `${sourceId}-fill-hover`,
            type: "fill",
            source: sourceId,
            paint: {
              "fill-color": color,
              "fill-opacity": 0,
            },
          })

          // Click handler
          map.on("click", `${sourceId}-fill`, () => {
            setActive(c)
          })

          // Hover cursor + highlight
          map.on("mouseenter", `${sourceId}-fill`, () => {
            map.getCanvas().style.cursor = "pointer"
            map.setPaintProperty(`${sourceId}-fill-hover`, "fill-opacity", 0.15)
          })
          map.on("mouseleave", `${sourceId}-fill`, () => {
            map.getCanvas().style.cursor = ""
            map.setPaintProperty(`${sourceId}-fill-hover`, "fill-opacity", 0)
          })

          // Label marker at center
          if (c.centerLat && c.centerLng) {
            const el = document.createElement("div")
            el.style.cssText = `
              background: white;
              border: 2px solid ${color};
              border-radius: 20px;
              padding: 3px 10px;
              font-size: 12px;
              font-weight: 600;
              color: #1e293b;
              white-space: nowrap;
              cursor: pointer;
              box-shadow: 0 2px 6px rgba(0,0,0,0.15);
            `
            el.textContent = c.name
            el.addEventListener("click", () => setActive(c))

            new mapboxgl.Marker({ element: el })
              .setLngLat([c.centerLng, c.centerLat])
              .addTo(map)
          }
        })
      })

      mapObj.current = map
    })

    return () => {
      cancelled = true
      if (mapObj.current) {
        ;(mapObj.current as { remove: () => void }).remove()
        mapObj.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="relative w-full h-full">
      <div ref={mapDiv} className="w-full h-full" />

      {/* Community detail panel */}
      {active && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-sm mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-5 border border-slate-100">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">{active.name}</h3>
                {active.nameAr && (
                  <p className="text-slate-400 text-sm" dir="rtl">{active.nameAr}</p>
                )}
              </div>
              <button
                onClick={() => setActive(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 transition text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Lifestyle tags */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {active.tags.slice(0, 4).map(tag => (
                <span
                  key={tag}
                  className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                  style={{
                    background: `${TAG_COLORS[tag] || "#64748b"}18`,
                    color: TAG_COLORS[tag] || "#64748b",
                  }}
                >
                  {tag.replace("-", " ")}
                </span>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center p-2.5 bg-slate-50 rounded-xl">
                <Home className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                <p className="text-xs text-slate-500">Listings</p>
                <p className="font-bold text-slate-900 text-sm">{active.listingCount}</p>
              </div>
              <div className="text-center p-2.5 bg-slate-50 rounded-xl">
                <MapPin className="w-4 h-4 text-green-500 mx-auto mb-1" />
                <p className="text-xs text-slate-500">Avg Rent/mo</p>
                <p className="font-bold text-slate-900 text-sm">{formatQar(active.liveAvgRent)}</p>
              </div>
              <div className="text-center p-2.5 bg-slate-50 rounded-xl">
                <TrendingUp className="w-4 h-4 text-purple-500 mx-auto mb-1" />
                <p className="text-xs text-slate-500">Avg Sale</p>
                <p className="font-bold text-slate-900 text-sm">{formatQar(active.liveAvgSale)}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => router.push(`/discover/${active.slug}`)}
                className="flex-1 text-sm font-semibold text-blue-600 border border-blue-200 hover:bg-blue-50 py-2 rounded-xl transition"
              >
                Community guide
              </button>
              <button
                onClick={() => router.push(`/listings?q=${encodeURIComponent(active.district)}`)}
                className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl transition"
              >
                View listings <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
