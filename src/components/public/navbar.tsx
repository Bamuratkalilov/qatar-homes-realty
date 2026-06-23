"use client"

import Link from "next/link"
import { useState, useRef, useEffect } from "react"
import { ChevronDown, Menu, X, Building2, User } from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  {
    label: "Rent",
    links: [
      { label: "All Rentals",           href: "/listings?listingType=RENT" },
      { label: "Apartments for Rent",   href: "/listings?listingType=RENT&type=APARTMENT" },
      { label: "Villas for Rent",       href: "/listings?listingType=RENT&type=VILLA" },
      { label: "Short-term Rentals",    href: "/listings?listingType=RENT&availability=SHORT_TERM" },
    ],
  },
  {
    label: "Buy",
    links: [
      { label: "Homes for Sale",        href: "/listings?listingType=SALE" },
      { label: "Apartments for Sale",   href: "/listings?listingType=SALE&type=APARTMENT" },
      { label: "Villas for Sale",       href: "/listings?listingType=SALE&type=VILLA" },
      { label: "New Developments",      href: "/listings?listingType=SALE&availability=NEW" },
    ],
  },
  {
    label: "Commercials",
    links: [
      { label: "Office Space",          href: "/listings?category=COMMERCIAL&type=OFFICE" },
      { label: "Retail Units",          href: "/listings?category=COMMERCIAL&type=RETAIL" },
      { label: "Warehouses",            href: "/listings?category=COMMERCIAL&type=WAREHOUSE" },
      { label: "Land",                  href: "/listings?category=COMMERCIAL&type=LAND" },
    ],
  },
  {
    label: "Real Estate Agents",
    links: [
      { label: "Find an Agent",         href: "/contact" },
      { label: "Our Team",              href: "/contact#team" },
      { label: "Join Our Network",      href: "/contact?reason=join" },
    ],
  },
  {
    label: "News",
    href: "/news",
  },
] as const

function NavDropdown({ item }: { item: (typeof NAV_ITEMS)[number] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  if (!("links" in item)) {
    return (
      <Link
        href={item.href}
        className="text-[13.5px] font-medium text-slate-700 hover:text-slate-900 transition-colors whitespace-nowrap"
      >
        {item.label}
      </Link>
    )
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className={cn(
          "flex items-center gap-0.5 text-[13.5px] font-medium transition-colors whitespace-nowrap py-1",
          open ? "text-slate-900" : "text-slate-700 hover:text-slate-900"
        )}
      >
        {item.label}
        <ChevronDown className={cn("w-3.5 h-3.5 mt-px transition-transform duration-200", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 pt-3 z-50">
          {/* invisible bridge closes the gap so mouse can travel to the panel without closing */}
          <div className="absolute -top-1 left-0 right-0 h-4" />
          <div className="bg-white rounded-xl shadow-xl border border-slate-100 py-2 min-w-[210px]">
            {/* pointer arrow */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-l border-t border-slate-100 rotate-45 -mt-1.5" />
            {"links" in item && item.links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-5 py-2.5 text-[13px] text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-slate-200">
      <div className="max-w-[1320px] mx-auto px-6 lg:px-10">
        <div className="flex items-center h-[60px] gap-8">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0 mr-4">
            <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
              <Building2 className="w-4.5 h-4.5 text-white w-[18px] h-[18px]" />
            </div>
            <div className="leading-tight">
              <span className="block font-bold text-slate-900 text-[15px] leading-none">Qatar Homes</span>
              <span className="block text-[10px] text-slate-400 leading-none mt-0.5">Realty</span>
            </div>
          </Link>

          {/* Desktop Nav — pushed to the right */}
          <div className="hidden lg:flex items-center gap-7 ml-auto">
            {NAV_ITEMS.map((item) => (
              <NavDropdown key={item.label} item={item} />
            ))}
          </div>

          {/* Right side */}
          <div className="hidden lg:flex items-center gap-3 pl-6 border-l border-slate-200">
            <Link
              href="/login"
              className="flex items-center gap-2 text-[13.5px] font-medium text-slate-700 hover:text-slate-900 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white text-xs font-bold">
                <User className="w-4 h-4" />
              </div>
              <span>Sign In</span>
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <button
            className="lg:hidden ml-auto p-2 text-slate-600 hover:text-slate-900"
            onClick={() => setMobileOpen(v => !v)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-100 bg-white divide-y divide-slate-100">
          {NAV_ITEMS.map((item) => (
            <div key={item.label}>
              {"href" in item && !("links" in item) ? (
                <Link
                  href={item.href}
                  className="block px-6 py-3.5 text-sm font-medium text-slate-700"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              ) : (
                <MobileSection item={item as Extract<(typeof NAV_ITEMS)[number], { links: readonly { label: string; href: string }[] }>} onClose={() => setMobileOpen(false)} />
              )}
            </div>
          ))}
          <div className="px-6 py-4">
            <Link
              href="/login"
              className="flex items-center gap-2 text-sm font-medium text-slate-700"
              onClick={() => setMobileOpen(false)}
            >
              <User className="w-4 h-4" />
              Sign In
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}

function MobileSection({
  item,
  onClose,
}: {
  item: Extract<(typeof NAV_ITEMS)[number], { links: readonly { label: string; href: string }[] }>
  onClose: () => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button
        className="flex items-center justify-between w-full px-6 py-3.5 text-sm font-medium text-slate-700"
        onClick={() => setOpen(v => !v)}
      >
        {item.label}
        <ChevronDown className={cn("w-4 h-4 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="bg-slate-50 px-6 pb-2">
          {item.links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block py-2.5 text-sm text-slate-600 hover:text-slate-900"
              onClick={onClose}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
