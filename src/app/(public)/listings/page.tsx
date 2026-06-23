import { Suspense } from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { PropertyCard } from "@/components/properties/property-card";
import { ListingsFilters } from "@/components/public/listings-filters";
import { SortSelect } from "@/components/public/sort-select";
import { LayoutSwitcher } from "@/components/public/layout-switcher";
import { PropertyMap } from "@/components/public/map-wrapper";
import type { ViewMode } from "@/components/public/layout-switcher";
import {
  Building2,
  MapPin,
  Bed,
  Bath,
  Maximize,
  ArrowRight,
} from "lucide-react";
import { formatPrice, formatArea } from "@/lib/utils";

interface SearchParams {
  listingType?: string;
  type?: string;
  category?: string;
  propertyType?: string;
  district?: string;
  minPrice?: string;
  maxPrice?: string;
  bedrooms?: string;
  bathrooms?: string;
  exactBeds?: string;
  furnishing?: string;
  minArea?: string;
  maxArea?: string;
  amenities?: string;
  utilities?: string;
  sort?: string;
  q?: string;
  view?: string;
}

async function getProperties(p: SearchParams) {
  try {
    const listingType =
      p.listingType ||
      (p.type === "RENT" || p.type === "SALE" ? p.type : undefined);
    const where: Record<string, unknown> = { status: "AVAILABLE" };
    if (listingType) where.listingType = listingType;
    if (p.propertyType) where.type = p.propertyType;
    if (p.district) where.district = p.district;
    if (p.bedrooms !== undefined && p.bedrooms !== "") {
      const n = parseInt(p.bedrooms);
      if (!isNaN(n)) {
        where.bedrooms = n === 0 ? 0 : p.exactBeds === "1" ? n : { gte: n };
      }
    }
    if (p.bathrooms) where.bathrooms = { gte: parseInt(p.bathrooms) };
    if (p.furnishing) where.furnishing = p.furnishing;
    if (p.minArea || p.maxArea) {
      const area: Record<string, number> = {};
      if (p.minArea) area.gte = parseFloat(p.minArea);
      if (p.maxArea) area.lte = parseFloat(p.maxArea);
      where.area = area;
    }
    if (p.utilities === "1") where.utilityBillsIncluded = true;
    if (p.amenities) {
      const list = p.amenities.split(",").filter(Boolean);
      if (list.length > 0) where.amenities = { hasSome: list };
    }
    if (p.category === "COMMERCIAL") {
      where.category = "COMMERCIAL";
    } else if (!p.category) {
      // default: show all (both residential and commercial)
    }
    if (p.minPrice || p.maxPrice) {
      const price: Record<string, number> = {};
      if (p.minPrice) price.gte = parseFloat(p.minPrice);
      if (p.maxPrice) price.lte = parseFloat(p.maxPrice);
      where.price = price;
    }
    if (p.q) {
      where.OR = [
        { title: { contains: p.q, mode: "insensitive" } },
        { district: { contains: p.q, mode: "insensitive" } },
        { address: { contains: p.q, mode: "insensitive" } },
        { city: { contains: p.q, mode: "insensitive" } },
      ];
    }
    const orderBy =
      p.sort === "price_asc"
        ? [{ price: "asc" as const }]
        : p.sort === "price_desc"
          ? [{ price: "desc" as const }]
          : [{ featured: "desc" as const }, { createdAt: "desc" as const }];

    return await db.property.findMany({ where, orderBy, take: 80 });
  } catch {
    return [];
  }
}

function pageTitle(p: SearchParams) {
  const listingType = p.listingType || p.type;
  const loc = p.district ? ` in ${p.district}` : " in Qatar";
  const type =
    listingType === "RENT"
      ? "Rentals"
      : listingType === "SALE"
        ? "Properties for Sale"
        : "Properties";
  const cat = p.category === "COMMERCIAL" ? "Commercial " : "";
  return `${cat}${type}${loc}`;
}

// Compact list-view row
function PropertyRow({
  p,
}: {
  p: Awaited<ReturnType<typeof getProperties>>[number];
}) {
  const isRent = p.listingType === "RENT";
  const photo = p.photos[0];
  return (
    <Link
      href={`/listings/${p.id}`}
      className="flex items-center gap-4 px-5 py-3.5 hover:bg-blue-50/50 transition-colors border-b border-slate-100 group"
    >
      <div className="w-20 h-14 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
        {photo ? (
          <img
            src={photo}
            alt={p.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <Building2 className="w-6 h-6 text-slate-300 m-4" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-slate-800 truncate group-hover:text-blue-600">
          {p.title}
        </p>
        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
          <MapPin className="w-3 h-3" />
          {p.district || p.city}
        </p>
      </div>
      <div className="hidden sm:flex items-center gap-3 text-[12px] text-slate-500">
        {p.bedrooms != null && (
          <span className="flex items-center gap-1">
            <Bed className="w-3.5 h-3.5" />
            {p.bedrooms}
          </span>
        )}
        {p.bathrooms != null && (
          <span className="flex items-center gap-1">
            <Bath className="w-3.5 h-3.5" />
            {p.bathrooms}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Maximize className="w-3.5 h-3.5" />
          {formatArea(p.area)}
        </span>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-[14px] font-bold text-blue-600">
          {formatPrice(p.price)}
        </p>
        {isRent && <p className="text-[10px] text-slate-400">per year</p>}
      </div>
      <ArrowRight className="w-4 h-4 text-slate-300 flex-shrink-0 group-hover:text-blue-500 transition-colors" />
    </Link>
  );
}

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const properties = await getProperties(params);
  const view = (params.view || "split") as ViewMode;
  const title = pageTitle(params);

  // ─── Full Map ────────────────────────────────────────────────
  if (view === "map") {
    return (
      <>
        <Suspense>
          <ListingsFilters />
        </Suspense>
        <div className="relative" style={{ height: "calc(100vh - 112px)" }}>
          <PropertyMap properties={properties} fullscreen />
          {/* Floating result count */}
          <div className="absolute top-3 left-3 bg-white rounded-xl shadow-lg px-4 py-2.5 z-10 text-sm font-semibold text-slate-800">
            {properties.length}{" "}
            {properties.length === 1 ? "property" : "properties"}
          </div>
          {/* Layout switcher */}
          <div className="absolute top-3 right-14 z-10">
            <Suspense>
              <LayoutSwitcher current={view} />
            </Suspense>
          </div>
        </div>
      </>
    );
  }

  const Header = (
    <div className="flex items-start justify-between gap-4 mb-5">
      <div>
        <h1 className="text-[22px] font-bold text-slate-900">{title}</h1>
        <p className="text-slate-500 text-[13px] mt-0.5">
          {properties.length} {properties.length === 1 ? "result" : "results"}
          {params.district ? ` near ${params.district}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="text-[13px] text-slate-500 hidden sm:block">
          Sort:
        </span>
        <Suspense>
          <SortSelect current={params.sort || ""} />
        </Suspense>
        <Suspense>
          <LayoutSwitcher current={view} />
        </Suspense>
      </div>
    </div>
  );

  const EmptyState = (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-5">
        <Building2 className="w-10 h-10 text-slate-300" />
      </div>
      <h2 className="text-xl font-bold text-slate-700 mb-2">
        No properties found
      </h2>
      <p className="text-slate-400 text-sm max-w-xs mb-6">
        Try adjusting your filters to see more results.
      </p>
      <Link
        href="/listings"
        className="bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition"
      >
        Clear filters
      </Link>
    </div>
  );

  // ─── Grid ─────────────────────────────────────────────────────
  if (view === "grid") {
    return (
      <>
        <Suspense>
          <ListingsFilters />
        </Suspense>
        <div className="max-w-[1320px] mx-auto px-6 lg:px-10 py-7">
          {Header}
          {properties.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {properties.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          ) : (
            EmptyState
          )}
        </div>
      </>
    );
  }

  // ─── List / Table ─────────────────────────────────────────────
  if (view === "list") {
    return (
      <>
        <Suspense>
          <ListingsFilters />
        </Suspense>
        <div className="max-w-[1100px] mx-auto px-6 lg:px-10 py-7">
          {Header}
          {properties.length > 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              {properties.map((p) => (
                <PropertyRow key={p.id} p={p} />
              ))}
            </div>
          ) : (
            EmptyState
          )}
        </div>
      </>
    );
  }

  // ─── Split (default) ─────────────────────────────────────────
  return (
    <>
      <Suspense>
        <ListingsFilters />
      </Suspense>

      <div className="flex" style={{ height: "calc(100vh - 112px)" }}>
        {/* Left: scrollable listings */}
        <div className="w-1/2 overflow-y-auto flex-shrink-0 border-r border-slate-200">
          <div className="p-5">
            {Header}
            {properties.length > 0 ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {properties.map((p) => (
                  <PropertyCard key={p.id} property={p} />
                ))}
              </div>
            ) : (
              EmptyState
            )}
          </div>
        </div>

        {/* Right: sticky map */}
        <div className="flex-1 sticky top-[112px] h-full">
          <PropertyMap properties={properties} />
        </div>
      </div>
    </>
  );
}
