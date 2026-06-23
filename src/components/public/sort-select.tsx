"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"

export function SortSelect({ current }: { current: string }) {
  const router   = useRouter()
  const pathname = usePathname()
  const sp       = useSearchParams()

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = new URLSearchParams(sp.toString())
    if (e.target.value) next.set("sort", e.target.value)
    else next.delete("sort")
    router.push(`${pathname}?${next.toString()}`)
  }

  return (
    <select
      value={current}
      onChange={onChange}
      className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
    >
      <option value="">Sort: Featured</option>
      <option value="price_asc">Price: Low to High</option>
      <option value="price_desc">Price: High to Low</option>
    </select>
  )
}
