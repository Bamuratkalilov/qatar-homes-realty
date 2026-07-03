"use client"

import { useState, Suspense } from "react"
import Link from "next/link"
import { Building2 } from "lucide-react"
import { PropertyCard } from "@/components/properties/property-card"
import { SortSelect } from "@/components/public/sort-select"
import { LayoutSwitcher } from "@/components/public/layout-switcher"
import { PropertyMap } from "@/components/public/map-wrapper"
import type { Property } from "@/components/public/property-map"

interface Props {
  properties: Property[]
  title: string
  currentSort: string
  district?: string
}

export function SplitView({ properties, title, currentSort, district }: Props) {
  const [filteredIds, setFilteredIds] = useState<string[] | null>(null)

  const displayed =
    filteredIds !== null
      ? properties.filter((p) => filteredIds.includes(p.id))
      : properties

  return (
    <div className="flex" style={{ height: "calc(100vh - 112px)" }}>
      {/* Left: scrollable listings ──────────────────────────── */}
      <div className="w-1/2 overflow-y-auto flex-shrink-0 border-r border-slate-200">
        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-[22px] font-bold text-slate-900">{title}</h1>
              <p className="text-slate-500 text-[13px] mt-0.5">
                {displayed.length}{" "}
                {displayed.length === 1 ? "result" : "results"}
                {filteredIds !== null
                  ? " in drawn area"
                  : district
                    ? ` near ${district}`
                    : ""}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <Suspense>
                <SortSelect current={currentSort} />
              </Suspense>
              <Suspense>
                <LayoutSwitcher current="split" />
              </Suspense>
            </div>
          </div>

          {/* Drawn-area banner */}
          {filteredIds !== null && (
            <div className="mb-4 flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 text-sm">
              <span className="text-blue-700 font-medium flex-1">
                {displayed.length === 0
                  ? "No properties in this area"
                  : `${displayed.length} propert${displayed.length === 1 ? "y" : "ies"} in drawn area`}
              </span>
              <button
                onClick={() => setFilteredIds(null)}
                className="text-xs text-blue-500 hover:text-blue-700 font-semibold underline"
              >
                Clear
              </button>
            </div>
          )}

          {/* Listings */}
          {displayed.length > 0 ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {displayed.map((p) => (
                <PropertyCard key={p.id} property={p as Parameters<typeof PropertyCard>[0]["property"]} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-5">
                <Building2 className="w-10 h-10 text-slate-300" />
              </div>
              <h2 className="text-xl font-bold text-slate-700 mb-2">
                No properties found
              </h2>
              <p className="text-slate-400 text-sm max-w-xs mb-6">
                {filteredIds !== null
                  ? "No properties in the drawn area. Try a different shape."
                  : "Try adjusting your filters to see more results."}
              </p>
              {filteredIds !== null ? (
                <button
                  onClick={() => setFilteredIds(null)}
                  className="bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition"
                >
                  Clear drawn area
                </button>
              ) : (
                <Link
                  href="/listings"
                  className="bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition"
                >
                  Clear filters
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: sticky map ────────────────────────────────────── */}
      <div className="flex-1 sticky top-[112px] h-full">
        <PropertyMap properties={properties} onFilter={setFilteredIds} />
      </div>
    </div>
  )
}
