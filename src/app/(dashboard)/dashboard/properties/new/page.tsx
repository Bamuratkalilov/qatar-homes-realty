"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { RESIDENTIAL_TYPES, COMMERCIAL_TYPES, QATAR_DISTRICTS, cn } from "@/lib/utils"
import { Wand2, Save, ArrowLeft, RefreshCw, Globe, AlertCircle, MapPin } from "lucide-react"
import dynamic from "next/dynamic"
import { PhotoManager } from "@/components/properties/photo-manager"
import {
  AMENITIES_LIST, UTILITY_OPTIONS, generateRef,
  ToggleChip, ToggleButton, SectionCard, LivePreview,
} from "@/components/properties/form-helpers"

const MapPicker = dynamic(
  () => import("@/components/map/map-picker").then((m) => m.MapPicker),
  { ssr: false }
)

// ── Main Page ────────────────────────────────────────────────────────────────
export default function NewPropertyPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<"draft" | "publish" | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)

  const [form, setForm] = useState({
    title: "",
    category: "RESIDENTIAL" as "RESIDENTIAL" | "COMMERCIAL",
    type: "APARTMENT",
    listingType: "RENT",
    referenceNumber: "",
    price: "",
    area: "",
    bedrooms: "",
    bathrooms: "",
    floor: "",
    address: "",
    district: "",
    description: "",
    furnishing: "" as "" | "FURNISHED" | "SEMI_FURNISHED" | "UNFURNISHED",
    availabilityType: "IMMEDIATE" as "IMMEDIATE" | "DATE",
    availableFrom: "",
    featured: false,
  })

  const [amenities, setAmenities] = useState<string[]>([])
  const [utilities, setUtilities] = useState<string[]>([])
  const [photos, setPhotos] = useState<string[]>([])
  const [showMap, setShowMap] = useState(false)
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const [draftStatus, setDraftStatus] = useState<"idle" | "saving" | "saved" | "restored">("idle")
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const DRAFT_KEY = "property_draft"

  // Generate reference number client-side only (avoids hydration mismatch)
  useEffect(() => {
    localStorage.removeItem(DRAFT_KEY) // always start fresh
    setForm((f) => ({ ...f, referenceNumber: generateRef() }))
  }, [])

  // Auto-save on every change (debounced 800ms)
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    setDraftStatus("saving")
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, amenities, utilities, photos, coordinates }))
        setDraftStatus("saved")
      } catch {
        setDraftStatus("idle")
      }
    }, 800)
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current) }
  }, [form, amenities, utilities, photos, coordinates])

  function clearDraft() {
    localStorage.removeItem(DRAFT_KEY)
  }

  // Check if the user has entered anything worth saving
  const hasContent = !!(form.title || form.price || form.area || form.address || form.description || amenities.length || photos.length)

  function handleBackClick() {
    if (hasContent) {
      setShowLeaveConfirm(true)
    } else {
      router.push("/dashboard/properties")
    }
  }

  async function saveAndLeave() {
    if (!form.title.trim()) {
      // No title — can't save to DB, just leave
      router.push("/dashboard/properties")
      return
    }
    try {
      await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          status: "OFF_MARKET",
          price: parseFloat(form.price) || 0,
          area: parseFloat(form.area) || 0,
          bedrooms: form.bedrooms ? parseInt(form.bedrooms) : undefined,
          bathrooms: form.bathrooms ? parseInt(form.bathrooms) : undefined,
          floor: form.floor ? parseInt(form.floor) : undefined,
          amenities,
          photos,
          utilityBillsIncluded: utilities.length > 0,
          coordinates: coordinates ? { lat: coordinates.lat, lng: coordinates.lng } : undefined,
          availableFrom: form.availabilityType === "DATE" && form.availableFrom ? new Date(form.availableFrom).toISOString() : undefined,
          furnishing: form.furnishing || undefined,
        }),
      })
    } catch { /* ignore — just leave */ }
    router.push("/dashboard/properties")
  }

  function update<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function toggleAmenity(a: string) {
    setAmenities((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a])
  }

  function toggleUtility(u: string) {
    setUtilities((prev) => prev.includes(u) ? prev.filter((x) => x !== u) : [...prev, u])
  }

  async function generateDescription() {
    if (!form.type || !form.area) return
    setAiLoading(true)
    try {
      const res = await fetch("/api/ai/description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amenities, price: parseFloat(form.price) || 0, area: parseFloat(form.area) || 0 }),
      })
      const data = await res.json()
      if (data.description) update("description", data.description)
    } finally {
      setAiLoading(false)
    }
  }

  async function submit(status: "OFF_MARKET" | "AVAILABLE") {
    // Basic validation
    if (!form.title.trim()) { setError("Property title is required"); return }
    if (!form.price) { setError("Price is required"); return }
    if (!form.area) { setError("Area is required"); return }
    if (!form.address.trim()) { setError("Address is required — please fill in or pick from the map"); return }

    setError(null)
    setLoading(status === "OFF_MARKET" ? "draft" : "publish")
    try {
      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          status,
          price: parseFloat(form.price),
          area: parseFloat(form.area),
          bedrooms: form.bedrooms ? parseInt(form.bedrooms) : undefined,
          bathrooms: form.bathrooms ? parseInt(form.bathrooms) : undefined,
          floor: form.floor ? parseInt(form.floor) : undefined,
          amenities,
          photos,
          utilityBillsIncluded: utilities.length > 0,
          coordinates: coordinates ? { lat: coordinates.lat, lng: coordinates.lng } : undefined,
          availableFrom: form.availabilityType === "DATE" && form.availableFrom ? new Date(form.availableFrom).toISOString() : undefined,
          furnishing: form.furnishing || undefined,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        clearDraft()
        router.push("/dashboard/properties")
      } else {
        setError(data.error || "Something went wrong. Please try again.")
      }
    } catch {
      setError("Network error — check your connection and try again.")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div>
      <Header
        title="Add Property"
        description="Create a new listing — preview updates live on the right"
        actions={
          <div className="flex items-center gap-3">
            {/* Top action buttons */}
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" disabled={loading !== null} onClick={() => submit("OFF_MARKET")} className="gap-1.5">
                <Save className="w-3.5 h-3.5" />
                {loading === "draft" ? "Saving…" : "Save Listing"}
              </Button>
              <Button type="button" size="sm" disabled={loading !== null} onClick={() => submit("AVAILABLE")} className="gap-1.5 bg-green-600 hover:bg-green-700">
                <Globe className="w-3.5 h-3.5" />
                {loading === "publish" ? "Publishing…" : "Publish Listing"}
              </Button>
            </div>
            {/* Draft status indicator */}
            {draftStatus === "restored" && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Draft restored
                <button
                  type="button"
                  onClick={() => { clearDraft(); router.push("/dashboard/properties/new") }}
                  className="ml-1 text-amber-500 hover:text-amber-700 underline font-normal"
                >
                  Discard
                </button>
              </div>
            )}
            {draftStatus === "saving" && (
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-pulse" />
                Saving draft…
              </span>
            )}
            {draftStatus === "saved" && (
              <span className="text-xs text-green-600 flex items-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Draft saved
              </span>
            )}
            <Button variant="outline" size="sm" className="gap-2" onClick={handleBackClick}>
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
          </div>
        }
      />

      {/* Leave confirmation modal */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Save className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-base">Leave without publishing?</h3>
                <p className="text-sm text-slate-500 mt-1">
                  {form.title.trim()
                    ? "Your draft will be saved to Properties so you can continue later."
                    : "Add a title first if you want to save this as a draft."}
                </p>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowLeaveConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Return to editing
              </button>
              <button
                type="button"
                onClick={saveAndLeave}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700 transition"
              >
                {form.title.trim() ? "Save draft & exit" : "Exit without saving"}
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mx-6 mt-4 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <button type="button" onClick={() => setError(null)} className="text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      <div className="p-6">
        <form onSubmit={(e) => e.preventDefault()}>
          <div className="flex gap-6 items-start">

            {/* ── Left: Form ── */}
            <div className="flex-1 min-w-0 space-y-5">

              {/* 1. Category & Type */}
              <SectionCard title="Category & Type">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Category *</label>
                  <div className="flex gap-3">
                    <ToggleButton label="🏠 Residential" selected={form.category === "RESIDENTIAL"} onClick={() => setForm((f) => ({ ...f, category: "RESIDENTIAL", type: "APARTMENT" }))} />
                    <ToggleButton label="🏢 Commercial" selected={form.category === "COMMERCIAL"} onClick={() => setForm((f) => ({ ...f, category: "COMMERCIAL", type: "OFFICE" }))} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Property Type *</label>
                    <Select
                      value={form.type}
                      onChange={(e) => update("type", e.target.value)}
                      options={form.category === "COMMERCIAL" ? COMMERCIAL_TYPES : RESIDENTIAL_TYPES}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Listing Type *</label>
                    <div className="flex gap-2">
                      <ToggleButton label="For Rent" selected={form.listingType === "RENT"} onClick={() => update("listingType", "RENT")} />
                      <ToggleButton label="For Sale" selected={form.listingType === "SALE"} onClick={() => update("listingType", "SALE")} />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Reference Number</label>
                  <div className="flex gap-2">
                    <Input value={form.referenceNumber} onChange={(e) => update("referenceNumber", e.target.value)} placeholder="QH-12345" className="flex-1 font-mono" />
                    <button type="button" onClick={() => update("referenceNumber", generateRef())}
                      className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-300 transition" title="Generate new">
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </SectionCard>

              {/* 3. Pricing & Size */}
              <SectionCard title="Pricing & Size">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Price (QAR) *</label>
                    <Input type="number" value={form.price} onChange={(e) => update("price", e.target.value)} placeholder="e.g. 180000" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Area (sqm) *</label>
                    <Input type="number" value={form.area} onChange={(e) => update("area", e.target.value)} placeholder="e.g. 185" required />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Bedrooms</label>
                    <Input type="number" value={form.bedrooms} onChange={(e) => update("bedrooms", e.target.value)} placeholder="3" min="0" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Bathrooms</label>
                    <Input type="number" value={form.bathrooms} onChange={(e) => update("bathrooms", e.target.value)} placeholder="2" min="0" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Floor</label>
                    <Input type="number" value={form.floor} onChange={(e) => update("floor", e.target.value)} placeholder="8" min="0" />
                  </div>
                </div>
              </SectionCard>

              {/* 4. Availability & Furnishing */}
              <SectionCard title="Availability & Condition">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Available</label>
                  <div className="flex gap-3">
                    <ToggleButton label="⚡ Immediate" selected={form.availabilityType === "IMMEDIATE"} onClick={() => update("availabilityType", "IMMEDIATE")} />
                    <ToggleButton label="📅 From Date" selected={form.availabilityType === "DATE"} onClick={() => update("availabilityType", "DATE")} />
                  </div>
                  {form.availabilityType === "DATE" && (
                    <div className="mt-3">
                      <Input type="date" value={form.availableFrom} onChange={(e) => update("availableFrom", e.target.value)} min={new Date().toISOString().split("T")[0]} />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Furnishing</label>
                  <div className="flex gap-3">
                    {(["FURNISHED", "SEMI_FURNISHED", "UNFURNISHED"] as const).map((f) => (
                      <ToggleButton
                        key={f}
                        label={f === "SEMI_FURNISHED" ? "Semi-Furnished" : f.charAt(0) + f.slice(1).toLowerCase()}
                        selected={form.furnishing === f}
                        onClick={() => update("furnishing", form.furnishing === f ? "" : f)}
                      />
                    ))}
                  </div>
                </div>
              </SectionCard>

              {/* 5. Photos */}
              <SectionCard title="Photos">
                <PhotoManager photos={photos} onChange={setPhotos} />
              </SectionCard>

              {/* 6. Amenities */}
              <SectionCard title="Amenities">
                <p className="text-xs text-slate-400 -mt-2">Click to select all that apply</p>
                <div className="flex flex-wrap gap-2">
                  {AMENITIES_LIST.map((a) => (
                    <ToggleChip key={a} label={a} selected={amenities.includes(a)} onClick={() => toggleAmenity(a)} />
                  ))}
                </div>
                {amenities.length > 0 && (
                  <p className="text-xs text-blue-600 font-medium">{amenities.length} selected</p>
                )}
              </SectionCard>

              {/* 7. Utility Bills */}
              <SectionCard title="Utility Bills Included">
                <p className="text-xs text-slate-400 -mt-2">Select which bills are included in the price</p>
                <div className="flex flex-wrap gap-2">
                  {UTILITY_OPTIONS.map((u) => (
                    <ToggleChip key={u} label={u} selected={utilities.includes(u)} onClick={() => toggleUtility(u)} />
                  ))}
                </div>
              </SectionCard>

              {/* 8. Title + Description */}
              <SectionCard title="Title & Description">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Property Title *</label>
                  <Input
                    value={form.title}
                    onChange={(e) => update("title", e.target.value)}
                    placeholder="e.g. Luxury 3BR Apartment with Sea View in The Pearl"
                    required
                    className="text-base"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-medium text-slate-700">Description</label>
                    <Button type="button" variant="outline" size="sm" onClick={generateDescription} disabled={aiLoading} className="gap-2">
                      <Wand2 className="w-3.5 h-3.5" />
                      {aiLoading ? "Generating..." : "AI Generate"}
                    </Button>
                  </div>
                  <Textarea
                    value={form.description}
                    onChange={(e) => update("description", e.target.value)}
                    placeholder="Describe the property… or click 'AI Generate' for a professional description"
                    rows={6}
                  />
                </div>
              </SectionCard>

              {/* 9. Location — at the end as requested */}
              <SectionCard title="Location">
                {/* Map picker button */}
                <button
                  type="button"
                  onClick={() => setShowMap(true)}
                  className={cn(
                    "w-full flex items-center gap-3 p-4 rounded-xl border-2 border-dashed transition-all text-left",
                    coordinates
                      ? "border-blue-300 bg-blue-50"
                      : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                  )}
                >
                  <div className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0",
                    coordinates ? "bg-blue-600" : "bg-slate-100"
                  )}>
                    <MapPin className={cn("w-4 h-4", coordinates ? "text-white" : "text-slate-400")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    {coordinates ? (
                      <>
                        <p className="text-sm font-semibold text-blue-700">Location pinned on map</p>
                        <p className="text-xs text-slate-500 truncate">
                          {form.address || `${coordinates.lat.toFixed(5)}, ${coordinates.lng.toFixed(5)}`}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-slate-700">Pick location on map</p>
                        <p className="text-xs text-slate-400">Click to open Mapbox and pin the exact location</p>
                      </>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-blue-600 flex-shrink-0">
                    {coordinates ? "Change" : "Open Map →"}
                  </span>
                </button>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Address *</label>
                  <Input value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="e.g. Porto Arabia, The Pearl-Qatar — auto-filled from map" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">District</label>
                  <Select value={form.district} onChange={(e) => update("district", e.target.value)} placeholder="Select district"
                    options={QATAR_DISTRICTS.map((d) => ({ value: d, label: d }))} />
                </div>
              </SectionCard>

              {/* Map Picker Modal */}
              {showMap && (
                <MapPicker
                  onClose={() => setShowMap(false)}
                  initialLat={coordinates?.lat}
                  initialLng={coordinates?.lng}
                  onSelect={(loc) => {
                    setCoordinates({ lat: loc.latitude, lng: loc.longitude })
                    update("address", loc.address)
                    // Try to match district from Qatar districts list
                    const matched = QATAR_DISTRICTS.find((d) =>
                      d.toLowerCase().includes(loc.district.toLowerCase()) ||
                      loc.district.toLowerCase().includes(d.toLowerCase())
                    )
                    if (matched) update("district", matched)
                    setShowMap(false)
                  }}
                />
              )}

              {/* 10. Featured */}
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <label className="flex items-center gap-3 cursor-pointer" onClick={() => update("featured", !form.featured)}>
                  <div className={cn("w-10 h-6 rounded-full transition-all relative flex-shrink-0", form.featured ? "bg-blue-600" : "bg-slate-200")}>
                    <div className={cn("w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-all", form.featured ? "left-[18px]" : "left-0.5")} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Feature on homepage</p>
                    <p className="text-xs text-slate-400">Highlights this property in the featured section</p>
                  </div>
                </label>
              </div>

              {/* Bottom action bar */}
              <div className="pb-10">
                <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between gap-4">
                  <div className="text-xs text-slate-500 space-y-0.5">
                    <p className="font-semibold text-slate-700">Ready to go?</p>
                    <p>
                      <span className="text-slate-400">Save Listing</span> keeps it hidden ·{" "}
                      <span className="text-green-600 font-medium">Publish Listing</span> makes it live on the website
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <Button type="button" variant="outline" size="sm" onClick={handleBackClick}>Cancel</Button>
                    <Button type="button" variant="outline" disabled={loading !== null} onClick={() => submit("OFF_MARKET")} className="gap-2">
                      <Save className="w-4 h-4" />
                      {loading === "draft" ? "Saving…" : "Save Listing"}
                    </Button>
                    <Button type="button" disabled={loading !== null} onClick={() => submit("AVAILABLE")} className="gap-2 bg-green-600 hover:bg-green-700">
                      <Globe className="w-4 h-4" />
                      {loading === "publish" ? "Publishing…" : "Publish Listing"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Right: Live Preview ── */}
            <div className="w-72 flex-shrink-0 hidden lg:block">
              <LivePreview form={form} photos={photos} amenities={amenities} utilities={utilities} />
              {coordinates && (
                <div className="mt-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <div className="text-xs">
                    <p className="font-semibold text-green-700">Location pinned</p>
                    <p className="text-green-600">{coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}</p>
                  </div>
                </div>
              )}
            </div>

          </div>
        </form>
      </div>
    </div>
  )
}
