"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import mapboxgl from "mapbox-gl"
import { X, Bed, Bath, Maximize, MapPin, Heart, Share2, PenLine, Building2 } from "lucide-react"
import { formatPrice } from "@/lib/utils"

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

// ── District coords ────────────────────────────────────────────────────────
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

function pinOffset(id: string, axis: 0 | 1): number {
  let h = 2166136261
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i) + axis * 100
    h = Math.imul(h, 16777619)
  }
  return ((h & 0xffff) / 0xffff - 0.5) * 0.012
}

function getCoords(p: { id: string; district?: string | null; city: string }): [number, number] {
  const base = DISTRICT_COORDS[p.district || ""] || DISTRICT_COORDS[p.city] || [51.5310, 25.2854]
  return [base[0] + pinOffset(p.id, 0), base[1] + pinOffset(p.id, 1)]
}

function shortPrice(p: Property): string {
  if (p.listingType === "RENT") {
    return p.price >= 1000 ? `QAR ${(p.price / 1000).toFixed(0)}K` : `QAR ${p.price}`
  }
  if (p.price >= 1_000_000) return `QAR ${(p.price / 1_000_000).toFixed(1)}M`
  return `QAR ${(p.price / 1000).toFixed(0)}K`
}

// Ray-casting point-in-polygon (lng/lat coords)
function pointInPolygon(point: [number, number], poly: [number, number][]): boolean {
  if (poly.length < 3) return false
  const [px, py] = point
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]
    const [xj, yj] = poly[j]
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}

// Thin raw freehand points — keep every Nth point
function thin(pts: [number, number][], step = 5): [number, number][] {
  if (pts.length <= 6) return pts
  const out: [number, number][] = []
  for (let i = 0; i < pts.length; i += step) out.push(pts[i])
  const last = pts[pts.length - 1]
  if (out[out.length - 1] !== last) out.push(last)
  return out
}

// ── Types ──────────────────────────────────────────────────────────────────
export interface Property {
  id: string
  title: string
  listingType: string
  price: number
  rentFrequency?: string | null
  area: number
  bedrooms?: number | null
  bathrooms?: number | null
  district?: string | null
  address?: string
  city: string
  photos: string[]
  type: string
  amenities?: string[]
}

type DrawState = "idle" | "drawing" | "done"

interface Props {
  properties: Property[]
  fullscreen?: boolean
  onFilter?: (ids: string[] | null) => void
}

// ── Popup card ─────────────────────────────────────────────────────────────
function PopupCard({ p, onClose }: { p: Property; onClose: () => void }) {
  const isRent = p.listingType === "RENT"
  const freq = p.rentFrequency === "WEEKLY" ? "/wk" : p.rentFrequency === "DAILY" ? "/day" : "/mo"
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-72 rounded-2xl overflow-hidden shadow-2xl bg-white border border-slate-100 animate-in fade-in slide-in-from-bottom-3 duration-200">
      <div className="relative h-44 bg-slate-100">
        {p.photos[0]
          ? <img src={p.photos[0]} alt={p.title} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center"><Building2 className="w-12 h-12 text-slate-300" /></div>}
        <button onClick={onClose}
          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="text-xl font-bold text-slate-900">{formatPrice(p.price)}</span>
            {isRent && <span className="text-slate-400 text-sm ml-1">{freq}</span>}
          </div>
          <div className="flex gap-2">
            <button className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-300 transition">
              <Share2 className="w-3.5 h-3.5" />
            </button>
            <button className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:text-red-500 hover:border-red-300 transition">
              <Heart className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-600 mb-2">
          {p.bedrooms != null && <span className="flex items-center gap-1"><Bed className="w-3.5 h-3.5 text-slate-400" />{p.bedrooms} bd</span>}
          {p.bathrooms != null && <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5 text-slate-400" />{p.bathrooms} ba</span>}
          {p.area > 0 && <span className="flex items-center gap-1"><Maximize className="w-3.5 h-3.5 text-slate-400" />{p.area} m²</span>}
        </div>
        {(p.district || p.address) && (
          <div className="flex items-start gap-1 text-xs text-slate-400 mb-3">
            <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span className="line-clamp-1">{p.district || p.address}, {p.city}</span>
          </div>
        )}
        {p.amenities && p.amenities.length > 0 && (
          <p className="text-xs text-slate-400 mb-3 line-clamp-1">{p.amenities.slice(0, 4).join(" · ")}</p>
        )}
        <a href={`/listings/${p.id}`}
          className="block w-full text-center bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm py-2.5 rounded-xl transition">
          View property
        </a>
      </div>
    </div>
  )
}

// ── Constants ──────────────────────────────────────────────────────────────
const DOT_DEFAULT  = "#7B2252"
const DOT_HOVER    = "#4A1535"
const DOT_SELECTED = "#1d4ed8"
const DRAW_SRC     = "draw-area-src"

// ── Main map ───────────────────────────────────────────────────────────────
export function PropertyMap({ properties, fullscreen = false, onFilter }: Props) {
  const containerRef  = useRef<HTMLDivElement>(null)
  const mapRef        = useRef<mapboxgl.Map | null>(null)
  const markersRef    = useRef<{ marker: mapboxgl.Marker; pid: string }[]>([])

  // Draw state
  const drawStateRef  = useRef<DrawState>("idle")
  const isDrawingRef  = useRef(false)
  const rawPtsRef     = useRef<[number, number][]>([])

  // React state
  const [selected,       setSelected]       = useState<Property | null>(null)
  const [drawState,      setDrawState]       = useState<DrawState>("idle")
  const [localFiltered,  setLocalFiltered]   = useState<string[] | null>(null)  // null = show all
  const [matchCount,     setMatchCount]      = useState<number | null>(null)

  // Keep onFilter in a ref so closures inside effects always see the latest version
  const onFilterRef = useRef(onFilter)
  useEffect(() => { onFilterRef.current = onFilter }, [onFilter])

  // ── Sync marker visibility whenever localFiltered changes ──────────────
  useEffect(() => {
    markersRef.current.forEach(({ marker, pid }) => {
      const show = localFiltered === null || localFiltered.includes(pid)
      const el = marker.getElement()
      el.style.opacity        = show ? "1" : "0"
      el.style.pointerEvents  = show ? "auto" : "none"
    })
    onFilterRef.current?.(localFiltered)
  }, [localFiltered])

  // ── Build markers ──────────────────────────────────────────────────────
  const buildMarkers = useCallback((map: mapboxgl.Map, props: Property[]) => {
    markersRef.current.forEach(({ marker }) => marker.remove())
    markersRef.current = []

    props.forEach(p => {
      const [lng, lat] = getCoords(p)
      const label = shortPrice(p)

      const wrapper = document.createElement("div")
      wrapper.style.cssText = "width:44px;height:44px;display:flex;align-items:center;justify-content:center;cursor:pointer;"

      const pill = document.createElement("div")
      pill.style.cssText = `background:${DOT_DEFAULT};border:2.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,.3);transition:all .18s ease;display:flex;align-items:center;justify-content:center;overflow:hidden;white-space:nowrap;font-family:system-ui,sans-serif;width:14px;height:14px;border-radius:50%;`

      const span = document.createElement("span")
      span.style.cssText = "font-size:11px;font-weight:700;color:white;letter-spacing:-.2px;opacity:0;max-width:0;transition:opacity .15s ease,max-width .15s ease;overflow:hidden;"
      span.textContent = label
      pill.appendChild(span)
      wrapper.appendChild(pill)

      let isSelected = false

      function expand(color: string) {
        pill.style.width = "auto"; pill.style.height = "26px"
        pill.style.borderRadius = "13px"; pill.style.padding = "0 10px"
        pill.style.background = color
        span.style.opacity = "1"; span.style.maxWidth = "120px"
      }
      function collapse() {
        pill.style.width = "14px"; pill.style.height = "14px"
        pill.style.borderRadius = "50%"; pill.style.padding = "0"
        pill.style.background = DOT_DEFAULT
        span.style.opacity = "0"; span.style.maxWidth = "0"
      }
      function deselectAll() {
        markersRef.current.forEach(({ marker: m }) => {
          if (m.getElement() === wrapper) return
          const ip = m.getElement().firstElementChild as HTMLElement | null
          if (!ip) return
          ip.style.width = "14px"; ip.style.height = "14px"
          ip.style.borderRadius = "50%"; ip.style.padding = "0"
          ip.style.background = DOT_DEFAULT
          const s = ip.querySelector("span") as HTMLSpanElement | null
          if (s) { s.style.opacity = "0"; s.style.maxWidth = "0" }
        })
      }

      wrapper.addEventListener("mouseenter", () => { if (!isSelected) expand(DOT_HOVER) })
      wrapper.addEventListener("mouseleave", () => { if (!isSelected) collapse() })
      wrapper.addEventListener("click", e => {
        if (drawStateRef.current === "drawing") return
        e.stopPropagation()
        isSelected = !isSelected
        if (isSelected) { deselectAll(); expand(DOT_SELECTED); setSelected(p) }
        else { collapse(); setSelected(null) }
      })

      const marker = new mapboxgl.Marker({ element: wrapper, anchor: "center" })
        .setLngLat([lng, lat]).addTo(map)
      markersRef.current.push({ marker, pid: p.id })
    })
  }, [])

  // ── Map init (once) ────────────────────────────────────────────────────
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
      // Draw polygon source + layers
      map.addSource(DRAW_SRC, { type: "geojson", data: { type: "FeatureCollection", features: [] } })
      map.addLayer({ id: "draw-fill", type: "fill",   source: DRAW_SRC, filter: ["==", "$type", "Polygon"],
        paint: { "fill-color": "#3b82f6", "fill-opacity": 0.1 } })
      map.addLayer({ id: "draw-line", type: "line",   source: DRAW_SRC,
        paint: { "line-color": "#2563eb", "line-width": 2.5 } })
    })

    // Deselect popup on map background click
    map.on("click", () => {
      if (drawStateRef.current === "drawing") return
      setSelected(null)
      markersRef.current.forEach(({ marker }) => {
        const ip = marker.getElement().firstElementChild as HTMLElement | null
        if (!ip) return
        ip.style.width = "14px"; ip.style.height = "14px"
        ip.style.borderRadius = "50%"; ip.style.padding = "0"
        ip.style.background = DOT_DEFAULT
        const s = ip.querySelector("span") as HTMLSpanElement | null
        if (s) { s.style.opacity = "0"; s.style.maxWidth = "0" }
      })
    })

    mapRef.current = map
    return () => { map.remove(); mapRef.current = null }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Rebuild markers when properties change ─────────────────────────────
  useEffect(() => {
    const map = mapRef.current; if (!map) return
    if (!map.loaded()) map.on("load", () => buildMarkers(map, properties))
    else buildMarkers(map, properties)
  }, [properties, buildMarkers])

  // ── Draw layer helper ──────────────────────────────────────────────────
  function updateDrawLayer(pts: [number, number][], closed: boolean) {
    const map = mapRef.current; if (!map) return
    const src = map.getSource(DRAW_SRC) as mapboxgl.GeoJSONSource | undefined
    if (!src) return
    const features: GeoJSON.Feature[] = []
    if (closed && pts.length >= 3) {
      features.push({ type: "Feature", properties: {},
        geometry: { type: "Polygon", coordinates: [[...pts, pts[0]]] } })
    } else if (pts.length >= 2) {
      features.push({ type: "Feature", properties: {},
        geometry: { type: "LineString", coordinates: pts } })
    }
    src.setData({ type: "FeatureCollection", features })
  }

  // ── Freehand draw events ───────────────────────────────────────────────
  // Use canvas-level mouse events + document mouseup for reliability
  useEffect(() => {
    const map = mapRef.current; if (!map) return

    // Wait for map to be loaded before hooking canvas
    function attach() {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const m = mapRef.current!
      const canvas = m.getCanvas()

      function onDown(e: MouseEvent) {
        if (drawStateRef.current !== "drawing") return
        isDrawingRef.current = true
        m.dragPan.disable()
        canvas.style.cursor = "crosshair"
        const pt = m.unproject([e.offsetX, e.offsetY])
        rawPtsRef.current = [[pt.lng, pt.lat]]
      }

      function onMove(e: MouseEvent) {
        if (!isDrawingRef.current) return
        const pt = m.unproject([e.offsetX, e.offsetY])
        rawPtsRef.current.push([pt.lng, pt.lat])
        updateDrawLayer(thin(rawPtsRef.current), false)
      }

      function onUp() {
        if (!isDrawingRef.current) return
        isDrawingRef.current = false
        m.dragPan.enable()
        canvas.style.cursor = "crosshair"

        const poly = thin(rawPtsRef.current)

        if (poly.length >= 3) {
          updateDrawLayer(poly, true)

          // Compute filtered IDs
          const ids = properties
            .filter(p => pointInPolygon(getCoords(p), poly))
            .map(p => p.id)

          // Update React state — the useEffect above will apply visibility + call onFilter
          setMatchCount(ids.length)
          setLocalFiltered(ids)
          setDrawState("done")
          drawStateRef.current = "done"
        } else {
          updateDrawLayer([], false)
        }
      }

      canvas.addEventListener("mousedown", onDown)
      canvas.addEventListener("mousemove", onMove)
      document.addEventListener("mouseup", onUp)

      return () => {
        canvas.removeEventListener("mousedown", onDown)
        canvas.removeEventListener("mousemove", onMove)
        document.removeEventListener("mouseup", onUp)
      }
    }

    const m = mapRef.current!
    if (m.loaded()) return attach()
    let cleanup: (() => void) | undefined
    m.once("load", () => { cleanup = attach() })
    return () => cleanup?.()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties])

  // ── Toolbar actions ────────────────────────────────────────────────────
  function startDraw() {
    drawStateRef.current = "drawing"
    setDrawState("drawing")
    setLocalFiltered(null)
    setMatchCount(null)
    setSelected(null)
    updateDrawLayer([], false)
    const map = mapRef.current
    if (map) map.getCanvas().style.cursor = "crosshair"
  }

  function cancelDraw() {
    drawStateRef.current = "idle"
    setDrawState("idle")
    isDrawingRef.current = false
    rawPtsRef.current = []
    setLocalFiltered(null)
    setMatchCount(null)
    setSelected(null)
    updateDrawLayer([], false)
    const map = mapRef.current
    if (map) {
      map.dragPan.enable()
      map.getCanvas().style.cursor = ""
    }
  }

  // ── Draw toolbar ───────────────────────────────────────────────────────
  let toolbarNode: React.ReactNode
  if (drawState === "idle") {
    toolbarNode = (
      <button onClick={startDraw}
        className="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-300 shadow-md rounded-full px-4 py-2 text-sm font-semibold text-slate-700 transition select-none">
        <PenLine className="w-3.5 h-3.5 text-slate-500" />
        Draw search area
      </button>
    )
  } else if (drawState === "drawing") {
    toolbarNode = (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-blue-600 border border-blue-700 shadow-md rounded-full px-4 py-2 text-sm font-semibold text-white select-none pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          Draw on the map
        </div>
        <button onClick={cancelDraw}
          className="bg-white hover:bg-slate-50 border border-slate-300 shadow-md rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition select-none">
          Cancel
        </button>
      </div>
    )
  } else {
    toolbarNode = (
      <div className="flex items-center gap-2">
        <div className="bg-white border border-slate-200 shadow-md rounded-full px-4 py-2 text-sm font-semibold text-slate-700 select-none">
          {matchCount === 0 ? "No homes in this area" : `${matchCount} home${matchCount === 1 ? "" : "s"} in area`}
        </div>
        <button onClick={cancelDraw}
          className="flex items-center gap-1.5 bg-white hover:bg-red-50 border border-slate-300 hover:border-red-300 shadow-md rounded-full px-4 py-2 text-sm font-semibold text-slate-600 hover:text-red-600 transition select-none">
          <X className="w-3.5 h-3.5" /> Clear
        </button>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full" style={{ minHeight: fullscreen ? "calc(100vh - 112px)" : "100%" }}>
      <div ref={containerRef} className="w-full h-full" />

      {/* Centered draw toolbar */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10">
        {toolbarNode}
      </div>

      {/* Property popup — visible in idle and done states */}
      {selected && drawState !== "drawing" && (
        <PopupCard
          p={selected}
          onClose={() => {
            setSelected(null)
            markersRef.current.forEach(({ marker }) => {
              const ip = marker.getElement().firstElementChild as HTMLElement | null
              if (!ip) return
              ip.style.width = "14px"; ip.style.height = "14px"
              ip.style.borderRadius = "50%"; ip.style.padding = "0"
              ip.style.background = DOT_DEFAULT
              const s = ip.querySelector("span") as HTMLSpanElement | null
              if (s) { s.style.opacity = "0"; s.style.maxWidth = "0" }
            })
          }}
        />
      )}
    </div>
  )
}
