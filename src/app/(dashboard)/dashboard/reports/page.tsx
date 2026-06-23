"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { cn, formatPrice } from "@/lib/utils"
import {
  TrendingUp, Users, UserCheck, Home, ArrowUpRight,
  Target, Loader2, Building2,
} from "lucide-react"

// Dynamic imports — recharts accesses window.matchMedia at init which can crash SSR/hydration
const ResponsiveContainer = dynamic(() => import("recharts").then(m => ({ default: m.ResponsiveContainer })), { ssr: false })
const BarChart            = dynamic(() => import("recharts").then(m => ({ default: m.BarChart })),            { ssr: false })
const Bar                 = dynamic(() => import("recharts").then(m => ({ default: m.Bar })),                 { ssr: false })
const XAxis               = dynamic(() => import("recharts").then(m => ({ default: m.XAxis })),               { ssr: false })
const YAxis               = dynamic(() => import("recharts").then(m => ({ default: m.YAxis })),               { ssr: false })
const Tooltip             = dynamic(() => import("recharts").then(m => ({ default: m.Tooltip })),             { ssr: false })
const CartesianGrid       = dynamic(() => import("recharts").then(m => ({ default: m.CartesianGrid })),       { ssr: false })
const PieChart            = dynamic(() => import("recharts").then(m => ({ default: m.PieChart })),            { ssr: false })
const Pie                 = dynamic(() => import("recharts").then(m => ({ default: m.Pie })),                 { ssr: false })
const Cell                = dynamic(() => import("recharts").then(m => ({ default: m.Cell })),                { ssr: false })
const LineChart           = dynamic(() => import("recharts").then(m => ({ default: m.LineChart })),           { ssr: false })
const Line                = dynamic(() => import("recharts").then(m => ({ default: m.Line })),                { ssr: false })

interface ReportData {
  monthly: { month: string; leads: number; converted: number; appointments: number }[]
  sources:  { name: string; value: number }[]
  pipeline: { status: string; count: number }[]
  stats: {
    totalLeads: number; totalConverted: number; totalProperties: number
    totalClients: number; totalAppointments: number; conversionRate: number
    portfolioValue: number; newLeadsThisMonth: number
  }
  topProperties: { id: string; title: string; views: number; type: string; listingType: string; price: number; status: string; photos: string[] }[]
  recentConversions: { id: string; name: string; updatedAt: string; property?: { title: string; price: number; listingType: string } | null }[]
}

const SOURCE_COLORS = ["#6366f1","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#ec4899","#84cc16"]
const PIPELINE_ORDER = ["NEW","CONTACTED","QUALIFIED","VIEWING SCHEDULED","NEGOTIATING","CONVERTED","LOST"]
const PIPELINE_COLORS: Record<string, string> = {
  NEW: "#6366f1", CONTACTED: "#3b82f6", QUALIFIED: "#10b981",
  "VIEWING SCHEDULED": "#f59e0b", NEGOTIATING: "#f97316", CONVERTED: "#22c55e", LOST: "#ef4444",
}

function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string | number; sub?: string; icon: React.ElementType; color: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-start justify-between mb-4">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", color)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <ArrowUpRight className="w-4 h-4 text-slate-300" />
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm font-medium text-slate-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 text-xs">
      <p className="font-bold text-slate-700 mb-2">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="flex items-center gap-2" style={{ color: p.color }}>
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
          {p.name}: <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  )
}

export default function ReportsPage() {
  const [data, setData]       = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    fetch("/api/reports")
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-7 h-7 animate-spin text-slate-300" />
    </div>
  )

  if (!data) return (
    <div className="p-6 text-center text-slate-400">Failed to load reports</div>
  )

  const { stats, monthly, sources, pipeline, topProperties, recentConversions } = data

  const sortedPipeline = [...pipeline].sort((a, b) =>
    PIPELINE_ORDER.indexOf(a.status) - PIPELINE_ORDER.indexOf(b.status)
  )
  const maxPipeline = Math.max(...sortedPipeline.map(p => p.count), 1)

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1>
          <p className="text-sm text-slate-400 mt-0.5">Performance overview for your portfolio</p>
        </div>
        <div className="text-xs text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg">
          {new Date().toLocaleDateString("en-QA", { month: "short", day: "numeric", year: "numeric" })}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Leads"      value={stats.totalLeads}
          sub={`+${stats.newLeadsThisMonth} this month`} icon={UserCheck} color="bg-blue-500" />
        <StatCard label="Conversion Rate"  value={`${stats.conversionRate}%`}
          sub={`${stats.totalConverted} deals closed`}   icon={Target}    color="bg-emerald-500" />
        <StatCard label="Active Listings"  value={stats.totalProperties}
          sub={`Portfolio: ${formatPrice(stats.portfolioValue)}`} icon={Home} color="bg-violet-500" />
        <StatCard label="Total Clients"    value={stats.totalClients}
          sub={`${stats.totalAppointments} appointments`} icon={Users}    color="bg-amber-500" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Monthly Activity */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-bold text-slate-900">Monthly Activity</h2>
              <p className="text-xs text-slate-400 mt-0.5">Leads, conversions & appointments</p>
            </div>
            <div className="flex items-center gap-4 text-[11px] font-semibold">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 inline-block" />Leads</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />Converted</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" />Appts</span>
            </div>
          </div>
          {mounted && (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthly} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={24} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="leads"        name="Leads"     fill="#6366f1" radius={[4,4,0,0]} />
                <Bar dataKey="converted"    name="Converted" fill="#10b981" radius={[4,4,0,0]} />
                <Bar dataKey="appointments" name="Appts"     fill="#f59e0b" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Lead Sources */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="font-bold text-slate-900 mb-1">Lead Sources</h2>
          <p className="text-xs text-slate-400 mb-4">Where your leads come from</p>
          {sources.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-300">
              <TrendingUp className="w-8 h-8 mb-2" /><p className="text-xs">No data yet</p>
            </div>
          ) : (
            <>
              {mounted && (
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={sources} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                      dataKey="value" nameKey="name" paddingAngle={3}>
                      {sources.map((_, i) => (
                        <Cell key={i} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => [v, ""]} />
                  </PieChart>
                </ResponsiveContainer>
              )}
              <div className="space-y-2 mt-2">
                {sources.slice(0, 5).map((s, i) => (
                  <div key={s.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ background: SOURCE_COLORS[i % SOURCE_COLORS.length] }} />
                      <span className="text-xs text-slate-600 capitalize">{s.name.toLowerCase()}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-700">{s.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Pipeline + Top Properties */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="font-bold text-slate-900 mb-1">Lead Pipeline</h2>
          <p className="text-xs text-slate-400 mb-5">Leads at each stage</p>
          {sortedPipeline.length === 0 ? (
            <div className="text-center py-10 text-slate-300 text-xs">No leads yet</div>
          ) : (
            <div className="space-y-3">
              {sortedPipeline.map(s => {
                const pct   = Math.round((s.count / maxPipeline) * 100)
                const color = PIPELINE_COLORS[s.status] || "#94a3b8"
                return (
                  <div key={s.status}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-600 capitalize">{s.status.toLowerCase()}</span>
                      <span className="text-xs font-bold text-slate-900">{s.count}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="font-bold text-slate-900 mb-1">Top Properties</h2>
          <p className="text-xs text-slate-400 mb-5">Most viewed listings</p>
          {topProperties.length === 0 ? (
            <div className="text-center py-10 text-slate-300 text-xs">No properties yet</div>
          ) : (
            <div className="space-y-3">
              {topProperties.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3">
                  <span className="w-5 text-[11px] font-bold text-slate-300 flex-shrink-0">{i + 1}</span>
                  <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                    {p.photos?.[0]
                      ? <img src={p.photos[0]} alt="" className="w-full h-full object-cover" />
                      : <Building2 className="w-4 h-4 text-slate-300 m-2.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{p.title}</p>
                    <p className="text-[10px] text-slate-400">
                      {p.type} · {p.listingType === "RENT" ? "Rent" : "Sale"} · {formatPrice(p.price)}
                    </p>
                  </div>
                  <div className="text-xs font-bold text-slate-600 flex-shrink-0">👁 {p.views}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Conversion Trend + Recent Deals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="font-bold text-slate-900 mb-1">Conversion Trend</h2>
          <p className="text-xs text-slate-400 mb-5">Lead-to-client rate over 6 months</p>
          {mounted && (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={monthly.map(m => ({ ...m, rate: m.leads > 0 ? Math.round((m.converted / m.leads) * 100) : 0 }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={30}
                  tickFormatter={v => `${v}%`} domain={[0, 100]} />
                <Tooltip formatter={(v) => [`${v}%`, "Conversion"]} />
                <Line type="monotone" dataKey="rate" stroke="#6366f1" strokeWidth={2.5}
                  dot={{ fill: "#6366f1", strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, fill: "#6366f1" }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="font-bold text-slate-900 mb-1">Recent Deals</h2>
          <p className="text-xs text-slate-400 mb-4">Latest conversions</p>
          {recentConversions.length === 0 ? (
            <div className="text-center py-10 text-slate-300 text-xs">No deals yet</div>
          ) : (
            <div className="space-y-3">
              {recentConversions.map(c => (
                <div key={c.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <Target className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800">{c.name}</p>
                    {c.property && (
                      <p className="text-[10px] text-slate-400 truncate">
                        {c.property.title} · {formatPrice(c.property.price)}
                      </p>
                    )}
                    <p className="text-[10px] text-slate-300 mt-0.5">
                      {new Date(c.updatedAt).toLocaleDateString("en-QA", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-md flex-shrink-0">WON</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
