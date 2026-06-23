"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Search, ChevronDown, X, SlidersHorizontal, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { QATAR_DISTRICTS, RESIDENTIAL_TYPES, COMMERCIAL_TYPES } from "@/lib/utils";

const AMENITIES = [
  { v: "Pool",       l: "Swimming Pool"       },
  { v: "Gym",        l: "Gym / Fitness"        },
  { v: "Parking",    l: "Covered Parking"      },
  { v: "Balcony",    l: "Balcony"              },
  { v: "Security",   l: "24/7 Security"        },
  { v: "Maid",       l: "Maid's Room"          },
  { v: "Study",      l: "Study Room"           },
  { v: "CentralAC",  l: "Central A/C"          },
  { v: "Wardrobes",  l: "Built-in Wardrobes"   },
  { v: "SeaView",    l: "Sea View"             },
  { v: "CityView",   l: "City View"            },
  { v: "Playground", l: "Kids' Playground"     },
  { v: "Concierge",  l: "Concierge"            },
  { v: "Elevator",   l: "Elevator"             },
];

const FURNISHING_OPTS = [
  { v: "",               l: "Any"           },
  { v: "FURNISHED",      l: "Furnished"     },
  { v: "SEMI_FURNISHED", l: "Semi-Furnished"},
  { v: "UNFURNISHED",    l: "Unfurnished"   },
];

function FiltersDrawer({
  open,
  onClose,
  furnishing,
  minArea,
  maxArea,
  amenitiesStr,
  utilities,
  push,
}: {
  open: boolean;
  onClose: () => void;
  furnishing: string;
  minArea: string;
  maxArea: string;
  amenitiesStr: string;
  utilities: string;
  push: (u: Record<string, string>) => void;
}) {
  const initAmenities = amenitiesStr ? amenitiesStr.split(",").filter(Boolean) : [];
  const [pendingFurnishing, setPendingFurnishing] = useState(furnishing);
  const [pendingMinArea, setPendingMinArea] = useState(minArea);
  const [pendingMaxArea, setPendingMaxArea] = useState(maxArea);
  const [pendingAmenities, setPendingAmenities] = useState<string[]>(initAmenities);
  const [pendingUtilities, setPendingUtilities] = useState(utilities === "1");

  // Sync when URL changes
  useEffect(() => {
    setPendingFurnishing(furnishing);
    setPendingMinArea(minArea);
    setPendingMaxArea(maxArea);
    setPendingAmenities(amenitiesStr ? amenitiesStr.split(",").filter(Boolean) : []);
    setPendingUtilities(utilities === "1");
  }, [furnishing, minArea, maxArea, amenitiesStr, utilities]);

  function toggleAmenity(v: string) {
    setPendingAmenities((prev) =>
      prev.includes(v) ? prev.filter((a) => a !== v) : [...prev, v]
    );
  }

  function apply() {
    push({
      furnishing: pendingFurnishing,
      minArea: pendingMinArea,
      maxArea: pendingMaxArea,
      amenities: pendingAmenities.join(","),
      utilities: pendingUtilities ? "1" : "",
    });
    onClose();
  }

  function clearAll() {
    setPendingFurnishing("");
    setPendingMinArea("");
    setPendingMaxArea("");
    setPendingAmenities([]);
    setPendingUtilities(false);
    push({ furnishing: "", minArea: "", maxArea: "", amenities: "", utilities: "" });
    onClose();
  }

  const activeCount = [
    pendingFurnishing,
    pendingMinArea || pendingMaxArea,
    pendingAmenities.length > 0,
    pendingUtilities,
  ].filter(Boolean).length;

  if (!open) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[1000]"
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full max-w-[440px] bg-white z-[1001] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-[16px] font-bold text-slate-900">Filters</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">

          {/* Furnishing */}
          <div className="px-6 py-5 border-b border-slate-100">
            <p className="text-[13px] font-bold text-slate-800 mb-3">Furnishing</p>
            <div className="grid grid-cols-2 gap-2">
              {FURNISHING_OPTS.map((o) => (
                <button
                  key={o.v}
                  type="button"
                  onClick={() => setPendingFurnishing(o.v)}
                  className={cn(
                    "py-2.5 px-4 rounded-xl border text-[13px] font-medium transition-all text-left",
                    pendingFurnishing === o.v
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-slate-200 text-slate-700 hover:border-slate-300 bg-white",
                  )}
                >
                  {o.l}
                </button>
              ))}
            </div>
          </div>

          {/* Area */}
          <div className="px-6 py-5 border-b border-slate-100">
            <p className="text-[13px] font-bold text-slate-800 mb-3">Area (sqm)</p>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-[11px] font-semibold text-slate-500 mb-1.5">Min</p>
                <input
                  type="number"
                  placeholder="No min"
                  value={pendingMinArea}
                  onChange={(e) => setPendingMinArea(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-[13px] text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                />
              </div>
              <span className="text-slate-400 mt-5">–</span>
              <div className="flex-1">
                <p className="text-[11px] font-semibold text-slate-500 mb-1.5">Max</p>
                <input
                  type="number"
                  placeholder="No max"
                  value={pendingMaxArea}
                  onChange={(e) => setPendingMaxArea(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-[13px] text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                />
              </div>
            </div>
          </div>

          {/* Utilities */}
          <div className="px-6 py-5 border-b border-slate-100">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-[13px] font-bold text-slate-800">Utilities Included</p>
                <p className="text-[12px] text-slate-400 mt-0.5">Water, electricity & AC bills</p>
              </div>
              <button
                type="button"
                onClick={() => setPendingUtilities((v) => !v)}
                className={cn(
                  "w-11 h-6 rounded-full transition-colors relative flex-shrink-0",
                  pendingUtilities ? "bg-blue-600" : "bg-slate-200",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all",
                    pendingUtilities ? "left-[22px]" : "left-0.5",
                  )}
                />
              </button>
            </label>
          </div>

          {/* Amenities */}
          <div className="px-6 py-5">
            <p className="text-[13px] font-bold text-slate-800 mb-3">Amenities</p>
            <div className="grid grid-cols-2 gap-2">
              {AMENITIES.map((a) => {
                const checked = pendingAmenities.includes(a.v);
                return (
                  <button
                    key={a.v}
                    type="button"
                    onClick={() => toggleAmenity(a.v)}
                    className={cn(
                      "flex items-center gap-2.5 py-2.5 px-3.5 rounded-xl border text-[13px] transition-all text-left",
                      checked
                        ? "border-blue-600 bg-blue-50 text-blue-700 font-medium"
                        : "border-slate-200 text-slate-700 hover:border-slate-300 bg-white",
                    )}
                  >
                    <span
                      className={cn(
                        "w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border",
                        checked ? "bg-blue-600 border-blue-600" : "border-slate-300",
                      )}
                    >
                      {checked && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                    </span>
                    {a.l}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center gap-3">
          <button
            type="button"
            onClick={clearAll}
            className="flex-1 py-3 rounded-full border border-slate-300 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Clear all
          </button>
          <button
            type="button"
            onClick={apply}
            className="flex-1 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-bold transition-colors"
          >
            See results
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}

// Decorative histogram shape (bell-skewed left = more affordable listings)
const HIST = [3,5,9,16,26,42,58,72,82,90,93,89,80,69,58,47,38,30,23,18,14,11,8,6,5,4,3,3,2,2];

function fmtQAR(v: number): string {
  if (v >= 1_000_000) return `QAR ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `QAR ${Math.round(v / 1_000)}K`;
  return `QAR ${v}`;
}

function PricePill({
  listing,
  minPrice,
  maxPrice,
  push,
}: {
  listing: string;
  minPrice: string;
  maxPrice: string;
  push: (u: Record<string, string>) => void;
}) {
  const isRent = listing === "RENT";
  const PMAX = isRent ? 500_000 : 5_000_000;
  const STEP = isRent ? 5_000 : 50_000;

  const [open, setOpen] = useState(false);
  const [minV, setMinV] = useState(minPrice ? parseInt(minPrice) : 0);
  const [maxV, setMaxV] = useState(maxPrice ? parseInt(maxPrice) : PMAX);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMinV(minPrice ? parseInt(minPrice) : 0);
    setMaxV(maxPrice ? parseInt(maxPrice) : PMAX);
  }, [minPrice, maxPrice, PMAX]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      document.addEventListener("click", () => setOpen(false), { once: true });
    }, 0);
    return () => clearTimeout(t);
  }, [open]);

  function toggle() {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + window.scrollY + 8, left: r.left + window.scrollX });
    }
    setOpen((v) => !v);
  }

  function apply() {
    push({ minPrice: minV > 0 ? String(minV) : "", maxPrice: maxV < PMAX ? String(maxV) : "" });
    setOpen(false);
  }

  const minPct = (minV / PMAX) * 100;
  const maxPct = (maxV / PMAX) * 100;
  const hasFilter = !!(minPrice || maxPrice);

  const pillLabel = hasFilter
    ? `${fmtQAR(parseInt(minPrice || "0"))} – ${maxPrice ? fmtQAR(parseInt(maxPrice)) : "Max"}`
    : "Price";

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        className={cn(
          "flex items-center gap-1 h-9 px-4 rounded-full border text-[13px] font-medium transition-all flex-shrink-0",
          hasFilter
            ? "border-blue-600 bg-blue-50 text-blue-700"
            : open
              ? "border-slate-400 bg-white text-slate-800"
              : "border-slate-300 bg-white text-slate-700 hover:border-slate-400",
        )}
      >
        {pillLabel}
        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", open && "rotate-180")} />
      </button>

      {open && createPortal(
        <div
          onClick={(e) => e.stopPropagation()}
          style={{ position: "absolute", top: pos.top, left: pos.left, zIndex: 9999 }}
          className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-80 overflow-hidden"
        >
          {/* Header */}
          <div className="px-5 pt-5 pb-2">
            <p className="text-[13px] font-bold text-slate-700">Price Range</p>
          </div>

          {/* Histogram */}
          <div className="px-5 flex items-end gap-[2px] h-[72px]">
            {HIST.map((h, i) => {
              const barPrice = (i / HIST.length) * PMAX;
              const inRange = barPrice >= minV && barPrice <= maxV;
              return (
                <div
                  key={i}
                  className="flex-1 rounded-t-[2px] transition-colors duration-150"
                  style={{ height: `${h}%`, background: inRange ? "#2563eb" : "#e2e8f0" }}
                />
              );
            })}
          </div>

          {/* Dual range slider */}
          <div className="px-5 mt-2">
            <div className="relative h-6">
              <div className="absolute top-1/2 -translate-y-1/2 w-full h-1.5 bg-slate-200 rounded-full" />
              <div
                className="absolute top-1/2 -translate-y-1/2 h-1.5 bg-blue-600 rounded-full"
                style={{ left: `${minPct}%`, width: `${maxPct - minPct}%` }}
              />
              <input
                type="range" min={0} max={PMAX} step={STEP} value={minV}
                onChange={(e) => setMinV(Math.min(parseInt(e.target.value), maxV - STEP))}
                className="absolute w-full h-full opacity-0 cursor-pointer"
                style={{ zIndex: minV > PMAX * 0.5 ? 5 : 3 }}
              />
              <input
                type="range" min={0} max={PMAX} step={STEP} value={maxV}
                onChange={(e) => setMaxV(Math.max(parseInt(e.target.value), minV + STEP))}
                className="absolute w-full h-full opacity-0 cursor-pointer"
                style={{ zIndex: minV > PMAX * 0.5 ? 3 : 5 }}
              />
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 bg-white rounded-full border-2 border-blue-600 shadow-md pointer-events-none"
                style={{ left: `${minPct}%` }} />
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 bg-white rounded-full border-2 border-blue-600 shadow-md pointer-events-none"
                style={{ left: `${maxPct}%` }} />
            </div>
            <div className="flex justify-between mt-1.5 text-[11px] text-slate-400">
              <span>QAR 0</span>
              <span>{fmtQAR(PMAX)}+</span>
            </div>
          </div>

          {/* Min / Max inputs */}
          <div className="px-5 mt-4 flex items-center gap-3">
            <div className="flex-1">
              <p className="text-[11px] font-semibold text-slate-600 mb-1.5">Min</p>
              <input
                type="number"
                placeholder="No min"
                value={minV === 0 ? "" : minV}
                onChange={(e) => setMinV(Math.min(parseInt(e.target.value) || 0, maxV - STEP))}
                className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-[13px] text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
              />
            </div>
            <span className="text-slate-400 mt-5 text-sm">–</span>
            <div className="flex-1">
              <p className="text-[11px] font-semibold text-slate-600 mb-1.5">Max</p>
              <input
                type="number"
                placeholder="No max"
                value={maxV >= PMAX ? "" : maxV}
                onChange={(e) => setMaxV(Math.max(parseInt(e.target.value) || PMAX, minV + STEP))}
                className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-[13px] text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* Apply */}
          <div className="px-5 py-4 mt-1">
            <button
              type="button"
              onClick={apply}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-[13px] py-3 rounded-full transition-colors"
            >
              See results
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
const BED_OPTS  = ["Studio", "1+", "2+", "3+", "4+", "5+"];
const BATH_OPTS = ["Any", "1+", "2+", "3+", "4+"];

function SegmentGroup({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex rounded-xl border border-slate-200 overflow-hidden">
      {options.map((o, i) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o === "Any" ? "" : o)}
          className={cn(
            "flex-1 py-2.5 text-center text-[13px] font-semibold transition-all relative",
            i > 0 && "border-l border-slate-200",
            (o === "Any" && value === "") || value === o
              ? "bg-blue-50 text-blue-700 shadow-[inset_0_0_0_2px_#2563eb] z-10"
              : "bg-white text-slate-700 hover:bg-slate-50",
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function BedsBathsPill({
  beds,
  bathrooms,
  push,
}: {
  beds: string;
  bathrooms: string;
  push: (u: Record<string, string>) => void;
}) {
  const toDisplay = (v: string) => {
    if (v === "0") return "Studio";
    return v ? `${v}+` : "";
  };
  const [open, setOpen] = useState(false);
  const [pendingBeds, setPendingBeds] = useState(toDisplay(beds));
  const [pendingBaths, setPendingBaths] = useState(toDisplay(bathrooms));
  const [exactBeds, setExactBeds] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setPendingBeds(toDisplay(beds));
    setPendingBaths(toDisplay(bathrooms));
  }, [beds, bathrooms]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      document.addEventListener("click", () => setOpen(false), { once: true });
    }, 0);
    return () => clearTimeout(t);
  }, [open]);

  function toggle() {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + window.scrollY + 8, left: r.left + window.scrollX });
    }
    setOpen((v) => !v);
  }

  function apply() {
    push({
      bedrooms: pendingBeds === "Studio" ? "0" : pendingBeds ? pendingBeds.replace("+", "") : "",
      bathrooms: pendingBaths ? pendingBaths.replace("+", "") : "",
      exactBeds: exactBeds ? "1" : "",
    });
    setOpen(false);
  }

  const hasFilter = !!(beds || bathrooms);
  const bedLabel = beds === "0" ? "Studio" : beds ? `${beds}+ bd` : "";
  const bathLabel = bathrooms ? `${bathrooms}+ ba` : "";
  const label = [bedLabel, bathLabel].filter(Boolean).join(" · ") || "Beds & baths";

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        className={cn(
          "flex items-center gap-1 h-9 px-4 rounded-full border text-[13px] font-medium transition-all flex-shrink-0",
          hasFilter
            ? "border-blue-600 bg-blue-50 text-blue-700"
            : open
              ? "border-slate-400 bg-white text-slate-800"
              : "border-slate-300 bg-white text-slate-700 hover:border-slate-400",
        )}
      >
        {label}
        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", open && "rotate-180")} />
      </button>

      {open && createPortal(
        <div
          onClick={(e) => e.stopPropagation()}
          style={{ position: "absolute", top: pos.top, left: pos.left, zIndex: 9999 }}
          className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-[380px] overflow-hidden"
        >
          {/* Bedrooms */}
          <div className="bg-slate-50 px-5 py-2.5">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Number of Bedrooms</p>
          </div>
          <div className="px-5 pt-4 pb-5">
            <p className="text-[13px] font-bold text-slate-800 mb-3">Bedrooms</p>
            <SegmentGroup options={BED_OPTS} value={pendingBeds} onChange={setPendingBeds} />
            <label className="flex items-center gap-2.5 mt-3.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={exactBeds}
                onChange={(e) => setExactBeds(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 accent-blue-600 cursor-pointer"
              />
              <span className="text-[13px] text-slate-700">Use exact match</span>
            </label>
          </div>

          {/* Bathrooms */}
          <div className="bg-slate-50 px-5 py-2.5 border-t border-slate-100">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Number of Bathrooms</p>
          </div>
          <div className="px-5 pt-4 pb-5">
            <p className="text-[13px] font-bold text-slate-800 mb-3">Bathrooms</p>
            <SegmentGroup options={BATH_OPTS} value={pendingBaths} onChange={setPendingBaths} />
          </div>

          {/* Apply */}
          <div className="px-5 pb-5">
            <button
              type="button"
              onClick={apply}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-[13px] py-3 rounded-full transition-colors"
            >
              See results
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
const RES_TYPES = [
  { v: "", l: "Any" },
  ...RESIDENTIAL_TYPES.map((t) => ({ v: t.value, l: t.label })),
];
const COM_TYPES = [
  { v: "", l: "Any" },
  ...COMMERCIAL_TYPES.map((t) => ({ v: t.value, l: t.label })),
];


function RentBuyPill({
  listing,
  push,
}: {
  listing: string;
  push: (u: Record<string, string>) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(listing || "RENT");
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { if (listing) setPending(listing); }, [listing]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      function close() { setOpen(false); }
      document.addEventListener("click", close, { once: true });
    }, 0);
    return () => clearTimeout(timer);
  }, [open]);

  function toggle() {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + window.scrollY + 8, left: r.left + window.scrollX });
    }
    setOpen((v) => !v);
  }

  const label = listing === "RENT" ? "For Rent" : listing === "SALE" ? "For Sale" : "For Rent";

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        className={cn(
          "flex items-center gap-1 h-9 px-4 rounded-full border text-[13px] font-medium transition-all flex-shrink-0",
          listing
            ? "border-blue-600 bg-blue-50 text-blue-700"
            : open
              ? "border-slate-400 bg-white text-slate-800"
              : "border-slate-300 bg-white text-slate-700 hover:border-slate-400",
        )}
      >
        {label}
        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", open && "rotate-180")} />
      </button>

      {open && createPortal(
        <div
          onClick={(e) => e.stopPropagation()}
          style={{ position: "absolute", top: pos.top, left: pos.left, zIndex: 9999 }}
          className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-60 overflow-hidden"
        >
          {[
            { v: "SALE", l: "For sale" },
            { v: "RENT", l: "For rent" },
          ].map((o, i) => (
            <div key={o.v}>
              <div
                onClick={() => setPending(o.v)}
                className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <span className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                  pending === o.v ? "border-blue-600" : "border-slate-300",
                )}>
                  {pending === o.v && <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                </span>
                <span className="text-[13px] text-slate-800">{o.l}</span>
              </div>
              {i === 0 && <div className="border-b border-slate-100 mx-5" />}
            </div>
          ))}
          <div className="px-5 py-4">
            <button
              type="button"
              onClick={() => { push({ listingType: pending, minPrice: "", maxPrice: "" }); setOpen(false); }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-[13px] py-2.5 rounded-full transition-colors"
            >
              Done
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

function HomeTypePill({
  label,
  defaultLabel,
  propType,
  typesArr,
  isCommercial,
  push,
}: {
  label: string;
  defaultLabel: string;
  propType: string;
  typesArr: { v: string; l: string }[];
  isCommercial: boolean;
  push: (u: Record<string, string>) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      document.addEventListener("click", () => setOpen(false), { once: true });
    }, 0);
    return () => clearTimeout(t);
  }, [open]);

  function toggle() {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + window.scrollY + 8, left: r.left + window.scrollX });
    }
    setOpen((v) => !v);
  }

  const sectionTitle = isCommercial ? "Commercial Property Type" : "Residential Home Type";

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        className={cn(
          "flex items-center gap-1 h-9 px-4 rounded-full border text-[13px] font-medium transition-all flex-shrink-0",
          propType
            ? "border-blue-600 bg-blue-50 text-blue-700"
            : open
              ? "border-slate-400 bg-white text-slate-800"
              : "border-slate-300 bg-white text-slate-700 hover:border-slate-400",
        )}
      >
        {label}
        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", open && "rotate-180")} />
      </button>

      {open && createPortal(
        <div
          onClick={(e) => e.stopPropagation()}
          style={{ position: "absolute", top: pos.top, left: pos.left, zIndex: 9999 }}
          className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-56 overflow-hidden"
        >
          <div className="bg-slate-50 px-4 py-2.5">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              {sectionTitle}
            </p>
          </div>
          <div className="p-2">
            {typesArr.map((t) => (
              <button
                key={t.v}
                type="button"
                onClick={() => { push({ propertyType: t.v }); setOpen(false); }}
                className={cn(
                  "w-full text-left px-4 py-2.5 text-[13px] rounded-lg transition-colors flex items-center justify-between",
                  propType === t.v
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "text-slate-700 hover:bg-slate-50",
                )}
              >
                {t.l}
                {propType === t.v && (
                  <span className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                    <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                      <path d="M1 3l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

function Pill({
  label,
  active,
  children,
}: {
  label: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-1 h-9 px-4 rounded-full border text-[13px] font-medium transition-all",
          active
            ? "border-blue-600 bg-blue-50 text-blue-700"
            : open
              ? "border-slate-400 bg-white text-slate-800"
              : "border-slate-300 bg-white text-slate-700 hover:border-slate-400",
        )}
      >
        {label}
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div
          className="absolute top-full left-0 mt-1.5 bg-white rounded-xl shadow-2xl border border-slate-100 z-50"
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function ListingsFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const typeParam = sp.get("type");
  const listing =
    sp.get("listingType") ||
    (typeParam === "RENT" || typeParam === "SALE" ? typeParam : "");
  const category = sp.get("category") || ""; // RESIDENTIAL | COMMERCIAL
  const minPrice = sp.get("minPrice") || "";
  const maxPrice = sp.get("maxPrice") || "";
  const beds = sp.get("bedrooms") || "";
  const bathrooms = sp.get("bathrooms") || "";
  const propType = sp.get("propertyType") || "";
  const furnishing = sp.get("furnishing") || "";
  const minArea = sp.get("minArea") || "";
  const maxArea = sp.get("maxArea") || "";
  const amenitiesStr = sp.get("amenities") || "";
  const utilities = sp.get("utilities") || "";
  const q = sp.get("q") || "";
  const [drawerOpen, setDrawerOpen] = useState(false);

  const push = useCallback(
    (updates: Record<string, string>) => {
      const next = new URLSearchParams(sp.toString());
      Object.entries(updates).forEach(([k, v]) => {
        if (k === "listingType") {
          next.delete("type");
        }
        if (k === "type") {
          next.delete("listingType");
        }
        v ? next.set(k, v) : next.delete(k);
      });
      router.push(`${pathname}?${next.toString()}`);
    },
    [router, pathname, sp],
  );

  const isCommercial = category === "COMMERCIAL";
  const typesArr = isCommercial ? COM_TYPES : RES_TYPES;
  const hasFilter = !!(
    minPrice || maxPrice || beds || bathrooms || propType || category ||
    furnishing || minArea || maxArea || amenitiesStr || utilities
  );
  const extraFilterCount = [furnishing, minArea || maxArea, amenitiesStr, utilities === "1"]
    .filter(Boolean).length;
  const defaultTypeLabel = isCommercial ? "Property type" : "Home type";
  const typeLabel = propType
    ? typesArr.find((t) => t.v === propType)?.l || defaultTypeLabel
    : defaultTypeLabel;

  return (
    <div className="sticky top-[60px] z-40 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-[1320px] mx-auto px-6 lg:px-10 py-2.5">
        <div className="flex items-center gap-2.5 overflow-x-auto scrollbar-hide">
          {/* Search */}
          <div className="flex items-center gap-2 flex-1 min-w-[180px] max-w-[280px] h-9 bg-white border border-slate-300 rounded-full px-4 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all flex-shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <input
              defaultValue={q}
              placeholder="District or address"
              className="flex-1 text-[13px] text-slate-800 placeholder-slate-400 outline-none bg-transparent"
              onKeyDown={(e) =>
                e.key === "Enter" &&
                push({ q: (e.target as HTMLInputElement).value })
              }
            />
          </div>

          {/* Residential / Commercial segment */}
          <div className="flex items-center bg-slate-100 rounded-full p-0.5 flex-shrink-0">
            {[
              { v: "", l: "Residential" },
              { v: "COMMERCIAL", l: "Commercial" },
            ].map((o) => (
              <button
                key={o.v}
                onClick={() => push({ category: o.v, propertyType: "" })}
                className={cn(
                  "h-8 px-4 rounded-full text-[12px] font-semibold transition-all",
                  category === o.v || (!category && o.v === "")
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700",
                )}
              >
                {o.l}
              </button>
            ))}
          </div>

          {/* Rent / Buy */}
          <RentBuyPill listing={listing} push={push} />

          {/* Price */}
          <PricePill listing={listing} minPrice={minPrice} maxPrice={maxPrice} push={push} />

          {/* Beds & Baths */}
          <BedsBathsPill beds={beds} bathrooms={bathrooms} push={push} />

          {/* Home / Property type */}
          <HomeTypePill
            label={typeLabel}
            defaultLabel={defaultTypeLabel}
            propType={propType}
            typesArr={typesArr}
            isCommercial={isCommercial}
            push={push}
          />


          {/* More Filters */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className={cn(
              "flex items-center gap-1.5 h-9 px-4 rounded-full border text-[13px] font-medium transition-all flex-shrink-0",
              extraFilterCount > 0
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : "border-slate-300 bg-white text-slate-700 hover:border-slate-400",
            )}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters
            {extraFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                {extraFilterCount}
              </span>
            )}
          </button>

          {hasFilter && (
            <button
              onClick={() => router.push(pathname)}
              className="flex items-center gap-1 text-[13px] text-slate-500 hover:text-slate-800 flex-shrink-0"
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>
      </div>

      <FiltersDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        furnishing={furnishing}
        minArea={minArea}
        maxArea={maxArea}
        amenitiesStr={amenitiesStr}
        utilities={utilities}
        push={push}
      />
    </div>
  );
}
