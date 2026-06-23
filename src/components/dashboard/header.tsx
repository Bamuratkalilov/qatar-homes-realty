"use client"

import { Bell } from "lucide-react"
import { GlobalSearch } from "./global-search"

interface HeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
}

export function Header({ title, description, actions }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{title}</h1>
          {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
        </div>
        <div className="flex items-center gap-3">
          <GlobalSearch />
          {actions}
          <button className="relative p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition">
            <Bell className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  )
}
