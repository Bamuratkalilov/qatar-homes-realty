"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { relativeTime, formatPrice, LEAD_SOURCES, PROPERTY_TYPES, cn } from "@/lib/utils"
import {
  Plus, Phone, Mail, Wand2, X, TrendingUp, User, MessageSquare,
  Search, LayoutList, Kanban, LayoutGrid, Clock, DollarSign,
  Flame, Target, CheckCircle, PhoneCall, Send, Loader2, ChevronDown,
  Maximize2, GripVertical, CalendarPlus, MoreHorizontal,
  Home, LinkIcon, Unlink, ExternalLink,
} from "lucide-react"

// ── Types ────────────────────────────────────────────────────────────────────
interface LinkedProperty {
  id: string; title: string; referenceNumber?: string | null
  type: string; listingType: string; price: number
  photos: string[]; address: string
}

interface Lead {
  id: string; name: string; phone: string; email?: string
  status: string; score: number; source: string
  budget?: number; budgetMax?: number; propertyType?: string
  bedrooms?: number; notes?: string; aiSummary?: string
  createdAt: string; lastContactAt?: string
  propertyId?: string | null
  property?: LinkedProperty | null
}

// ── Constants ────────────────────────────────────────────────────────────────
const PIPELINE_STAGES = [
  { key: "NEW",               label: "New",             color: "bg-slate-500",  light: "bg-slate-50  border-slate-200", text: "text-slate-600",  dot: "bg-slate-400" },
  { key: "CONTACTED",         label: "Contacted",       color: "bg-blue-500",   light: "bg-blue-50   border-blue-200",  text: "text-blue-600",   dot: "bg-blue-400"  },
  { key: "QUALIFIED",         label: "Qualified",       color: "bg-violet-500", light: "bg-violet-50 border-violet-200",text: "text-violet-600", dot: "bg-violet-400"},
  { key: "VIEWING_SCHEDULED", label: "Viewing",         color: "bg-amber-500",  light: "bg-amber-50  border-amber-200", text: "text-amber-600",  dot: "bg-amber-400" },
  { key: "NEGOTIATING",       label: "Negotiating",     color: "bg-orange-500", light: "bg-orange-50 border-orange-200",text: "text-orange-600", dot: "bg-orange-400"},
  { key: "CONVERTED",         label: "Converted",       color: "bg-green-500",  light: "bg-green-50  border-green-200", text: "text-green-600",  dot: "bg-green-400" },
  { key: "LOST",              label: "Lost",            color: "bg-red-400",    light: "bg-red-50    border-red-200",   text: "text-red-600",    dot: "bg-red-400"   },
]

const SOURCE_ICONS: Record<string, string> = {
  WEBSITE: "🌐", PHONE: "📞", REFERRAL: "🤝", SOCIAL_MEDIA: "📱",
  PROPERTY_FINDER: "🔍", BAYUT: "🏠", WALK_IN: "🚶", OTHER: "💼",
}

function scoreColor(s: number) {
  if (s >= 70) return { ring: "stroke-green-500",  bg: "bg-green-50",  text: "text-green-700",  label: "Hot" }
  if (s >= 40) return { ring: "stroke-amber-400",  bg: "bg-amber-50",  text: "text-amber-700",  label: "Warm" }
  if (s > 0)   return { ring: "stroke-red-400",    bg: "bg-red-50",    text: "text-red-700",    label: "Cold" }
  return              { ring: "stroke-slate-200",   bg: "bg-slate-50",  text: "text-slate-400",  label: "" }
}

function stageOf(key: string) { return PIPELINE_STAGES.find((s) => s.key === key) || PIPELINE_STAGES[0] }

// ── Score Ring Avatar ─────────────────────────────────────────────────────────
function ScoreRing({ name, score, size = 40 }: { name: string; score: number; size?: number }) {
  const r = (size - 4) / 2
  const circ = 2 * Math.PI * r
  const fill = score > 0 ? (score / 100) * circ : 0
  const sc = scoreColor(score)
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90 absolute inset-0">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={3} />
        {score > 0 && (
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" className={sc.ring}
            strokeWidth={3} strokeDasharray={`${fill} ${circ}`} strokeLinecap="round" />
        )}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold"
        style={{ margin: 3, fontSize: size * 0.3 }}>
        {name[0]?.toUpperCase()}
      </div>
    </div>
  )
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4">
      <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0", color)}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ── Lead Popup (single-click mini card) ──────────────────────────────────────
function LeadPopup({ lead, position, onClose, onExpand }: {
  lead: Lead
  position: { x: number; y: number }
  onClose: () => void
  onExpand: () => void
}) {
  const stage = stageOf(lead.status)
  const sc = scoreColor(lead.score)

  // Clamp so popup never goes off-screen (300px wide, ~220px tall)
  const left = Math.min(position.x, (typeof window !== "undefined" ? window.innerWidth : 1200) - 320)
  const top  = Math.min(position.y, (typeof window !== "undefined" ? window.innerHeight : 800) - 240)

  return (
    <>
      {/* invisible backdrop to close on outside click */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      <div
        className="fixed z-50 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        style={{ left, top }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <div className="flex items-center gap-2 text-slate-400">
            <GripVertical className="w-4 h-4" />
            <span className="text-xs font-semibold text-slate-500">Lead overview</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={onExpand}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition">
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Lead identity */}
        <div className="px-4 pb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative">
              <ScoreRing name={lead.name} score={lead.score} size={52} />
              {lead.score > 0 && (
                <div className={cn(
                  "absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold",
                  sc.bg, sc.text
                )}>
                  {lead.score >= 70 ? "🔥" : lead.score >= 40 ? "⚡" : "❄️"}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-slate-900 text-base leading-tight">{lead.name}</h4>
              <p className="text-sm text-slate-400 mt-0.5 flex items-center gap-1.5">
                <span>{SOURCE_ICONS[lead.source]}</span>
                <span className="truncate">{lead.source.replace(/_/g, " ")}</span>
                <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-auto flex-shrink-0", stage.light, stage.text)}>
                  {stage.label}
                </span>
              </p>
            </div>
          </div>

          {/* Primary action */}
          {lead.email ? (
            <a href={`mailto:${lead.email}`}
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm rounded-xl transition-colors mb-2">
              <Mail className="w-4 h-4" />
              Compose email
            </a>
          ) : (
            <a href={`tel:${lead.phone}`}
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm rounded-xl transition-colors mb-2">
              <Phone className="w-4 h-4" />
              Call now
            </a>
          )}

          {/* Secondary actions */}
          <div className="flex gap-2">
            <a href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors">
              <MessageSquare className="w-3.5 h-3.5 text-green-600" /> WhatsApp
            </a>
            <button onClick={onExpand}
              className="w-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors" title="Schedule">
              <CalendarPlus className="w-4 h-4" />
            </button>
            <button onClick={onExpand}
              className="w-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors" title="More">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ── Lead Card (List) ──────────────────────────────────────────────────────────
function LeadCard({ lead, onClick, onStatusChange, onQualify, qualifying }: {
  lead: Lead; onClick: (e: React.MouseEvent) => void
  onStatusChange: (id: string, status: string) => void
  onQualify: (id: string) => void
  qualifying: string | null
}) {
  const stage = stageOf(lead.status)
  const sc = scoreColor(lead.score)
  const nextStage = PIPELINE_STAGES[PIPELINE_STAGES.findIndex((s) => s.key === lead.status) + 1]

  return (
    <div onClick={onClick}
      className="bg-white border border-slate-200 rounded-2xl p-4 cursor-pointer hover:border-blue-200 hover:shadow-md transition-all group"
    >
      <div className="flex items-start gap-3">
        <ScoreRing name={lead.name} score={lead.score} size={44} />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-slate-900 text-sm">{lead.name}</p>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                <span>{SOURCE_ICONS[lead.source]}</span>
                <span>{lead.source.replace(/_/g, " ")}</span>
                <span className="text-slate-300">·</span>
                <Clock className="w-3 h-3" />
                <span>{relativeTime(lead.createdAt)}</span>
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {lead.score > 0 && (
                <span className={cn("text-[11px] font-bold px-2 py-0.5 rounded-full", sc.bg, sc.text)}>
                  {sc.label} · {lead.score}
                </span>
              )}
              <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full border", stage.light, stage.text)}>
                {stage.label}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-2.5 text-xs text-slate-500">
            <a href={`tel:${lead.phone}`} onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 hover:text-blue-600 transition-colors">
              <Phone className="w-3 h-3" /> {lead.phone}
            </a>
            {lead.email && (
              <a href={`mailto:${lead.email}`} onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 hover:text-blue-600 transition-colors truncate max-w-[140px]">
                <Mail className="w-3 h-3" /> {lead.email}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 text-xs text-slate-500">
          {lead.budget && (
            <span className="flex items-center gap-1 font-medium text-slate-700">
              <DollarSign className="w-3 h-3 text-slate-400" />
              {formatPrice(lead.budget)}{lead.budgetMax ? ` – ${formatPrice(lead.budgetMax)}` : ""}
            </span>
          )}
          {lead.propertyType && (
            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[11px] font-medium">
              {lead.propertyType}
            </span>
          )}
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
          <a href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
            className="w-7 h-7 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 flex items-center justify-center transition-colors" title="WhatsApp">
            <MessageSquare className="w-3.5 h-3.5" />
          </a>
          <a href={`tel:${lead.phone}`}
            className="w-7 h-7 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center transition-colors" title="Call">
            <PhoneCall className="w-3.5 h-3.5" />
          </a>
          <button onClick={() => onQualify(lead.id)} disabled={qualifying === lead.id}
            className="w-7 h-7 rounded-lg bg-violet-50 hover:bg-violet-100 text-violet-600 flex items-center justify-center transition-colors" title="AI Qualify">
            {qualifying === lead.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
          </button>
          {nextStage && (
            <button onClick={() => onStatusChange(lead.id, nextStage.key)}
              className="flex items-center gap-1 h-7 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-semibold transition-colors">
              → {nextStage.label}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Lead Row (Table list view) ────────────────────────────────────────────────
function LeadRow({ lead, onClick, onStatusChange, onQualify, qualifying }: {
  lead: Lead; onClick: (e: React.MouseEvent) => void
  onStatusChange: (id: string, status: string) => void
  onQualify: (id: string) => void
  qualifying: string | null
}) {
  const stage = stageOf(lead.status)
  const sc = scoreColor(lead.score)
  const nextStage = PIPELINE_STAGES[PIPELINE_STAGES.findIndex((s) => s.key === lead.status) + 1]

  return (
    <tr onClick={onClick} className="group cursor-pointer hover:bg-blue-50/40 transition-colors border-b border-slate-100 last:border-0">
      {/* Name + avatar */}
      <td className="pl-4 pr-3 py-3">
        <div className="flex items-center gap-3">
          <ScoreRing name={lead.name} score={lead.score} size={34} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate max-w-[140px]">{lead.name}</p>
            <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
              <span>{SOURCE_ICONS[lead.source]}</span>
              <span className="truncate max-w-[100px]">{lead.source.replace(/_/g, " ")}</span>
            </p>
          </div>
        </div>
      </td>

      {/* Contact */}
      <td className="px-3 py-3">
        <a href={`tel:${lead.phone}`} onClick={(e) => e.stopPropagation()} className="text-xs text-blue-600 hover:underline flex items-center gap-1 whitespace-nowrap">
          <Phone className="w-3 h-3 flex-shrink-0" /> {lead.phone}
        </a>
        {lead.email && (
          <a href={`mailto:${lead.email}`} onClick={(e) => e.stopPropagation()} className="text-[11px] text-slate-400 hover:text-blue-500 truncate max-w-[160px] flex items-center gap-1 mt-0.5">
            <Mail className="w-3 h-3 flex-shrink-0" /> {lead.email}
          </a>
        )}
      </td>

      {/* Reference (linked property) */}
      <td className="px-3 py-3">
        {lead.property ? (
          <div className="flex items-center gap-2 min-w-0 max-w-[180px]">
            <div className="w-9 h-9 rounded-lg flex-shrink-0 overflow-hidden bg-slate-100 border border-slate-200">
              {lead.property.photos?.[0]
                ? <img src={lead.property.photos[0]} alt="" className="w-full h-full object-cover" />
                : <Home className="w-4 h-4 text-slate-400 m-2.5" />}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-slate-700 truncate leading-tight">{lead.property.title}</p>
              {lead.property.referenceNumber && (
                <p className="text-[10px] font-mono text-slate-400 leading-tight">{lead.property.referenceNumber}</p>
              )}
            </div>
          </div>
        ) : (
          <span className="text-slate-300 text-xs">—</span>
        )}
      </td>

      {/* Stage */}
      <td className="px-3 py-3">
        <span className={cn("text-[11px] font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap", stage.light, stage.text)}>
          {stage.label}
        </span>
      </td>

      {/* Score */}
      <td className="px-3 py-3 text-center">
        {lead.score > 0 ? (
          <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", sc.bg, sc.text)}>
            {lead.score}
          </span>
        ) : (
          <span className="text-slate-300 text-xs">—</span>
        )}
      </td>

      {/* Budget */}
      <td className="px-3 py-3">
        {lead.budget ? (
          <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">
            {formatPrice(lead.budget)}{lead.budgetMax ? "+" : ""}
          </span>
        ) : (
          <span className="text-slate-300 text-xs">—</span>
        )}
      </td>

      {/* Added */}
      <td className="px-3 py-3 text-[11px] text-slate-400 whitespace-nowrap">
        {relativeTime(lead.createdAt)}
      </td>

      {/* Actions */}
      <td className="pl-3 pr-4 py-3">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
          <a href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
            className="w-7 h-7 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 flex items-center justify-center transition-colors" title="WhatsApp">
            <MessageSquare className="w-3.5 h-3.5" />
          </a>
          <a href={`tel:${lead.phone}`}
            className="w-7 h-7 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center transition-colors" title="Call">
            <PhoneCall className="w-3.5 h-3.5" />
          </a>
          <button onClick={() => onQualify(lead.id)} disabled={qualifying === lead.id}
            className="w-7 h-7 rounded-lg bg-violet-50 hover:bg-violet-100 text-violet-600 flex items-center justify-center transition-colors" title="AI Qualify">
            {qualifying === lead.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
          </button>
          {nextStage && (
            <button onClick={() => onStatusChange(lead.id, nextStage.key)}
              className="h-7 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-semibold transition-colors whitespace-nowrap">
              → {nextStage.label}
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}

// ── Kanban Column Card ────────────────────────────────────────────────────────
function KanbanCard({ lead, onClick }: { lead: Lead; onClick: (e: React.MouseEvent) => void }) {
  const sc = scoreColor(lead.score)
  return (
    <div onClick={onClick}
      className="bg-white border border-slate-200 rounded-xl p-3 cursor-pointer hover:shadow-md transition-all"
    >
      <div className="flex items-center gap-2 mb-2">
        <ScoreRing name={lead.name} score={lead.score} size={32} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 text-xs truncate">{lead.name}</p>
          <p className="text-[10px] text-slate-400">{SOURCE_ICONS[lead.source]} {lead.source.replace(/_/g, " ")}</p>
        </div>
        {lead.score > 0 && (
          <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0", sc.bg, sc.text)}>
            {lead.score}
          </span>
        )}
      </div>
      {lead.budget && (
        <p className="text-[11px] font-semibold text-slate-600 mt-1">
          {formatPrice(lead.budget)}{lead.budgetMax ? `+` : ""}
        </p>
      )}
      <p className="text-[10px] text-slate-400 mt-1">{relativeTime(lead.createdAt)}</p>
    </div>
  )
}

// ── Property Picker ───────────────────────────────────────────────────────────
function PropertyPicker({ onSelect, onClose }: {
  onSelect: (p: LinkedProperty) => void
  onClose: () => void
}) {
  const [properties, setProperties] = useState<LinkedProperty[]>([])
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch("/api/properties")
      .then((r) => r.json())
      .then((d) => setProperties(d.properties || []))
      .finally(() => setLoading(false))
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [])

  const filtered = properties.filter((p) =>
    !query.trim() ||
    p.title.toLowerCase().includes(query.toLowerCase()) ||
    (p.referenceNumber || "").toLowerCase().includes(query.toLowerCase()) ||
    p.address.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="absolute inset-x-0 top-full mt-1 z-10 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
      <div className="p-2 border-b border-slate-100">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, ref, address…"
            className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>
      <div className="max-h-52 overflow-y-auto">
        {loading ? (
          <div className="py-6 flex justify-center"><Loader2 className="w-4 h-4 animate-spin text-slate-400" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">No properties found</p>
        ) : (
          filtered.map((p) => (
            <button key={p.id} onClick={() => onSelect(p)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-blue-50 transition-colors text-left">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden">
                {p.photos?.[0]
                  ? <img src={p.photos[0]} alt="" className="w-full h-full object-cover" />
                  : <Home className="w-4 h-4 text-slate-400 m-2" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate">{p.title}</p>
                <p className="text-[10px] text-slate-400 truncate">
                  {p.referenceNumber && <span className="font-mono mr-1">{p.referenceNumber}</span>}
                  {formatPrice(p.price)} · {p.listingType === "RENT" ? "Rent" : "Sale"}
                </p>
              </div>
            </button>
          ))
        )}
      </div>
      <div className="p-2 border-t border-slate-100">
        <button onClick={onClose} className="w-full text-xs text-slate-400 hover:text-slate-600 py-1">Cancel</button>
      </div>
    </div>
  )
}

// ── Detail Drawer ─────────────────────────────────────────────────────────────
function MatchingProperties({ lead, onLink }: { lead: Lead; onLink: (propertyId: string) => void }) {
  const [matches, setMatches]   = useState<LinkedProperty[]>([])
  const [loading, setLoading]   = useState(false)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (!lead.budget && !lead.propertyType && !lead.bedrooms) return
    setLoading(true)
    const params = new URLSearchParams()
    if (lead.propertyType) params.set("type", lead.propertyType)
    if (lead.budgetMax)    params.set("maxPrice", String(lead.budgetMax))
    else if (lead.budget)  params.set("maxPrice", String(lead.budget * 1.25))
    if (lead.bedrooms)     params.set("bedrooms", String(lead.bedrooms))
    params.set("status", "AVAILABLE")
    fetch(`/api/properties?${params}`)
      .then(r => r.json())
      .then(d => setMatches((d.properties || []).filter((p: LinkedProperty) => p.id !== lead.propertyId).slice(0, 6)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [lead.id, lead.budget, lead.budgetMax, lead.propertyType, lead.bedrooms, lead.propertyId])

  if (!lead.budget && !lead.propertyType && !lead.bedrooms) return null
  if (!loading && matches.length === 0) return null

  const visible = expanded ? matches : matches.slice(0, 2)

  return (
    <div className="px-5 pb-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
          Matching Listings
        </p>
        {!loading && <span className="text-[10px] font-bold text-emerald-600">{matches.length} found</span>}
      </div>
      {loading ? (
        <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Scanning listings…
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map(p => (
            <div key={p.id} className="flex items-center gap-2.5 p-2.5 bg-emerald-50/60 border border-emerald-100 rounded-xl group">
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-200 flex-shrink-0">
                {p.photos?.[0]
                  ? <img src={p.photos[0]} alt="" className="w-full h-full object-cover" />
                  : <Home className="w-4 h-4 text-slate-300 m-3" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-slate-800 truncate">{p.title}</p>
                <p className="text-[10px] font-semibold text-emerald-700">{formatPrice(p.price)}<span className="text-slate-400 font-normal ml-1">{p.listingType === "RENT" ? "/yr" : ""}</span></p>
              </div>
              <button onClick={() => onLink(p.id)}
                className="flex-shrink-0 text-[10px] font-bold px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg opacity-0 group-hover:opacity-100 transition">
                Link
              </button>
            </div>
          ))}
          {matches.length > 2 && (
            <button onClick={() => setExpanded(v => !v)}
              className="w-full text-[11px] font-semibold text-slate-400 hover:text-blue-600 py-1 transition">
              {expanded ? "Show less" : `+${matches.length - 2} more matches`}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function LeadDrawer({ lead, onClose, onStatusChange, onQualify, qualifying, onPropertyLink }: {
  lead: Lead; onClose: () => void
  onStatusChange: (id: string, status: string) => void
  onQualify: (id: string) => void
  qualifying: string | null
  onPropertyLink: (leadId: string, propertyId: string | null) => void
}) {
  const stage = stageOf(lead.status)
  const sc = scoreColor(lead.score)
  const [showPicker, setShowPicker] = useState(false)

  return (
    <div className="w-full lg:w-[380px] flex-shrink-0 border-l border-slate-200 bg-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Lead Details</span>
        <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Hero */}
        <div className="px-5 py-5 space-y-4">
          <div className="flex items-start gap-4">
            <ScoreRing name={lead.name} score={lead.score} size={56} />
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-slate-900 text-base">{lead.name}</h4>
              <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                {SOURCE_ICONS[lead.source]} {lead.source.replace(/_/g, " ")}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full border", stage.light, stage.text)}>
                  {stage.label}
                </span>
                {lead.score > 0 && (
                  <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full", sc.bg, sc.text)}>
                    {sc.label} · {lead.score}/100
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Score bar */}
          {lead.score > 0 && (
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Lead Score</span><span className="font-semibold">{lead.score}/100</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all", lead.score >= 70 ? "bg-green-500" : lead.score >= 40 ? "bg-amber-400" : "bg-red-400")}
                  style={{ width: `${lead.score}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Contact */}
        <div className="px-5 pb-4 space-y-2">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Contact</p>
          <a href={`tel:${lead.phone}`} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-blue-50 transition group">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Phone className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-slate-700 group-hover:text-blue-700">{lead.phone}</span>
          </a>
          {lead.email && (
            <a href={`mailto:${lead.email}`} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-blue-50 transition group">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Mail className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-slate-700 group-hover:text-blue-700 truncate">{lead.email}</span>
            </a>
          )}
        </div>

        {/* Quick actions */}
        <div className="px-5 pb-5">
          <div className="grid grid-cols-3 gap-2">
            <a href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
              className="flex flex-col items-center gap-1 p-3 bg-green-50 hover:bg-green-100 rounded-xl transition">
              <MessageSquare className="w-5 h-5 text-green-600" />
              <span className="text-[10px] font-semibold text-green-700">WhatsApp</span>
            </a>
            <a href={`tel:${lead.phone}`}
              className="flex flex-col items-center gap-1 p-3 bg-blue-50 hover:bg-blue-100 rounded-xl transition">
              <PhoneCall className="w-5 h-5 text-blue-600" />
              <span className="text-[10px] font-semibold text-blue-700">Call</span>
            </a>
            {lead.email && (
              <a href={`mailto:${lead.email}`}
                className="flex flex-col items-center gap-1 p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition">
                <Send className="w-5 h-5 text-slate-600" />
                <span className="text-[10px] font-semibold text-slate-700">Email</span>
              </a>
            )}
          </div>
        </div>

        {/* Status pipeline */}
        <div className="px-5 pb-5">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Move to Stage</p>
          <div className="flex flex-wrap gap-1.5">
            {PIPELINE_STAGES.filter((s) => s.key !== "LOST").map((s) => (
              <button
                key={s.key}
                onClick={() => onStatusChange(lead.id, s.key)}
                className={cn(
                  "text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border transition-all",
                  lead.status === s.key ? `${s.color} text-white border-transparent` : `${s.light} ${s.text} hover:opacity-80`
                )}
              >
                {s.label}
              </button>
            ))}
            <button
              onClick={() => onStatusChange(lead.id, "LOST")}
              className={cn(
                "text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border transition-all",
                lead.status === "LOST" ? "bg-red-400 text-white border-transparent" : "bg-red-50 text-red-600 border-red-200 hover:opacity-80"
              )}
            >
              Lost
            </button>
          </div>
        </div>

        {/* Linked Property */}
        <div className="px-5 pb-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Linked Property</p>
            {!lead.property && (
              <button onClick={() => setShowPicker((v) => !v)}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                <LinkIcon className="w-3 h-3" /> Link
              </button>
            )}
          </div>

          <div className="relative">
            {lead.property ? (
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="w-12 h-12 rounded-lg bg-slate-200 flex-shrink-0 overflow-hidden">
                  {lead.property.photos?.[0]
                    ? <img src={lead.property.photos[0]} alt="" className="w-full h-full object-cover" />
                    : <Home className="w-5 h-5 text-slate-400 m-3.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">{lead.property.title}</p>
                  {lead.property.referenceNumber && (
                    <p className="text-[10px] font-mono text-slate-400">{lead.property.referenceNumber}</p>
                  )}
                  <p className="text-[11px] font-semibold text-blue-600 mt-0.5">
                    {formatPrice(lead.property.price)}
                    <span className="text-slate-400 font-normal ml-1">
                      {lead.property.listingType === "RENT" ? "/ yr" : "sale"}
                    </span>
                  </p>
                </div>
                <div className="flex flex-col gap-1 flex-shrink-0">
                  <a href={`/properties/${lead.property.id}`} target="_blank" rel="noopener noreferrer"
                    className="w-6 h-6 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center transition-colors" title="View property">
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <button onClick={() => onPropertyLink(lead.id, null)}
                    className="w-6 h-6 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition-colors" title="Unlink">
                    <Unlink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowPicker((v) => !v)}
                className="w-full flex items-center gap-2 p-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50/40 transition-all">
                <Home className="w-4 h-4 flex-shrink-0" />
                <span className="text-xs font-medium">Link a property to this lead</span>
              </button>
            )}

            {showPicker && (
              <PropertyPicker
                onSelect={(p) => { onPropertyLink(lead.id, p.id); setShowPicker(false) }}
                onClose={() => setShowPicker(false)}
              />
            )}
          </div>
        </div>

        {/* Requirements */}
        {(lead.budget || lead.propertyType || lead.bedrooms) && (
          <div className="px-5 pb-5">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Requirements</p>
            <div className="bg-slate-50 rounded-xl p-4 space-y-2">
              {lead.budget && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" /> Budget</span>
                  <span className="font-semibold text-slate-900">
                    {formatPrice(lead.budget)}{lead.budgetMax ? ` – ${formatPrice(lead.budgetMax)}` : ""}
                  </span>
                </div>
              )}
              {lead.propertyType && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 flex items-center gap-1.5"><Target className="w-3.5 h-3.5" /> Type</span>
                  <span className="font-semibold text-slate-900">{lead.propertyType}</span>
                </div>
              )}
              {lead.bedrooms && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Bedrooms</span>
                  <span className="font-semibold text-slate-900">{lead.bedrooms} BR</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Auto-matched properties */}
        <MatchingProperties lead={lead} onLink={(pid) => { onPropertyLink(lead.id, pid) }} />

        {/* Notes */}
        {lead.notes && (
          <div className="px-5 pb-5">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Notes</p>
            <p className="text-sm text-slate-700 bg-slate-50 rounded-xl p-4 leading-relaxed">{lead.notes}</p>
          </div>
        )}

        {/* AI Analysis */}
        {lead.aiSummary && (
          <div className="px-5 pb-5">
            <div className="bg-gradient-to-br from-violet-50 to-blue-50 border border-violet-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center">
                  <Wand2 className="w-3 h-3 text-white" />
                </div>
                <span className="text-xs font-bold text-violet-700 uppercase tracking-wide">AI Analysis</span>
                {lead.score > 0 && (
                  <span className={cn("ml-auto text-xs font-bold px-2 py-0.5 rounded-full", sc.bg, sc.text)}>
                    {lead.score}/100
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">{lead.aiSummary}</p>
            </div>
          </div>
        )}

        {/* AI Qualify button */}
        <div className="px-5 pb-6">
          <Button
            onClick={() => onQualify(lead.id)}
            disabled={qualifying === lead.id}
            variant="outline"
            className="w-full gap-2 justify-center border-violet-200 text-violet-700 hover:bg-violet-50"
          >
            {qualifying === lead.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            {qualifying === lead.id ? "Qualifying with AI…" : "Re-run AI Qualification"}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [qualifying, setQualifying] = useState<string | null>(null)
  const [view, setView] = useState<"cards" | "list" | "kanban">("cards")
  const [popup, setPopup] = useState<{ lead: Lead; x: number; y: number } | null>(null)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [filterSource, setFilterSource] = useState("")
  const [sort, setSort] = useState("newest")
  const [form, setForm] = useState({
    name: "", phone: "", email: "", budget: "", budgetMax: "",
    propertyType: "", source: "WEBSITE", notes: "", bedrooms: "",
  })

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/leads")
      const data = await res.json()
      setLeads(data.leads || [])
    } catch { setLeads([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  async function addLead(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        budget: form.budget ? parseFloat(form.budget) : undefined,
        budgetMax: form.budgetMax ? parseFloat(form.budgetMax) : undefined,
        bedrooms: form.bedrooms ? parseInt(form.bedrooms) : undefined,
      }),
    })
    if (res.ok) {
      setShowForm(false)
      setForm({ name: "", phone: "", email: "", budget: "", budgetMax: "", propertyType: "", source: "WEBSITE", notes: "", bedrooms: "" })
      fetchLeads()
    }
  }

  async function qualifyLead(leadId: string) {
    setQualifying(leadId)
    try {
      const res = await fetch(`/api/leads/${leadId}/qualify`, { method: "POST" })
      const data = await res.json()
      setLeads((prev) => prev.map((l) => l.id === leadId
        ? { ...l, score: data.score, aiSummary: data.summary, status: data.priority === "HIGH" ? "QUALIFIED" : l.status }
        : l
      ))
      setSelectedLead((l) => l?.id === leadId ? { ...l, score: data.score, aiSummary: data.summary } : l)
    } finally { setQualifying(null) }
  }

  async function updateStatus(leadId: string, status: string) {
    await fetch(`/api/leads/${leadId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, status } : l))
    setSelectedLead((l) => l?.id === leadId ? { ...l, status } : l)
  }

  async function linkProperty(leadId: string, propertyId: string | null) {
    const res = await fetch(`/api/leads/${leadId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId }),
    })
    const data = await res.json()
    const updatedLead = data.lead
    setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, ...updatedLead } : l))
    setSelectedLead((l) => l?.id === leadId ? { ...l, ...updatedLead } : l)
  }

  // Computed stats
  const hot = leads.filter((l) => l.score >= 70).length
  const converted = leads.filter((l) => l.status === "CONVERTED").length
  const newThisWeek = leads.filter((l) => {
    const d = new Date(l.createdAt); const now = new Date()
    return (now.getTime() - d.getTime()) < 7 * 24 * 60 * 60 * 1000
  }).length
  const avgScore = leads.filter((l) => l.score > 0).length
    ? Math.round(leads.filter((l) => l.score > 0).reduce((s, l) => s + l.score, 0) / leads.filter((l) => l.score > 0).length)
    : 0

  // Filtered + sorted
  const filtered = useMemo(() => {
    let r = [...leads]
    if (search.trim()) {
      const q = search.toLowerCase()
      r = r.filter((l) => l.name.toLowerCase().includes(q) || l.phone.includes(q) || (l.email || "").toLowerCase().includes(q))
    }
    if (filterStatus) r = r.filter((l) => l.status === filterStatus)
    if (filterSource) r = r.filter((l) => l.source === filterSource)
    switch (sort) {
      case "newest": r.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break
      case "oldest": r.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()); break
      case "score_high": r.sort((a, b) => b.score - a.score); break
      case "budget_high": r.sort((a, b) => (b.budget || 0) - (a.budget || 0)); break
    }
    return r
  }, [leads, search, filterStatus, filterSource, sort])

  return (
    <div className="h-full flex flex-col">
      <Header
        title="Leads"
        description={`${leads.length} total · ${hot} hot leads`}
        actions={
          <Button size="sm" className="gap-2" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4" /> Add Lead
          </Button>
        }
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-6 pt-5 pb-4 space-y-4 flex-shrink-0">

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard icon={<User className="w-5 h-5 text-blue-600" />} label="Total Leads" value={leads.length} sub={`${newThisWeek} this week`} color="bg-blue-50" />
            <StatCard icon={<Flame className="w-5 h-5 text-orange-600" />} label="Hot Leads" value={hot} sub="Score ≥ 70" color="bg-orange-50" />
            <StatCard icon={<CheckCircle className="w-5 h-5 text-green-600" />} label="Converted" value={converted} sub="All time" color="bg-green-50" />
            <StatCard icon={<TrendingUp className="w-5 h-5 text-violet-600" />} label="Avg Score" value={avgScore > 0 ? `${avgScore}/100` : "—"} sub="Qualified leads" color="bg-violet-50" />
          </div>

          {/* Search + controls */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, phone, email…"
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
              {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>}
            </div>

            {/* Status filter */}
            <div className="relative">
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                className={cn("appearance-none pl-3 pr-7 py-2.5 text-sm border rounded-xl bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer",
                  filterStatus ? "border-blue-500 text-blue-700" : "border-slate-200 text-slate-700")}>
                <option value="">All Stages</option>
                {PIPELINE_STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>

            {/* Source filter */}
            <div className="relative hidden xl:block">
              <select value={filterSource} onChange={(e) => setFilterSource(e.target.value)}
                className={cn("appearance-none pl-3 pr-7 py-2.5 text-sm border rounded-xl bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer",
                  filterSource ? "border-blue-500 text-blue-700" : "border-slate-200 text-slate-700")}>
                <option value="">All Sources</option>
                {LEAD_SOURCES.map((s) => <option key={s.value} value={s.value}>{SOURCE_ICONS[s.value]} {s.label}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>

            {/* Sort */}
            <div className="relative hidden lg:block">
              <select value={sort} onChange={(e) => setSort(e.target.value)}
                className="appearance-none pl-3 pr-7 py-2.5 text-sm border border-slate-200 rounded-xl bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="score_high">Hottest first</option>
                <option value="budget_high">Highest budget</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>

            {/* View toggle */}
            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 gap-0.5 flex-shrink-0">
              <button onClick={() => setView("cards")}
                className={cn("p-1.5 rounded-lg transition-all", view === "cards" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-700")}
                title="Card view">
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button onClick={() => setView("list")}
                className={cn("p-1.5 rounded-lg transition-all", view === "list" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-700")}
                title="List view">
                <LayoutList className="w-4 h-4" />
              </button>
              <button onClick={() => setView("kanban")}
                className={cn("p-1.5 rounded-lg transition-all", view === "kanban" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-700")}
                title="Pipeline view">
                <Kanban className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Active filters */}
          {(filterStatus || filterSource) && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Filtering:</span>
              {filterStatus && <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                {stageOf(filterStatus).label} <button onClick={() => setFilterStatus("")}><X className="w-3 h-3" /></button>
              </span>}
              {filterSource && <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                {SOURCE_ICONS[filterSource]} {filterSource.replace(/_/g, " ")} <button onClick={() => setFilterSource("")}><X className="w-3 h-3" /></button>
              </span>}
              <button onClick={() => { setFilterStatus(""); setFilterSource("") }} className="text-xs text-red-500 hover:text-red-700 font-semibold">Clear all</button>
            </div>
          )}
        </div>

        {/* ── Content ── */}
        <div className="flex-1 flex overflow-hidden">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : leads.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center max-w-sm w-full">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <User className="w-7 h-7 text-blue-600" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">No leads yet</h3>
                <p className="text-slate-500 text-sm mb-5">Start by adding your first potential client</p>
                <Button onClick={() => setShowForm(true)} className="gap-2"><Plus className="w-4 h-4" /> Add First Lead</Button>
              </div>
            </div>
          ) : view === "cards" ? (
            /* ── Cards View ── */
            <div className="flex flex-1 overflow-hidden">
              <div className={cn("flex-1 overflow-y-auto px-6 pb-6 space-y-3", selectedLead ? "hidden lg:block" : "")}>
                {filtered.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <Search className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-medium">No leads match your search</p>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-slate-400 pb-1">{filtered.length} lead{filtered.length !== 1 ? "s" : ""}</p>
                    {filtered.map((lead) => (
                      <LeadCard key={lead.id} lead={lead}
                        onClick={(e) => setPopup({ lead, x: e.clientX + 12, y: e.clientY - 20 })}
                        onStatusChange={updateStatus}
                        onQualify={qualifyLead}
                        qualifying={qualifying}
                      />
                    ))}
                  </>
                )}
              </div>
              {selectedLead && (
                <LeadDrawer lead={selectedLead} onClose={() => setSelectedLead(null)}
                  onStatusChange={updateStatus} onQualify={qualifyLead} qualifying={qualifying} onPropertyLink={linkProperty} />
              )}
            </div>

          ) : view === "list" ? (
            /* ── Table List View ── */
            <div className="flex flex-1 overflow-hidden">
              <div className={cn("flex-1 overflow-y-auto px-6 pb-6", selectedLead ? "hidden lg:block" : "")}>
                {filtered.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <Search className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-medium">No leads match your search</p>
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50">
                          <th className="pl-4 pr-3 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Lead</th>
                          <th className="px-3 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Contact</th>
                          <th className="px-3 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Reference</th>
                          <th className="px-3 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Stage</th>
                          <th className="px-3 py-3 text-center text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Score</th>
                          <th className="px-3 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Budget</th>
                          <th className="px-3 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Added</th>
                          <th className="pl-3 pr-4 py-3 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((lead) => (
                          <LeadRow key={lead.id} lead={lead}
                            onClick={(e) => setPopup({ lead, x: e.clientX + 12, y: e.clientY - 20 })}
                            onStatusChange={updateStatus}
                            onQualify={qualifyLead}
                            qualifying={qualifying}
                          />
                        ))}
                      </tbody>
                    </table>
                    <div className="px-4 py-3 border-t border-slate-100 bg-slate-50">
                      <p className="text-xs text-slate-400">{filtered.length} lead{filtered.length !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                )}
              </div>
              {selectedLead && (
                <LeadDrawer lead={selectedLead} onClose={() => setSelectedLead(null)}
                  onStatusChange={updateStatus} onQualify={qualifyLead} qualifying={qualifying} onPropertyLink={linkProperty} />
              )}
            </div>
          ) : (
            /* ── Kanban View ── */
            <div className="flex-1 overflow-x-auto px-6 pb-6">
              <div className="flex gap-4 h-full" style={{ minWidth: PIPELINE_STAGES.length * 240 }}>
                {PIPELINE_STAGES.map((stage) => {
                  const colLeads = filtered.filter((l) => l.status === stage.key)
                  const totalBudget = colLeads.reduce((s, l) => s + (l.budget || 0), 0)
                  return (
                    <div key={stage.key} className="w-56 flex-shrink-0 flex flex-col">
                      {/* Column header */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className={cn("w-2.5 h-2.5 rounded-full", stage.dot)} />
                            <span className="text-xs font-bold text-slate-700">{stage.label}</span>
                          </div>
                          <span className={cn("text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center", stage.color, "text-white")}>
                            {colLeads.length}
                          </span>
                        </div>
                        {totalBudget > 0 && (
                          <p className="text-[10px] text-slate-400 pl-4">{formatPrice(totalBudget)} total budget</p>
                        )}
                      </div>
                      {/* Cards */}
                      <div className="flex-1 space-y-2 overflow-y-auto">
                        {colLeads.map((lead) => (
                          <KanbanCard key={lead.id} lead={lead} onClick={(e) => setPopup({ lead, x: e.clientX + 12, y: e.clientY - 20 })} />
                        ))}
                        {colLeads.length === 0 && (
                          <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center text-slate-300 text-xs">
                            Empty
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Lead Popup (single click) ── */}
      {popup && (
        <LeadPopup
          lead={popup.lead}
          position={{ x: popup.x, y: popup.y }}
          onClose={() => setPopup(null)}
          onExpand={() => { setSelectedLead(popup.lead); setPopup(null) }}
        />
      )}

      {/* ── Full Detail Drawer (expand) ── */}
      {selectedLead && (
        <div className="fixed inset-0 z-40 flex items-stretch justify-end pointer-events-none">
          <div className="pointer-events-auto w-full max-w-[380px] bg-white border-l border-slate-200 shadow-2xl flex flex-col overflow-hidden">
            <LeadDrawer
              lead={selectedLead}
              onClose={() => setSelectedLead(null)}
              onStatusChange={updateStatus}
              onQualify={qualifyLead}
              qualifying={qualifying}
              onPropertyLink={linkProperty}
            />
          </div>
        </div>
      )}

      {/* ── Add Lead Modal ── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900">Add New Lead</h3>
                <p className="text-xs text-slate-400 mt-0.5">Fill in what you know — you can add more later</p>
              </div>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 transition">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={addLead} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name *</label>
                  <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Mohammed Al-Rashid" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone *</label>
                  <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+974 5555 1234" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                  <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="optional" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Lead Source</label>
                <Select value={form.source} onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))} options={LEAD_SOURCES} />
              </div>

              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Requirements</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Min Budget (QAR)</label>
                    <Input type="number" value={form.budget} onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))} placeholder="100,000" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Max Budget (QAR)</label>
                    <Input type="number" value={form.budgetMax} onChange={(e) => setForm((f) => ({ ...f, budgetMax: e.target.value }))} placeholder="200,000" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Property Type</label>
                    <Select value={form.propertyType} onChange={(e) => setForm((f) => ({ ...f, propertyType: e.target.value }))} placeholder="Any" options={PROPERTY_TYPES} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Bedrooms</label>
                    <Input type="number" value={form.bedrooms} onChange={(e) => setForm((f) => ({ ...f, bedrooms: e.target.value }))} placeholder="e.g. 2" min="0" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
                <Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Initial notes, requirements, anything relevant…" rows={3} />
              </div>

              <div className="flex gap-3 pt-1">
                <Button type="submit" className="flex-1 gap-2"><Plus className="w-4 h-4" /> Add Lead</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
