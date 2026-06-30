import { notFound } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, ArrowRight, MapPin, Home, TrendingUp,
  CheckCircle, XCircle, Star, Lightbulb, Users,
  Building2, Waves, Sparkles,
} from "lucide-react"
import { db } from "@/lib/db"
import { PropertyCard } from "@/components/properties/property-card"

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

// ── Article content type ────────────────────────────────────────────────────

interface District {
  name: string
  photoKey: string
  body: string
}

interface ArticleContent {
  intro?: string
  whyImportant?: string
  location?: string
  districts?: District[]
  propertyTypes?: string[]
  propertyTypeNote?: string
  renting?: string
  buying?: string
  lifestyle?: string[]
  lifestyleNote?: string
  investorReasons?: string[]
  investorNote?: string
  whoFor?: string[]
  pros?: string[]
  cons?: string[]
  tips?: string[]
  tipsNote?: string
  conclusion?: string
}

// ── Helpers ─────────────────────────────────────────────────────────────────

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

function formatQar(v: number | null) {
  if (!v) return "—"
  return v >= 1_000_000 ? `QAR ${(v / 1_000_000).toFixed(1)}M` : `QAR ${v.toLocaleString()}`
}

function sat(lat: number, lng: number, zoom = 14, w = 800, h = 500) {
  return `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static/${lng},${lat},${zoom},0/${w}x${h}@2x?access_token=${TOKEN}`
}

// Photo slot — shows uploaded photo or a labelled placeholder
function PhotoSlot({ src, alt, label, className = "" }: { src?: string; alt: string; label: string; className?: string }) {
  if (src) {
    return <img src={src} alt={alt} className={`w-full h-full object-cover ${className}`} />
  }
  return (
    <div className={`w-full h-full bg-slate-100 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-300 ${className}`}>
      <Sparkles className="w-6 h-6 text-slate-400" />
      <p className="text-xs text-slate-400 font-medium text-center px-4">{label}</p>
    </div>
  )
}

// ── Data fetching ────────────────────────────────────────────────────────────

async function getCommunity(slug: string) {
  const c = await db.community.findUnique({ where: { slug } })
  if (!c) return null

  const [rentStats, saleStats, listings, similar] = await Promise.all([
    db.property.aggregate({
      where: { district: c.district, listingType: "RENT", status: "AVAILABLE" },
      _avg: { price: true },
      _count: true,
    }),
    db.property.aggregate({
      where: { district: c.district, listingType: "SALE", status: "AVAILABLE" },
      _avg: { price: true },
      _count: true,
    }),
    db.property.findMany({
      where: { district: c.district, status: "AVAILABLE" },
      orderBy: { views: "desc" },
      take: 6,
    }),
    db.community.findMany({
      where: { id: { not: c.id }, featured: true },
      orderBy: { sortOrder: "asc" },
      take: 3,
    }),
  ])

  return {
    ...c,
    content: c.content as ArticleContent | null,
    liveAvgRent: rentStats._avg.price ? Math.round(rentStats._avg.price) : c.avgRentQar,
    liveAvgSale: saleStats._avg.price ? Math.round(saleStats._avg.price) : c.avgSaleQar,
    rentCount: rentStats._count,
    saleCount: saleStats._count,
    listings,
    similar,
  }
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function CommunityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const c = await getCommunity(slug)
  if (!c) notFound()

  const art = c.content
  const photos = (c.photos ?? []) as string[]
  // Map photoKey → uploaded URL (by index in photos array, keyed by district order)
  const districtPhotos = art?.districts?.map((_, i) => photos[i + 1] ?? undefined) ?? []
  const heroPhoto = photos[0] ?? undefined

  const hasArticle = !!art

  return (
    <div className="min-h-screen bg-white">

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <div className="relative h-[50vh] min-h-[380px] max-h-[560px] overflow-hidden">
        {heroPhoto ? (
          <img src={heroPhoto} alt={c.name} className="absolute inset-0 w-full h-full object-cover" />
        ) : c.centerLat && c.centerLng ? (
          <img src={sat(c.centerLat, c.centerLng, 14, 1600, 700)} alt={c.name} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-blue-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />

        {/* Back link */}
        <div className="absolute top-6 left-0 right-0 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/discover" className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm transition">
            <ArrowLeft className="w-4 h-4" /> Discover Qatar
          </Link>
        </div>

        {/* Title */}
        <div className="absolute bottom-0 left-0 right-0 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <div className="flex flex-wrap gap-2 mb-3">
            {c.tags.slice(0, 4).map(tag => (
              <span key={tag} className="text-xs px-3 py-1 rounded-full font-semibold text-white"
                style={{ background: `${TAG_COLORS[tag] || "#64748b"}99` }}>
                {tag.replace("-", " ")}
              </span>
            ))}
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight">{c.name}</h1>
          {c.nameAr && <p className="text-white/50 text-lg mt-1" dir="rtl">{c.nameAr}</p>}
          <p className="text-white/60 mt-2 flex items-center gap-1.5 text-sm">
            <MapPin className="w-4 h-4" /> {c.district}, Qatar
          </p>
        </div>
      </div>

      {/* ── STATS BAR ─────────────────────────────────────────────────────── */}
      <div className="border-b border-slate-200 bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6 py-3 overflow-x-auto scrollbar-hide text-sm">
            <div className="flex items-center gap-2 flex-shrink-0">
              <Home className="w-4 h-4 text-blue-500" />
              <span className="text-slate-500">Listings:</span>
              <span className="font-bold text-slate-900">{c.rentCount + c.saleCount}</span>
            </div>
            <div className="w-px h-4 bg-slate-200 flex-shrink-0" />
            <div className="flex items-center gap-2 flex-shrink-0">
              <MapPin className="w-4 h-4 text-green-500" />
              <span className="text-slate-500">Avg rent:</span>
              <span className="font-bold text-slate-900">{formatQar(c.liveAvgRent)}/mo</span>
            </div>
            <div className="w-px h-4 bg-slate-200 flex-shrink-0" />
            <div className="flex items-center gap-2 flex-shrink-0">
              <TrendingUp className="w-4 h-4 text-purple-500" />
              <span className="text-slate-500">Avg sale:</span>
              <span className="font-bold text-slate-900">{formatQar(c.liveAvgSale)}</span>
            </div>
            <div className="flex-1" />
            <Link
              href={`/listings?q=${encodeURIComponent(c.district)}`}
              className="flex-shrink-0 flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-1.5 rounded-full transition"
            >
              View listings <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── ARTICLE BODY ──────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {hasArticle ? (
          <div className="space-y-16">

            {/* ── Intro ─────────────────────────────────────────────────── */}
            {art?.intro && (
              <section className="max-w-3xl">
                <p className="text-xl text-slate-700 leading-relaxed font-light whitespace-pre-line">{art.intro}</p>
              </section>
            )}

            {/* ── Why important + satellite ─────────────────────────────── */}
            {art?.whyImportant && (
              <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">Why The Pearl Stands Out</h2>
                  <p className="text-slate-600 leading-relaxed whitespace-pre-line">{art.whyImportant}</p>
                </div>
                <div className="rounded-2xl overflow-hidden h-64">
                  {c.centerLat && c.centerLng && (
                    <img src={sat(c.centerLat, c.centerLng, 13, 700, 500)} alt="The Pearl aerial" className="w-full h-full object-cover" />
                  )}
                </div>
              </section>
            )}

            {/* ── Location ──────────────────────────────────────────────── */}
            {art?.location && (
              <section className="bg-blue-50 rounded-3xl p-8">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 mb-3">Location &amp; Connectivity</h2>
                    <p className="text-slate-600 leading-relaxed whitespace-pre-line">{art.location}</p>
                  </div>
                </div>
              </section>
            )}

            {/* ── Districts ─────────────────────────────────────────────── */}
            {art?.districts && art.districts.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Districts Inside The Pearl</h2>
                <p className="text-slate-500 mb-8">Each sub-community has its own character and lifestyle</p>

                <div className="space-y-10">
                  {art.districts.map((d, i) => (
                    <div key={d.name} className={`grid grid-cols-1 lg:grid-cols-2 gap-6 items-center ${i % 2 === 1 ? "lg:grid-flow-dense" : ""}`}>
                      <div className={i % 2 === 1 ? "lg:col-start-2" : ""}>
                        <h3 className="text-xl font-bold text-slate-900 mb-3">{d.name}</h3>
                        <p className="text-slate-600 leading-relaxed">{d.body}</p>
                        <Link
                          href={`/listings?q=${encodeURIComponent(d.name)}`}
                          className="inline-flex items-center gap-1.5 text-blue-600 text-sm font-semibold mt-4 hover:text-blue-700"
                        >
                          View {d.name} listings <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                      <div className={`rounded-2xl overflow-hidden h-56 ${i % 2 === 1 ? "lg:col-start-1 lg:row-start-1" : ""}`}>
                        <PhotoSlot
                          src={districtPhotos[i]}
                          alt={d.name}
                          label={`Upload: ${d.name} photo`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── Property types ────────────────────────────────────────── */}
            {art?.propertyTypes && art.propertyTypes.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Types of Properties Available</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {art.propertyTypes.map(type => (
                    <div key={type} className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                      <Building2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <span className="text-sm text-slate-700 font-medium">{type}</span>
                    </div>
                  ))}
                </div>
                {art.propertyTypeNote && (
                  <p className="text-slate-500 text-sm mt-4 italic">{art.propertyTypeNote}</p>
                )}
              </section>
            )}

            {/* ── Renting + Buying ──────────────────────────────────────── */}
            {(art?.renting || art?.buying) && (
              <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {art.renting && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                    <h2 className="text-xl font-bold text-slate-900 mb-3">Renting in The Pearl</h2>
                    <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">{art.renting}</p>
                  </div>
                )}
                {art.buying && (
                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
                    <h2 className="text-xl font-bold text-slate-900 mb-3">Buying Property in The Pearl</h2>
                    <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">{art.buying}</p>
                  </div>
                )}
              </section>
            )}

            {/* ── Lifestyle ─────────────────────────────────────────────── */}
            {art?.lifestyle && art.lifestyle.length > 0 && (
              <section className="bg-slate-900 rounded-3xl p-8 text-white">
                <div className="flex items-center gap-3 mb-6">
                  <Waves className="w-6 h-6 text-blue-400" />
                  <h2 className="text-2xl font-bold">Lifestyle in The Pearl</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {art.lifestyle.map(item => (
                    <div key={item} className="flex items-center gap-3">
                      <Star className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      <span className="text-white/80 text-sm">{item}</span>
                    </div>
                  ))}
                </div>
                {art.lifestyleNote && (
                  <p className="text-white/60 text-sm mt-5 border-t border-white/10 pt-5">{art.lifestyleNote}</p>
                )}
              </section>
            )}

            {/* ── Investor appeal ───────────────────────────────────────── */}
            {art?.investorReasons && art.investorReasons.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Why Investors Like The Pearl</h2>
                <p className="text-slate-500 mb-6">Key factors driving investment appeal</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                  {art.investorReasons.map(r => (
                    <div key={r} className="flex items-start gap-2.5 bg-purple-50 border border-purple-100 rounded-xl px-4 py-3">
                      <TrendingUp className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-purple-900 font-medium">{r}</span>
                    </div>
                  ))}
                </div>
                {art.investorNote && (
                  <p className="text-slate-600 text-sm leading-relaxed">{art.investorNote}</p>
                )}
              </section>
            )}

            {/* ── Pros & Cons ───────────────────────────────────────────── */}
            {(art?.pros || art?.cons) && (
              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Pros &amp; Cons of Living in The Pearl</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {art?.pros && art.pros.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
                      <h3 className="font-bold text-green-800 mb-4 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" /> Pros
                      </h3>
                      <ul className="space-y-2.5">
                        {art.pros.map(pro => (
                          <li key={pro} className="flex items-start gap-2.5">
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-green-900">{pro}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {art?.cons && art.cons.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                      <h3 className="font-bold text-red-800 mb-4 flex items-center gap-2">
                        <XCircle className="w-5 h-5" /> Cons
                      </h3>
                      <ul className="space-y-2.5">
                        {art.cons.map(con => (
                          <li key={con} className="flex items-start gap-2.5">
                            <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-red-900">{con}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* ── Who is it for ─────────────────────────────────────────── */}
            {art?.whoFor && art.whoFor.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                  <Users className="w-6 h-6 text-blue-500" /> Who Should Live in The Pearl?
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {art.whoFor.map(who => (
                    <div key={who} className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
                      <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700">{who}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── Tips ──────────────────────────────────────────────────── */}
            {art?.tips && art.tips.length > 0 && (
              <section className="border border-amber-200 bg-amber-50 rounded-3xl p-8">
                <h2 className="text-xl font-bold text-amber-900 mb-5 flex items-center gap-3">
                  <Lightbulb className="w-5 h-5 text-amber-600" /> Tips Before Renting or Buying
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {art.tips.map((tip, i) => (
                    <div key={tip} className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-amber-200 text-amber-800 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-sm text-amber-900">{tip}</span>
                    </div>
                  ))}
                </div>
                {art.tipsNote && (
                  <p className="text-amber-800 text-sm mt-5 border-t border-amber-200 pt-5">{art.tipsNote}</p>
                )}
              </section>
            )}

            {/* ── Conclusion ────────────────────────────────────────────── */}
            {art?.conclusion && (
              <section className="max-w-3xl border-l-4 border-blue-500 pl-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Conclusion</h2>
                <p className="text-slate-600 leading-relaxed text-lg whitespace-pre-line">{art.conclusion}</p>
              </section>
            )}

          </div>
        ) : (
          /* ── Simple layout for communities without article content ─── */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">About {c.name}</h2>
              <p className="text-slate-600 leading-relaxed">{c.description ?? "No description available yet."}</p>
              <div className="mt-6 space-y-2">
                {c.tags.map(tag => (
                  <div key={tag} className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: TAG_COLORS[tag] || "#64748b" }} />
                    <span className="text-sm text-slate-600 capitalize">{tag.replace("-", " ")}</span>
                  </div>
                ))}
              </div>
            </div>
            {c.centerLat && c.centerLng && TOKEN && (
              <div className="rounded-2xl overflow-hidden h-72">
                <img src={sat(c.centerLat, c.centerLng, 14, 700, 500)} alt={c.name} className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        )}

        {/* ── CTA ─────────────────────────────────────────────────────────── */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-blue-800 rounded-3xl p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-bold">Ready to move to {c.name}?</h3>
            <p className="text-blue-200 mt-1">Our agents know every building, view, and price point.</p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <Link
              href={`/listings?q=${encodeURIComponent(c.district)}`}
              className="bg-white text-blue-700 font-semibold px-6 py-3 rounded-xl hover:bg-blue-50 transition text-sm"
            >
              Browse listings
            </Link>
            <Link
              href="/contact"
              className="bg-blue-500/50 border border-blue-400 text-white font-semibold px-6 py-3 rounded-xl hover:bg-blue-500 transition text-sm"
            >
              Talk to an agent
            </Link>
          </div>
        </div>

        {/* ── Live listings ────────────────────────────────────────────────── */}
        {c.listings.length > 0 && (
          <div className="mt-16">
            <div className="flex items-end justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Available in {c.name}</h2>
              <Link href={`/listings?q=${encodeURIComponent(c.district)}`}
                className="text-blue-600 text-sm font-semibold hover:text-blue-700 flex items-center gap-1">
                All listings <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {c.listings.map(p => <PropertyCard key={p.id} property={p} />)}
            </div>
          </div>
        )}

        {/* ── Similar communities ──────────────────────────────────────────── */}
        {c.similar.length > 0 && (
          <div className="mt-16">
            <h2 className="text-xl font-bold text-slate-900 mb-5">Explore similar areas</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {c.similar.map(s => (
                <Link key={s.id} href={`/discover/${s.slug}`}
                  className="group flex items-center gap-4 bg-white rounded-2xl p-4 border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm group-hover:text-blue-600 transition">{s.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{s.district}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-400 transition" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
