"use client"

import { useState, useCallback, useRef } from "react"
import Map, { Marker, NavigationControl, GeolocateControl } from "react-map-gl/mapbox"
import { MapPin, Search, X, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""

// Doha, Qatar center
const DOHA = { longitude: 51.531, latitude: 25.2854, zoom: 12 }

interface PickedLocation {
  latitude: number
  longitude: number
  address: string
  district: string
}

interface MapPickerProps {
  onSelect: (location: PickedLocation) => void
  onClose: () => void
  initialLat?: number
  initialLng?: number
}

async function reverseGeocode(lat: number, lng: number): Promise<{ address: string; district: string }> {
  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${TOKEN}&types=address,neighborhood,locality,place&language=en`
    const res = await fetch(url)
    const data = await res.json()
    const features = data.features || []

    // Try to get the most specific address
    const address = features[0]?.place_name?.split(",").slice(0, 2).join(",").trim() || `${lat.toFixed(5)}, ${lng.toFixed(5)}`

    // Try to find a neighborhood or district
    const neighborhood = features.find((f: { place_type: string[] }) => f.place_type.includes("neighborhood"))
    const locality = features.find((f: { place_type: string[] }) => f.place_type.includes("locality"))
    const district = (neighborhood?.text || locality?.text || "").trim()

    return { address, district }
  } catch {
    return { address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, district: "" }
  }
}

async function searchAddress(query: string): Promise<Array<{ id: string; place_name: string; center: [number, number] }>> {
  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${TOKEN}&country=qa&language=en&limit=5`
    const res = await fetch(url)
    const data = await res.json()
    return data.features || []
  } catch {
    return []
  }
}

export function MapPicker({ onSelect, onClose, initialLat, initialLng }: MapPickerProps) {
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
  )
  const [geocoded, setGeocoded] = useState<{ address: string; district: string } | null>(null)
  const [loadingGeo, setLoadingGeo] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Array<{ id: string; place_name: string; center: [number, number] }>>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [viewport, setViewport] = useState({
    longitude: initialLng || DOHA.longitude,
    latitude: initialLat || DOHA.latitude,
    zoom: initialLat ? 15 : DOHA.zoom,
  })

  const handleMapClick = useCallback(async (e: { lngLat: { lat: number; lng: number } }) => {
    const { lat, lng } = e.lngLat
    setPin({ lat, lng })
    setLoadingGeo(true)
    setGeocoded(null)
    const result = await reverseGeocode(lat, lng)
    setGeocoded(result)
    setLoadingGeo(false)
  }, [])

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    if (!query.trim()) { setSearchResults([]); return }
    searchTimeout.current = setTimeout(async () => {
      setSearchLoading(true)
      const results = await searchAddress(query)
      setSearchResults(results)
      setSearchLoading(false)
    }, 400)
  }, [])

  function selectSearchResult(result: { id: string; place_name: string; center: [number, number] }) {
    const [lng, lat] = result.center
    setPin({ lat, lng })
    setViewport({ longitude: lng, latitude: lat, zoom: 16 })
    setSearchQuery(result.place_name.split(",")[0])
    setSearchResults([])
    reverseGeocode(lat, lng).then(setGeocoded)
  }

  function confirm() {
    if (!pin || !geocoded) return
    onSelect({
      latitude: pin.lat,
      longitude: pin.lng,
      address: geocoded.address,
      district: geocoded.district,
    })
  }

  if (!TOKEN || TOKEN.startsWith("pk.your_")) {
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
          <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="font-bold text-slate-900 text-lg mb-2">Mapbox token needed</h3>
          <p className="text-sm text-slate-500 mb-4">
            To use the map picker, add your Mapbox public token to <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">.env.local</code>
          </p>
          <ol className="text-left text-sm text-slate-600 space-y-2 mb-6">
            <li>1. Go to <strong>mapbox.com</strong> → sign up (free)</li>
            <li>2. Click your account → <strong>Tokens</strong></li>
            <li>3. Copy the <strong>Default public token</strong></li>
            <li>4. Paste it in <code className="bg-slate-100 px-1 rounded text-xs">.env.local</code> as <code className="bg-slate-100 px-1 rounded text-xs">NEXT_PUBLIC_MAPBOX_TOKEN</code></li>
            <li>5. Restart the dev server</li>
          </ol>
          <button onClick={onClose} className="bg-blue-600 text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-blue-700 transition">
            Got it
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl overflow-hidden shadow-2xl w-full max-w-3xl flex flex-col" style={{ height: "85vh" }}>

        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">Pick Location on Map</h3>
              <p className="text-xs text-slate-400">Click anywhere on the map to set the property location</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search bar */}
        <div className="px-4 py-3 border-b border-slate-100 flex-shrink-0 relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search address, district, building name..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchLoading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            )}
          </div>
          {searchResults.length > 0 && (
            <div className="absolute left-4 right-4 top-full mt-1 bg-white rounded-xl border border-slate-200 shadow-lg z-10 overflow-hidden">
              {searchResults.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => selectSearchResult(r)}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-blue-50 transition flex items-center gap-3 border-b border-slate-100 last:border-0"
                >
                  <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span className="text-slate-700 truncate">{r.place_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <Map
            mapboxAccessToken={TOKEN}
            {...viewport}
            onMove={(e) => setViewport(e.viewState)}
            onClick={handleMapClick}
            mapStyle="mapbox://styles/mapbox/streets-v12"
            style={{ width: "100%", height: "100%" }}
            cursor="crosshair"
          >
            <NavigationControl position="bottom-right" />
            <GeolocateControl position="bottom-right" />

            {pin && (
              <Marker longitude={pin.lng} latitude={pin.lat} anchor="bottom">
                <div className="relative">
                  <div className="w-8 h-8 bg-blue-600 rounded-full border-3 border-white shadow-lg flex items-center justify-center animate-bounce-once">
                    <MapPin className="w-4 h-4 text-white fill-white" />
                  </div>
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-600 rotate-45" />
                </div>
              </Marker>
            )}
          </Map>

          {/* Hint overlay */}
          {!pin && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/80 text-white text-xs font-medium px-4 py-2 rounded-full pointer-events-none">
              Click on the map to drop a pin
            </div>
          )}
        </div>

        {/* Footer with result + confirm */}
        <div className="px-5 py-4 border-t border-slate-200 flex-shrink-0">
          {!pin ? (
            <p className="text-sm text-slate-400 text-center">No location selected yet</p>
          ) : loadingGeo ? (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              Getting address...
            </div>
          ) : geocoded ? (
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400 mb-0.5">Selected location</p>
                <p className="text-sm font-semibold text-slate-900 truncate">{geocoded.address}</p>
                <p className="text-xs text-slate-500">
                  {geocoded.district && `${geocoded.district} · `}
                  {pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}
                </p>
              </div>
              <button
                type="button"
                onClick={confirm}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all",
                  "bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                )}
              >
                <CheckCircle className="w-4 h-4" />
                Use this location
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
