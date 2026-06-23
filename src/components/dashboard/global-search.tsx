"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, Home, UserCheck, Users, X, Loader2 } from "lucide-react"
import { cn, formatPrice } from "@/lib/utils"

interface SearchResult {
  id: string; _type: "property" | "lead" | "client"
  title?: string; name?: string; phone?: string; email?: string
  type?: string; listingType?: string; price?: number; status?: string
  photos?: string[]; address?: string; score?: number; source?: string
  nationality?: string
}

interface SearchResults {
  properties: SearchResult[]
  leads:      SearchResult[]
  clients:    SearchResult[]
}

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: "bg-green-100 text-green-700",
  RENTED: "bg-blue-100 text-blue-700",
  SOLD: "bg-purple-100 text-purple-700",
  RESERVED: "bg-amber-100 text-amber-700",
  NEW: "bg-blue-100 text-blue-700",
  CONVERTED: "bg-green-100 text-green-700",
  LOST: "bg-red-100 text-red-600",
}

export function GlobalSearch() {
  const [open, setOpen]       = useState(false)
  const [query, setQuery]     = useState("")
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [cursor, setCursor]   = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router   = useRouter()

  // Cmd+K / Ctrl+K to open
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen(v => !v)
      }
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  useEffect(() => { if (open) { setTimeout(() => inputRef.current?.focus(), 50); setQuery(""); setResults(null) } }, [open])

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults(null); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setResults(data.results)
      setCursor(0)
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => search(query), 250)
    return () => clearTimeout(t)
  }, [query, search])

  const allResults = results ? [
    ...results.properties.map(r => ({ ...r, _type: "property" as const })),
    ...results.leads.map(r      => ({ ...r, _type: "lead"     as const })),
    ...results.clients.map(r    => ({ ...r, _type: "client"   as const })),
  ] : []

  function navigate(r: SearchResult) {
    setOpen(false)
    if (r._type === "property") router.push(`/dashboard/properties/${r.id}`)
    else if (r._type === "lead") router.push("/dashboard/leads")
    else router.push("/dashboard/clients")
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setCursor(c => Math.min(c + 1, allResults.length - 1)) }
    if (e.key === "ArrowUp")   { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)) }
    if (e.key === "Enter" && allResults[cursor]) navigate(allResults[cursor])
  }

  if (!open) return (
    <button onClick={() => setOpen(true)}
      className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-400 text-xs transition w-48">
      <Search className="w-3.5 h-3.5 flex-shrink-0" />
      <span>Search anything…</span>
      <span className="ml-auto text-[10px] font-bold bg-white border border-slate-200 px-1.5 py-0.5 rounded-md">⌘K</span>
    </button>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4" onClick={() => setOpen(false)}>
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={e => e.stopPropagation()}>
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100">
          {loading ? <Loader2 className="w-4 h-4 text-slate-400 animate-spin flex-shrink-0" />
                   : <Search  className="w-4 h-4 text-slate-400 flex-shrink-0" />}
          <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} onKeyDown={handleKey}
            placeholder="Search properties, leads, clients…"
            className="flex-1 text-sm text-slate-900 bg-transparent focus:outline-none placeholder:text-slate-300" />
          {query && (
            <button onClick={() => { setQuery(""); setResults(null); inputRef.current?.focus() }}>
              <X className="w-4 h-4 text-slate-300 hover:text-slate-500 transition" />
            </button>
          )}
          <kbd className="text-[10px] font-bold bg-slate-100 border border-slate-200 text-slate-400 px-1.5 py-0.5 rounded-md">ESC</kbd>
        </div>

        {/* Results */}
        {!results && !loading && (
          <div className="px-4 py-8 text-center">
            <p className="text-xs text-slate-300">Type to search across all your data</p>
          </div>
        )}

        {results && allResults.length === 0 && (
          <div className="px-4 py-8 text-center">
            <p className="text-sm font-semibold text-slate-700">No results for "{query}"</p>
            <p className="text-xs text-slate-400 mt-1">Try a different name, phone, or address</p>
          </div>
        )}

        {results && allResults.length > 0 && (
          <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-50">
            {/* Properties */}
            {results.properties.length > 0 && (
              <div>
                <p className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50">
                  Properties
                </p>
                {results.properties.map((r, i) => {
                  const idx = i
                  return (
                    <button key={r.id} onClick={() => navigate(r)}
                      className={cn("w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition text-left",
                        cursor === idx ? "bg-blue-50" : "")}>
                      <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                        {r.photos?.[0]
                          ? <img src={r.photos[0]} alt="" className="w-full h-full object-cover" />
                          : <Home className="w-4 h-4 text-slate-300 m-2.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{r.title}</p>
                        <p className="text-xs text-slate-400 truncate">{r.address} · {r.price ? formatPrice(r.price) : ""}</p>
                      </div>
                      {r.status && (
                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-lg flex-shrink-0",
                          STATUS_COLORS[r.status] || "bg-slate-100 text-slate-500")}>
                          {r.status}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Leads */}
            {results.leads.length > 0 && (
              <div>
                <p className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50">Leads</p>
                {results.leads.map((r, i) => {
                  const idx = results.properties.length + i
                  return (
                    <button key={r.id} onClick={() => navigate(r)}
                      className={cn("w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition text-left",
                        cursor === idx ? "bg-blue-50" : "")}>
                      <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <UserCheck className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900">{r.name}</p>
                        <p className="text-xs text-slate-400">{r.phone} {r.email ? `· ${r.email}` : ""}</p>
                      </div>
                      {r.status && (
                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-lg flex-shrink-0",
                          STATUS_COLORS[r.status] || "bg-slate-100 text-slate-500")}>
                          {r.status}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Clients */}
            {results.clients.length > 0 && (
              <div>
                <p className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50">Clients</p>
                {results.clients.map((r, i) => {
                  const idx = results.properties.length + results.leads.length + i
                  return (
                    <button key={r.id} onClick={() => navigate(r)}
                      className={cn("w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition text-left",
                        cursor === idx ? "bg-blue-50" : "")}>
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <Users className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900">{r.name}</p>
                        <p className="text-xs text-slate-400">{r.phone} {r.nationality ? `· ${r.nationality}` : ""}</p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-700 flex-shrink-0">
                        CLIENT
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Footer hint */}
        <div className="px-4 py-2.5 border-t border-slate-100 flex items-center gap-4 text-[10px] text-slate-300">
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span>ESC close</span>
        </div>
      </div>
    </div>
  )
}
