"use client"

import { useRef } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { PropertyCard } from "@/components/properties/property-card"

interface Property {
  id: string; title: string; type: string; listingType: string; status: string
  price: number; area: number; bedrooms: number | null; bathrooms: number | null
  address: string; district: string | null; city: string; photos: string[]; featured: boolean
}

export function SimilarProperties({ properties }: { properties: Property[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)

  function scroll(dir: "left" | "right") {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -300 : 300, behavior: "smooth" })
  }

  if (!properties.length) return null

  return (
    <div className="mt-10 px-4 sm:px-6 lg:px-8 pb-12">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Similar properties</h2>
        <div className="flex gap-2">
          <button
            onClick={() => scroll("left")}
            className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition"
          >
            <ChevronLeft className="w-4 h-4 text-slate-600" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition"
          >
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {properties.map(p => (
          <div key={p.id} className="flex-shrink-0 w-72">
            <PropertyCard property={p} />
          </div>
        ))}
      </div>
    </div>
  )
}
