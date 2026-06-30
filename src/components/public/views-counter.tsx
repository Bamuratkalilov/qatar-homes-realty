"use client"

import { useState, useEffect } from "react"
import { Eye } from "lucide-react"

export function ViewsCounter({ propertyId, initialCount }: { propertyId: string; initialCount: number }) {
  const [views, setViews] = useState(initialCount)

  useEffect(() => {
    fetch(`/api/properties/${propertyId}/views`)
      .then(r => r.json())
      .then(d => { if (d.views !== undefined) setViews(d.views) })
      .catch(() => {})
  }, [propertyId])

  return (
    <span className="flex items-center gap-1.5 text-slate-400 text-xs">
      <Eye className="w-3.5 h-3.5" />
      {views.toLocaleString()} views
    </span>
  )
}
