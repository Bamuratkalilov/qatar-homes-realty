"use client"

import Image from "next/image"
import { cn, formatPrice, PROPERTY_TYPES } from "@/lib/utils"
import {
  BedDouble, Bath, Ruler, MapPin, Tag, Zap, CalendarDays, CheckCircle2, ImageIcon,
} from "lucide-react"

export const AMENITIES_LIST = [
  "Swimming Pool", "Gym", "Parking", "Concierge", "Sea View", "Garden",
  "Balcony", "Maid Room", "Storage Room", "Central AC", "Security", "CCTV",
  "Kids Play Area", "BBQ Area", "Jacuzzi", "Sauna", "Home Cinema",
  "Study Room", "Built-in Wardrobes", "Driver's Room", "Intercom",
  "Laundry Room", "Guest Bathroom", "High Floor", "City View", "Mall Access",
]

export const UTILITY_OPTIONS = ["Electricity", "Water", "Internet", "Gas", "Cooling (Chiller)"]

export function generateRef() {
  return `QH-${Math.floor(10000 + Math.random() * 90000)}`
}

export function ToggleChip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-full text-sm font-medium border transition-all",
        selected
          ? "bg-blue-600 text-white border-blue-600"
          : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600"
      )}
    >
      {label}
    </button>
  )
}

export function ToggleButton({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold border-2 transition-all",
        selected
          ? "bg-blue-600 text-white border-blue-600"
          : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
      )}
    >
      {label}
    </button>
  )
}

export function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
      <h2 className="font-semibold text-slate-800 text-sm uppercase tracking-wide">{title}</h2>
      {children}
    </div>
  )
}

export interface FormState {
  title: string
  category: "RESIDENTIAL" | "COMMERCIAL"
  type: string
  listingType: string
  referenceNumber: string
  price: string
  area: string
  bedrooms: string
  bathrooms: string
  floor: string
  address: string
  district: string
  description: string
  furnishing: "" | "FURNISHED" | "SEMI_FURNISHED" | "UNFURNISHED"
  availabilityType: "IMMEDIATE" | "DATE"
  availableFrom: string
  featured: boolean
}

export const EMPTY_FORM: FormState = {
  title: "", category: "RESIDENTIAL", type: "APARTMENT", listingType: "RENT",
  referenceNumber: "", price: "", area: "", bedrooms: "", bathrooms: "", floor: "",
  address: "", district: "", description: "",
  furnishing: "", availabilityType: "IMMEDIATE", availableFrom: "", featured: false,
}

export function LivePreview({
  form, photos, amenities, utilities,
}: {
  form: FormState
  photos: string[]
  amenities: string[]
  utilities: string[]
}) {
  const price = parseFloat(form.price) || 0
  const area = parseFloat(form.area) || 0
  const typeLabel = PROPERTY_TYPES.find((t) => t.value === form.type)?.label || form.type

  return (
    <div className="sticky top-6 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Live Preview</p>
        <span className="text-[10px] bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">
          Updates as you type
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="relative aspect-[4/3] bg-slate-100">
          {photos.length > 0 ? (
            <Image src={photos[0]} alt="Cover" fill className="object-cover" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300">
              <ImageIcon className="w-10 h-10 mb-2" />
              <p className="text-xs">No photos yet</p>
            </div>
          )}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            <span className={cn(
              "text-xs font-bold px-2.5 py-1 rounded-full",
              form.listingType === "RENT" ? "bg-blue-600 text-white" : "bg-emerald-600 text-white"
            )}>
              For {form.listingType === "RENT" ? "Rent" : "Sale"}
            </span>
            <span className="text-xs font-semibold bg-white/90 text-slate-700 px-2.5 py-1 rounded-full">
              {form.category === "RESIDENTIAL" ? "🏠" : "🏢"} {form.category.charAt(0) + form.category.slice(1).toLowerCase()}
            </span>
            {form.featured && (
              <span className="text-xs font-bold bg-amber-500 text-white px-2.5 py-1 rounded-full">⭐ Featured</span>
            )}
          </div>
          {photos.length > 1 && (
            <span className="absolute bottom-3 right-3 text-xs font-semibold bg-black/60 text-white px-2 py-0.5 rounded-full">
              +{photos.length - 1} photos
            </span>
          )}
        </div>

        <div className="p-4 space-y-3">
          {form.referenceNumber && (
            <p className="text-[10px] text-slate-400 font-mono">{form.referenceNumber}</p>
          )}
          <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">
            {form.title || <span className="text-slate-300 italic">Property title will appear here</span>}
          </h3>
          {price > 0 ? (
            <p className="text-lg font-bold text-blue-600">
              {formatPrice(price)}
              <span className="text-xs text-slate-400 font-normal ml-1">{form.listingType === "RENT" ? "/ month" : ""}</span>
            </p>
          ) : (
            <p className="text-lg font-bold text-slate-200">QAR —</p>
          )}
          <div className="flex flex-wrap gap-1.5">
            <span className="text-[11px] bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded">{typeLabel}</span>
            {form.furnishing && (
              <span className="text-[11px] bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded">
                {form.furnishing === "SEMI_FURNISHED" ? "Semi-Furnished" : form.furnishing.charAt(0) + form.furnishing.slice(1).toLowerCase()}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            {form.bedrooms && <span className="flex items-center gap-1"><BedDouble className="w-3.5 h-3.5 text-slate-400" /> {form.bedrooms} Beds</span>}
            {form.bathrooms && <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5 text-slate-400" /> {form.bathrooms} Baths</span>}
            {area > 0 && <span className="flex items-center gap-1"><Ruler className="w-3.5 h-3.5 text-slate-400" /> {area} sqm</span>}
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            {form.availabilityType === "IMMEDIATE" ? (
              <span className="flex items-center gap-1 text-green-600 font-semibold"><Zap className="w-3 h-3" /> Available Now</span>
            ) : form.availableFrom ? (
              <span className="flex items-center gap-1 text-amber-600 font-semibold">
                <CalendarDays className="w-3 h-3" />
                From {new Date(form.availableFrom).toLocaleDateString("en-QA", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            ) : (
              <span className="text-slate-300 text-xs">Availability not set</span>
            )}
          </div>
          {(form.district || form.address) && (
            <div className="flex items-start gap-1.5 text-xs text-slate-500">
              <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
              <span>{[form.district, form.address].filter(Boolean).join(" · ")}</span>
            </div>
          )}
          {utilities.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Bills included: {utilities.join(", ")}
            </div>
          )}
          {amenities.length > 0 && (
            <div className="pt-1 border-t border-slate-100">
              <div className="flex flex-wrap gap-1">
                {amenities.slice(0, 6).map((a) => (
                  <span key={a} className="text-[10px] bg-blue-50 text-blue-600 font-medium px-1.5 py-0.5 rounded">{a}</span>
                ))}
                {amenities.length > 6 && <span className="text-[10px] text-slate-400">+{amenities.length - 6} more</span>}
              </div>
            </div>
          )}
          {form.description && (
            <p className="text-[11px] text-slate-500 line-clamp-3 pt-1 border-t border-slate-100 leading-relaxed">{form.description}</p>
          )}
          <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">Q</div>
            <div>
              <p className="text-[10px] font-semibold text-slate-700">Qatar Homes Realty</p>
              <p className="text-[10px] text-slate-400">Listed by you</p>
            </div>
            <Tag className="w-3 h-3 text-slate-300 ml-auto" />
          </div>
        </div>
      </div>
    </div>
  )
}
