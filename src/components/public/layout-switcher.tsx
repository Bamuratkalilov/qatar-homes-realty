"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { LayoutGrid, List, Map, Columns2 } from "lucide-react"
import { cn } from "@/lib/utils"

const VIEWS = [
  { id: "split",  icon: Columns2,    label: "Split"  },
  { id: "map",    icon: Map,         label: "Map"    },
  { id: "grid",   icon: LayoutGrid,  label: "Grid"   },
  { id: "list",   icon: List,        label: "List"   },
] as const

export type ViewMode = (typeof VIEWS)[number]["id"]

export function LayoutSwitcher({ current }: { current: ViewMode }) {
  const router   = useRouter()
  const pathname = usePathname()
  const sp       = useSearchParams()

  function setView(v: ViewMode) {
    const next = new URLSearchParams(sp.toString())
    if (v === "split") next.delete("view"); else next.set("view", v)
    router.push(`${pathname}?${next.toString()}`)
  }

  return (
    <div className="flex items-center bg-slate-100 rounded-lg p-1 gap-0.5">
      {VIEWS.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => setView(id)}
          title={label}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all",
            current === id
              ? "bg-white text-blue-600 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          )}
        >
          <Icon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  )
}
