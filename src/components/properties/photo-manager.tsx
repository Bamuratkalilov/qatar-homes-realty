"use client"

import { useCallback, useState } from "react"
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
import { Upload, X, GripVertical, Star, ImageIcon, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

// ── Client-side image compression ──────────────────────────────────────────
async function compressImage(file: File, maxPx = 1920, quality = 0.82): Promise<File> {
  return new Promise((resolve) => {
    const img = new window.Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      if (width <= maxPx && height <= maxPx) {
        // Already small enough — still re-encode to strip EXIF
        quality = 0.92
      }
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
          const compressed = new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" })
          resolve(compressed)
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

// ── Single sortable photo tile ──────────────────────────────────────────────
interface PhotoTileProps {
  url: string
  index: number
  originalSize?: number
  compressedSize?: number
  isDragging?: boolean
  onRemove: () => void
}

function SortableTile({ url, index, originalSize, compressedSize, isDragging, onRemove }: PhotoTileProps) {
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

        {/* Dark overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all" />

        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="absolute top-2 left-2 w-6 h-6 bg-white/90 rounded-lg flex items-center justify-center cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
        >
          <GripVertical className="w-3.5 h-3.5 text-slate-600" />
        </div>

        {/* Remove button */}
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm text-white"
        >
          <X className="w-3 h-3" />
        </button>

        {/* Cover badge */}
        {index === 0 && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
            <Star className="w-2.5 h-2.5 fill-white" /> Cover
          </div>
        )}

        {/* Compression badge */}
        {saved > 0 && (
          <div className="absolute bottom-2 right-2 bg-green-600/90 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-md">
            -{saved}%
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main PhotoManager ───────────────────────────────────────────────────────
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

  const totalOriginal = Object.values(meta).reduce((s, m) => s + m.originalSize, 0)
  const totalCompressed = Object.values(meta).reduce((s, m) => s + m.compressedSize, 0)
  const totalSaved = totalOriginal > 0 ? Math.round((1 - totalCompressed / totalOriginal) * 100) : 0

  return (
    <div className="space-y-4">
      {/* Drop zone — only show when no photos, or always show as secondary */}
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
              Auto-compressed before upload · JPG, PNG, WEBP · Multiple at once
            </p>
          </>
        )}
      </div>

      {/* Photo grid with drag-to-reorder */}
      {photos.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 font-medium">
              {photos.length} photo{photos.length !== 1 ? "s" : ""} · Drag to reorder · First is cover
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
                  />
                ))}

                {/* Add more tile */}
                <div
                  onClick={() => document.getElementById("photo-file-input")?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-300 hover:bg-blue-50 flex flex-col items-center justify-center gap-1.5 text-slate-300 hover:text-blue-400 transition-all cursor-pointer"
                >
                  <ImageIcon className="w-5 h-5" />
                  <span className="text-[11px] font-medium">Add more</span>
                </div>
              </div>
            </SortableContext>

            {/* Floating drag preview */}
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
