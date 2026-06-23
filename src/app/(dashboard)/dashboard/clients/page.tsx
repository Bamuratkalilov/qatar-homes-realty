"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { relativeTime, formatPrice, cn } from "@/lib/utils"
import Link from "next/link"
import {
  Plus, Phone, Mail, X, Users, FileText, MessageSquare, Search,
  LayoutGrid, LayoutList, ChevronDown, Calendar, CalendarCheck,
  PhoneCall, Send, Loader2, BadgeCheck, TrendingUp, UserPlus,
  MapPin, CreditCard, StickyNote, ArrowUpRight, Building2,
  Bell, CheckCircle, AlertTriangle, Clock,
} from "lucide-react"

// ── Types ─────────────────────────────────────────────────────────────────────
interface ClientLead {
  id: string; status: string; propertyType?: string | null; budget?: number | null; createdAt: string
  property?: { id: string; title: string; referenceNumber?: string | null; photos: string[]; price: number; listingType: string } | null
}

interface Client {
  id: string; name: string; phone: string; email?: string | null
  nationality?: string | null; idNumber?: string | null; notes?: string | null
  contractStart?: string | null; contractEnd?: string | null
  contractNotes?: string | null; renewalSentAt?: string | null
  createdAt: string; updatedAt: string
  _count: { leads: number; documents: number; appointments: number }
  leads: ClientLead[]
}

function daysUntil(date: string) {
  return Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}
function urgencyColor(days: number) {
  if (days <= 30) return { bar: "bg-red-500",   badge: "bg-red-50 text-red-700 border-red-200",   label: "Urgent" }
  if (days <= 60) return { bar: "bg-amber-400", badge: "bg-amber-50 text-amber-700 border-amber-200", label: "Soon" }
  return              { bar: "bg-blue-400",   badge: "bg-blue-50 text-blue-700 border-blue-200",   label: `${days}d left` }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  "bg-blue-500", "bg-violet-500", "bg-emerald-500", "bg-orange-500",
  "bg-pink-500", "bg-cyan-500", "bg-amber-500", "bg-indigo-500",
]
function avatarColor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % AVATAR_COLORS.length
  return AVATAR_COLORS[h]
}
function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase()
}

const NATIONALITIES = [
  "Qatari", "Saudi", "Emirati", "Kuwaiti", "Bahraini", "Omani",
  "Egyptian", "Jordanian", "Lebanese", "Syrian", "Indian", "Pakistani",
  "Bangladeshi", "Filipino", "Nepali", "Sri Lankan", "British", "American",
  "French", "German", "Turkish", "Iranian", "Other",
]

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; color: string
}) {
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

// ── Client Avatar ─────────────────────────────────────────────────────────────
function ClientAvatar({ name, size = 44 }: { name: string; size?: number }) {
  return (
    <div
      className={cn("rounded-full flex items-center justify-center text-white font-bold flex-shrink-0", avatarColor(name))}
      style={{ width: size, height: size, fontSize: size * 0.33 }}
    >
      {initials(name)}
    </div>
  )
}

// ── Client Card (Grid) ────────────────────────────────────────────────────────
function ClientCard({ client, onClick }: { client: Client; onClick: () => void }) {
  const lastLead = client.leads[0]
  const lastProperty = lastLead?.property

  return (
    <div
      onClick={onClick}
      className="bg-white border border-slate-200 rounded-2xl p-5 cursor-pointer hover:border-blue-200 hover:shadow-lg transition-all group flex flex-col"
    >
      {/* Top: Avatar + name + badge */}
      <div className="flex items-start gap-3 mb-4">
        <ClientAvatar name={client.name} size={48} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <p className="font-bold text-slate-900 truncate">{client.name}</p>
            {client._count.leads > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] font-bold bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full flex-shrink-0">
                <BadgeCheck className="w-3 h-3" /> Active
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {client.nationality && (
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" /> {client.nationality}
              </span>
            )}
            {client.idNumber && (
              <span className="text-[11px] font-mono text-slate-400">
                QID ···{client.idNumber.slice(-4)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="space-y-1.5 mb-4">
        <a href={`tel:${client.phone}`} onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-2 text-xs text-slate-600 hover:text-blue-600 transition">
          <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" /> {client.phone}
        </a>
        {client.email && (
          <a href={`mailto:${client.email}`} onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-2 text-xs text-slate-500 hover:text-blue-600 transition truncate">
            <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="truncate">{client.email}</span>
          </a>
        )}
      </div>

      {/* Last deal */}
      {lastProperty && (
        <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl mb-4 border border-slate-100">
          <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-200 flex-shrink-0">
            {lastProperty.photos?.[0]
              ? <img src={lastProperty.photos[0]} alt="" className="w-full h-full object-cover" />
              : <Building2 className="w-4 h-4 text-slate-400 m-2" />}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-slate-700 truncate">{lastProperty.title}</p>
            <p className="text-[10px] text-slate-400">
              {formatPrice(lastProperty.price)} · {lastProperty.listingType === "RENT" ? "Rent" : "Sale"}
            </p>
          </div>
        </div>
      )}

      {/* Notes preview */}
      {client.notes && !lastProperty && (
        <p className="text-[11px] text-slate-400 bg-slate-50 rounded-xl px-3 py-2 mb-4 line-clamp-2 border border-slate-100">
          {client.notes}
        </p>
      )}

      {/* Contract badge */}
      {client.contractEnd && (() => {
        const d = daysUntil(client.contractEnd)
        const u = urgencyColor(d)
        return (
          <div className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold mb-3", u.badge)}>
            {d <= 0 ? <AlertTriangle className="w-3 h-3 flex-shrink-0" />
              : d <= 30 ? <AlertTriangle className="w-3 h-3 flex-shrink-0" />
              : <Bell className="w-3 h-3 flex-shrink-0" />}
            {d <= 0 ? "Contract expired" : `Renewal in ${d}d`}
          </div>
        )
      })()}

      {/* Footer */}
      <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          {client._count.documents > 0 && (
            <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {client._count.documents}</span>
          )}
          {client._count.appointments > 0 && (
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {client._count.appointments}</span>
          )}
          <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> {client._count.leads} deal{client._count.leads !== 1 ? "s" : ""}</span>
        </div>
        <span className="text-[10px] text-slate-300">Since {relativeTime(client.createdAt)}</span>
      </div>

      {/* Quick actions on hover */}
      <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
        <a href={`https://wa.me/${client.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-50 hover:bg-green-100 text-green-700 text-[11px] font-semibold rounded-xl transition">
          <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
        </a>
        <a href={`tel:${client.phone}`}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-semibold rounded-xl transition">
          <PhoneCall className="w-3.5 h-3.5" /> Call
        </a>
        <Link href={`/dashboard/documents?clientId=${client.id}`}
          className="flex items-center justify-center w-9 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition" title="Documents">
          <FileText className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}

// ── Client Row (Table) ────────────────────────────────────────────────────────
function ClientRow({ client, onClick }: { client: Client; onClick: () => void }) {
  const lastProperty = client.leads[0]?.property

  return (
    <tr onClick={onClick} className="group cursor-pointer hover:bg-blue-50/40 transition-colors border-b border-slate-100 last:border-0">
      <td className="pl-4 pr-3 py-3">
        <div className="flex items-center gap-3">
          <ClientAvatar name={client.name} size={34} />
          <div>
            <p className="text-sm font-semibold text-slate-900">{client.name}</p>
            {client.nationality && <p className="text-[11px] text-slate-400">{client.nationality}</p>}
          </div>
        </div>
      </td>
      <td className="px-3 py-3">
        <a href={`tel:${client.phone}`} onClick={(e) => e.stopPropagation()} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
          <Phone className="w-3 h-3" /> {client.phone}
        </a>
        {client.email && (
          <p className="text-[11px] text-slate-400 truncate max-w-[160px] mt-0.5">{client.email}</p>
        )}
      </td>
      <td className="px-3 py-3">
        {client.idNumber
          ? <span className="text-xs font-mono text-slate-600">···{client.idNumber.slice(-4)}</span>
          : <span className="text-slate-300 text-xs">—</span>}
      </td>
      <td className="px-3 py-3">
        {lastProperty ? (
          <div className="flex items-center gap-2 max-w-[180px]">
            <div className="w-7 h-7 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
              {lastProperty.photos?.[0]
                ? <img src={lastProperty.photos[0]} alt="" className="w-full h-full object-cover" />
                : <Building2 className="w-3 h-3 text-slate-400 m-2" />}
            </div>
            <p className="text-[11px] font-medium text-slate-700 truncate">{lastProperty.title}</p>
          </div>
        ) : <span className="text-slate-300 text-xs">—</span>}
      </td>
      <td className="px-3 py-3 text-center">
        <span className="text-xs font-semibold text-slate-700">{client._count.leads}</span>
      </td>
      <td className="px-3 py-3 text-center">
        <span className="text-xs font-semibold text-slate-700">{client._count.documents}</span>
      </td>
      <td className="px-3 py-3 whitespace-nowrap">
        {client.contractEnd ? (() => {
          const d = daysUntil(client.contractEnd)
          const u = urgencyColor(d)
          return (
            <span className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-bold", u.badge)}>
              {d <= 30 ? <AlertTriangle className="w-2.5 h-2.5" /> : <Bell className="w-2.5 h-2.5" />}
              {d <= 0 ? "Expired" : `${d}d`}
            </span>
          )
        })() : <span className="text-[11px] text-slate-400">{relativeTime(client.createdAt)}</span>}
      </td>
      <td className="pl-3 pr-4 py-3">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
          <a href={`https://wa.me/${client.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
            className="w-7 h-7 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 flex items-center justify-center transition">
            <MessageSquare className="w-3.5 h-3.5" />
          </a>
          <a href={`tel:${client.phone}`}
            className="w-7 h-7 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center transition">
            <PhoneCall className="w-3.5 h-3.5" />
          </a>
          {client.email && (
            <a href={`mailto:${client.email}`}
              className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition">
              <Send className="w-3.5 h-3.5" />
            </a>
          )}
          <Link href={`/dashboard/documents?clientId=${client.id}`}
            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition">
            <FileText className="w-3.5 h-3.5" />
          </Link>
        </div>
      </td>
    </tr>
  )
}

// ── Detail Drawer ─────────────────────────────────────────────────────────────
function ClientDrawer({ client, onClose, onContractSaved }: {
  client: Client; onClose: () => void; onContractSaved: (updated: Partial<Client>) => void
}) {
  const lastLead = client.leads[0]
  const lastProperty = lastLead?.property
  const [editContract, setEditContract] = useState(false)
  const [contractForm, setContractForm] = useState({
    contractStart: client.contractStart ? client.contractStart.slice(0, 10) : "",
    contractEnd: client.contractEnd ? client.contractEnd.slice(0, 10) : "",
    contractNotes: client.contractNotes || "",
  })
  const [savingContract, setSavingContract] = useState(false)
  const [sendingOffer, setSendingOffer] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  async function saveContract() {
    if (!contractForm.contractEnd) { setSaveError("Please enter a contract end date"); return }
    setSavingContract(true)
    setSaveError(null)
    try {
      const res = await fetch("/api/renewals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: client.id, ...contractForm }),
      })
      if (res.ok) {
        onContractSaved(contractForm)
        setEditContract(false)
      } else {
        const data = await res.json().catch(() => ({}))
        setSaveError(data.error || `Error ${res.status}`)
      }
    } catch (e) {
      setSaveError("Network error — please try again")
    } finally { setSavingContract(false) }
  }

  async function markRenewalSent() {
    setSendingOffer(true)
    try {
      await fetch("/api/renewals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: client.id, markRenewalSent: true }),
      })
      onContractSaved({ renewalSentAt: new Date().toISOString() })
    } finally { setSendingOffer(false) }
  }

  const daysLeft = client.contractEnd ? daysUntil(client.contractEnd) : null
  const urgency = daysLeft !== null ? urgencyColor(daysLeft) : null

  return (
    <div className="w-full lg:w-[360px] flex-shrink-0 border-l border-slate-200 bg-white flex flex-col overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Client Profile</span>
        <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Hero */}
        <div className="px-5 py-5 flex items-start gap-4 border-b border-slate-100">
          <ClientAvatar name={client.name} size={56} />
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-slate-900 text-base">{client.name}</h4>
            {client.nationality && (
              <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5" /> {client.nationality}
              </p>
            )}
            <p className="text-[11px] text-slate-400 mt-1">Client since {relativeTime(client.createdAt)}</p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="grid grid-cols-3 gap-2">
            <a href={`https://wa.me/${client.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
              className="flex flex-col items-center gap-1 p-3 bg-green-50 hover:bg-green-100 rounded-xl transition">
              <MessageSquare className="w-5 h-5 text-green-600" />
              <span className="text-[10px] font-semibold text-green-700">WhatsApp</span>
            </a>
            <a href={`tel:${client.phone}`}
              className="flex flex-col items-center gap-1 p-3 bg-blue-50 hover:bg-blue-100 rounded-xl transition">
              <PhoneCall className="w-5 h-5 text-blue-600" />
              <span className="text-[10px] font-semibold text-blue-700">Call</span>
            </a>
            {client.email
              ? <a href={`mailto:${client.email}`}
                  className="flex flex-col items-center gap-1 p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition">
                  <Send className="w-5 h-5 text-slate-600" />
                  <span className="text-[10px] font-semibold text-slate-700">Email</span>
                </a>
              : <Link href={`/dashboard/documents?clientId=${client.id}`}
                  className="flex flex-col items-center gap-1 p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition">
                  <FileText className="w-5 h-5 text-slate-600" />
                  <span className="text-[10px] font-semibold text-slate-700">Docs</span>
                </Link>
            }
          </div>
        </div>

        {/* Contact info */}
        <div className="px-5 py-4 space-y-2 border-b border-slate-100">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Contact</p>
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
            <Phone className="w-4 h-4 text-slate-400" />
            <a href={`tel:${client.phone}`} className="text-sm font-medium text-slate-700 hover:text-blue-600">{client.phone}</a>
          </div>
          {client.email && (
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <Mail className="w-4 h-4 text-slate-400" />
              <a href={`mailto:${client.email}`} className="text-sm font-medium text-slate-700 hover:text-blue-600 truncate">{client.email}</a>
            </div>
          )}
        </div>

        {/* Identity */}
        {(client.nationality || client.idNumber) && (
          <div className="px-5 py-4 space-y-2 border-b border-slate-100">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Identity</p>
            <div className="bg-slate-50 rounded-xl p-4 space-y-2.5">
              {client.nationality && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> Nationality</span>
                  <span className="font-semibold text-slate-800">{client.nationality}</span>
                </div>
              )}
              {client.idNumber && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 flex items-center gap-2"><CreditCard className="w-3.5 h-3.5" /> QID</span>
                  <span className="font-mono font-semibold text-slate-800">···{client.idNumber.slice(-4)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Deal history */}
        {lastProperty && (
          <div className="px-5 py-4 border-b border-slate-100">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Last Deal</p>
            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-200 flex-shrink-0">
                {lastProperty.photos?.[0]
                  ? <img src={lastProperty.photos[0]} alt="" className="w-full h-full object-cover" />
                  : <Building2 className="w-5 h-5 text-slate-400 m-3.5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">{lastProperty.title}</p>
                {lastProperty.referenceNumber && (
                  <p className="text-[10px] font-mono text-slate-400">{lastProperty.referenceNumber}</p>
                )}
                <p className="text-[11px] font-semibold text-blue-600 mt-0.5">
                  {formatPrice(lastProperty.price)}
                  <span className="text-slate-400 font-normal ml-1">{lastProperty.listingType === "RENT" ? "/yr" : "sale"}</span>
                </p>
              </div>
              <Link href={`/listings/${lastProperty.id}`} target="_blank"
                className="w-7 h-7 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 transition">
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* Summary counts */}
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-slate-50 rounded-xl">
              <p className="text-lg font-bold text-slate-900">{client._count.leads}</p>
              <p className="text-[10px] text-slate-400">Deals</p>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-xl">
              <p className="text-lg font-bold text-slate-900">{client._count.documents}</p>
              <p className="text-[10px] text-slate-400">Documents</p>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-xl">
              <p className="text-lg font-bold text-slate-900">{client._count.appointments}</p>
              <p className="text-[10px] text-slate-400">Meetings</p>
            </div>
          </div>
        </div>

        {/* Notes */}
        {client.notes && (
          <div className="px-5 py-4 border-b border-slate-100">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <StickyNote className="w-3 h-3" /> Notes
            </p>
            <p className="text-sm text-slate-700 bg-slate-50 rounded-xl p-4 leading-relaxed">{client.notes}</p>
          </div>
        )}

        {/* Contract / Lease */}
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <CalendarCheck className="w-3 h-3" /> Contract / Lease
            </p>
            <button onClick={() => setEditContract((v) => !v)}
              className="text-[11px] font-semibold text-blue-600 hover:text-blue-700">
              {editContract ? "Cancel" : client.contractEnd ? "Edit" : "+ Set dates"}
            </button>
          </div>

          {editContract ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">Start Date</label>
                  <input type="date" value={contractForm.contractStart}
                    onChange={(e) => setContractForm((f) => ({ ...f, contractStart: e.target.value }))}
                    className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">End Date</label>
                  <input type="date" value={contractForm.contractEnd}
                    onChange={(e) => setContractForm((f) => ({ ...f, contractEnd: e.target.value }))}
                    className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <textarea value={contractForm.contractNotes}
                onChange={(e) => setContractForm((f) => ({ ...f, contractNotes: e.target.value }))}
                placeholder="e.g. Annual rent QAR 180,000 — The Pearl unit 8B"
                rows={2}
                className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              {saveError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{saveError}</p>
              )}
              <button onClick={saveContract} disabled={savingContract}
                className="w-full flex items-center justify-center gap-2 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition disabled:opacity-60">
                {savingContract ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                Save Contract Dates
              </button>
            </div>
          ) : client.contractEnd ? (
            <div className="space-y-3">
              {/* Progress bar */}
              {client.contractStart && (
                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                    <span>{new Date(client.contractStart).toLocaleDateString("en-QA", { day: "numeric", month: "short", year: "numeric" })}</span>
                    <span>{new Date(client.contractEnd).toLocaleDateString("en-QA", { day: "numeric", month: "short", year: "numeric" })}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    {(() => {
                      const total = new Date(client.contractEnd).getTime() - new Date(client.contractStart).getTime()
                      const elapsed = Date.now() - new Date(client.contractStart).getTime()
                      const pct = Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)))
                      return <div className={cn("h-full rounded-full transition-all", urgency?.bar || "bg-blue-400")} style={{ width: `${pct}%` }} />
                    })()}
                  </div>
                </div>
              )}

              {/* Days left badge */}
              {daysLeft !== null && (
                <div className={cn("flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold", urgency?.badge)}>
                  {daysLeft <= 30
                    ? <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    : daysLeft <= 60
                      ? <Bell className="w-4 h-4 flex-shrink-0" />
                      : <Clock className="w-4 h-4 flex-shrink-0" />}
                  <span>
                    {daysLeft <= 0
                      ? "Contract has expired!"
                      : `${daysLeft} day${daysLeft !== 1 ? "s" : ""} until renewal`}
                  </span>
                </div>
              )}

              {client.contractNotes && (
                <p className="text-[11px] text-slate-500 bg-slate-50 rounded-lg px-3 py-2">{client.contractNotes}</p>
              )}

              {/* Renewal offer actions */}
              {daysLeft !== null && daysLeft <= 90 && (
                <div className="space-y-2 pt-1">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">Send Renewal Offer</p>
                  <div className="flex gap-2">
                    <a
                      href={`https://wa.me/${client.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Dear ${client.name},\n\nYour lease agreement is expiring on ${new Date(client.contractEnd).toLocaleDateString("en-QA", { day: "numeric", month: "long", year: "numeric" })} (${daysLeft} days). We have great options available for renewal. Would you like to schedule a viewing?\n\nBest regards,\nQatar Homes Realty`)}`}
                      target="_blank" rel="noopener noreferrer"
                      onClick={markRenewalSent}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 text-[11px] font-semibold rounded-xl transition">
                      <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                    </a>
                    {client.email && (
                      <a
                        href={`mailto:${client.email}?subject=Your%20Lease%20Renewal%20-%20Qatar%20Homes%20Realty&body=${encodeURIComponent(`Dear ${client.name},\n\nYour lease agreement is expiring on ${new Date(client.contractEnd).toLocaleDateString("en-QA", { day: "numeric", month: "long", year: "numeric" })} (${daysLeft} days). We have several great properties available that match your requirements.\n\nPlease contact us to discuss your renewal options.\n\nBest regards,\nQatar Homes Realty`)}`}
                        onClick={markRenewalSent}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-[11px] font-semibold rounded-xl transition">
                        <Send className="w-3.5 h-3.5" /> Email
                      </a>
                    )}
                  </div>
                  {client.renewalSentAt && (
                    <p className="text-[10px] text-green-600 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Offer sent {relativeTime(client.renewalSentAt)}
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <button onClick={() => setEditContract(true)}
              className="w-full flex items-center gap-2 p-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:border-blue-300 hover:text-blue-500 transition text-xs font-medium">
              <Calendar className="w-4 h-4" /> Add contract start &amp; end dates
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="px-5 py-4 space-y-2">
          <Link href={`/dashboard/documents?clientId=${client.id}`}>
            <button className="w-full flex items-center justify-between px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition group">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <FileText className="w-4 h-4 text-slate-400" /> View Documents
              </span>
              <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{client._count.documents}</span>
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Client | null>(null)
  const [view, setView] = useState<"grid" | "list">("grid")
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState("newest")
  const [showForm, setShowForm] = useState(false)
  const [convertLeads, setConvertLeads] = useState<{ id: string; name: string; phone: string }[]>([])
  const [form, setForm] = useState({
    name: "", phone: "", email: "", nationality: "", idNumber: "", notes: "", leadId: "",
  })
  const [saving, setSaving] = useState(false)

  const fetchClients = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/clients")
      const data = await res.json()
      setClients(data.clients || [])
    } catch { setClients([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchClients() }, [fetchClients])

  // Load unconverted leads for "convert" picker
  async function loadLeads() {
    try {
      const res = await fetch("/api/leads")
      const data = await res.json()
      setConvertLeads((data.leads || [])
        .filter((l: { status: string }) => l.status !== "CONVERTED" && l.status !== "LOST")
        .map((l: { id: string; name: string; phone: string }) => ({ id: l.id, name: l.name, phone: l.phone }))
      )
    } catch { setConvertLeads([]) }
  }

  function openForm() { loadLeads(); setShowForm(true) }

  async function addClient(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      // If converting a lead, pre-fill from lead data when name empty
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setShowForm(false)
        setForm({ name: "", phone: "", email: "", nationality: "", idNumber: "", notes: "", leadId: "" })
        fetchClients()
      }
    } finally { setSaving(false) }
  }

  // When a lead is selected to convert, pre-fill form
  function selectLead(leadId: string) {
    const lead = convertLeads.find((l) => l.id === leadId)
    if (lead) {
      setForm((f) => ({ ...f, leadId, name: lead.name, phone: lead.phone }))
    } else {
      setForm((f) => ({ ...f, leadId: "" }))
    }
  }

  // Stats
  const totalDeals = clients.reduce((s, c) => s + c._count.leads, 0)
  const totalDocs = clients.reduce((s, c) => s + c._count.documents, 0)
  const thisMonth = clients.filter((c) => {
    const d = new Date(c.createdAt)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length

  const filtered = useMemo(() => {
    let r = [...clients]
    if (search.trim()) {
      const q = search.toLowerCase()
      r = r.filter((c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.email || "").toLowerCase().includes(q) ||
        (c.nationality || "").toLowerCase().includes(q)
      )
    }
    switch (sort) {
      case "newest": r.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break
      case "oldest": r.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()); break
      case "name": r.sort((a, b) => a.name.localeCompare(b.name)); break
      case "deals": r.sort((a, b) => b._count.leads - a._count.leads); break
    }
    return r
  }, [clients, search, sort])

  return (
    <div className="h-full flex flex-col">
      <Header
        title="Clients"
        description={`${clients.length} client${clients.length !== 1 ? "s" : ""}`}
        actions={
          <Button size="sm" className="gap-2" onClick={openForm}>
            <Plus className="w-4 h-4" /> Add Client
          </Button>
        }
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-6 pt-5 pb-4 space-y-4 flex-shrink-0">

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard icon={<Users className="w-5 h-5 text-blue-600" />} label="Total Clients" value={clients.length} sub={`${thisMonth} this month`} color="bg-blue-50" />
            <StatCard icon={<TrendingUp className="w-5 h-5 text-green-600" />} label="Total Deals" value={totalDeals} sub="Across all clients" color="bg-green-50" />
            <StatCard icon={<FileText className="w-5 h-5 text-violet-600" />} label="Documents" value={totalDocs} sub="Contracts & files" color="bg-violet-50" />
            <StatCard icon={<UserPlus className="w-5 h-5 text-amber-600" />} label="New This Month" value={thisMonth} sub="Recently added" color="bg-amber-50" />
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, phone, email, nationality…"
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Sort */}
            <div className="relative">
              <select value={sort} onChange={(e) => setSort(e.target.value)}
                className="appearance-none pl-3 pr-7 py-2.5 text-sm border border-slate-200 rounded-xl bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="name">A → Z</option>
                <option value="deals">Most Deals</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>

            {/* View toggle */}
            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 gap-0.5 flex-shrink-0">
              <button onClick={() => setView("grid")}
                className={cn("p-1.5 rounded-lg transition-all", view === "grid" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-700")}>
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button onClick={() => setView("list")}
                className={cn("p-1.5 rounded-lg transition-all", view === "list" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-700")}>
                <LayoutList className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 flex overflow-hidden">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : clients.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center max-w-sm w-full">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-7 h-7 text-blue-600" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">No clients yet</h3>
                <p className="text-slate-500 text-sm mb-5">Add your first client or convert a qualified lead</p>
                <Button onClick={openForm} className="gap-2"><Plus className="w-4 h-4" /> Add First Client</Button>
              </div>
            </div>
          ) : (
            <div className={cn("flex-1 overflow-hidden flex", selected ? "" : "")}>
              <div className={cn("flex-1 overflow-y-auto px-6 pb-6", selected ? "hidden lg:block" : "")}>
                {filtered.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <Search className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-medium">No clients match your search</p>
                  </div>
                ) : view === "grid" ? (
                  <>
                    <p className="text-xs text-slate-400 pb-3">{filtered.length} client{filtered.length !== 1 ? "s" : ""}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {filtered.map((c) => <ClientCard key={c.id} client={c} onClick={() => setSelected(c)} />)}
                    </div>
                  </>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50">
                          <th className="pl-4 pr-3 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Client</th>
                          <th className="px-3 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Contact</th>
                          <th className="px-3 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">QID</th>
                          <th className="px-3 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Last Deal</th>
                          <th className="px-3 py-3 text-center text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Deals</th>
                          <th className="px-3 py-3 text-center text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Docs</th>
                          <th className="px-3 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Since</th>
                          <th className="pl-3 pr-4 py-3 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((c) => <ClientRow key={c.id} client={c} onClick={() => setSelected(c)} />)}
                      </tbody>
                    </table>
                    <div className="px-4 py-3 border-t border-slate-100 bg-slate-50">
                      <p className="text-xs text-slate-400">{filtered.length} client{filtered.length !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                )}
              </div>

              {selected && (
                <ClientDrawer
                  client={selected}
                  onClose={() => setSelected(null)}
                  onContractSaved={(updated) => {
                    const merged = { ...selected, ...updated }
                    setSelected(merged as Client)
                    setClients((prev) => prev.map((c) => c.id === selected.id ? merged as Client : c))
                  }}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Add / Convert Modal ── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900">Add New Client</h3>
                <p className="text-xs text-slate-400 mt-0.5">New client or convert an existing lead</p>
              </div>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={addClient} className="px-6 py-5 space-y-4">
              {/* Convert from Lead */}
              {convertLeads.length > 0 && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <p className="text-xs font-semibold text-blue-700 mb-2 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" /> Convert an existing lead
                  </p>
                  <div className="relative">
                    <select
                      value={form.leadId}
                      onChange={(e) => selectLead(e.target.value)}
                      className="w-full appearance-none pl-3 pr-7 py-2 text-sm border border-blue-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">— Select a lead to convert —</option>
                      {convertLeads.map((l) => (
                        <option key={l.id} value={l.id}>{l.name} · {l.phone}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  </div>
                  {form.leadId && (
                    <p className="text-[11px] text-blue-600 mt-1.5 flex items-center gap-1">
                      <BadgeCheck className="w-3 h-3" /> Lead will be marked as Converted
                    </p>
                  )}
                </div>
              )}

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

              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Identity</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Nationality</label>
                    <div className="relative">
                      <select value={form.nationality} onChange={(e) => setForm((f) => ({ ...f, nationality: e.target.value }))}
                        className="w-full appearance-none pl-3 pr-7 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Select…</option>
                        {NATIONALITIES.map((n) => <option key={n} value={n}>{n}</option>)}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">QID Number</label>
                    <Input value={form.idNumber} onChange={(e) => setForm((f) => ({ ...f, idNumber: e.target.value }))} placeholder="28XXXXXXXXX" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
                <Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="VIP client, preferences, important details…" rows={3} />
              </div>

              <div className="flex gap-3 pt-1">
                <Button type="submit" disabled={saving} className="flex-1 gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {form.leadId ? "Convert & Add Client" : "Add Client"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
