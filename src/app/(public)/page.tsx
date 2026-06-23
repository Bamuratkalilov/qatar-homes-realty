import Link from "next/link";
import {
  Search,
  MapPin,
  TrendingUp,
  Shield,
  Phone,
  ArrowRight,
  Star,
  Building2,
} from "lucide-react";
import { db } from "@/lib/db";
import { PropertyCard } from "@/components/properties/property-card";

async function getFeaturedProperties() {
  try {
    return await db.property.findMany({
      where: { featured: true, status: "AVAILABLE" },
      take: 6,
      orderBy: { createdAt: "desc" },
    });
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const featured = await getFeaturedProperties();

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-400 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 rounded-full px-4 py-1.5 text-blue-300 text-sm mb-6">
              <Star className="w-4 h-4 fill-current" />
              Qatar&apos;s Trusted Real Estate Platform
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Find Your Perfect
              <span className="text-blue-400"> Home in Qatar</span>
            </h1>
            <p className="text-lg text-slate-300 mb-10">
              Discover premium residential properties across Doha, Lusail, The
              Pearl, and beyond. Expert guidance from qualified local agents.
            </p>

            {/* Search Bar */}
            <div className="bg-white rounded-xl p-2 flex flex-col sm:flex-row gap-2 shadow-2xl">
              <div className="flex items-center gap-3 flex-1 px-3">
                <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search by location, property type..."
                  className="flex-1 text-slate-900 placeholder-slate-400 text-sm outline-none py-2"
                />
              </div>
              <div className="flex gap-2">
                <Link
                  href="/listings?listingType=RENT"
                  className="flex-1 sm:flex-none bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm px-5 py-3 rounded-lg transition text-center"
                >
                  Rent
                </Link>
                <Link
                  href="/listings?listingType=SALE"
                  className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-5 py-3 rounded-lg transition text-center"
                >
                  Buy
                </Link>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 mt-6 text-slate-400 text-sm">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                Doha & All Qatar
              </span>
              <span className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4" />
                500+ Listings
              </span>
              <span className="flex items-center gap-1.5">
                <Shield className="w-4 h-4" />
                RERA Compliant
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-white border-b border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: "500+", label: "Active Listings" },
              { value: "200+", label: "Happy Clients" },
              { value: "50+", label: "Districts Covered" },
              { value: "5★", label: "Average Rating" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-bold text-blue-600">{stat.value}</p>
                <p className="text-sm text-slate-500 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Featured Properties
            </h2>
            <p className="text-slate-500 mt-1">Hand-picked premium listings</p>
          </div>
          <Link
            href="/listings"
            className="flex items-center gap-2 text-blue-600 font-medium text-sm hover:text-blue-700"
          >
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {featured.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Placeholder cards when no DB */}
            {[
              {
                id: "1",
                title: "Luxury 3BR Apartment in The Pearl",
                type: "APARTMENT",
                listingType: "RENT",
                status: "AVAILABLE",
                price: 180000,
                area: 185,
                bedrooms: 3,
                bathrooms: 3,
                address: "Porto Arabia",
                district: "The Pearl-Qatar",
                city: "Doha",
                photos: [
                  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600",
                ],
                featured: true,
              },
              {
                id: "2",
                title: "Modern Villa in Al Waab",
                type: "VILLA",
                listingType: "SALE",
                status: "AVAILABLE",
                price: 3500000,
                area: 450,
                bedrooms: 5,
                bathrooms: 5,
                address: "Al Waab Street",
                district: "Al Waab",
                city: "Doha",
                photos: [
                  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600",
                ],
                featured: true,
              },
              {
                id: "3",
                title: "Studio Apartment in Lusail",
                type: "STUDIO",
                listingType: "RENT",
                status: "AVAILABLE",
                price: 60000,
                area: 65,
                bedrooms: null,
                bathrooms: 1,
                address: "Fox Hills",
                district: "Lusail",
                city: "Lusail",
                photos: [
                  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600",
                ],
                featured: false,
              },
            ].map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </section>

      {/* Why Choose Us */}
      <section className="bg-blue-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-slate-900">
              Why Choose Qatar Homes?
            </h2>
            <p className="text-slate-500 mt-2">
              We make finding property in Qatar simple and stress-free
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: "RERA Compliant",
                desc: "All our listings and agents comply with Qatar Real Estate Regulatory Authority guidelines.",
              },
              {
                icon: TrendingUp,
                title: "Market Expertise",
                desc: "Deep knowledge of Qatar's property market with data-driven pricing and investment advice.",
              },
              {
                icon: Phone,
                title: "Always Available",
                desc: "Our agents are available 7 days a week to answer your questions and arrange viewings.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="bg-white rounded-xl p-6 shadow-sm border border-blue-100 text-center"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>
                <p className="text-sm text-slate-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-600 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Find Your Home?
          </h2>
          <p className="text-blue-200 mb-8">
            Our team of expert agents is ready to help you find the perfect
            property.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/listings"
              className="bg-white text-blue-600 font-semibold px-8 py-3 rounded-xl hover:bg-blue-50 transition"
            >
              Browse Listings
            </Link>
            <Link
              href="/contact"
              className="bg-blue-500 text-white font-semibold px-8 py-3 rounded-xl hover:bg-blue-400 transition border border-blue-400"
            >
              Contact an Agent
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
