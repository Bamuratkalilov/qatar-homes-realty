import Link from "next/link"
import { ArrowRight, MapPin } from "lucide-react"
import { db } from "@/lib/db"
import { ExploreMap } from "@/components/public/explore-map"

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

const TAG_COLORS: Record<string, string> = {
  waterfront:        "#0ea5e9",
  luxury:            "#a855f7",
  family:            "#22c55e",
  urban:             "#f59e0b",
  affordable:        "#10b981",
  modern:            "#3b82f6",
  cultural:          "#f97316",
  "expat-friendly":  "#6366f1",
  coastal:           "#06b6d4",
  quiet:             "#84cc16",
}

const TAGLINES: Record<string, string> = {
  "the-pearl-qatar": "Island luxury. Marina views. Premium life.",
  "lusail":          "Qatar's city of the future.",
  "west-bay":        "Where the skyline meets the sea.",
  "al-waab":         "Space, community, and family life.",
  "msheireb":        "Heritage meets modern Doha.",
  "al-sadd":         "Central, vibrant, and connected.",
  "fox-hills":       "Modern living in Lusail's heart.",
  "al-dafna":        "Corniche views at your doorstep.",
  "al-wakra":        "Coastal charm south of Doha.",
  "ain-khaled":      "Quiet streets, spacious homes.",
}

const CURATED = [
  {
    title:  "Waterfront Living",
    sub:    "Communities where the sea is your neighbour",
    tag:    "waterfront",
    slugs:  ["the-pearl-qatar", "al-dafna", "al-wakra", "west-bay"],
  },
  {
    title:  "Family Friendly",
    sub:    "Space, schools, and community — all in one place",
    tag:    "family",
    slugs:  ["al-waab", "ain-khaled", "fox-hills", "lusail"],
  },
  {
    title:  "Urban & Modern",
    sub:    "City living at its most connected",
    tag:    "urban",
    slugs:  ["msheireb", "west-bay", "al-sadd", "lusail"],
  },
]

function satelliteUrl(lat: number, lng: number, zoom = 14, w = 800, h = 500) {
  return `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static/${lng},${lat},${zoom},0/${w}x${h}@2x?access_token=${TOKEN}`
}

async function getCommunities() {
  const list = await db.community.findMany({ orderBy: { sortOrder: "asc" } })
  return Promise.all(
    list.map(async (c) => {
      const [rentStats, saleStats, total] = await Promise.all([
        db.property.aggregate({
          where: { district: c.district, listingType: "RENT", status: "AVAILABLE" },
          _avg: { price: true },
        }),
        db.property.aggregate({
          where: { district: c.district, listingType: "SALE", status: "AVAILABLE" },
          _avg: { price: true },
        }),
        db.property.count({ where: { district: c.district, status: "AVAILABLE" } }),
      ])
      return {
        ...c,
        liveAvgRent: rentStats._avg.price ? Math.round(rentStats._avg.price) : c.avgRentQar,
        liveAvgSale: saleStats._avg.price ? Math.round(saleStats._avg.price) : c.avgSaleQar,
        listingCount: total,
      }
    })
  )
}

type Community = Awaited<ReturnType<typeof getCommunities>>[number]

// ── Card components ────────────────────────────────────────────────────────

function HeroCard({ c }: { c: Community }) {
  const img = c.centerLat && c.centerLng ? satelliteUrl(c.centerLat, c.centerLng, 14, 1200, 600) : null
  return (
    <Link href={`/discover/${c.slug}`} className="group relative block rounded-3xl overflow-hidden h-[420px] sm:h-[500px]">
      {img
        ? <img src={img} alt={c.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        : <div className="absolute inset-0 bg-gradient-to-br from-blue-800 to-blue-600" />
      }
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

      <div className="absolute bottom-0 left-0 right-0 p-7">
        <div className="flex flex-wrap gap-2 mb-3">
          {c.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-xs px-3 py-1 rounded-full font-semibold text-white"
              style={{ background: `${TAG_COLORS[tag] || "#64748b"}99` }}>
              {tag.replace("-", " ")}
            </span>
          ))}
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-1">{c.name}</h2>
        <p className="text-white/70 text-base mb-4">{TAGLINES[c.slug] || c.district}</p>
        <div className="flex items-center gap-4">
          {c.listingCount > 0 && (
            <span className="text-white/80 text-sm flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> {c.listingCount} listing{c.listingCount !== 1 ? "s" : ""}
            </span>
          )}
          {c.liveAvgRent && (
            <span className="text-white/80 text-sm">from QAR {c.liveAvgRent.toLocaleString()}/mo</span>
          )}
          <span className="ml-auto flex items-center gap-1.5 text-white font-semibold text-sm group-hover:gap-3 transition-all">
            Explore guide <ArrowRight className="w-4 h-4" />
          </span>
        </div>
      </div>
    </Link>
  )
}

function MediumCard({ c }: { c: Community }) {
  const img = c.centerLat && c.centerLng ? satelliteUrl(c.centerLat, c.centerLng, 14, 600, 400) : null
  return (
    <Link href={`/discover/${c.slug}`} className="group relative block rounded-2xl overflow-hidden h-64">
      {img
        ? <img src={img} alt={c.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        : <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-blue-800" />
      }
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <p className="text-white/60 text-xs mb-1">{c.tags[0]?.replace("-", " ")}</p>
        <h3 className="text-white font-bold text-base leading-tight">{c.name}</h3>
        <p className="text-white/60 text-xs mt-0.5">{TAGLINES[c.slug] || c.district}</p>
      </div>
    </Link>
  )
}

function SmallCard({ c }: { c: Community }) {
  const img = c.centerLat && c.centerLng ? satelliteUrl(c.centerLat, c.centerLng, 14, 400, 280) : null
  return (
    <Link href={`/discover/${c.slug}`} className="group flex-shrink-0 w-56 relative block rounded-2xl overflow-hidden h-44">
      {img
        ? <img src={img} alt={c.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        : <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-blue-800" />
      }
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <h3 className="text-white font-bold text-sm leading-tight">{c.name}</h3>
        {c.listingCount > 0 && (
          <p className="text-white/60 text-xs mt-0.5">{c.listingCount} listings</p>
        )}
      </div>
    </Link>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────

export default async function DiscoverPage() {
  const communities = await getCommunities()
  const bySlug = Object.fromEntries(communities.map(c => [c.slug, c]))
  const hero = bySlug["the-pearl-qatar"] ?? communities[0]
  const top3 = communities.filter(c => c.featured && c.slug !== hero.slug).slice(0, 3)

  return (
    <div className="min-h-screen bg-white">

      {/* ── Page header ───────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-6">
        <h1 className="text-4xl font-bold text-slate-900">Discover Qatar</h1>
        <p className="text-slate-500 mt-2 text-lg">Your guide to Qatar&apos;s neighbourhoods</p>
      </div>

      {/* ── Hero + 3-col grid ──────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Big hero — spans 2 cols */}
          <div className="lg:col-span-2">
            <HeroCard c={hero} />
          </div>
          {/* Right column — 2 stacked medium cards */}
          <div className="flex flex-col gap-4">
            {top3.slice(0, 2).map(c => (
              <MediumCard key={c.id} c={c} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Curated sections ──────────────────────────────────────────── */}
      {CURATED.map(({ title, sub, slugs }) => {
        const cards = slugs.map(s => bySlug[s]).filter(Boolean)
        if (cards.length === 0) return null
        return (
          <section key={title} className="mb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-5">
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
                  <p className="text-slate-500 text-sm mt-0.5">{sub}</p>
                </div>
                <Link href={`/listings`} className="hidden sm:flex items-center gap-1.5 text-blue-600 text-sm font-semibold hover:text-blue-700">
                  View listings <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Horizontal scroll on mobile, grid on desktop */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-4">
                {cards.map(c => <SmallCard key={c.id} c={c} />)}
              </div>
              <div className="sm:hidden flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
                {cards.map(c => <SmallCard key={c.id} c={c} />)}
              </div>
            </div>
          </section>
        )
      })}

      {/* ── Divider ───────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        <div className="border-t border-slate-100" />
      </div>

      {/* ── All communities grid ──────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">All communities</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {communities.map(c => {
            const img = c.centerLat && c.centerLng ? satelliteUrl(c.centerLat, c.centerLng, 14, 400, 300) : null
            return (
              <Link
                key={c.id}
                href={`/discover/${c.slug}`}
                className="group relative block rounded-2xl overflow-hidden aspect-[4/3]"
              >
                {img
                  ? <img src={img} alt={c.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  : <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-blue-800" />
                }
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-white font-semibold text-sm leading-tight">{c.name}</p>
                  {c.listingCount > 0 && (
                    <p className="text-white/60 text-xs">{c.listingCount} listings</p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* ── Interactive map ───────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Map view</h2>
            <p className="text-slate-500 text-sm mt-0.5">Click any community to explore it</p>
          </div>
        </div>
        <div className="rounded-3xl overflow-hidden border border-slate-200 shadow-sm" style={{ height: 480 }}>
          <ExploreMap communities={communities as Parameters<typeof ExploreMap>[0]["communities"]} />
        </div>
      </div>

    </div>
  )
}
