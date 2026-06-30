import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(amount: number, currency = "QAR") {
  return new Intl.NumberFormat("en-QA", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatArea(area: number) {
  return `${area.toLocaleString()} sqm`
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

export function relativeTime(date: Date | string) {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 7) return d.toLocaleDateString("en-QA", { day: "numeric", month: "short", year: "numeric" })
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return "just now"
}

export const RESIDENTIAL_TYPES = [
  { value: "APARTMENT",     label: "Apartment"      },
  { value: "COMPOUND",      label: "Compound"       },
  { value: "DUPLEX",        label: "Duplex"         },
  { value: "PENTHOUSE",     label: "Penthouse"      },
  { value: "STUDIO",        label: "Studio"         },
  { value: "TOWNHOUSE",     label: "Townhouse"      },
  { value: "VILLA",         label: "Villa"          },
  { value: "WHOLE_BUILDING",label: "Whole Building" },
]

export const COMMERCIAL_TYPES = [
  { value: "COWORKING",      label: "Co-working Space" },
  { value: "INDUSTRIAL_LAND",label: "Industrial Land"  },
  { value: "LABOR_CAMP",     label: "Labor Camp"       },
  { value: "OFFICE",         label: "Office"           },
  { value: "RESTAURANT",     label: "Restaurant / F&B" },
  { value: "SHOP",           label: "Shop / Retail"    },
  { value: "SHOWROOM",       label: "Showroom"         },
  { value: "WAREHOUSE",      label: "Warehouse"        },
  { value: "WHOLE_BUILDING", label: "Whole Building"   },
]

export const PROPERTY_TYPES = [...RESIDENTIAL_TYPES, ...COMMERCIAL_TYPES]

export const QATAR_DISTRICTS = [
  "Al Waab", "Al Duhail", "Al Rayyan", "Lusail", "The Pearl-Qatar",
  "West Bay", "Al Sadd", "Bin Mahmoud", "Fereej Bin Omran",
  "Al Thumama", "Ain Khalid", "Al Aziziyah", "Muaither",
  "Al Khor", "Al Wakra", "Mesaimeer", "Industrial Area",
]

export const LEAD_SOURCES = [
  { value: "WEBSITE", label: "Website" },
  { value: "PHONE", label: "Phone Call" },
  { value: "REFERRAL", label: "Referral" },
  { value: "SOCIAL_MEDIA", label: "Social Media" },
  { value: "TIKTOK", label: "TikTok" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "PROPERTY_FINDER", label: "Property Finder" },
  { value: "BAYUT", label: "Bayut" },
  { value: "WALK_IN", label: "Walk-in" },
  { value: "OTHER", label: "Other" },
]
