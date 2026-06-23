"use client"

import Link from "next/link"
import { useState } from "react"
import { MapPin, Bed, Bath, Maximize, Heart, Camera, Star } from "lucide-react"
import { formatPrice, formatArea } from "@/lib/utils"
import { cn } from "@/lib/utils"

interface PropertyCardProps {
  property: {
    id: string
    title: string
    type: string
    listingType: string
    status: string
    price: number
    area: number
    bedrooms?: number | null
    bathrooms?: number | null
    address: string
    district?: string | null
    city: string
    photos: string[]
    featured?: boolean
    description?: string
  }
}

const TYPE_LABELS: Record<string, string> = {
  APARTMENT: "Apartment", VILLA: "Villa", TOWNHOUSE: "Townhouse",
  STUDIO: "Studio", PENTHOUSE: "Penthouse", OFFICE: "Office",
  RETAIL: "Retail", WAREHOUSE: "Warehouse", LAND: "Land", DUPLEX: "Duplex",
}

export function PropertyCard({ property }: PropertyCardProps) {
  const [liked,   setLiked]   = useState(false)
  const [imgIdx,  setImgIdx]  = useState(0)
  const photos  = property.photos.length > 0
    ? property.photos
    : ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800"]
  const isRent  = property.listingType === "RENT"
  const monthly = isRent ? Math.round(property.price / 12) : null

  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-slate-200 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200">

      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        <Link href={`/listings/${property.id}`}>
          <img
            src={photos[imgIdx]}
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
          />
        </Link>

        {/* Top badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {property.featured && (
            <span className="flex items-center gap-1 bg-amber-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow">
              <Star className="w-3 h-3 fill-current" />Featured
            </span>
          )}
          <span className={cn(
            "text-[11px] font-bold px-2.5 py-1 rounded-full shadow",
            isRent ? "bg-blue-600 text-white" : "bg-emerald-600 text-white"
          )}>
            {isRent ? "For Rent" : "For Sale"}
          </span>
        </div>

        {/* Heart */}
        <button
          onClick={() => setLiked(v => !v)}
          className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md transition hover:scale-110"
        >
          <Heart className={cn("w-4 h-4 transition-colors", liked ? "fill-red-500 text-red-500" : "text-slate-500")} />
        </button>

        {/* Photo count + prev/next dots */}
        {photos.length > 1 && (
          <>
            <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/50 text-white text-[11px] px-2 py-0.5 rounded-full">
              <Camera className="w-3 h-3" />
              {photos.length}
            </div>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
              {photos.slice(0, 5).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setImgIdx(i)}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all",
                    i === imgIdx ? "bg-white w-3" : "bg-white/60"
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Content */}
      <Link href={`/listings/${property.id}`} className="block p-4">
        {/* Price */}
        <div className="mb-2">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900">{formatPrice(property.price)}</span>
            {isRent && (
              <span className="text-[11px] text-slate-400 font-medium">/yr
                {monthly && (
                  <span className="ml-1 text-slate-400">· QAR {monthly.toLocaleString()}/mo</span>
                )}
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-slate-800 text-[14px] leading-snug line-clamp-1 mb-1 group-hover:text-blue-600 transition-colors">
          {property.title}
        </h3>

        {/* Location */}
        <div className="flex items-center gap-1 text-slate-400 text-xs mb-3">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{[property.district, property.city].filter(Boolean).join(", ")}</span>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-slate-600 text-[12px] pt-3 border-t border-slate-100">
          {property.bedrooms != null && (
            <span className="flex items-center gap-1.5 font-medium">
              <Bed className="w-3.5 h-3.5 text-slate-400" />
              {property.bedrooms} {property.bedrooms === 1 ? "Bed" : "Beds"}
            </span>
          )}
          {property.bathrooms != null && (
            <span className="flex items-center gap-1.5 font-medium">
              <Bath className="w-3.5 h-3.5 text-slate-400" />
              {property.bathrooms} {property.bathrooms === 1 ? "Bath" : "Baths"}
            </span>
          )}
          <span className="flex items-center gap-1.5 font-medium">
            <Maximize className="w-3.5 h-3.5 text-slate-400" />
            {formatArea(property.area)}
          </span>
          <span className="ml-auto text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
            {TYPE_LABELS[property.type] || property.type}
          </span>
        </div>
      </Link>
    </div>
  )
}
