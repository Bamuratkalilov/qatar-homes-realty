import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { formatPrice, formatArea } from "@/lib/utils"
import { MapPin, Bed, Bath, Maximize, Share2, CheckCircle, Building2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { InquiryForm } from "@/components/public/inquiry-form"

export default async function PropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let property = null

  try {
    property = await db.property.findUnique({
      where: { id },
      include: { agent: { select: { name: true, email: true, image: true } } },
    })
    if (property) {
      await db.property.update({ where: { id }, data: { views: { increment: 1 } } })
    }
  } catch {
    // DB not connected, show placeholder
  }

  if (!property && id !== "demo") notFound()

  const p = property || {
    id: "demo", title: "Luxury 3BR Apartment in The Pearl", type: "APARTMENT",
    listingType: "RENT", status: "AVAILABLE", price: 180000, area: 185,
    bedrooms: 3, bathrooms: 3, floor: 8, totalFloors: 22,
    address: "Porto Arabia, The Pearl-Qatar", district: "The Pearl-Qatar", city: "Doha",
    photos: [
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200",
    ],
    description: "Stunning luxury apartment located in the prestigious Pearl-Qatar development. This beautifully furnished 3-bedroom unit offers panoramic sea views from the 8th floor. Features an open-plan kitchen with premium appliances, spacious living and dining areas, and three en-suite bathrooms. The building offers world-class amenities including a pool, gym, and 24-hour concierge service.",
    amenities: ["Pool", "Gym", "Parking", "Concierge", "Sea View", "Furnished", "Central AC", "Balcony"],
    featured: true, views: 42,
    agent: { name: "Ahmad Al-Mansoori", email: "ahmad@qatarhomes.com", image: null },
  }

  const photos = (p.photos as string[]) || []
  const isRent = p.listingType === "RENT"

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Photo Gallery */}
          <div className="rounded-2xl overflow-hidden bg-slate-100 mb-6">
            {photos[0] ? (
              <div className="grid grid-cols-2 gap-1 h-80 sm:h-96">
                <img src={photos[0]} alt={p.title} className="w-full h-full object-cover col-span-2 sm:col-span-1 row-span-2" />
                {photos[1] && <img src={photos[1]} alt="" className="w-full h-full object-cover hidden sm:block" />}
                {photos[2] && <img src={photos[2]} alt="" className="w-full h-full object-cover hidden sm:block" />}
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-slate-400">
                <Building2 className="w-16 h-16" />
              </div>
            )}
          </div>

          {/* Title & Badges */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex gap-2 mb-2">
                <Badge variant={isRent ? "default" : "success"}>{isRent ? "For Rent" : "For Sale"}</Badge>
                {p.featured && <Badge variant="warning">Featured</Badge>}
              </div>
              <h1 className="text-2xl font-bold text-slate-900">{p.title}</h1>
              <p className="flex items-center gap-1.5 text-slate-500 text-sm mt-1">
                <MapPin className="w-4 h-4" />
                {p.address}
              </p>
            </div>
            <button className="p-2.5 border border-slate-200 rounded-xl text-slate-400 hover:text-slate-700 transition flex-shrink-0">
              <Share2 className="w-5 h-5" />
            </button>
          </div>

          {/* Price */}
          <div className="mb-6">
            <span className="text-3xl font-bold text-blue-600">{formatPrice(p.price)}</span>
            {isRent && <span className="text-slate-400 ml-1">/year</span>}
          </div>

          {/* Key Details */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {(p.bedrooms ?? null) !== null && (
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <Bed className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                <p className="font-bold text-slate-900">{p.bedrooms}</p>
                <p className="text-xs text-slate-500">Bedrooms</p>
              </div>
            )}
            {(p.bathrooms ?? null) !== null && (
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <Bath className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                <p className="font-bold text-slate-900">{p.bathrooms}</p>
                <p className="text-xs text-slate-500">Bathrooms</p>
              </div>
            )}
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <Maximize className="w-5 h-5 text-blue-600 mx-auto mb-1" />
              <p className="font-bold text-slate-900">{formatArea(p.area)}</p>
              <p className="text-xs text-slate-500">Area</p>
            </div>
            {(p.floor ?? null) !== null && (
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <Building2 className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                <p className="font-bold text-slate-900">Floor {p.floor}</p>
                <p className="text-xs text-slate-500">of {p.totalFloors}</p>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">About this property</h2>
            <p className="text-slate-600 leading-relaxed whitespace-pre-line">{p.description}</p>
          </div>

          {/* Amenities */}
          {(p.amenities as string[])?.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-3">Amenities & Features</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(p.amenities as string[]).map((a) => (
                  <div key={a} className="flex items-center gap-2 text-sm text-slate-700">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    {a}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: Agent + Contact */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sticky top-20">
            <h3 className="font-semibold text-slate-900 mb-4">Contact Agent</h3>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                {(p.agent as { name: string })?.name?.[0] || "A"}
              </div>
              <div>
                <p className="font-semibold text-slate-900">{(p.agent as { name: string })?.name || "Agent"}</p>
                <p className="text-xs text-slate-500">Property Consultant</p>
              </div>
            </div>

            <InquiryForm
              propertyId={p.id}
              propertyTitle={p.title}
              agentName={(p.agent as { name: string })?.name || "Our Agent"}
              agencyPhone={process.env.NEXT_PUBLIC_AGENCY_PHONE}
              agencyEmail={process.env.NEXT_PUBLIC_AGENCY_EMAIL}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
