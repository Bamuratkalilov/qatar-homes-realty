"use client"

import { useCallback, useState, useRef, useEffect } from "react"
import Image from "next/image"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core"
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Upload, X, GripVertical, Star, ImageIcon, Loader2, Sliders, Check, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

// ── Image compression ──────────────────────────────────────────────────────
async function compressImage(file: File, maxPx = 1920, quality = 0.82): Promise<File> {
  return new Promise((resolve) => {
    const img = new window.Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      if (width <= maxPx && height <= maxPx) quality = 0.92
      const scale = Math.min(maxPx / width, maxPx / height, 1)
      width = Math.round(width * scale)
      height = Math.round(height * scale)
      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext("2d")!
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => {
          if (!blob) return resolve(file)
          resolve(new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" }))
        },
        "image/jpeg",
        quality
      )
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
    img.src = url
  })
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ── Photo Editor Modal ─────────────────────────────────────────────────────
interface Adjustments {
  brightness: number   // 0-200, default 100
  contrast: number     // 0-200, default 100
  saturation: number   // 0-200, default 100
  warmth: number       // -50 to 50, default 0
  sharpness: number    // 0-100, default 0
}

const DEFAULT_ADJ: Adjustments = { brightness: 100, contrast: 100, saturation: 100, warmth: 0, sharpness: 0 }

const PRESETS: { name: string; emoji: string; adj: Adjustments }[] = [
  { name: "Original", emoji: "🔄", adj: DEFAULT_ADJ },
  { name: "Bright", emoji: "☀️", adj: { brightness: 115, contrast: 105, saturation: 110, warmth: 5, sharpness: 10 } },
  { name: "Warm", emoji: "🌅", adj: { brightness: 105, contrast: 108, saturation: 115, warmth: 25, sharpness: 5 } },
  { name: "Clean", emoji: "✨", adj: { brightness: 108, contrast: 112, saturation: 95, warmth: -5, sharpness: 20 } },
  { name: "Luxury", emoji: "💎", adj: { brightness: 100, contrast: 120, saturation: 105, warmth: 10, sharpness: 15 } },
  { name: "Cool", emoji: "🌊", adj: { brightness: 105, contrast: 110, saturation: 105, warmth: -20, sharpness: 10 } },
]

function buildFilter(adj: Adjustments) {
  const sepia = adj.warmth > 0 ? adj.warmth * 0.012 : 0
  const hueRotate = adj.warmth < 0 ? adj.warmth * 0.5 : 0
  return `brightness(${adj.brightness}%) contrast(${adj.contrast}%) saturate(${adj.saturation}%) sepia(${sepia}) hue-rotate(${hueRotate}deg)`
}

interface PhotoEditorProps {
  url: string
  onSave: (newUrl: string) => void
  onClose: () => void
}

function PhotoEditor({ url, onSave, onClose }: PhotoEditorProps) {
  const [adj, setAdj]           = useState<Adjustments>(DEFAULT_ADJ)
  const [saving, setSaving]     = useState(false)
  const [aiPrompt, setAiPrompt] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [aiStatus, setAiStatus] = useState<"idle" | "ok" | "error">("idle")
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef    = useRef<HTMLImageElement | null>(null)

  async function applyAiPrompt() {
    if (!aiPrompt.trim()) return
    setAiLoading(true)
    setAiStatus("idle")
    try {
      const res = await fetch("/api/enhance-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt }),
      })
      const data = await res.json()
      if (data.adj) { setAdj(data.adj); setAiStatus("ok") }
      else setAiStatus("error")
    } catch {
      setAiStatus("error")
    } finally {
      setAiLoading(false)
    }
  }

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

      // Apply filters via canvas
      ctx.filter = buildFilter(adj)
      ctx.drawImage(img, 0, 0)

      // Sharpness via unsharp mask approximation
      if (adj.sharpness > 0) {
        const amount = adj.sharpness / 100
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const blurCanvas = document.createElement("canvas")
        blurCanvas.width = canvas.width
        blurCanvas.height = canvas.height
        const blurCtx = blurCanvas.getContext("2d")!
        blurCtx.filter = `blur(1px)`
        blurCtx.drawImage(canvas, 0, 0)
        const blurData = blurCtx.getImageData(0, 0, canvas.width, canvas.height)
        const d = imageData.data
        const b = blurData.data
        for (let i = 0; i < d.length; i += 4) {
          d[i] = Math.min(255, Math.max(0, d[i] + (d[i] - b[i]) * amount))
          d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + (d[i + 1] - b[i + 1]) * amount))
          d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + (d[i + 2] - b[i + 2]) * amount))
        }
        ctx.putImageData(imageData, 0, 0)
      }

      // Upload edited image
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", 0.92))
      if (!blob) { onSave(url); return }

      const fd = new FormData()
      fd.append("files", new File([blob], "edited.jpg", { type: "image/jpeg" }))
      const resp = await fetch("/api/upload", { method: "POST", body: fd })
      const data = await resp.json()
      if (data.urls?.[0]) onSave(data.urls[0])
      else onSave(url)
    } finally {
      setSaving(false)
    }
  }

  const sliders: { key: keyof Adjustments; label: string; min: number; max: number; step: number }[] = [
    { key: "brightness", label: "Brightness", min: 50, max: 150, step: 1 },
    { key: "contrast", label: "Contrast", min: 50, max: 175, step: 1 },
    { key: "saturation", label: "Saturation", min: 0, max: 200, step: 1 },
    { key: "warmth", label: "Warmth", min: -50, max: 50, step: 1 },
    { key: "sharpness", label: "Sharpness", min: 0, max: 100, step: 1 },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2"><Sliders className="w-4 h-4" /> Enhance Photo</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>

        {/* AI Prompt */}
        <div className="px-4 pt-4 pb-3 border-b border-slate-100 bg-gradient-to-r from-blue-50/60 to-violet-50/60">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="w-4 h-4 text-violet-600" />
            <span className="text-sm font-semibold text-slate-800">AI Enhance</span>
            <span className="text-[11px] text-slate-400 ml-1">— type what you want</span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={aiPrompt}
              onChange={e => { setAiPrompt(e.target.value); setAiStatus("idle") }}
              onKeyDown={e => e.key === "Enter" && applyAiPrompt()}
              placeholder='e.g. "make it brighter and cleaner" or "warm luxury look"'
              className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white"
            />
            <button
              type="button"
              onClick={applyAiPrompt}
              disabled={aiLoading || !aiPrompt.trim()}
              className="px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 disabled:opacity-40 transition flex items-center gap-1.5 shrink-0"
            >
              {aiLoading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Sparkles className="w-4 h-4" />}
              {aiLoading ? "Working…" : "Apply"}
            </button>
          </div>
          {aiStatus === "ok" && (
            <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">
              <Check className="w-3 h-3" /> Settings updated — fine-tune with the sliders below if needed
            </p>
          )}
          {aiStatus === "error" && (
            <p className="text-xs text-red-500 mt-1.5">Could not process that instruction. Try rephrasing.</p>
          )}
        </div>

        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Preview */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Preview</p>
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt="preview"
                className="w-full h-full object-cover"
                style={{ filter: buildFilter(adj) }}
              />
            </div>
            <canvas ref={canvasRef} className="hidden" />

            {/* Presets */}
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Presets</p>
            <div className="grid grid-cols-3 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.name}
                  onClick={() => setAdj(p.adj)}
                  className={cn(
                    "relative rounded-lg overflow-hidden border-2 transition-all",
                    JSON.stringify(adj) === JSON.stringify(p.adj) ? "border-blue-500" : "border-transparent hover:border-slate-300"
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={p.name} className="w-full aspect-square object-cover" style={{ filter: buildFilter(p.adj) }} />
                  <div className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[10px] font-medium py-0.5 text-center">
                    {p.emoji} {p.name}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Sliders */}
          <div className="space-y-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Manual Adjustments</p>
            {sliders.map(({ key, label, min, max, step }) => {
              const val = adj[key]
              const isDefault = val === DEFAULT_ADJ[key]
              return (
                <div key={key} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-700">{label}</label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 tabular-nums w-8 text-right">{val}</span>
                      {!isDefault && (
                        <button onClick={() => setAdj((a) => ({ ...a, [key]: DEFAULT_ADJ[key] }))} className="text-[10px] text-blue-500 hover:underline">reset</button>
                      )}
                    </div>
                  </div>
                  <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={val}
                    onChange={(e) => setAdj((a) => ({ ...a, [key]: Number(e.target.value) }))}
                    className="w-full accent-blue-500"
                  />
                </div>
              )
            })}

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

// ── Single sortable photo tile ─────────────────────────────────────────────
interface PhotoTileProps {
  url: string
  index: number
  originalSize?: number
  compressedSize?: number
  isDragging?: boolean
  onRemove: () => void
  onEdit: () => void
}

function SortableTile({ url, index, originalSize, compressedSize, isDragging, onRemove, onEdit }: PhotoTileProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSelfDragging } = useSortable({ id: url })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSelfDragging ? 0.35 : 1,
  }

  const saved = originalSize && compressedSize ? Math.round((1 - compressedSize / originalSize) * 100) : 0

  return (
    <div ref={setNodeRef} style={style} className="relative group aspect-square">
      <div className={cn(
        "relative w-full h-full rounded-xl overflow-hidden border-2 transition-all",
        index === 0 ? "border-blue-500" : "border-slate-200",
        isDragging ? "shadow-2xl scale-105" : ""
      )}>
        <Image src={url} alt={`Photo ${index + 1}`} fill className="object-cover" sizes="200px" />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all" />

        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="absolute top-2 left-2 w-6 h-6 bg-white/90 rounded-lg flex items-center justify-center cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
        >
          <GripVertical className="w-3.5 h-3.5 text-slate-600" />
        </div>

        {/* Edit button */}
        <button
          type="button"
          onClick={onEdit}
          className="absolute top-2 right-8 w-6 h-6 bg-white/90 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm text-slate-600 hover:text-blue-600"
          title="Enhance photo"
        >
          <Sliders className="w-3 h-3" />
        </button>

        {/* Remove button */}
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm text-white"
        >
          <X className="w-3 h-3" />
        </button>

        {index === 0 && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
            <Star className="w-2.5 h-2.5 fill-white" /> Cover
          </div>
        )}

        {saved > 0 && (
          <div className="absolute bottom-2 right-2 bg-green-600/90 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-md">
            -{saved}%
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main PhotoManager ──────────────────────────────────────────────────────
interface PhotoMeta {
  url: string
  originalSize: number
  compressedSize: number
}

interface PhotoManagerProps {
  photos: string[]
  onChange: (photos: string[]) => void
}

export function PhotoManager({ photos, onChange }: PhotoManagerProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [activeDragUrl, setActiveDragUrl] = useState<string | null>(null)
  const [meta, setMeta] = useState<Record<string, { originalSize: number; compressedSize: number }>>({})
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null)
  const [editingUrl, setEditingUrl] = useState<string | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const processAndUpload = useCallback(async (files: FileList | File[]) => {
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"))
    if (!imageFiles.length) return

    setUploading(true)
    setProgress({ current: 0, total: imageFiles.length })

    const newMeta: Record<string, { originalSize: number; compressedSize: number }> = {}

    try {
      const compressed = await Promise.all(
        imageFiles.map(async (file, i) => {
          const c = await compressImage(file)
          setProgress({ current: i + 1, total: imageFiles.length })
          return { original: file, compressed: c }
        })
      )

      const fd = new FormData()
      compressed.forEach(({ compressed: c }) => fd.append("files", c))

      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const data = await res.json()

      if (data.urls) {
        data.urls.forEach((url: string, i: number) => {
          newMeta[url] = {
            originalSize: compressed[i].original.size,
            compressedSize: compressed[i].compressed.size,
          }
        })
        setMeta((prev) => ({ ...prev, ...newMeta }))
        onChange([...photos, ...data.urls])
      }
    } finally {
      setUploading(false)
      setProgress(null)
    }
  }, [photos, onChange])

  function handleDragEnd(event: DragEndEvent) {
    setActiveDragUrl(null)
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = photos.indexOf(active.id as string)
    const newIndex = photos.indexOf(over.id as string)
    onChange(arrayMove(photos, oldIndex, newIndex))
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveDragUrl(event.active.id as string)
  }

  function handleEdited(oldUrl: string, newUrl: string) {
    onChange(photos.map((u) => (u === oldUrl ? newUrl : u)))
    setEditingUrl(null)
  }

  const totalOriginal = Object.values(meta).reduce((s, m) => s + m.originalSize, 0)
  const totalCompressed = Object.values(meta).reduce((s, m) => s + m.compressedSize, 0)
  const totalSaved = totalOriginal > 0 ? Math.round((1 - totalCompressed / totalOriginal) * 100) : 0

  return (
    <div className="space-y-4">
      {editingUrl && (
        <PhotoEditor
          url={editingUrl}
          onSave={(newUrl) => handleEdited(editingUrl, newUrl)}
          onClose={() => setEditingUrl(null)}
        />
      )}

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(false) }}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); processAndUpload(e.dataTransfer.files) }}
        onClick={() => document.getElementById("photo-file-input")?.click()}
        className={cn(
          "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all select-none",
          dragOver ? "border-blue-500 bg-blue-50 scale-[1.01]" : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
        )}
      >
        <input
          id="photo-file-input"
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files && processAndUpload(e.target.files)}
        />
        {uploading && progress ? (
          <div className="space-y-2">
            <Loader2 className="w-7 h-7 text-blue-500 mx-auto animate-spin" />
            <p className="text-sm font-semibold text-blue-600">
              Compressing & uploading {progress.current}/{progress.total}…
            </p>
            <div className="w-full bg-slate-100 rounded-full h-1.5 max-w-xs mx-auto">
              <div
                className="bg-blue-500 h-1.5 rounded-full transition-all"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
          </div>
        ) : (
          <>
            <Upload className="w-7 h-7 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-600">
              {photos.length > 0 ? "Add more photos" : "Drop photos here or click to upload"}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Auto-compressed · Hover photo to enhance ✨ · Add up to 10 for Instagram carousel
            </p>
          </>
        )}
      </div>

      {photos.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 font-medium">
              {photos.length} photo{photos.length !== 1 ? "s" : ""} · Drag to reorder · First is cover · Hover to enhance
            </p>
            {totalSaved > 0 && (
              <span className="text-xs font-semibold bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full">
                {formatBytes(totalOriginal - totalCompressed)} saved ({totalSaved}% smaller)
              </span>
            )}
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={photos} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {photos.map((url, i) => (
                  <SortableTile
                    key={url}
                    url={url}
                    index={i}
                    originalSize={meta[url]?.originalSize}
                    compressedSize={meta[url]?.compressedSize}
                    onRemove={() => onChange(photos.filter((_, idx) => idx !== i))}
                    onEdit={() => setEditingUrl(url)}
                  />
                ))}

                <div
                  onClick={() => document.getElementById("photo-file-input")?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-300 hover:bg-blue-50 flex flex-col items-center justify-center gap-1.5 text-slate-300 hover:text-blue-400 transition-all cursor-pointer"
                >
                  <ImageIcon className="w-5 h-5" />
                  <span className="text-[11px] font-medium">Add more</span>
                </div>
              </div>
            </SortableContext>

            <DragOverlay>
              {activeDragUrl && (
                <div className="w-24 h-24 rounded-xl overflow-hidden shadow-2xl rotate-2 border-2 border-blue-500">
                  <Image src={activeDragUrl} alt="dragging" fill className="object-cover" sizes="96px" />
                </div>
              )}
            </DragOverlay>
          </DndContext>
        </>
      )}
    </div>
  )
}
