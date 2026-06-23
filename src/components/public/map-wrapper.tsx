"use client"

import dynamic from "next/dynamic"

const PropertyMap = dynamic(
  () => import("./property-map").then(m => ({ default: m.PropertyMap })),
  { ssr: false, loading: () => <div className="w-full h-full bg-slate-100 animate-pulse rounded-none" /> }
)

export { PropertyMap }
