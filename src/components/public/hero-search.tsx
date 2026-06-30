"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"

const TABS = [
  { key: "RENT",       label: "Rent"       },
  { key: "SALE",       label: "Buy"        },
  { key: "COMMERCIAL", label: "Commercial" },
] as const

const POPULAR = ["The Pearl", "Lusail", "West Bay", "Al Waab", "Msheireb"]

export function HeroSearch() {
  const router = useRouter()
  const [tab, setTab]           = useState<"RENT" | "SALE" | "COMMERCIAL">("RENT")
  const [location, setLocation] = useState("")
  const [beds, setBeds]         = useState("")

  function search(loc = location) {
    const p = new URLSearchParams()
    if (tab === "COMMERCIAL") {
      p.set("listingType", "SALE")
      p.set("type", "OFFICE")
    } else {
      p.set("listingType", tab)
    }
    if (loc.trim()) p.set("q", loc.trim())
    if (beds)       p.set("bedrooms", beds)
    router.push(`/listings?${p.toString()}`)
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Tabs */}
      <div className="flex gap-1 mb-0">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "px-6 py-2.5 text-sm font-semibold rounded-t-xl transition-all",
              tab === t.key
                ? "bg-white text-blue-600 shadow-sm"
                : "bg-white/20 text-white/80 hover:bg-white/30"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search card */}
      <div className="bg-white rounded-b-2xl rounded-tr-2xl shadow-2xl p-2.5 flex flex-col sm:flex-row gap-2">
        <div className="flex items-center gap-3 flex-1 px-4 py-2.5 border border-slate-200 rounded-xl">
          <MapPin className="w-5 h-5 text-slate-400 flex-shrink-0" />
          <input
            type="text"
            value={location}
            onChange={e => setLocation(e.target.value)}
            onKeyDown={e => e.key === "Enter" && search()}
            placeholder="Search area, district, or city…"
            className="flex-1 text-slate-900 placeholder-slate-400 text-sm outline-none"
          />
        </div>

        <select
          value={beds}
          onChange={e => setBeds(e.target.value)}
          className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 outline-none bg-white min-w-[110px]"
        >
          <option value="">Any beds</option>
          <option value="1">1 bed</option>
          <option value="2">2 beds</option>
          <option value="3">3 beds</option>
          <option value="4">4+ beds</option>
        </select>

        <button
          onClick={() => search()}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl transition"
        >
          <Search className="w-4 h-4" />
          Search
        </button>
      </div>

      {/* Popular tags */}
      <div className="flex flex-wrap items-center gap-2 mt-3">
        <span className="text-white/60 text-xs">Popular:</span>
        {POPULAR.map(area => (
          <button
            key={area}
            onClick={() => { setLocation(area); search(area) }}
            className="text-xs text-white/80 hover:text-white border border-white/30 hover:border-white/60 rounded-full px-3 py-1 transition"
          >
            {area}
          </button>
        ))}
      </div>
    </div>
  )
}
