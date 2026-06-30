"use client"

import { useState, useEffect, useRef } from "react"
import {
  MapPin, GraduationCap, ShoppingBag, ShoppingCart, Trees,
  Dumbbell, Scissors, Hospital, Shield, Bus,
  PersonStanding, Bike, TrainFront, Leaf, ChevronDown, ChevronUp,
} from "lucide-react"
import { WeatherSection } from "@/components/public/weather-section"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface Place    { name: string; dist: number; lat?: number; lng?: number }
interface Category { key: string; label: string; places: Place[] }

const TABS: { key: string; label: string; Icon: LucideIcon }[] = [
  { key: "schools",   label: "Schools",   Icon: GraduationCap },
  { key: "shops",     label: "Shops",     Icon: ShoppingBag },
  { key: "grocery",   label: "Grocery",   Icon: ShoppingCart },
  { key: "parks",     label: "Parks",     Icon: Trees },
  { key: "fitness",   label: "Fitness",   Icon: Dumbbell },
  { key: "beauty",    label: "Beauty",    Icon: Scissors },
  { key: "hospitals", label: "Hospitals", Icon: Hospital },
  { key: "police",    label: "Police",    Icon: Shield },
  { key: "transport", label: "Transport", Icon: Bus },
]

function formatDist(m: number) {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`
}

// Derive scores from nearby category counts
function deriveScores(cats: Category[]) {
  const count = (key: string) => cats.find(c => c.key === key)?.places.length ?? 0
  const walk    = Math.min(10, Math.round((count("shops") + count("grocery") + count("parks")) / 3 * 3.5))
  const transit = Math.min(10, Math.round(count("transport") * 2.5))
  const health  = Math.min(10, Math.round((count("parks") + count("fitness") + count("hospitals")) / 3 * 4))
  return { walk, transit, health }
}

function ScoreCard({ Icon, score, title, subtitle }: { Icon: LucideIcon; score: number; title: string; subtitle: string }) {
  return (
    <div className="border border-slate-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-5 h-5 text-slate-500" />
        <span className="text-sm font-bold text-slate-800">{score} <span className="text-slate-400 font-normal text-xs">/ 10</span></span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-1 mb-3">
        <div className="bg-blue-500 h-1 rounded-full transition-all" style={{ width: `${score * 10}%` }} />
      </div>
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
    </div>
  )
}

function scoreLabel(score: number, type: "walk" | "transit" | "health") {
  if (type === "walk") {
    if (score >= 8) return "Very walkable"
    if (score >= 5) return "Some walkability"
    return "Car dependent"
  }
  if (type === "transit") {
    if (score >= 8) return "Excellent transit"
    if (score >= 5) return "Good transit"
    return "Minimal transit"
  }
  if (score >= 8) return "Very healthy area"
  if (score >= 5) return "Healthy area"
  return "Limited amenities"
}

function scoreSubtitle(score: number, type: "walk" | "transit" | "health") {
  if (type === "walk") return score >= 5 ? "Many errands can be done on foot" : "Most errands require a car"
  if (type === "transit") return score >= 5 ? "Transit is convenient for most trips" : "Minimal public transport nearby"
  return score >= 5 ? "Wellness amenities nearby" : "Limited wellness options nearby"
}

export function Neighbourhood({
  propertyId,
  address,
  district,
  city,
  coordinates,
}: {
  propertyId: string
  address: string
  district?: string | null
  city: string
  coordinates?: { lat: number; lng: number } | null
}) {
  const mapDiv        = useRef<HTMLDivElement>(null)
  const mapObj        = useRef<unknown>(null)
  const poiMarkers    = useRef<{ remove: () => void }[]>([])
  const [coords, setCoords]           = useState<{ lat: number; lng: number } | null>(coordinates ?? null)
  const [categories, setCategories]   = useState<Category[]>([])
  const [activeTab, setActiveTab]     = useState("schools")
  const [loadingPlaces, setLoadingPlaces] = useState(false)
  const [areaDesc, setAreaDesc]       = useState("")
  const [descExpanded, setDescExpanded] = useState(false)
  const [loadingDesc, setLoadingDesc] = useState(false)

  // Geocode address → coords
  useEffect(() => {
    if (coords) return
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!token) return
    fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address + ", Qatar")}.json?access_token=${token}&limit=1`)
      .then(r => r.json())
      .then(d => { const f = d.features?.[0]; if (f) setCoords({ lng: f.center[0], lat: f.center[1] }) })
      .catch(() => {})
  }, [address, coords])

  // Init map
  useEffect(() => {
    if (!coords || !mapDiv.current || mapObj.current) return
    let cancelled = false
    import("mapbox-gl").then(mod => {
      if (cancelled || !mapDiv.current) return
      const mapboxgl = mod.default
      mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!
      const map = new mapboxgl.Map({
        container: mapDiv.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [coords.lng, coords.lat],
        zoom: 14,
        attributionControl: false,
      })
      new mapboxgl.Marker({ color: "#2563eb" }).setLngLat([coords.lng, coords.lat]).addTo(map)
      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right")
      map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right")
      mapObj.current = map
    })
    return () => {
      cancelled = true
      poiMarkers.current.forEach(m => m.remove())
      poiMarkers.current = []
      if (mapObj.current) {
        ;(mapObj.current as { remove: () => void }).remove()
        mapObj.current = null
      }
    }
  }, [coords])

  // Category marker colors
  const CAT_COLOR: Record<string, string> = {
    schools:   "#10b981",
    shops:     "#f59e0b",
    grocery:   "#f97316",
    parks:     "#22c55e",
    fitness:   "#8b5cf6",
    beauty:    "#ec4899",
    hospitals: "#ef4444",
    police:    "#3b82f6",
    transport: "#6366f1",
  }

  // Update POI markers when tab or data changes
  useEffect(() => {
    if (!mapObj.current) return
    // Remove old POI markers
    poiMarkers.current.forEach(m => m.remove())
    poiMarkers.current = []

    const map = mapObj.current as { getContainer: () => HTMLElement }
    const cat = categories.find(c => c.key === activeTab)
    if (!cat) return

    import("mapbox-gl").then(mod => {
      const mapboxgl = mod.default
      const color = CAT_COLOR[activeTab] || "#64748b"
      cat.places.forEach(place => {
        if (place.lat == null || place.lng == null) return
        // Custom colored circle marker
        const el = document.createElement("div")
        el.style.cssText = `
          width:28px;height:28px;border-radius:50%;background:${color};
          border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);
          display:flex;align-items:center;justify-content:center;cursor:pointer;
        `
        el.title = place.name
        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([place.lng, place.lat])
          .setPopup(new mapboxgl.Popup({ offset: 16, closeButton: false })
            .setHTML(`<div style="font-size:13px;font-weight:600;padding:4px 2px">${place.name}</div>`)
          )
          .addTo(map as unknown as Parameters<typeof marker.addTo>[0])
        poiMarkers.current.push(marker)
      })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, categories, mapObj.current])

  // Fetch nearby places
  useEffect(() => {
    if (!coords) return
    setLoadingPlaces(true)
    fetch(`/api/properties/${propertyId}/nearby?lat=${coords.lat}&lng=${coords.lng}`)
      .then(r => r.json())
      .then(d => { if (d.categories) setCategories(d.categories) })
      .catch(() => {})
      .finally(() => setLoadingPlaces(false))
  }, [coords, propertyId])

  // Fetch AI area description
  useEffect(() => {
    setLoadingDesc(true)
    fetch(`/api/properties/${propertyId}/area-info?district=${encodeURIComponent(district || "")}&city=${encodeURIComponent(city)}`)
      .then(r => r.json())
      .then(d => { if (d.description) setAreaDesc(d.description) })
      .catch(() => {})
      .finally(() => setLoadingDesc(false))
  }, [propertyId, district, city])

  const active = categories.find(c => c.key === activeTab)
  const scores = deriveScores(categories)
  const areaName = district || city

  return (
    <div className="mb-8 space-y-6">
      <h2 className="text-lg font-semibold text-slate-900">Location</h2>

      {/* Map */}
      <div ref={mapDiv} className="w-full h-64 sm:h-80 rounded-2xl overflow-hidden bg-slate-100">
        {!coords && (
          <div className="w-full h-full flex items-center justify-center gap-2 text-slate-400 text-sm">
            <MapPin className="w-4 h-4" /> Loading map…
          </div>
        )}
      </div>

      {/* About area */}
      <div className="border border-slate-200 rounded-2xl p-5">
        <h3 className="text-base font-semibold text-slate-900 mb-4">About {areaName}</h3>

        {/* Area photos — satellite + street level from Mapbox */}
        {coords && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            {/* Large satellite view */}
            <div className="col-span-2 rounded-xl overflow-hidden h-40 bg-slate-100">
              <img
                src={`https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static/${coords.lng},${coords.lat},14,0/600x320@2x?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`}
                alt={`${areaName} aerial view`}
                className="w-full h-full object-cover"
              />
            </div>
            {/* Two smaller: zoomed out + street style */}
            <div className="flex flex-col gap-2">
              <div className="rounded-xl overflow-hidden flex-1 bg-slate-100">
                <img
                  src={`https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${coords.lng},${coords.lat},12,0/300x150@2x?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`}
                  alt={`${areaName} overview`}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="rounded-xl overflow-hidden flex-1 bg-slate-100">
                <img
                  src={`https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${coords.lng},${coords.lat},15,0/300x150@2x?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`}
                  alt={`${areaName} streets`}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        )}

        {loadingDesc ? (
          <div className="h-16 flex items-center text-slate-400 text-sm">Generating area description…</div>
        ) : areaDesc ? (
          <>
            <p className={cn("text-slate-600 text-sm leading-relaxed", !descExpanded && "line-clamp-3")}>
              {areaDesc}
            </p>
            <button
              onClick={() => setDescExpanded(v => !v)}
              className="mt-2 flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800 transition"
            >
              {descExpanded ? "Show less" : "Show more"}
              {descExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </>
        ) : null}

        {/* Score cards */}
        {categories.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mt-5">
            <ScoreCard
              Icon={PersonStanding}
              score={scores.walk}
              title={scoreLabel(scores.walk, "walk")}
              subtitle={scoreSubtitle(scores.walk, "walk")}
            />
            <ScoreCard
              Icon={TrainFront}
              score={scores.transit}
              title={scoreLabel(scores.transit, "transit")}
              subtitle={scoreSubtitle(scores.transit, "transit")}
            />
            <ScoreCard
              Icon={Leaf}
              score={scores.health}
              title={scoreLabel(scores.health, "health")}
              subtitle={scoreSubtitle(scores.health, "health")}
            />
          </div>
        )}
      </div>

      {/* Around this property */}
      <div>
        <h3 className="text-base font-semibold text-slate-900 mb-3">Around this property</h3>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          {TABS.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                "flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                activeTab === key
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50 overflow-hidden min-h-[140px]">
          {loadingPlaces ? (
            <div className="flex items-center justify-center h-36 text-slate-400 text-sm">Finding nearby places…</div>
          ) : active && active.places.length > 0 ? (
            <div>
              {active.places.map((place, i) => {
                const { Icon } = TABS.find(t => t.key === activeTab)!
                return (
                  <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-slate-100 last:border-0 hover:bg-white transition-colors">
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <span className="text-sm font-medium text-slate-800">{place.name}</span>
                    </div>
                    <span className="text-xs text-slate-400 bg-white border border-slate-200 px-2.5 py-1 rounded-full">
                      {formatDist(place.dist)}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-36 text-slate-400 text-sm">No places found nearby</div>
          )}
        </div>
      </div>

      {/* Weather */}
      <WeatherSection />
    </div>
  )
}
