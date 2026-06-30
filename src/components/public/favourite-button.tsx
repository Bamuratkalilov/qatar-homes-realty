"use client"

import { useState, useEffect } from "react"
import { Heart } from "lucide-react"
import { cn } from "@/lib/utils"

export function FavouriteButton({ propertyId, initialCount }: { propertyId: string; initialCount: number }) {
  const key = `fav_${propertyId}`
  const [liked, setLiked]   = useState(false)
  const [count, setCount]   = useState(initialCount)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLiked(localStorage.getItem(key) === "1")
  }, [key])

  async function toggle() {
    if (loading) return
    setLoading(true)
    const action = liked ? "remove" : "add"
    const next = liked ? count - 1 : count + 1

    setLiked(!liked)
    setCount(next)

    try {
      const res = await fetch(`/api/properties/${propertyId}/favourite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (data.favorites !== undefined) setCount(data.favorites)
      if (action === "add") localStorage.setItem(key, "1")
      else localStorage.removeItem(key)
    } catch {
      // revert on error
      setLiked(liked)
      setCount(count)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="flex items-center gap-1.5 text-xs transition group"
    >
      <Heart className={cn(
        "w-3.5 h-3.5 transition-all",
        liked ? "fill-red-500 text-red-500" : "text-slate-400 group-hover:text-red-400"
      )} />
      <span className={cn("font-medium", liked ? "text-red-500" : "text-slate-400 group-hover:text-red-400")}>
        {count > 0 ? `${count} Favourites` : "Favourite"}
      </span>
    </button>
  )
}
