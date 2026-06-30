"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronLeft, ChevronRight, Camera, ArrowLeft, ZoomIn, ZoomOut } from "lucide-react"

interface PhotoGalleryProps {
  photos: string[]
  title: string
}

// ── Page layout helpers ────────────────────────────────────────────────────

interface GalleryPage {
  layout: "hero5" | "grid6" | "grid4half" | "hero3" | "half2" | "half1"
  photos: string[]
  startIdx: number
}

function pickLayout(rem: number): GalleryPage["layout"] {
  if (rem >= 6) return "grid6"
  if (rem === 5) return "hero5"
  if (rem === 4) return "grid4half"
  if (rem === 3) return "hero3"
  if (rem === 2) return "half2"
  return "half1"
}

const LAYOUT_SIZE: Record<GalleryPage["layout"], number> = {
  hero5: 5, grid6: 6, grid4half: 4, hero3: 3, half2: 2, half1: 1,
}

function buildPages(photos: string[]): GalleryPage[] {
  const n = photos.length
  if (n === 0) return []
  const pages: GalleryPage[] = []
  let off = 0
  if (n >= 5) {
    pages.push({ layout: "hero5", photos: photos.slice(0, 5), startIdx: 0 })
    off = 5
  } else {
    pages.push({ layout: pickLayout(n), photos: photos.slice(0, n), startIdx: 0 })
    return pages
  }
  while (off < n) {
    const layout = pickLayout(n - off)
    const take = LAYOUT_SIZE[layout]
    pages.push({ layout, photos: photos.slice(off, off + take), startIdx: off })
    off += take
  }
  return pages
}

function groupPhotos(photos: string[]) {
  const groups: Array<{ hero: string; heroIdx: number; pair: Array<{ url: string; idx: number }> }> = []
  for (let i = 0; i < photos.length; i += 3) {
    const pair: Array<{ url: string; idx: number }> = []
    if (i + 1 < photos.length) pair.push({ url: photos[i + 1], idx: i + 1 })
    if (i + 2 < photos.length) pair.push({ url: photos[i + 2], idx: i + 2 })
    groups.push({ hero: photos[i], heroIdx: i, pair })
  }
  return groups
}

// ── Slide (hero paged view) ────────────────────────────────────────────────

const IMG = "w-full h-full object-cover"
const GAP = 2

function Slide({ page, onClick }: { page: GalleryPage; onClick: (absIdx: number) => void }) {
  const { layout, photos, startIdx } = page

  function cell(url: string, localIdx: number) {
    return (
      <div key={localIdx} className="overflow-hidden cursor-pointer" onClick={() => onClick(startIdx + localIdx)}>
        <img src={url} alt="" className={`${IMG} hover:scale-[1.04] transition-transform duration-300`} />
      </div>
    )
  }

  if (layout === "hero5") return (
    <div className="flex w-full h-full" style={{ gap: GAP }}>
      <div className="overflow-hidden cursor-pointer" style={{ flex: "11 11 0%" }} onClick={() => onClick(startIdx)}>
        <img src={photos[0]} alt="" className={`${IMG} hover:scale-[1.02] transition-transform duration-300`} />
      </div>
      <div style={{ flex: "9 9 0%", display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: GAP }}>
        {photos.slice(1).map((url, i) => cell(url, i + 1))}
      </div>
    </div>
  )

  if (layout === "grid6") return (
    <div className="w-full h-full" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gridTemplateRows: "1fr 1fr", gap: GAP }}>
      {photos.map((url, i) => cell(url, i))}
    </div>
  )

  if (layout === "grid4half") return (
    <div className="flex w-full h-full" style={{ gap: GAP }}>
      <div style={{ flex: "11 11 0%" }} className="bg-slate-900" />
      <div style={{ flex: "9 9 0%", display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: GAP }}>
        {photos.map((url, i) => cell(url, i))}
      </div>
    </div>
  )

  if (layout === "hero3") return (
    <div className="flex w-full h-full" style={{ gap: GAP }}>
      <div className="overflow-hidden cursor-pointer" style={{ flex: "11 11 0%" }} onClick={() => onClick(startIdx)}>
        <img src={photos[0]} alt="" className={`${IMG} hover:scale-[1.02] transition-transform duration-300`} />
      </div>
      <div style={{ flex: "9 9 0%", display: "grid", gridTemplateColumns: "1fr", gridTemplateRows: "1fr 1fr", gap: GAP }}>
        {photos.slice(1).map((url, i) => cell(url, i + 1))}
      </div>
    </div>
  )

  if (layout === "half2") return (
    <div className="w-full h-full" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: GAP }}>
      {photos.map((url, i) => cell(url, i))}
    </div>
  )

  return (
    <div className="flex w-full h-full" style={{ gap: GAP }}>
      <div className="overflow-hidden cursor-pointer" style={{ flex: "11 11 0%" }} onClick={() => onClick(startIdx)}>
        <img src={photos[0]} alt="" className={`${IMG} hover:scale-[1.02] transition-transform duration-300`} />
      </div>
      <div style={{ flex: "9 9 0%" }} className="bg-slate-900" />
    </div>
  )
}

// ── Single photo viewer (view 3) ───────────────────────────────────────────

function SingleViewer({
  photos,
  initialIdx,
  title,
  onClose,
}: {
  photos: string[]
  initialIdx: number
  title: string
  onClose: () => void
}) {
  const [idx, setIdx]         = useState(initialIdx)
  const [zoom, setZoom]       = useState(1)
  const [pan, setPan]         = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef({ active: false, startX: 0, startY: 0, panX: 0, panY: 0 })
  const wasDrag = useRef(false)

  // Reset zoom/pan when photo changes
  useEffect(() => { setZoom(1); setPan({ x: 0, y: 0 }) }, [idx])

  // Keyboard nav
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape")                  onClose()
      if (e.key === "ArrowLeft")               setIdx(i => Math.max(0, i - 1))
      if (e.key === "ArrowRight")              setIdx(i => Math.min(photos.length - 1, i + 1))
      if (e.key === "+" || e.key === "=")      setZoom(z => Math.min(4, +(z + 0.5).toFixed(1)))
      if (e.key === "-")                       setZoom(z => Math.max(1, +(z - 0.5).toFixed(1)))
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [photos.length, onClose])

  function handleClick() {
    if (wasDrag.current) { wasDrag.current = false; return }
    setZoom(z => { if (z > 1) { setPan({ x: 0, y: 0 }); return 1 } return 2 })
  }

  function onMouseDown(e: React.MouseEvent) {
    if (zoom <= 1) return
    e.preventDefault()
    wasDrag.current = false
    dragRef.current = { active: true, startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y }

    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current.active) return
      const dx = ev.clientX - dragRef.current.startX
      const dy = ev.clientY - dragRef.current.startY
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) { wasDrag.current = true; setIsDragging(true) }
      setPan({ x: dragRef.current.panX + dx / zoom, y: dragRef.current.panY + dy / zoom })
    }
    const onUp = () => {
      dragRef.current.active = false
      setIsDragging(false)
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
  }

  function onWheel(e: React.WheelEvent) {
    e.preventDefault()
    setZoom(z => Math.max(1, Math.min(4, +(z - e.deltaY * 0.003).toFixed(2))))
  }

  const cursor = zoom > 1 ? (isDragging ? "grabbing" : "grab") : "zoom-in"

  return (
    <div className="fixed inset-0 z-[60] bg-white flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-4 flex-shrink-0 border-b border-slate-200">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-slate-700 hover:text-slate-900 transition font-medium text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> All photos
        </button>
        <span className="text-slate-400 text-sm">{idx + 1} / {photos.length}</span>
      </div>

      {/* Photo */}
      <div
        className="flex-1 relative overflow-hidden flex items-center justify-center bg-slate-50"
        onWheel={onWheel}
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center center",
            transition: isDragging ? "none" : "transform 0.2s ease",
            cursor,
            userSelect: "none",
          }}
          onMouseDown={onMouseDown}
          onClick={handleClick}
        >
          <img
            src={photos[idx]}
            alt={idx === 0 ? title : `Photo ${idx + 1}`}
            style={{ display: "block", maxWidth: "calc(100vw - 120px)", maxHeight: "calc(100vh - 160px)", objectFit: "contain" }}
            draggable={false}
          />
        </div>

        {idx > 0 && (
          <button
            onClick={() => setIdx(i => i - 1)}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-slate-50 transition z-10"
          >
            <ChevronLeft className="w-5 h-5 text-slate-700" />
          </button>
        )}
        {idx < photos.length - 1 && (
          <button
            onClick={() => setIdx(i => i + 1)}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-slate-50 transition z-10"
          >
            <ChevronRight className="w-5 h-5 text-slate-700" />
          </button>
        )}
      </div>

      {/* Zoom bar */}
      <div className="flex-shrink-0 flex items-center justify-center gap-3 py-3 border-t border-slate-200 bg-white">
        <button
          onClick={() => setZoom(z => Math.max(1, +(z - 0.5).toFixed(1)))}
          disabled={zoom <= 1}
          className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }) }}
          className="text-sm font-medium text-slate-500 hover:text-slate-800 transition w-14 text-center"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          onClick={() => setZoom(z => Math.min(4, +(z + 0.5).toFixed(1)))}
          disabled={zoom >= 4}
          className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ── Main gallery component ─────────────────────────────────────────────────

export function PhotoGallery({ photos, title }: PhotoGalleryProps) {
  const [view, setView]           = useState<"hero" | "grid" | "single">("hero")
  const [openAtIdx, setOpenAtIdx] = useState(0)
  const [activePage, setActivePage] = useState(0)
  const scrollRef   = useRef<HTMLDivElement>(null)
  const groupRefs   = useRef<Array<HTMLDivElement | null>>([])

  const pages  = buildPages(photos)
  const groups = groupPhotos(photos)

  // Escape closes grid
  useEffect(() => {
    if (view !== "grid") return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setView("hero") }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [view])

  // Lock body scroll for grid and single
  useEffect(() => {
    document.body.style.overflow = view !== "hero" ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [view])

  // Scroll grid to clicked photo's group on open
  useEffect(() => {
    if (view !== "grid") return
    const gi = Math.floor(openAtIdx / 3)
    const t = setTimeout(() => {
      groupRefs.current[gi]?.scrollIntoView({ block: "start", behavior: "auto" })
    }, 30)
    return () => clearTimeout(t)
  }, [view, openAtIdx])

  function openGrid(idx: number) {
    setOpenAtIdx(idx)
    setView("grid")
  }

  function openSingle(idx: number) {
    setOpenAtIdx(idx)
    setView("single")
  }

  function goToPage(idx: number) {
    const el = scrollRef.current
    if (!el || idx < 0 || idx >= pages.length) return
    el.scrollTo({ left: idx * el.clientWidth, behavior: "smooth" })
    setActivePage(idx)
  }

  function onScroll() {
    const el = scrollRef.current
    if (!el) return
    setActivePage(Math.round(el.scrollLeft / el.clientWidth))
  }

  if (!photos.length || !pages.length) return null

  // ── VIEW 3: Single photo with zoom ────────────────────────────────────────
  if (view === "single") return (
    <SingleViewer
      photos={photos}
      initialIdx={openAtIdx}
      title={title}
      onClose={() => setView("grid")}
    />
  )

  // ── VIEW 2: Scrollable photo grid ─────────────────────────────────────────
  if (view === "grid") return (
    <div className="fixed inset-0 z-50 bg-slate-100 flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 flex-shrink-0 bg-white border-b border-slate-200">
        <button
          onClick={() => setView("hero")}
          className="flex items-center gap-2 text-slate-700 hover:text-slate-900 transition font-medium text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <span className="text-slate-400 text-sm">{photos.length} photos</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-2 max-w-4xl mx-auto py-2 px-2 sm:px-4">
          {groups.map((group, gi) => (
            <div key={gi} ref={el => { groupRefs.current[gi] = el }}>
              {/* Hero photo */}
              <div
                className="w-full overflow-hidden cursor-pointer"
                style={{ height: 440 }}
                onClick={() => openSingle(group.heroIdx)}
              >
                <img
                  src={group.hero}
                  alt={group.heroIdx === 0 ? title : ""}
                  className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-300"
                />
              </div>

              {/* Pair row */}
              {group.pair.length > 0 && (
                <div className="flex gap-2 mt-2" style={{ height: 240 }}>
                  {group.pair.map(p => (
                    <div
                      key={p.idx}
                      className="flex-1 overflow-hidden cursor-pointer"
                      onClick={() => openSingle(p.idx)}
                    >
                      <img
                        src={p.url}
                        alt=""
                        className="w-full h-full object-cover hover:scale-[1.04] transition-transform duration-300"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div className="h-4" />
        </div>
      </div>
    </div>
  )

  // ── VIEW 1: Hero paged grid ───────────────────────────────────────────────
  return (
    <div className="relative mx-4 mt-4 rounded-xl overflow-hidden" style={{ height: 397 }}>
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex h-full overflow-x-auto overflow-y-hidden scrollbar-hide"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {pages.map((page, i) => (
          <div key={i} className="flex-shrink-0 w-full h-full" style={{ scrollSnapAlign: "start" }}>
            <Slide page={page} onClick={openGrid} />
          </div>
        ))}
      </div>

      {activePage > 0 && (
        <button
          onClick={() => goToPage(activePage - 1)}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center hover:bg-white transition z-10"
        >
          <ChevronLeft className="w-5 h-5 text-slate-800" />
        </button>
      )}
      {activePage < pages.length - 1 && (
        <button
          onClick={() => goToPage(activePage + 1)}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center hover:bg-white transition z-10"
        >
          <ChevronRight className="w-5 h-5 text-slate-800" />
        </button>
      )}

      <button
        onClick={() => openGrid(pages[activePage]?.startIdx ?? 0)}
        className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-full text-sm font-semibold text-slate-800 shadow hover:bg-white transition z-10"
      >
        <Camera className="w-4 h-4" />
        {photos.length} photos
      </button>
    </div>
  )
}
