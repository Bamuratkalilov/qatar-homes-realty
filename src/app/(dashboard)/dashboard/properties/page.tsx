"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatPrice, formatArea, PROPERTY_TYPES, cn } from "@/lib/utils"
import {
  Plus, Eye, Edit, Bed, Bath, Maximize, MapPin, Search,
  LayoutGrid, List, SlidersHorizontal, X, ChevronDown,
  Loader2, PenLine, ArrowUpDown,
} from "lucide-react"

// ── Types ────────────────────────────────────────────────────────────────────
interface Property {
  id: string; title: string; category: string; type: string; listingType: string
  status: string; price: number; area: number; bedrooms: number | null; bathrooms: number | null
  address: string; district: string | null; city: string; photos: string[]
  furnishing: string | null; utilityBillsIncluded: boolean; featured: boolean
  referenceNumber: string | null; availabilityType: string; createdAt: string
}

// ── Constants ────────────────────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { value: "AVAILABLE", label: "Available" },
  { value: "RESERVED", label: "Reserved" },
  { value: "RENTED", label: "Rented" },
  { value: "SOLD", label: "Sold" },
  { value: "OFF_MARKET", label: "Draft" },
]

const FURNISHING_OPTIONS = [
  { value: "FURNISHED", label: "Furnished" },
  { value: "SEMI_FURNISHED", label: "Semi-Furnished" },
  { value: "UNFURNISHED", label: "Unfurnished" },
]

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "price_high", label: "Highest price" },
  { value: "price_low", label: "Lowest price" },
]

const STATUS_BADGE: Record<string, "success" | "warning" | "secondary" | "destructive"> = {
  AVAILABLE: "success", RESERVED: "warning", RENTED: "secondary", SOLD: "secondary", OFF_MARKET: "destructive",
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function Chip({ label, active, onClick, onClear }: { label: string; active: boolean; onClick: () => void; onClear?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
        active
          ? "bg-blue-600 text-white border-blue-600"
          : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600"
      )}
    >
      {label}
      {active && onClear && (
        <X className="w-3 h-3" onClick={(e) => { e.stopPropagation(); onClear() }} />
      )}
    </button>
  )
}

function FilterSelect({ label, value, options, onChange }: {
  label: string; value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "appearance-none pl-3 pr-8 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer",
          value
            ? "bg-blue-600 text-white border-blue-600"
            : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
        )}
      >
        <option value="">{label}</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown className={cn("absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none", value ? "text-white" : "text-slate-400")} />
    </div>
  )
}

// ── Property Card (Grid) ─────────────────────────────────────────────────────
function PropertyCard({ p }: { p: Property }) {
  const isDraft = p.status === "OFF_MARKET"
  return (
    <div className={cn(
      "bg-white rounded-2xl border overflow-hidden hover:shadow-lg transition-all group",
      isDraft ? "border-amber-200" : "border-slate-200"
    )}>
      {/* Photo */}
      <div className="relative aspect-[16/9] bg-slate-100 overflow-hidden">
        {p.photos[0] ? (
          <img src={p.photos[0]} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <PenLine className="w-8 h-8" />
          </div>
        )}
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
          <span className={cn("text-[11px] font-bold px-2 py-0.5 rounded-full", p.listingType === "RENT" ? "bg-blue-600 text-white" : "bg-emerald-600 text-white")}>
            {p.listingType === "RENT" ? "Rent" : "Sale"}
          </span>
          {p.featured && <span className="text-[11px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full">⭐ Featured</span>}
        </div>
        <div className="absolute top-3 right-3">
          <Badge variant={STATUS_BADGE[p.status] || "secondary"} className="text-[10px]">
            {p.status === "OFF_MARKET" ? "Draft" : p.status.replace("_", " ")}
          </Badge>
        </div>
        {p.photos.length > 1 && (
          <span className="absolute bottom-2 right-2 text-[10px] font-semibold bg-black/60 text-white px-1.5 py-0.5 rounded-full">
            +{p.photos.length - 1}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-2.5">
        {p.referenceNumber && <p className="text-[10px] text-slate-400 font-mono">{p.referenceNumber}</p>}
        <p className="font-semibold text-slate-900 text-sm line-clamp-2 leading-snug">{p.title}</p>
        <p className="text-lg font-bold text-blue-600">
          {p.price > 0 ? formatPrice(p.price) : <span className="text-slate-300 text-sm">Price not set</span>}
          {p.price > 0 && p.listingType === "RENT" && <span className="text-xs text-slate-400 font-normal"> /yr</span>}
        </p>

        <div className="flex items-center gap-3 text-xs text-slate-500">
          {p.bedrooms != null && <span className="flex items-center gap-1"><Bed className="w-3 h-3" />{p.bedrooms}BR</span>}
          {p.bathrooms != null && <span className="flex items-center gap-1"><Bath className="w-3 h-3" />{p.bathrooms}BA</span>}
          {p.area > 0 && <span className="flex items-center gap-1"><Maximize className="w-3 h-3" />{formatArea(p.area)}</span>}
          {p.furnishing && <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{p.furnishing === "SEMI_FURNISHED" ? "Semi" : p.furnishing.charAt(0) + p.furnishing.slice(1).toLowerCase()}</span>}
        </div>

        {(p.district || p.address) && (
          <div className="flex items-center gap-1 text-xs text-slate-400 truncate">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{p.district || p.address}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
          <span className="text-[10px] text-slate-400">
            {PROPERTY_TYPES.find((t) => t.value === p.type)?.label || p.type}
            {p.utilityBillsIncluded && " · Bills incl."}
          </span>
          <div className="flex gap-1">
            {!isDraft && (
              <Link href={`/listings/${p.id}`} target="_blank">
                <Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="w-3.5 h-3.5" /></Button>
              </Link>
            )}
            <Link href={`/dashboard/properties/${p.id}/edit`}>
              <Button variant="ghost" size="icon" className="h-7 w-7"><Edit className="w-3.5 h-3.5" /></Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Property Row (List) ──────────────────────────────────────────────────────
function PropertyRow({ p }: { p: Property }) {
  const isDraft = p.status === "OFF_MARKET"
  return (
    <div className={cn(
      "bg-white border rounded-xl px-4 py-3 flex items-center gap-4 hover:shadow-sm transition-all",
      isDraft ? "border-amber-200 bg-amber-50/30" : "border-slate-200"
    )}>
      {/* Thumb */}
      <div className="w-16 h-12 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
        {p.photos[0]
          ? <img src={p.photos[0]} alt="" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-slate-300"><PenLine className="w-4 h-4" /></div>
        }
      </div>

      {/* Title + ref */}
      <div className="w-48 flex-shrink-0 min-w-0">
        <p className="text-sm font-semibold text-slate-900 truncate">{p.title}</p>
        {p.referenceNumber && <p className="text-[10px] text-slate-400 font-mono">{p.referenceNumber}</p>}
      </div>

      {/* Location */}
      <div className="flex-1 min-w-0 hidden md:flex items-center gap-1 text-xs text-slate-500">
        <MapPin className="w-3 h-3 flex-shrink-0 text-slate-400" />
        <span className="truncate">{p.district || p.address || p.city}</span>
      </div>

      {/* Specs */}
      <div className="flex items-center gap-3 text-xs text-slate-500 flex-shrink-0">
        {p.bedrooms != null && <span className="flex items-center gap-1"><Bed className="w-3 h-3" />{p.bedrooms}</span>}
        {p.bathrooms != null && <span className="flex items-center gap-1"><Bath className="w-3 h-3" />{p.bathrooms}</span>}
        {p.area > 0 && <span className="flex items-center gap-1"><Maximize className="w-3 h-3" />{formatArea(p.area)}</span>}
      </div>

      {/* Price */}
      <div className="w-32 text-right flex-shrink-0">
        <p className="font-bold text-blue-600 text-sm">
          {p.price > 0 ? formatPrice(p.price) : <span className="text-slate-300 text-xs">—</span>}
        </p>
        {p.price > 0 && p.listingType === "RENT" && <p className="text-[10px] text-slate-400">/year</p>}
      </div>

      {/* Status */}
      <div className="flex-shrink-0">
        <Badge variant={STATUS_BADGE[p.status] || "secondary"} className="text-[10px]">
          {p.status === "OFF_MARKET" ? "Draft" : p.status.replace("_", " ")}
        </Badge>
      </div>

      {/* Actions */}
      <div className="flex gap-1 flex-shrink-0">
        {!isDraft && (
          <Link href={`/listings/${p.id}`} target="_blank">
            <Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="w-3.5 h-3.5" /></Button>
          </Link>
        )}
        <Link href={`/dashboard/properties/${p.id}/edit`}>
          <Button variant="ghost" size="icon" className="h-7 w-7"><Edit className="w-3.5 h-3.5" /></Button>
        </Link>
      </div>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function PropertiesPage() {
  const router = useRouter()
  const [properties, setProperties] = useState<Property[]>([])
  const [pageLoading, setPageLoading] = useState(true)
  const [view, setView] = useState<"grid" | "list">("grid")
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState("newest")
  const [showFilters, setShowFilters] = useState(false)
  const [showDrafts, setShowDrafts] = useState(true)
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 12

  const [filters, setFilters] = useState({
    listingType: "", category: "", type: "", status: "",
    furnishing: "", utilities: false, priceMin: "", priceMax: "",
  })

  useEffect(() => {
    fetch("/api/properties")
      .then((r) => r.json())
      .then(({ properties: p }) => { setProperties(p || []); setPageLoading(false) })
      .catch(() => setPageLoading(false))
  }, [])

  function setFilter<K extends keyof typeof filters>(key: K, value: typeof filters[K]) {
    setFilters((f) => ({ ...f, [key]: value }))
    setPage(1)
  }

  function clearFilters() {
    setFilters({ listingType: "", category: "", type: "", status: "", furnishing: "", utilities: false, priceMin: "", priceMax: "" })
    setSearch("")
    setPage(1)
  }

  const activeFilterCount = Object.entries(filters).filter(([, v]) => v !== "" && v !== false).length

  const filtered = useMemo(() => {
    let r = [...properties]

    if (search.trim()) {
      const q = search.toLowerCase()
      r = r.filter((p) =>
        p.title.toLowerCase().includes(q) ||
        (p.address || "").toLowerCase().includes(q) ||
        (p.district || "").toLowerCase().includes(q) ||
        (p.referenceNumber || "").toLowerCase().includes(q)
      )
    }

    if (filters.listingType) r = r.filter((p) => p.listingType === filters.listingType)
    if (filters.category) r = r.filter((p) => p.category === filters.category)
    if (filters.type) r = r.filter((p) => p.type === filters.type)
    if (filters.status) r = r.filter((p) => p.status === filters.status)
    if (filters.furnishing) r = r.filter((p) => p.furnishing === filters.furnishing)
    if (filters.utilities) r = r.filter((p) => p.utilityBillsIncluded)
    if (filters.priceMin) r = r.filter((p) => p.price >= parseFloat(filters.priceMin))
    if (filters.priceMax) r = r.filter((p) => p.price <= parseFloat(filters.priceMax))

    switch (sort) {
      case "newest": r.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break
      case "oldest": r.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()); break
      case "price_high": r.sort((a, b) => b.price - a.price); break
      case "price_low": r.sort((a, b) => a.price - b.price); break
    }

    return r
  }, [properties, search, filters, sort])

  const allDrafts = filtered.filter((p) => p.status === "OFF_MARKET")
  const allPublished = filtered.filter((p) => p.status !== "OFF_MARKET")

  // Paginate only the visible set (exclude hidden drafts from count)
  const visibleItems = showDrafts ? filtered : allPublished
  const totalPages = Math.max(1, Math.ceil(visibleItems.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageItems = visibleItems.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const drafts = pageItems.filter((p) => p.status === "OFF_MARKET")
  const published = pageItems.filter((p) => p.status !== "OFF_MARKET")
  const hasAnyFilter = !!search.trim() || activeFilterCount > 0

  return (
    <div>
      <Header
        title="Properties"
        description={`${properties.filter(p => p.status !== "OFF_MARKET").length} published · ${properties.filter(p => p.status === "OFF_MARKET").length} drafts`}
        actions={
          <Link href="/dashboard/properties/new">
            <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> Add Property</Button>
          </Link>
        }
      />

      <div className="p-6 space-y-4">

        {/* ── Search + Controls ── */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search by title, location, reference number…"
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filters toggle */}
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all",
              showFilters || activeFilterCount > 0
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-white text-blue-600 text-xs font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Sort */}
          <div className="relative">
            <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="appearance-none pl-8 pr-8 py-2.5 text-sm border border-slate-200 rounded-xl bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* View toggle */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 gap-0.5">
            <button
              onClick={() => setView("grid")}
              className={cn("p-1.5 rounded-lg transition-all", view === "grid" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-700")}
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView("list")}
              className={cn("p-1.5 rounded-lg transition-all", view === "list" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-700")}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Drafts toggle — at the end */}
          {properties.some((p) => p.status === "OFF_MARKET") && (
            <button
              onClick={() => setShowDrafts((v) => !v)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:border-slate-300 transition-all flex-shrink-0"
            >
              <div className={cn("w-8 h-4 rounded-full transition-colors relative flex-shrink-0", showDrafts ? "bg-amber-400" : "bg-slate-200")}>
                <div className={cn("absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all", showDrafts ? "left-[18px]" : "left-0.5")} />
              </div>
              Drafts
            </button>
          )}
        </div>

        {/* ── Filter Panel ── */}
        {showFilters && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
            {/* Row 1: listing type + category + type */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide w-24">Category</span>
              <Chip label="Residential" active={filters.category === "RESIDENTIAL"} onClick={() => setFilter("category", filters.category === "RESIDENTIAL" ? "" : "RESIDENTIAL")} onClear={() => setFilter("category", "")} />
              <Chip label="Commercial" active={filters.category === "COMMERCIAL"} onClick={() => setFilter("category", filters.category === "COMMERCIAL" ? "" : "COMMERCIAL")} onClear={() => setFilter("category", "")} />
              <div className="h-4 w-px bg-slate-200 mx-1" />
              <Chip label="For Rent" active={filters.listingType === "RENT"} onClick={() => setFilter("listingType", filters.listingType === "RENT" ? "" : "RENT")} onClear={() => setFilter("listingType", "")} />
              <Chip label="For Sale" active={filters.listingType === "SALE"} onClick={() => setFilter("listingType", filters.listingType === "SALE" ? "" : "SALE")} onClear={() => setFilter("listingType", "")} />
            </div>

            {/* Row 2: property type + status + furnishing */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide w-24">Type & Status</span>
              <FilterSelect label="Property Type" value={filters.type} options={PROPERTY_TYPES} onChange={(v) => setFilter("type", v)} />
              <FilterSelect label="Status" value={filters.status} options={STATUS_OPTIONS} onChange={(v) => setFilter("status", v)} />
              <FilterSelect label="Furnishing" value={filters.furnishing} options={FURNISHING_OPTIONS} onChange={(v) => setFilter("furnishing", v)} />
            </div>

            {/* Row 3: price range + utilities */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide w-24">Price (QAR)</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={filters.priceMin}
                  onChange={(e) => setFilter("priceMin", e.target.value)}
                  placeholder="Min"
                  className="w-28 px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-slate-400 text-xs">—</span>
                <input
                  type="number"
                  value={filters.priceMax}
                  onChange={(e) => setFilter("priceMax", e.target.value)}
                  placeholder="Max"
                  className="w-28 px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="h-4 w-px bg-slate-200 mx-1" />
              <button
                onClick={() => setFilter("utilities", !filters.utilities)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                  filters.utilities ? "bg-green-600 text-white border-green-600" : "bg-white text-slate-600 border-slate-200 hover:border-green-400"
                )}
              >
                <span className={cn("w-3.5 h-3.5 rounded border flex items-center justify-center transition-all", filters.utilities ? "bg-white border-white" : "border-slate-300")}>
                  {filters.utilities && <span className="text-green-600 font-black text-[9px]">✓</span>}
                </span>
                Utilities included
              </button>
            </div>

            {/* Clear */}
            {activeFilterCount > 0 && (
              <div className="pt-1 border-t border-slate-100">
                <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1">
                  <X className="w-3 h-3" /> Clear all filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Results ── */}
        {pageLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : properties.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Plus className="w-7 h-7 text-blue-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">No properties yet</h3>
            <p className="text-slate-500 text-sm mb-5">Add your first property listing to get started</p>
            <Link href="/dashboard/properties/new"><Button>Add First Property</Button></Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <Search className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="font-semibold text-slate-700 mb-1">No properties match your filters</p>
            <p className="text-sm text-slate-400 mb-4">Try adjusting your search or filters</p>
            <button onClick={clearFilters} className="text-sm text-blue-600 font-semibold hover:underline">Clear all filters</button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Results count */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">
                {filtered.length === properties.length
                  ? `${properties.length} properties`
                  : `${filtered.length} of ${properties.length} properties`}
              </p>
              {hasAnyFilter && (
                <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1">
                  <X className="w-3 h-3" /> Clear filters
                </button>
              )}
            </div>

            {/* Drafts */}
            {drafts.length > 0 && showDrafts && (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Drafts — hidden from website ({drafts.length})</p>
                {view === "grid" ? (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {drafts.map((p) => <PropertyCard key={p.id} p={p} />)}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {drafts.map((p) => <PropertyRow key={p.id} p={p} />)}
                  </div>
                )}
              </div>
            )}

            {/* Published */}
            {published.length > 0 && (
              <div className="space-y-3">
                {drafts.length > 0 && <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Published listings ({allPublished.length})</p>}
                {view === "grid" ? (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {published.map((p) => <PropertyCard key={p.id} p={p} />)}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {published.map((p) => <PropertyRow key={p.id} p={p} />)}
                  </div>
                )}
              </div>
            )}

            {/* ── Pagination ── */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1 pt-4 border-t border-slate-100">
                {/* Prev */}
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  ← Prev
                </button>

                {/* Page numbers — max 6 visible */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((n) => {
                    if (totalPages <= 6) return true
                    if (n === 1 || n === totalPages) return true
                    return Math.abs(n - safePage) <= 2
                  })
                  .reduce<(number | "…")[]>((acc, n, i, arr) => {
                    if (i > 0 && (n as number) - (arr[i - 1] as number) > 1) acc.push("…")
                    acc.push(n)
                    return acc
                  }, [])
                  .map((n, i) =>
                    n === "…" ? (
                      <span key={`ellipsis-${i}`} className="px-2 py-2 text-sm text-slate-400">…</span>
                    ) : (
                      <button
                        key={n}
                        onClick={() => setPage(n as number)}
                        className={cn(
                          "w-9 h-9 rounded-lg text-sm font-semibold transition-all",
                          safePage === n
                            ? "bg-blue-600 text-white shadow-sm"
                            : "text-slate-600 hover:bg-slate-100"
                        )}
                      >
                        {n}
                      </button>
                    )
                  )}

                {/* Next */}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
