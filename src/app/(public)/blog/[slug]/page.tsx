import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Star } from "lucide-react"
import { ARTICLES, getArticle } from "@/lib/blog-articles"

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

function mapUrl(lat: number, lng: number, zoom: number, w: number, h: number, style = "satellite-streets-v12") {
  return `https://api.mapbox.com/styles/v1/mapbox/${style}/static/${lng},${lat},${zoom},0/${w}x${h}@2x?access_token=${TOKEN}`
}

// Generate static params for all articles
export function generateStaticParams() {
  return ARTICLES.map(a => ({ slug: a.slug }))
}

export default async function BlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const article = getArticle(slug)
  if (!article) notFound()

  const heroUrl = article.heroCoords && TOKEN
    ? mapUrl(article.heroCoords.lat, article.heroCoords.lng, article.heroCoords.zoom, 1400, 550)
    : null

  const mapSidebarUrl = article.heroCoords && TOKEN
    ? mapUrl(article.heroCoords.lat, article.heroCoords.lng, 14, 600, 480)
    : null

  const mapNeighUrl = article.heroCoords && TOKEN
    ? mapUrl(article.heroCoords.lat, article.heroCoords.lng, 15, 560, 700)
    : null

  // Coming-soon placeholder
  if (article.comingSoon) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center py-24 px-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-blue-600 mb-4">{article.category}</p>
        <h1 className="font-serif text-4xl font-bold text-slate-900 text-center max-w-xl leading-snug mb-4">
          {article.title}
        </h1>
        <p className="text-slate-500 text-center max-w-sm leading-relaxed mb-8">{article.excerpt}</p>
        <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-slate-200 text-sm font-semibold text-slate-500">
          Guide coming soon
        </span>
        <Link href="/blog" className="mt-8 flex items-center gap-1.5 text-sm text-blue-600 font-semibold hover:text-blue-700">
          <ArrowLeft className="w-4 h-4" /> All guides
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">

      {/* ── Breadcrumb ──────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-5 pb-0">
        <div className="flex items-center gap-2 text-[13px] text-slate-400">
          <Link href="/blog" className="hover:text-blue-600 transition-colors">Blog</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-blue-600 transition-colors">Doha Guides</Link>
          <span>/</span>
          <span className="text-slate-700 font-semibold truncate">The Pearl Qatar</span>
        </div>
      </div>

      {/* ── Article header ──────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-8 pb-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-blue-600 mb-3">
          {article.category} · Doha
        </p>
        <h1 className="font-serif text-4xl sm:text-[44px] font-bold text-slate-900 leading-[1.1] tracking-tight max-w-3xl">
          {article.title}
        </h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-5 text-[13px] text-slate-400">
          <span>By {article.author}</span>
          <span className="w-1 h-1 rounded-full bg-slate-300" />
          <span>{article.updatedDate}</span>
          <span className="w-1 h-1 rounded-full bg-slate-300" />
          <span>{article.readTime}</span>
        </div>
      </div>

      {/* ── Hero image ──────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-5 sm:px-8 pb-0">
        <div className="rounded-2xl overflow-hidden bg-slate-100 aspect-[21/9]">
          {heroUrl ? (
            <img src={heroUrl} alt="The Pearl Qatar" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-900 to-slate-700" />
          )}
        </div>
      </div>

      {/* ── Sticky TOC bar ──────────────────────────────────────────────────── */}
      <div className="sticky top-[60px] z-40 bg-white border-b border-slate-200 mt-8">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="flex items-center gap-2.5 overflow-x-auto py-3.5 scrollbar-hide">
            {[
              ["#overview", "Overview"],
              ["#living", "Living There"],
              ["#things-to-do", "Things To Do"],
              ["#investment", "Investment"],
              ["#similar", "Similar Areas"],
              ["#neighbourhood", "Neighbourhood"],
              ["#compare", "Compare"],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="flex-shrink-0 px-4 py-1.5 rounded-full border border-slate-200 text-[13px] font-semibold text-slate-500 hover:border-blue-300 hover:text-slate-800 transition-colors whitespace-nowrap"
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main content: 2-col (article + sidebar) ─────────────────────────── */}
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-12">
        <div className="grid lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-12 lg:gap-14 items-stretch">

          {/* ── Left: Article body ──────────────────────────────────────────── */}
          <div className="min-w-0 space-y-14">

            {/* Overview */}
            {article.overview && (
              <section id="overview">
                <h2 className="font-serif text-2xl font-bold text-slate-900 tracking-tight mb-5">Overview</h2>
                <div className="space-y-4">
                  {article.overview.map((p, i) => (
                    <p key={i} className="text-slate-600 leading-[1.8] text-[15px]">{p}</p>
                  ))}
                </div>
                {article.pullQuote && (
                  <blockquote className="mt-8 pl-5 border-l-4 border-blue-500">
                    <p className="font-serif text-xl font-semibold text-slate-800 leading-relaxed tracking-tight">
                      &ldquo;{article.pullQuote}&rdquo;
                    </p>
                  </blockquote>
                )}
              </section>
            )}

            {/* Living There */}
            {article.livingCards && (
              <section id="living">
                <h2 className="font-serif text-2xl font-bold text-slate-900 tracking-tight mb-3">Living there</h2>
                <p className="text-slate-500 text-[15px] leading-relaxed mb-6">
                  Day-to-day life on the Pearl leans walkable-by-Doha-standards: a marina promenade, beach clubs, and Medina Centrale&apos;s piazza cover most errands on foot, with the rest a short drive away.
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {article.livingCards.map(card => (
                    <div key={card.label} className="rounded-xl border border-slate-200 bg-slate-50/60 p-5">
                      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-blue-600 mb-2">{card.label}</p>
                      <p className="text-[14px] text-slate-600 leading-relaxed">{card.body}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Things To Do */}
            {article.attractions && (
              <section id="things-to-do">
                <h2 className="font-serif text-2xl font-bold text-slate-900 tracking-tight mb-3">Things to do</h2>
                <p className="text-slate-500 text-[15px] leading-relaxed mb-6">
                  What draws the TripAdvisor crowd is also what draws buyers: a genuinely walkable strip of restaurants, a working marina, and a rare (for Doha) sense of pedestrian street life.
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {article.attractions.map(a => {
                    const imgUrl = a.coords && TOKEN
                      ? mapUrl(a.coords.lat, a.coords.lng, 16, 480, 360)
                      : null
                    return (
                      <div key={a.name} className="rounded-xl overflow-hidden border border-slate-200">
                        <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
                          {imgUrl ? (
                            <img src={imgUrl} alt={a.name} className="absolute inset-0 w-full h-full object-cover" />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-600" />
                          )}
                        </div>
                        <div className="px-4 py-3 flex items-center justify-between">
                          <p className="font-semibold text-[15px] text-slate-900">{a.name}</p>
                          <span className="flex items-center gap-1 text-[12px] font-bold bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full border border-amber-200">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {a.rating}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Investment */}
            {article.investmentStats && (
              <section id="investment">
                <h2 className="font-serif text-2xl font-bold text-slate-900 tracking-tight mb-3">Investment angle</h2>
                {article.investmentBody?.map((p, i) => (
                  <p key={i} className="text-slate-600 leading-[1.8] text-[15px] mb-4">{p}</p>
                ))}
                <div className="grid sm:grid-cols-3 gap-4 mt-6">
                  {article.investmentStats.map(stat => (
                    <div key={stat.value} className="rounded-xl border border-slate-200 bg-white p-5">
                      <p className="font-serif text-2xl font-bold text-slate-900 tracking-tight leading-none">{stat.value}</p>
                      <p className="mt-2 text-[13px] text-slate-500 leading-snug">{stat.desc}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-5 text-[13px] text-slate-400 italic leading-relaxed">
                  Figures are indicative and vary by district, floor, and view — always verify current listings before deciding.
                </p>
              </section>
            )}

          </div>

          {/* ── Right: Sticky sidebar ────────────────────────────────────────── */}
          <aside className="hidden lg:block">
            <div className="sticky top-[130px] rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <div className="p-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-blue-600 mb-4">Quick facts</p>
                <div className="divide-y divide-slate-100">
                  {article.quickFacts?.map(f => (
                    <div key={f.label} className="flex justify-between items-baseline gap-3 py-3 first:pt-0 last:pb-0">
                      <span className="text-[12px] uppercase tracking-wide text-slate-400 font-semibold flex-shrink-0">{f.label}</span>
                      <span className="text-[14px] font-semibold text-slate-800 text-right">{f.value}</span>
                    </div>
                  ))}
                </div>
                <Link
                  href="/listings?district=The+Pearl"
                  className="mt-5 w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[14px] font-semibold transition-colors"
                >
                  Browse Pearl Qatar listings
                </Link>
              </div>
              {mapSidebarUrl && (
                <div className="aspect-[4/3] bg-slate-100">
                  <img src={mapSidebarUrl} alt="The Pearl Qatar map" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </aside>

        </div>
      </div>

      {/* ── Full-width sections (below 2-col) ───────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-5 sm:px-8 pb-16 space-y-16">

        {/* Similar Experiences */}
        {article.similarAreas && (
          <section id="similar">
            <h2 className="font-serif text-2xl font-bold text-slate-900 tracking-tight mb-2">Similar experiences</h2>
            <p className="text-slate-500 text-[15px] leading-relaxed mb-6">Other Doha areas worth comparing before you decide.</p>
            <div className="flex gap-5 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
              {article.similarAreas.map(area => {
                const imgUrl = area.coords && TOKEN
                  ? mapUrl(area.coords.lat, area.coords.lng, 13, 480, 360)
                  : null
                return (
                  <Link
                    key={area.slug}
                    href={`/discover/${area.slug}`}
                    className="group flex-shrink-0 w-[260px] block"
                  >
                    <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-slate-100">
                      {imgUrl ? (
                        <img src={imgUrl} alt={area.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-600" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      {area.badge && (
                        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-bold text-blue-700 bg-white/90 border border-blue-200">
                          {area.badge}
                        </span>
                      )}
                    </div>
                    <h3 className="font-serif mt-3 text-[16px] font-bold text-slate-900 leading-snug">{area.title}</h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="flex items-center gap-1 text-[12px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {area.rating}
                      </span>
                      <span className="text-[13px] text-slate-400">({area.reviews.toLocaleString()})</span>
                    </div>
                    <p className="mt-1.5 text-[13px] text-slate-500">{area.category}</p>
                    <p className="mt-1 text-[13px] font-semibold text-slate-800">{area.price}</p>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* Neighbourhood Guide */}
        {article.neighbourhoodSpots && (
          <section id="neighbourhood">
            <h2 className="font-serif text-2xl font-bold text-slate-900 tracking-tight mb-2">Neighbourhood guide</h2>
            <p className="text-slate-500 text-[15px] leading-relaxed mb-8">
              What&apos;s actually within reach from Porto Arabia — the shops, schools, and transport links that shape day-to-day life here.
            </p>
            <div className="grid lg:grid-cols-[1.2fr_1fr] gap-8 items-start">
              <div className="space-y-0">
                {article.neighbourhoodSpots.map((spot, i) => {
                  const isLast = i === article.neighbourhoodSpots!.length - 1
                  return (
                    <div key={spot.step} className="flex gap-5 pb-8 relative">
                      {!isLast && (
                        <div className="absolute left-[15px] top-8 bottom-0 w-[2px] bg-slate-200" />
                      )}
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[14px] relative z-10">
                        {spot.step}
                      </div>
                      <div className="pt-0.5 min-w-0">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide text-blue-700 bg-blue-50 border border-blue-200 mb-2">
                          {spot.category}
                        </span>
                        <h3 className="font-serif font-bold text-[16px] text-slate-900 mb-1.5">{spot.name}</h3>
                        <p className="text-[14px] text-slate-500 leading-relaxed">{spot.desc}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="hidden lg:block lg:sticky lg:top-[130px]">
                {mapNeighUrl ? (
                  <div className="rounded-2xl overflow-hidden aspect-[4/5] bg-slate-100">
                    <img src={mapNeighUrl} alt="Neighbourhood map" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="rounded-2xl aspect-[4/5] bg-slate-100" />
                )}
              </div>
            </div>
          </section>
        )}

        {/* Compare Areas */}
        {article.compareTable && (
          <section id="compare">
            <h2 className="font-serif text-2xl font-bold text-slate-900 tracking-tight mb-6">How it compares to other Doha areas</h2>
            <div className="rounded-2xl border border-slate-200 overflow-hidden overflow-x-auto">
              <table className="w-full border-collapse text-[14px] min-w-[520px]">
                <thead>
                  <tr className="border-b border-slate-200">
                    {["Area", "Vibe", "Property types", "Best for"].map(h => (
                      <th key={h} className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {article.compareTable.map(row => (
                    <tr
                      key={row.area}
                      className={`border-b border-slate-200 last:border-b-0 ${row.highlight ? "bg-blue-50" : "bg-white"}`}
                    >
                      <td className="px-5 py-4 font-bold text-slate-900">{row.area}</td>
                      <td className="px-5 py-4 text-slate-600">{row.vibe}</td>
                      <td className="px-5 py-4 text-slate-600">{row.types}</td>
                      <td className="px-5 py-4 text-slate-600">{row.bestFor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

      </div>

      {/* ── CTA banner ──────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-5 sm:px-8 pb-20">
        <div className="rounded-2xl bg-slate-900 px-8 sm:px-12 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h2 className="font-serif text-2xl font-bold text-white tracking-tight">Searching listings across Doha?</h2>
            <p className="mt-2 text-slate-400 text-[15px] leading-relaxed max-w-sm">
              Qatar Homes pulls live inventory from every major area, including the Pearl.
            </p>
          </div>
          <Link
            href="/listings"
            className="flex-shrink-0 px-6 py-3.5 rounded-xl bg-white text-slate-900 text-[14px] font-bold hover:bg-slate-100 transition-colors"
          >
            See live listings
          </Link>
        </div>
      </div>

    </div>
  )
}
