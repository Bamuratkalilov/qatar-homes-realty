export interface QuickFact { label: string; value: string }
export interface LivingCard { label: string; body: string }
export interface Attraction { name: string; rating: string; coords?: { lat: number; lng: number } }
export interface InvestmentStat { value: string; desc: string }
export interface SimilarArea {
  title: string; slug: string; rating: string; reviews: number
  category: string; price: string; badge?: string; coords?: { lat: number; lng: number }
}
export interface NeighbourhoodSpot { step: number; category: string; name: string; desc: string }
export interface CompareRow { area: string; vibe: string; types: string; bestFor: string; highlight?: boolean }

export interface BlogArticle {
  slug: string
  title: string
  excerpt: string
  category: string
  readTime: string
  updatedDate: string
  author: string
  featured?: boolean
  comingSoon?: boolean
  heroCoords?: { lat: number; lng: number; zoom: number }
  quickFacts?: QuickFact[]
  overview?: string[]
  pullQuote?: string
  livingCards?: LivingCard[]
  attractions?: Attraction[]
  investmentStats?: InvestmentStat[]
  investmentBody?: string[]
  similarAreas?: SimilarArea[]
  neighbourhoodSpots?: NeighbourhoodSpot[]
  compareTable?: CompareRow[]
}

export const ARTICLES: BlogArticle[] = [
  {
    slug: "the-pearl-qatar",
    title: "The Pearl Qatar: Living, Investing, and Everything In Between",
    excerpt: "A resident's-eye look at Doha's waterfront island — amenities, price bands, and how it stacks up against Lusail and West Bay.",
    category: "Area Guide",
    readTime: "12 min read",
    updatedDate: "Updated July 2026",
    author: "Qatar Homes Editorial",
    featured: true,
    heroCoords: { lat: 25.3694, lng: 51.5499, zoom: 13 },
    quickFacts: [
      { label: "Type", value: "Man-made island, freehold" },
      { label: "Property types", value: "Apartments, villas" },
      { label: "Price range", value: "~QAR 900K–15M+" },
      { label: "Best for", value: "Waterfront, expats, investors" },
      { label: "Nearby", value: "Lusail, West Bay" },
    ],
    overview: [
      "The Pearl Qatar is a 4-million-square-metre artificial island off the coast of Doha's West Bay Lagoon, built by Qatari Diar and United Development Company. It's one of the few places in Qatar where non-Qataris can hold freehold property — which, along with its marinas and Mediterranean-inflected architecture, made it the country's first real \"lifestyle\" address rather than just a place to live.",
      "The island is split into distinct districts: Porto Arabia (the marina towers), Viva Bahriya, Qanat Quartier (Venice-style canals), Isola Dana and Costa Malaz (villas), and Medina Centrale, the retail and dining core.",
    ],
    pullQuote: "It reads less like a suburb and more like a resort that people happen to live in year-round.",
    livingCards: [
      { label: "Groceries", body: "Carrefour, Monoprix and Spar all operate within Medina Centrale and Porto Arabia — no need to leave the island for a weekly shop." },
      { label: "Schools", body: "No K-12 schools on the island itself; families typically enroll at nurseries and international schools a 10–20 min drive away in West Bay or Al Waab." },
      { label: "Public transport", body: "Doha Metro doesn't reach the island directly; residents rely on cars, taxis, or the ride-hailing apps most Doha neighborhoods still depend on." },
      { label: "Healthcare", body: "Pharmacies and clinics are on-island; hospitals (Hamad, Sidra) are a 15–25 min drive depending on district." },
    ],
    attractions: [
      { name: "Porto Arabia Marina Walk", rating: "4.5", coords: { lat: 25.368, lng: 51.549 } },
      { name: "Qanat Quartier Canals", rating: "4.3", coords: { lat: 25.372, lng: 51.543 } },
      { name: "Medina Centrale Piazza", rating: "4.2", coords: { lat: 25.370, lng: 51.548 } },
      { name: "Pearl Beach Clubs", rating: "4.4", coords: { lat: 25.365, lng: 51.553 } },
    ],
    investmentStats: [
      { value: "QAR 8–13K", desc: "Typical price per sqm, apartments" },
      { value: "5–7%", desc: "Indicative gross rental yield" },
      { value: "Freehold", desc: "Full foreign ownership status" },
    ],
    investmentBody: [
      "Freehold status is the headline for foreign buyers: owning here can come with residency benefits, and the Pearl remains one of the most liquid resale markets in Qatar simply because of transaction volume.",
      "Non-Qataris buy through the freehold/usufruct framework covering designated areas like the Pearl. Expect: agreeing terms, a deposit, due diligence and title transfer at the Ministry of Justice's real estate registry, then utility and community-fee setup. Budget for a one-off registration fee on top of the purchase price.",
    ],
    similarAreas: [
      { title: "Lusail City Marina District", slug: "lusail", rating: "4.8", reviews: 219, category: "Master-planned, waterfront", price: "from QAR 7–11K / sqm", badge: "New Launch", coords: { lat: 25.427, lng: 51.502 } },
      { title: "West Bay Lagoon Villas", slug: "west-bay", rating: "5.0", reviews: 450, category: "Gated, low-rise villas", price: "from QAR 10–15K / sqm", coords: { lat: 25.335, lng: 51.534 } },
      { title: "Msheireb Downtown Doha", slug: "msheireb", rating: "4.9", reviews: 1055, category: "Urban, heritage-inspired", price: "from QAR 9–13K / sqm", coords: { lat: 25.286, lng: 51.534 } },
      { title: "Al Waab Family Compounds", slug: "al-waab", rating: "4.9", reviews: 174, category: "Compound living, schools nearby", price: "from QAR 6–9K / sqm", coords: { lat: 25.256, lng: 51.500 } },
    ],
    neighbourhoodSpots: [
      { step: 1, category: "Shops", name: "Medina Centrale retail strip", desc: "Carrefour, Monoprix and Spar cover groceries; the surrounding piazza has boutiques, salons and pharmacies — all reachable on foot from any Pearl district." },
      { step: 2, category: "Schools", name: "Nearest international schools", desc: "No K-12 campuses on the island itself. Families typically enroll at Cambridge International School or DPS Modern Indian School, both a 10–20 min drive." },
      { step: 3, category: "Transportation", name: "Getting on and off the island", desc: "No Doha Metro stop on the Pearl — residents rely on cars, taxis and ride-hailing apps. The nearest Metro station (Msheireb) is roughly a 20 min drive." },
      { step: 4, category: "Healthcare", name: "Clinics and hospitals", desc: "Pharmacies and outpatient clinics operate within Porto Arabia and Medina Centrale; major hospitals like Hamad and Sidra are 15–25 min away." },
    ],
    compareTable: [
      { area: "The Pearl Qatar", vibe: "Resort-style, walkable", types: "Apartments, villas", bestFor: "Waterfront lifestyle, resale liquidity", highlight: true },
      { area: "Lusail", vibe: "New-build, master-planned", types: "Apartments, townhouses", bestFor: "Newer stock, longer-term growth" },
      { area: "West Bay", vibe: "High-rise, corporate", types: "Apartments", bestFor: "City views, short commutes to CBD" },
    ],
  },
  {
    slug: "lusail-city",
    title: "Lusail City: A First-Timer's Guide",
    excerpt: "Master-planned towers, brand-new inventory, and what 'off-plan' really means here.",
    category: "Area Guide",
    readTime: "9 min read",
    updatedDate: "Coming 2026",
    author: "Qatar Homes Editorial",
    comingSoon: true,
    heroCoords: { lat: 25.427, lng: 51.502, zoom: 13 },
  },
  {
    slug: "freehold-guide",
    title: "Freehold vs Leasehold in Qatar, Explained",
    excerpt: "What foreign buyers can actually own, and where. A plain-English breakdown of Qatar's foreign ownership rules.",
    category: "Buyer Guide",
    readTime: "6 min read",
    updatedDate: "Coming 2026",
    author: "Qatar Homes Editorial",
    comingSoon: true,
    heroCoords: { lat: 25.286, lng: 51.534, zoom: 13 },
  },
]

export function getArticle(slug: string) {
  return ARTICLES.find(a => a.slug === slug)
}
