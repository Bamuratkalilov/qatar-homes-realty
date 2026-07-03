import Link from "next/link"
import {
  ArrowRight, Building2, Home, Layers, Briefcase,
  LayoutGrid, Building, Shield, TrendingUp, Phone,
  CheckCircle, Anchor, Zap, Landmark, Trees, Waves,
} from "lucide-react"
import { db } from "@/lib/db"
import { PropertyCard } from "@/components/properties/property-card"
import { HeroSearch } from "@/components/public/hero-search"
import type { LucideIcon } from "lucide-react"

// ── Data ──────────────────────────────────────────────────────────────────

async function getFeatured() {
  try {
    return await db.property.findMany({
      where: { featured: true, status: "AVAILABLE" },
      take: 6,
      orderBy: { views: "desc" },
    })
  } catch { return [] }
}

async function getCounts() {
  try {
    const [byType, total] = await Promise.all([
      db.property.groupBy({ by: ["type"], where: { status: "AVAILABLE" }, _count: true }),
      db.property.count({ where: { status: "AVAILABLE" } }),
    ])
    return { byType: Object.fromEntries(byType.map(r => [r.type, r._count])), total }
  } catch { return { byType: {} as Record<string, number>, total: 0 } }
}

// ── Static config ─────────────────────────────────────────────────────────

const PROPERTY_TYPES: { key: string; label: string; Icon: LucideIcon }[] = [
  { key: "APARTMENT",  label: "Apartments",  Icon: Building2   },
  { key: "VILLA",      label: "Villas",       Icon: Home        },
  { key: "STUDIO",     label: "Studios",      Icon: LayoutGrid  },
  { key: "PENTHOUSE",  label: "Penthouses",   Icon: Layers      },
  { key: "TOWNHOUSE",  label: "Townhouses",   Icon: Building    },
  { key: "OFFICE",     label: "Commercial",   Icon: Briefcase   },
]

const AREAS = [
  { name: "The Pearl-Qatar", q: "The Pearl",  Icon: Anchor,   gradient: "from-blue-600 to-cyan-500",    desc: "Luxury island living"      },
  { name: "Lusail",          q: "Lusail",     Icon: Zap,      gradient: "from-slate-700 to-blue-700",   desc: "Qatar's new city"          },
  { name: "West Bay",        q: "West Bay",   Icon: Building2,gradient: "from-blue-900 to-indigo-700",  desc: "Skyscrapers & sea views"   },
  { name: "Al Waab",         q: "Al Waab",    Icon: Trees,    gradient: "from-green-700 to-emerald-600",desc: "Family villa community"    },
  { name: "Msheireb",        q: "Msheireb",   Icon: Landmark, gradient: "from-amber-700 to-orange-600", desc: "Downtown heritage district" },
  { name: "Al Wakra",        q: "Al Wakra",   Icon: Waves,    gradient: "from-teal-700 to-cyan-600",    desc: "Peaceful coastal living"   },
]

const STEPS = [
  { n: "01", title: "Search & Discover",  desc: "Browse hundreds of verified listings across all Qatar districts with smart filters for price, size, and bedrooms." },
  { n: "02", title: "Visit & Experience", desc: "Schedule viewings at your convenience. Our agents are available 7 days a week to guide you through every property." },
  { n: "03", title: "Move In",            desc: "We handle all the paperwork, contracts, and RERA compliance — so you can focus on settling into your new home." },
]

const PLACEHOLDER_PROPERTIES = [
  { id: "1", title: "Luxury 3BR Apartment in The Pearl",  type: "APARTMENT", listingType: "RENT", status: "AVAILABLE", price: 14000,   area: 185, bedrooms: 3, bathrooms: 3, address: "Porto Arabia",    district: "The Pearl-Qatar", city: "Doha",   photos: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600"], featured: true  },
  { id: "2", title: "Modern Villa in Al Waab",            type: "VILLA",     listingType: "SALE", status: "AVAILABLE", price: 3500000, area: 450, bedrooms: 5, bathrooms: 5, address: "Al Waab Street",  district: "Al Waab",         city: "Doha",   photos: ["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600"], featured: true  },
  { id: "3", title: "Studio Apartment in Lusail",         type: "STUDIO",    listingType: "RENT", status: "AVAILABLE", price: 4500,    area: 65,  bedrooms: null, bathrooms: 1, address: "Fox Hills",    district: "Lusail",          city: "Lusail", photos: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600"], featured: false },
]

// ── Page ──────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const [featured, { byType, total }] = await Promise.all([getFeatured(), getCounts()])
  const displayProperties = featured.length > 0 ? featured : PLACEHOLDER_PROPERTIES

  return (
    <div>
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white">
        {/* Decorative blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_50%,rgba(59,130,246,0.15),transparent_60%)]" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-36">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 rounded-full px-4 py-1.5 text-blue-300 text-sm mb-5">
              <Shield className="w-3.5 h-3.5" />
              Qatar&apos;s Trusted Real Estate Platform · RERA Compliant
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-4">
              Find Your Perfect<br />
              <span className="text-blue-400">Home in Qatar</span>
            </h1>
            <p className="text-lg text-slate-300 max-w-xl mx-auto">
              Discover premium properties across Doha, Lusail, The Pearl and beyond.
            </p>
          </div>

          {/* Search */}
          <HeroSearch />
        </div>

        {/* Stats bar */}
        <div className="relative border-t border-white/10 bg-black/20 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-slate-300">
              {[
                { v: total > 0 ? `${total}+` : "500+", l: "Active Listings" },
                { v: "200+", l: "Happy Clients"       },
                { v: "50+",  l: "Districts Covered"   },
                { v: "5/5",  l: "Client Rating"       },
              ].map(({ v, l }) => (
                <div key={l} className="flex items-center gap-2">
                  <span className="font-bold text-white text-base">{v}</span>
                  <span className="text-slate-400">{l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PROPERTY TYPES ───────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">What are you looking for?</h2>
          <p className="text-slate-500 mt-1">Browse properties by type</p>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {PROPERTY_TYPES.map(({ key, label, Icon }) => {
            const count = byType[key] ?? 0
            return (
              <Link
                key={key}
                href={`/listings?type=${key}`}
                className="group flex flex-col items-center gap-2.5 p-4 rounded-2xl border border-slate-200 bg-white hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-center"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                  <Icon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{label}</p>
                  {count > 0 && <p className="text-xs text-slate-400 mt-0.5">{count} listings</p>}
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* ── EXPLORE AREAS ────────────────────────────────────────────────── */}
      <section className="bg-slate-50 py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Explore neighbourhoods</h2>
              <p className="text-slate-500 mt-1">Qatar&apos;s most popular residential areas</p>
            </div>
            <Link href="/listings" className="hidden sm:flex items-center gap-1.5 text-blue-600 font-medium text-sm hover:text-blue-700">
              All areas <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {AREAS.map(({ name, q, Icon, gradient, desc }) => (
              <Link
                key={name}
                href={`/listings?q=${encodeURIComponent(q)}`}
                className="group relative rounded-2xl overflow-hidden aspect-[3/4] flex flex-col justify-end hover:-translate-y-1 transition-transform duration-200 shadow-sm hover:shadow-lg"
              >
                {/* Gradient background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
                {/* Dark overlay for text legibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                {/* Icon top-right */}
                <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Icon className="w-4 h-4 text-white" />
                </div>

                {/* Text */}
                <div className="relative p-3">
                  <p className="text-white font-bold text-sm leading-tight">{name}</p>
                  <p className="text-white/70 text-[11px] mt-0.5">{desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED LISTINGS ────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Featured listings</h2>
            <p className="text-slate-500 mt-1">Hand-picked premium properties</p>
          </div>
          <Link href="/listings?featured=true" className="flex items-center gap-1.5 text-blue-600 font-medium text-sm hover:text-blue-700">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayProperties.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section className="bg-slate-50 py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-slate-900">Finding your home is simple</h2>
            <p className="text-slate-500 mt-2">Three easy steps to your perfect property</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map(({ n, title, desc }) => (
              <div key={n} className="relative">
                <div className="text-5xl font-black text-blue-100 mb-3">{n}</div>
                <h3 className="font-bold text-slate-900 text-lg mb-2">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST ────────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-slate-900">Why Qatar Homes Realty?</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { Icon: Shield,     title: "RERA Compliant",   desc: "All listings and agents fully comply with Qatar Real Estate Regulatory Authority guidelines." },
            { Icon: TrendingUp, title: "Market Expertise", desc: "Deep knowledge of Qatar's property market with data-driven pricing and investment insights." },
            { Icon: Phone,      title: "Always Available", desc: "Our bilingual agents are available 7 days a week for viewings, calls, and WhatsApp." },
          ].map(({ Icon, title, desc }) => (
            <div key={title} className="flex gap-4 p-6 rounded-2xl border border-slate-200 bg-white hover:shadow-md transition-shadow">
              <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="mx-4 sm:mx-6 lg:mx-8 mb-16 rounded-3xl overflow-hidden bg-gradient-to-r from-blue-600 to-blue-800">
        <div className="max-w-6xl mx-auto px-8 py-14 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="text-3xl font-bold text-white">Ready to find your home?</h2>
            <p className="text-blue-200 mt-2">Talk to our expert agents today — no obligation, just advice.</p>
            <div className="flex flex-wrap gap-2 mt-4">
              {["Free consultation", "RERA certified", "Bilingual agents"].map(t => (
                <span key={t} className="flex items-center gap-1.5 text-blue-100 text-sm">
                  <CheckCircle className="w-4 h-4 text-blue-300" />
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
            <Link
              href="/listings"
              className="bg-white text-blue-600 font-semibold px-7 py-3 rounded-xl hover:bg-blue-50 transition text-center"
            >
              Browse Listings
            </Link>
            <Link
              href="/contact"
              className="bg-blue-500/60 border border-blue-400 text-white font-semibold px-7 py-3 rounded-xl hover:bg-blue-500 transition text-center"
            >
              Contact an Agent
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
