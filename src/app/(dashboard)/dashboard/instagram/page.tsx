"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import {
  Search, Sparkles, Send, RotateCcw, CheckCircle2,
  AlertCircle, Loader2, ImageIcon, X, Check, Sliders, GripVertical, ChevronRight
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import { SortableContext, useSortable, rectSortingStrategy, arrayMove } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

// ── Types ──────────────────────────────────────────────────────────────────
interface Property {
  id: string
  title: string
  type: string
  listingType: string
  status: string
  price: number
  bedrooms: number | null
  bathrooms: number | null
  area: number
  district: string | null
  city: string
  address: string
  description: string
  furnishing: string | null
  amenities: string[]
  photos: string[]
  referenceNumber: string | null
}

// ── Photo Editor ───────────────────────────────────────────────────────────
interface Adjustments {
  brightness: number
  contrast: number
  saturation: number
  warmth: number
  sharpness: number
}

const DEFAULT_ADJ: Adjustments = { brightness: 100, contrast: 100, saturation: 100, warmth: 0, sharpness: 0 }

const PRESETS = [
  { name: "Original", adj: DEFAULT_ADJ },
  { name: "Bright", adj: { brightness: 115, contrast: 105, saturation: 110, warmth: 5, sharpness: 10 } },
  { name: "Warm", adj: { brightness: 105, contrast: 108, saturation: 115, warmth: 25, sharpness: 5 } },
  { name: "Clean", adj: { brightness: 108, contrast: 112, saturation: 95, warmth: -5, sharpness: 20 } },
  { name: "Luxury", adj: { brightness: 100, contrast: 120, saturation: 105, warmth: 10, sharpness: 15 } },
  { name: "Cool", adj: { brightness: 105, contrast: 110, saturation: 105, warmth: -20, sharpness: 10 } },
]

function buildFilter(adj: Adjustments) {
  const sepia = adj.warmth > 0 ? adj.warmth * 0.012 : 0
  const hueRotate = adj.warmth < 0 ? adj.warmth * 0.5 : 0
  return `brightness(${adj.brightness}%) contrast(${adj.contrast}%) saturate(${adj.saturation}%) sepia(${sepia}) hue-rotate(${hueRotate}deg)`
}

function PhotoEditorModal({ url, onSave, onClose }: { url: string; onSave: (url: string) => void; onClose: () => void }) {
  const [adj, setAdj] = useState<Adjustments>(DEFAULT_ADJ)
  const [saving, setSaving] = useState(false)
  const imgRef = useRef<HTMLImageElement | null>(null)

  useEffect(() => {
    const img = new window.Image()
    img.crossOrigin = "anonymous"
    img.onload = () => { imgRef.current = img }
    img.src = url
  }, [url])

  async function applyAndSave() {
    setSaving(true)
    try {
      const img = imgRef.current
      if (!img) { onSave(url); return }
      const canvas = document.createElement("canvas")
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext("2d")!
      ctx.filter = buildFilter(adj)
      ctx.drawImage(img, 0, 0)
      if (adj.sharpness > 0) {
        const amount = adj.sharpness / 100
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const blurCanvas = document.createElement("canvas")
        blurCanvas.width = canvas.width; blurCanvas.height = canvas.height
        const blurCtx = blurCanvas.getContext("2d")!
        blurCtx.filter = "blur(1px)"; blurCtx.drawImage(canvas, 0, 0)
        const blurData = blurCtx.getImageData(0, 0, canvas.width, canvas.height)
        const d = imageData.data; const b = blurData.data
        for (let i = 0; i < d.length; i += 4) {
          d[i] = Math.min(255, Math.max(0, d[i] + (d[i] - b[i]) * amount))
          d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + (d[i + 1] - b[i + 1]) * amount))
          d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + (d[i + 2] - b[i + 2]) * amount))
        }
        ctx.putImageData(imageData, 0, 0)
      }
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", 0.92))
      if (!blob) { onSave(url); return }
      const fd = new FormData()
      fd.append("files", new File([blob], "edited.jpg", { type: "image/jpeg" }))
      const resp = await fetch("/api/upload", { method: "POST", body: fd })
      const data = await resp.json()
      onSave(data.urls?.[0] || url)
    } finally { setSaving(false) }
  }

  const sliders: { key: keyof Adjustments; label: string; min: number; max: number }[] = [
    { key: "brightness", label: "Brightness", min: 50, max: 150 },
    { key: "contrast", label: "Contrast", min: 50, max: 175 },
    { key: "saturation", label: "Saturation", min: 0, max: 200 },
    { key: "warmth", label: "Warmth", min: -50, max: 50 },
    { key: "sharpness", label: "Sharpness", min: 0, max: 100 },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2"><Sliders className="w-4 h-4" /> Enhance Photo</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="preview" className="w-full h-full object-cover" style={{ filter: buildFilter(adj) }} />
            </div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Presets</p>
            <div className="grid grid-cols-3 gap-2">
              {PRESETS.map((p) => (
                <button key={p.name} onClick={() => setAdj(p.adj)}
                  className={cn("relative rounded-lg overflow-hidden border-2 transition-all",
                    JSON.stringify(adj) === JSON.stringify(p.adj) ? "border-blue-500" : "border-transparent hover:border-slate-300")}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={p.name} className="w-full aspect-square object-cover" style={{ filter: buildFilter(p.adj) }} />
                  <div className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[10px] font-medium py-0.5 text-center">{p.name}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Manual Adjustments</p>
            {sliders.map(({ key, label, min, max }) => (
              <div key={key} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">{label}</label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 tabular-nums w-8 text-right">{adj[key]}</span>
                    {adj[key] !== DEFAULT_ADJ[key] && (
                      <button onClick={() => setAdj((a) => ({ ...a, [key]: DEFAULT_ADJ[key] }))} className="text-[10px] text-blue-500 hover:underline">reset</button>
                    )}
                  </div>
                </div>
                <input type="range" min={min} max={max} step={1} value={adj[key]}
                  onChange={(e) => setAdj((a) => ({ ...a, [key]: Number(e.target.value) }))}
                  className="w-full accent-blue-500" />
              </div>
            ))}
            <div className="pt-2 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setAdj(DEFAULT_ADJ)}>Reset All</Button>
              <Button className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700" onClick={applyAndSave} disabled={saving}>
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><Check className="w-4 h-4" /> Apply & Save</>}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Sortable Photo Item ────────────────────────────────────────────────────
function SortablePhoto({ url, index, selected, onToggle, onEdit }: {
  url: string; index: number; selected: boolean; onToggle: () => void; onEdit: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: url })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }

  return (
    <div ref={setNodeRef} style={style} className="relative group aspect-square">
      <div className={cn("relative w-full h-full rounded-xl overflow-hidden border-2 transition-all cursor-pointer",
        selected ? "border-purple-500 ring-2 ring-purple-200" : "border-slate-200 hover:border-slate-300")}>
        <Image src={url} alt={`photo ${index + 1}`} fill className="object-cover" sizes="120px" onClick={onToggle} />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all" onClick={onToggle} />

        {/* Select indicator */}
        <div className={cn("absolute top-2 left-2 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
          selected ? "bg-purple-500 border-purple-500" : "bg-white/80 border-white")} onClick={onToggle}>
          {selected && <Check className="w-3 h-3 text-white" />}
        </div>

        {/* Order badge */}
        {selected && (
          <div className="absolute bottom-2 left-2 bg-purple-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
            #{index + 1}
          </div>
        )}

        {/* Drag handle */}
        <div {...attributes} {...listeners}
          className="absolute top-2 right-8 w-5 h-5 bg-white/90 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
          <GripVertical className="w-3 h-3 text-slate-600" />
        </div>

        {/* Edit button */}
        <button type="button" onClick={onEdit}
          className="absolute top-2 right-2 w-5 h-5 bg-white/90 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-100">
          <Sliders className="w-3 h-3 text-slate-600" />
        </button>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function InstagramPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loadingProps, setLoadingProps] = useState(true)
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Property | null>(null)
  const [photos, setPhotos] = useState<string[]>([])
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set())
  const [editingPhoto, setEditingPhoto] = useState<string | null>(null)
  const [caption, setCaption] = useState("")
  const [captionLoading, setCaptionLoading] = useState(false)
  const [captionInstructions, setCaptionInstructions] = useState("")
  const [posting, setPosting] = useState(false)
  const [postStatus, setPostStatus] = useState<{ ok: boolean; msg: string } | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  useEffect(() => {
    fetch("/api/properties?status=AVAILABLE&limit=100")
      .then((r) => r.json())
      .then((d) => { setProperties(d.properties || []); setLoadingProps(false) })
      .catch(() => setLoadingProps(false))
  }, [])

  function selectProperty(p: Property) {
    setSelected(p)
    setPhotos([...p.photos])
    setSelectedPhotos(new Set(p.photos.slice(0, 10)))
    setCaption("")
    setPostStatus(null)
  }

  async function generateCaption() {
    if (!selected) return
    setCaptionLoading(true)
    try {
      const res = await fetch("/api/instagram/caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ property: selected, instructions: captionInstructions.trim() }),
      })
      const data = await res.json()
      if (data.caption) setCaption(data.caption)
    } finally { setCaptionLoading(false) }
  }

  async function postToInstagram() {
    if (!selected || selectedPhotos.size === 0) return
    setPosting(true)
    setPostStatus(null)
    try {
      const orderedPhotos = photos.filter((u) => selectedPhotos.has(u))
      const res = await fetch("/api/instagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ property: { ...selected, photos: orderedPhotos }, caption: caption.trim() }),
      })
      const data = await res.json()
      if (res.ok) setPostStatus({ ok: true, msg: `Posted ${orderedPhotos.length} photo${orderedPhotos.length > 1 ? "s" : ""} successfully!` })
      else setPostStatus({ ok: false, msg: data.error || "Failed to post" })
    } finally { setPosting(false) }
  }

  function handlePhotoEdited(oldUrl: string, newUrl: string) {
    setPhotos((p) => p.map((u) => (u === oldUrl ? newUrl : u)))
    setSelectedPhotos((s) => {
      const next = new Set(s)
      if (next.has(oldUrl)) { next.delete(oldUrl); next.add(newUrl) }
      return next
    })
    setEditingPhoto(null)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setPhotos((p) => arrayMove(p, p.indexOf(active.id as string), p.indexOf(over.id as string)))
  }

  const filtered = properties.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    (p.district || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.referenceNumber || "").toLowerCase().includes(search.toLowerCase())
  )

  const orderedSelected = photos.filter((u) => selectedPhotos.has(u))
  const charCount = caption.length
  const charLimit = 2200

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <Header title="Instagram" description="Select a listing and post to Instagram" />

      {editingPhoto && (
        <PhotoEditorModal
          url={editingPhoto}
          onSave={(newUrl) => handlePhotoEdited(editingPhoto, newUrl)}
          onClose={() => setEditingPhoto(null)}
        />
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* ── LEFT: Listing Browser ── */}
        <div className="w-72 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col">
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search listings…"
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-100"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingProps ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-400">No listings found</div>
            ) : (
              <div className="p-2 space-y-1">
                {filtered.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => selectProperty(p)}
                    className={cn(
                      "w-full text-left rounded-xl overflow-hidden border-2 transition-all",
                      selected?.id === p.id ? "border-purple-500 bg-purple-50" : "border-transparent hover:border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    <div className="flex gap-2.5 p-2">
                      <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100">
                        {p.photos[0] ? (
                          <Image src={p.photos[0]} alt={p.title} fill className="object-cover" sizes="56px" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="w-5 h-5 text-slate-300" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate leading-tight">{p.title}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{p.district || p.city}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                            {p.listingType === "RENT" ? "Rent" : "Sale"}
                          </span>
                          <span className="text-[10px] text-slate-500">{p.photos.length} photos</span>
                        </div>
                      </div>
                      {selected?.id === p.id && <ChevronRight className="w-4 h-4 text-purple-500 flex-shrink-0 self-center" />}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── MIDDLE: Photo Composer ── */}
        <div className="flex-1 flex flex-col border-r border-slate-200 overflow-hidden">
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-purple-400" />
              </div>
              <p className="font-medium text-slate-600">Select a listing to start</p>
              <p className="text-sm">Choose from the left panel</p>
            </div>
          ) : (
            <>
              {/* Property header */}
              <div className="p-4 border-b border-slate-100 bg-white">
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                    {selected.photos[0] && <Image src={selected.photos[0]} alt={selected.title} fill className="object-cover" sizes="48px" />}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{selected.title}</p>
                    <p className="text-xs text-slate-500">{selected.district || selected.city} · QAR {selected.price.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Photo selection */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Select Photos</p>
                    <p className="text-xs text-slate-400">{selectedPhotos.size} selected · max 10 for carousel · drag to reorder</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setSelectedPhotos(new Set(photos.slice(0, 10)))}
                      className="text-xs text-purple-600 hover:underline font-medium">All</button>
                    <span className="text-slate-300">·</span>
                    <button onClick={() => setSelectedPhotos(new Set())}
                      className="text-xs text-slate-400 hover:underline">None</button>
                  </div>
                </div>

                {photos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
                    <ImageIcon className="w-8 h-8" />
                    <p className="text-sm">This listing has no photos</p>
                  </div>
                ) : (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={photos} strategy={rectSortingStrategy}>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        {photos.map((url, i) => (
                          <SortablePhoto
                            key={url}
                            url={url}
                            index={orderedSelected.indexOf(url)}
                            selected={selectedPhotos.has(url)}
                            onToggle={() => {
                              setSelectedPhotos((s) => {
                                const next = new Set(s)
                                if (next.has(url)) next.delete(url)
                                else if (next.size < 10) next.add(url)
                                return next
                              })
                            }}
                            onEdit={() => setEditingPhoto(url)}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}

                {/* Selected order preview */}
                {orderedSelected.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Post Order Preview</p>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {orderedSelected.map((url, i) => (
                        <div key={url} className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 border-purple-300">
                          <Image src={url} alt={`slide ${i + 1}`} fill className="object-cover" sizes="64px" />
                          <div className="absolute bottom-0.5 right-0.5 bg-purple-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                            {i + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* ── RIGHT: Caption & Post ── */}
        <div className="w-80 flex-shrink-0 bg-white flex flex-col">
          <div className="p-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <ImageIcon className="w-3.5 h-3.5 text-white" />
              </div>
              Post to Instagram
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Caption */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Instructions for AI</label>
              <textarea
                value={captionInstructions}
                onChange={(e) => setCaptionInstructions(e.target.value)}
                placeholder={"e.g. Make it formal, focus on the pool view, mention it's near Lusail Marina, keep it very short…"}
                disabled={!selected}
                rows={3}
                className="w-full text-sm border border-slate-200 rounded-xl p-3 outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-100 resize-none disabled:bg-slate-50 disabled:text-slate-400"
              />
              <Button
                size="sm"
                className="w-full gap-1.5 bg-purple-600 hover:bg-purple-700 text-white h-8 text-xs"
                onClick={generateCaption}
                disabled={!selected || captionLoading}
              >
                {captionLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                {captionLoading ? "Generating…" : "Generate Caption"}
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700">Caption</label>
                {caption && (
                  <button onClick={() => setCaption("")} className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
                    <RotateCcw className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder={selected ? "Click AI Generate or write your own caption…" : "Select a listing first"}
                disabled={!selected}
                rows={10}
                className="w-full text-sm border border-slate-200 rounded-xl p-3 outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-100 resize-none disabled:bg-slate-50 disabled:text-slate-400"
              />
              <p className={cn("text-xs", charCount > charLimit ? "text-red-500" : "text-slate-400")}>
                {charCount}/{charLimit} characters
              </p>
            </div>

            {/* Summary */}
            {selected && (
              <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Listing</span>
                  <span className="font-medium truncate max-w-[160px]">{selected.title}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Photos</span>
                  <span className="font-medium">{selectedPhotos.size} selected {selectedPhotos.size > 1 ? "(carousel)" : ""}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Caption</span>
                  <span className={cn("font-medium", caption ? "text-green-600" : "text-orange-500")}>
                    {caption ? "Ready" : "Not written"}
                  </span>
                </div>
              </div>
            )}

            {/* Status */}
            {postStatus && (
              <div className={cn("flex items-start gap-2 p-3 rounded-xl text-sm",
                postStatus.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700")}>
                {postStatus.ok
                  ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  : <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                <span>{postStatus.msg}</span>
              </div>
            )}
          </div>

          {/* Post button */}
          <div className="p-4 border-t border-slate-100">
            <Button
              className="w-full gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 h-11"
              disabled={!selected || selectedPhotos.size === 0 || !caption.trim() || posting || charCount > charLimit}
              onClick={postToInstagram}
            >
              {posting
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Posting…</>
                : <><Send className="w-4 h-4" /> Post to Instagram</>}
            </Button>
            {selected && selectedPhotos.size === 0 && (
              <p className="text-xs text-center text-slate-400 mt-2">Select at least 1 photo</p>
            )}
            {selected && !caption.trim() && selectedPhotos.size > 0 && (
              <p className="text-xs text-center text-slate-400 mt-2">Write or generate a caption first</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
