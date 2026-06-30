"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

export function ExpandableText({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div>
      <p className={`text-slate-600 leading-relaxed whitespace-pre-line ${expanded ? "" : "line-clamp-6"}`}>
        {text}
      </p>
      <button
        onClick={() => setExpanded(v => !v)}
        className="mt-2 flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800 transition"
      >
        {expanded ? "Show less" : "Show more"}
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
    </div>
  )
}
