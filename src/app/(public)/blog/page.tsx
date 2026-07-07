import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { ARTICLES } from "@/lib/blog-articles"

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

function mapUrl(lat: number, lng: number, zoom: number, w: number, h: number) {
  return `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static/${lng},${lat},${zoom},0/${w}x${h}@2x?access_token=${TOKEN}`
}

export default function BlogIndexPage() {
  const featured = ARTICLES.find(a => a.featured)!
  const others = ARTICLES.filter(a => !a.featured)

  return (
    <div className="min-h-screen bg-white">

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-14 pb-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-blue-600 mb-4">Doha Area Guides</p>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-slate-900 leading-[1.1] tracking-tight max-w-2xl">
          Neighbourhood insight for smarter real estate decisions.
        </h1>
        <p className="mt-5 text-slate-500 text-lg max-w-xl leading-relaxed">
          Deep dives on Doha&apos;s most-searched areas — lifestyle, pricing, and what buyers actually ask us.
        </p>
      </div>

      {/* ── Featured post ────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-5 sm:px-8 pb-10">
        <Link
          href={`/blog/${featured.slug}`}
          className="group block overflow-hidden rounded-2xl border border-slate-200 bg-white hover:shadow-2xl transition-all duration-300"
        >
          <div className="grid sm:grid-cols-[1.15fr_1fr]">
            {/* Image */}
            <div className="relative aspect-[4/3] sm:aspect-auto min-h-[260px] overflow-hidden bg-slate-100">
              {featured.heroCoords && TOKEN ? (
                <img
                  src={mapUrl(featured.heroCoords.lat, featured.heroCoords.lng, featured.heroCoords.zoom, 800, 600)}
                  alt="The Pearl Qatar aerial"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-blue-800 to-slate-700" />
              )}
            </div>

            {/* Text */}
            <div className="flex flex-col justify-between p-8 sm:p-10">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-blue-600">
                  Featured · {featured.category}
                </p>
                <h2 className="font-serif mt-3 text-2xl sm:text-[28px] font-bold text-slate-900 leading-snug tracking-tight">
                  {featured.title}
                </h2>
                <p className="mt-3 text-slate-500 leading-relaxed text-[15px]">{featured.excerpt}</p>
              </div>
              <div className="flex items-center gap-3 mt-7 text-sm text-slate-400">
                <span>{featured.readTime}</span>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span>{featured.updatedDate}</span>
                <span className="ml-auto flex items-center gap-1.5 text-blue-600 font-semibold text-sm group-hover:gap-2.5 transition-all duration-200">
                  Read guide <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* ── Other posts ──────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-5 sm:px-8 pb-20">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-6">More area guides</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {others.map(post => (
            <div key={post.slug} className="rounded-2xl overflow-hidden border border-slate-200 bg-white">
              <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                {post.heroCoords && TOKEN ? (
                  <img
                    src={mapUrl(post.heroCoords.lat, post.heroCoords.lng, post.heroCoords.zoom, 600, 375)}
                    alt={post.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-800" />
                )}
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-blue-600">{post.category}</p>
                  {post.comingSoon && (
                    <span className="text-[11px] font-semibold text-slate-400 border border-slate-200 px-2.5 py-1 rounded-full">
                      Coming soon
                    </span>
                  )}
                </div>
                <h3 className="font-serif mt-2 text-[17px] font-bold text-slate-900 leading-snug tracking-tight">
                  {post.title}
                </h3>
                <p className="mt-2 text-[13px] text-slate-500 leading-relaxed">{post.excerpt}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
