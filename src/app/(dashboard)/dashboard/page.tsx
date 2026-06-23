import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { LeadStatus } from "@prisma/client"
import { Header } from "@/components/dashboard/header"
import { StatsCard } from "@/components/dashboard/stats-card"
import { PipelineChart } from "@/components/dashboard/pipeline-chart"
import { formatPrice, relativeTime } from "@/lib/utils"
import {
  Building2, Users, UserCheck, Calendar, TrendingUp,
  ArrowRight, Star, Phone, Flame, Target, DollarSign,
  Clock, ChevronUp, Shield, Bell, AlertTriangle,
} from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

const PIPELINE_STAGES: { status: LeadStatus; label: string }[] = [
  { status: LeadStatus.NEW, label: "New" },
  { status: LeadStatus.CONTACTED, label: "Contacted" },
  { status: LeadStatus.QUALIFIED, label: "Qualified" },
  { status: LeadStatus.VIEWING_SCHEDULED, label: "Viewing" },
  { status: LeadStatus.NEGOTIATING, label: "Negotiating" },
  { status: LeadStatus.CONVERTED, label: "Converted" },
]

const STATUS_COLORS: Record<string, "success" | "default" | "secondary" | "warning" | "destructive"> = {
  NEW: "default", CONTACTED: "secondary", QUALIFIED: "success",
  VIEWING_SCHEDULED: "warning", NEGOTIATING: "warning",
  CONVERTED: "success", LOST: "destructive",
}

async function getDashboardData(agentId: string, isAdmin: boolean) {
  try {
    const filter = isAdmin ? {} : { agentId }
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(todayStart.getTime() + 86400000)

    const [
      totalProperties, totalLeads, totalClients,
      newLeadsThisMonth, convertedLeads, totalLeadsEver,
      leadsWithScore,
    ] = await Promise.all([
      db.property.count({ where: filter }),
      db.lead.count({ where: { ...filter, status: { notIn: [LeadStatus.LOST, LeadStatus.CONVERTED] } } }),
      db.client.count({ where: filter }),
      db.lead.count({ where: { ...filter, createdAt: { gte: startOfMonth } } }),
      db.lead.count({ where: { ...filter, status: "CONVERTED" } }),
      db.lead.count({ where: filter }),
      db.lead.findMany({
        where: { ...filter, score: { gt: 59 } },
        orderBy: { score: "desc" },
        take: 5,
        select: { id: true, name: true, phone: true, score: true, status: true, propertyType: true, budget: true },
      }),
    ])

    const [pipelineCounts, portfolioValue, todayAppointments, recentActivity, websiteInquiries] = await Promise.all([
      Promise.all(
        PIPELINE_STAGES.map(async (s) => ({
          ...s,
          count: await db.lead.count({ where: { ...filter, status: s.status } }),
        }))
      ),
      db.property.aggregate({
        where: { ...filter, status: "AVAILABLE" },
        _sum: { price: true },
      }),
      db.appointment.findMany({
        where: {
          ...(isAdmin ? {} : { agentId }),
          startTime: { gte: todayStart, lt: todayEnd },
          status: { not: "CANCELLED" },
        },
        orderBy: { startTime: "asc" },
        include: {
          lead: { select: { name: true, phone: true } },
          property: { select: { title: true, district: true } },
        },
      }),
      db.lead.findMany({
        where: filter,
        orderBy: { updatedAt: "desc" },
        take: 6,
        select: { id: true, name: true, status: true, source: true, updatedAt: true, score: true },
      }),
      db.lead.findMany({
        where: { ...filter, source: "WEBSITE", propertyId: { not: null } },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          property: { select: { id: true, title: true, referenceNumber: true, listingType: true, price: true, photos: true } },
        },
      }),
    ])

    const conversionRate = totalLeadsEver > 0 ? Math.round((convertedLeads / totalLeadsEver) * 100) : 0

    // Admin: agent leaderboard
    let agentLeaderboard: Array<{ id: string; name: string | null; leads: number; converted: number }> = []
    if (isAdmin) {
      const agents = await db.user.findMany({
        where: { role: "AGENT" },
        select: { id: true, name: true },
      })
      agentLeaderboard = await Promise.all(
        agents.map(async (a) => ({
          id: a.id,
          name: a.name,
          leads: await db.lead.count({ where: { agentId: a.id } }),
          converted: await db.lead.count({ where: { agentId: a.id, status: "CONVERTED" } }),
        }))
      )
      agentLeaderboard.sort((a, b) => b.converted - a.converted)
    }

    const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)
    const upcomingRenewals = await db.client.findMany({
      where: { agentId, contractEnd: { gte: now, lte: in90Days } },
      orderBy: { contractEnd: "asc" },
      take: 5,
      select: { id: true, name: true, phone: true, email: true, contractEnd: true, contractNotes: true, renewalSentAt: true },
    })

    return {
      totalProperties, totalLeads, totalClients, newLeadsThisMonth,
      conversionRate, pipelineCounts, portfolioValue: portfolioValue._sum.price || 0,
      todayAppointments, hotLeads: leadsWithScore, recentActivity, agentLeaderboard,
      websiteInquiries, upcomingRenewals,
    }
  } catch (e) {
    console.error(e)
    return {
      totalProperties: 0, totalLeads: 0, totalClients: 0, newLeadsThisMonth: 0,
      conversionRate: 0, pipelineCounts: PIPELINE_STAGES.map((s) => ({ ...s, count: 0 })),
      portfolioValue: 0, todayAppointments: [], hotLeads: [], recentActivity: [], agentLeaderboard: [], websiteInquiries: [], upcomingRenewals: [],
    }
  }
}

export default async function DashboardPage() {
  const session = await auth()
  const isAdmin = session?.user?.role === "ADMIN"
  const data = await getDashboardData(session?.user?.id || "", isAdmin)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"
  const firstName = session?.user?.name?.split(" ")[0] || "Agent"

  return (
    <div>
      <Header
        title={`${greeting}, ${firstName}`}
        description={isAdmin ? "Agency-wide performance overview" : "Your sales pipeline and today's schedule"}
        actions={
          isAdmin ? (
            <span className="inline-flex items-center gap-1.5 bg-purple-100 text-purple-700 text-xs font-semibold px-3 py-1.5 rounded-full">
              <Shield className="w-3 h-3" /> Admin View
            </span>
          ) : undefined
        }
      />

      <div className="p-6 space-y-6">

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Active Properties" value={data.totalProperties} icon={Building2} color="blue" change={8} />
          <StatsCard title="Active Leads" value={data.totalLeads} icon={UserCheck} color="amber" change={data.newLeadsThisMonth} />
          <StatsCard title="Clients" value={data.totalClients} icon={Users} color="green" />
          <StatsCard
            title="Conversion Rate"
            value={`${data.conversionRate}%`}
            icon={Target}
            color="purple"
          />
        </div>

        {/* Pipeline + Today's Schedule */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Pipeline */}
          <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">Lead Pipeline</h3>
                <p className="text-xs text-slate-400 mt-0.5">Leads by stage</p>
              </div>
              <Link href="/dashboard/leads" className="text-xs text-blue-600 flex items-center gap-1 hover:underline">
                Manage <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="px-5 pt-4 pb-2">
              <PipelineChart stages={data.pipelineCounts} />
            </div>
            <div className="px-5 pb-4 grid grid-cols-3 gap-2">
              {data.pipelineCounts.slice(0, 6).map((s) => (
                <div key={s.status} className="text-center">
                  <p className="text-lg font-bold text-slate-900">{s.count}</p>
                  <p className="text-[11px] text-slate-400">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Today's Schedule */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">Today</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {new Date().toLocaleDateString("en-QA", { weekday: "long", day: "numeric", month: "long" })}
                </p>
              </div>
              <Link href="/dashboard/calendar" className="text-xs text-blue-600 flex items-center gap-1 hover:underline">
                Calendar <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="flex-1 divide-y divide-slate-100">
              {data.todayAppointments.length === 0 ? (
                <div className="p-8 text-center">
                  <Clock className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">No appointments today</p>
                  <Link href="/dashboard/calendar" className="text-blue-600 text-xs font-medium hover:underline mt-1 block">
                    Schedule one →
                  </Link>
                </div>
              ) : (
                data.todayAppointments.map((apt) => (
                  <div key={apt.id} className="px-5 py-3 flex items-start gap-3">
                    <div className="flex-shrink-0 text-center pt-0.5">
                      <p className="text-xs font-bold text-blue-600 leading-none">
                        {new Date(apt.startTime).toLocaleTimeString("en-QA", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 truncate">{apt.title}</p>
                      {apt.lead && <p className="text-xs text-slate-400 truncate">{apt.lead.name}</p>}
                      {apt.property && (
                        <p className="text-xs text-slate-400 truncate">{apt.property.district || apt.property.title}</p>
                      )}
                    </div>
                    <Badge variant={apt.type === "VIEWING" ? "warning" : "secondary"} className="text-[10px] flex-shrink-0">
                      {apt.type}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Hot Leads + Portfolio Value */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Hot Leads */}
          <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" />
                <h3 className="font-semibold text-slate-900">Hot Leads</h3>
                <span className="text-xs text-slate-400">Score 60+</span>
              </div>
              <Link href="/dashboard/leads" className="text-xs text-blue-600 flex items-center gap-1 hover:underline">
                All leads <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {data.hotLeads.length === 0 ? (
              <div className="p-8 text-center">
                <Star className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">No qualified leads yet</p>
                <p className="text-slate-300 text-xs mt-1">Use AI Qualify on leads to score them</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {data.hotLeads.map((lead) => (
                  <div key={lead.id} className="px-5 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-xs font-bold flex-shrink-0">
                      {lead.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{lead.name}</p>
                      <p className="text-xs text-slate-400 truncate">
                        {lead.propertyType?.toLowerCase()} · {lead.budget ? formatPrice(lead.budget) : "Budget TBC"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="flex items-center gap-1">
                        <div
                          className="h-1.5 rounded-full bg-orange-400"
                          style={{ width: `${Math.round(lead.score * 0.5)}px` }}
                        />
                        <span className="text-xs font-bold text-orange-600">{lead.score}</span>
                      </div>
                      <Badge variant={STATUS_COLORS[lead.status] || "secondary"} className="text-[10px]">
                        {lead.status.replace(/_/g, " ")}
                      </Badge>
                      <a
                        href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-green-50 hover:bg-green-100 transition"
                      >
                        <Phone className="w-3 h-3 text-green-600" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Portfolio + Metrics */}
          <div className="lg:col-span-2 space-y-4">
            {/* Portfolio Value */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-5 text-white">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-4 h-4 text-blue-200" />
                <span className="text-sm font-medium text-blue-100">Portfolio Value</span>
              </div>
              <p className="text-2xl font-bold">{formatPrice(data.portfolioValue)}</p>
              <p className="text-xs text-blue-200 mt-1">Active listings (QAR)</p>
              <div className="mt-4 pt-4 border-t border-blue-500/40 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xl font-bold">{data.newLeadsThisMonth}</p>
                  <p className="text-xs text-blue-200">New leads this month</p>
                </div>
                <div>
                  <p className="text-xl font-bold">{data.conversionRate}%</p>
                  <p className="text-xs text-blue-200">Conversion rate</p>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl border border-slate-200">
              <div className="p-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900 text-sm">Recent Activity</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {data.recentActivity.length === 0 ? (
                  <p className="p-4 text-xs text-slate-400 text-center">No activity yet</p>
                ) : (
                  data.recentActivity.map((lead) => (
                    <div key={lead.id} className="px-4 py-2.5 flex items-center gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-slate-700 truncate">{lead.name}</p>
                        <p className="text-[11px] text-slate-400">{lead.status.replace(/_/g, " ")} · {relativeTime(lead.updatedAt)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Website Inquiries */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <h3 className="font-semibold text-slate-900">Website Inquiries</h3>
              <span className="text-xs text-slate-400">Leads from your public listings</span>
            </div>
            <Link href="/dashboard/leads?source=WEBSITE" className="text-xs text-blue-600 flex items-center gap-1 hover:underline">
              All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {data.websiteInquiries.length === 0 ? (
            <div className="p-10 text-center">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-sm font-medium text-slate-400">No website inquiries yet</p>
              <p className="text-xs text-slate-300 mt-1">When visitors fill out the contact form on a listing, they appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {data.websiteInquiries.map((inquiry) => {
                const prop = inquiry.property as { id: string; title: string; referenceNumber?: string | null; listingType: string; price: number; photos: string[] } | null
                return (
                  <div key={inquiry.id} className="px-5 py-4 flex items-center gap-4">
                    {/* Lead avatar */}
                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                      {inquiry.name[0]}
                    </div>

                    {/* Lead info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{inquiry.name}</p>
                      <p className="text-xs text-slate-400">{inquiry.phone} · {relativeTime(inquiry.createdAt)}</p>
                    </div>

                    {/* Arrow */}
                    <ChevronUp className="w-4 h-4 text-slate-300 rotate-90 flex-shrink-0" />

                    {/* Property reference */}
                    {prop && (
                      <div className="flex items-center gap-2.5 min-w-0 max-w-[220px]">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden">
                          {prop.photos?.[0]
                            ? <img src={prop.photos[0]} alt="" className="w-full h-full object-cover" />
                            : <Building2 className="w-4 h-4 text-slate-400 m-2.5" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800 truncate">{prop.title}</p>
                          <p className="text-[11px] text-slate-400">
                            {prop.referenceNumber && <span className="font-mono">{prop.referenceNumber} · </span>}
                            {formatPrice(prop.price)} {prop.listingType === "RENT" ? "/yr" : "sale"}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Status badge */}
                    <Badge variant={STATUS_COLORS[inquiry.status] || "secondary"} className="text-[10px] flex-shrink-0">
                      {inquiry.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Upcoming Renewals */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-500" />
              <h3 className="font-semibold text-slate-900">Upcoming Renewals</h3>
              <span className="text-xs text-slate-400">Contracts expiring within 90 days</span>
              {data.upcomingRenewals.length > 0 && (
                <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full ml-1">
                  {data.upcomingRenewals.length}
                </span>
              )}
            </div>
            <Link href="/dashboard/clients" className="text-xs text-blue-600 flex items-center gap-1 hover:underline">
              Manage <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {data.upcomingRenewals.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Bell className="w-6 h-6 text-amber-400" />
              </div>
              <p className="text-sm font-semibold text-slate-700 mb-1">No upcoming renewals</p>
              <p className="text-xs text-slate-400 mb-4">Open a client profile and set their contract start &amp; end dates to track renewals here</p>
              <Link href="/dashboard/clients" className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700">
                Go to Clients <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {data.upcomingRenewals.map((client) => {
                const daysLeft = Math.ceil((new Date(client.contractEnd!).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                const isUrgent = daysLeft <= 30
                const isSoon = daysLeft <= 60
                return (
                  <div key={client.id} className="px-5 py-4 flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isUrgent ? "bg-red-100" : isSoon ? "bg-amber-100" : "bg-blue-100"}`}>
                      {isUrgent
                        ? <AlertTriangle className="w-5 h-5 text-red-600" />
                        : <Bell className="w-5 h-5 text-amber-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{client.name}</p>
                      <p className="text-xs text-slate-400">
                        Expires {new Date(client.contractEnd!).toLocaleDateString("en-QA", { day: "numeric", month: "long", year: "numeric" })}
                        {client.contractNotes && <span> · {client.contractNotes}</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${isUrgent ? "bg-red-50 text-red-700" : isSoon ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"}`}>
                        {daysLeft}d left
                      </span>
                      <a
                        href={`https://wa.me/${client.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Dear ${client.name}, your lease is expiring in ${daysLeft} days. We have great renewal options available. Please contact us.`)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-semibold rounded-xl transition"
                      >
                        <Phone className="w-3.5 h-3.5" /> Send Offer
                      </a>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Admin: Agent Leaderboard */}
        {isAdmin && data.agentLeaderboard.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-600" />
              <h3 className="font-semibold text-slate-900">Agent Performance</h3>
              <span className="text-xs text-slate-400 ml-1">Team leaderboard</span>
            </div>
            <div className="divide-y divide-slate-100">
              {data.agentLeaderboard.map((agent, i) => {
                const rate = agent.leads > 0 ? Math.round((agent.converted / agent.leads) * 100) : 0
                return (
                  <div key={agent.id} className="px-5 py-4 flex items-center gap-4">
                    <span className={`text-sm font-bold w-5 text-center ${i === 0 ? "text-amber-500" : "text-slate-300"}`}>
                      {i + 1}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold flex-shrink-0">
                      {(agent.name || "A")[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{agent.name || "Agent"}</p>
                      <p className="text-xs text-slate-400">{agent.leads} leads · {agent.converted} converted</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-slate-900">{rate}%</p>
                      <p className="text-xs text-slate-400">conversion</p>
                    </div>
                    {i === 0 && (
                      <div className="flex items-center gap-1 text-amber-500 flex-shrink-0">
                        <Star className="w-4 h-4 fill-amber-400" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold">Quick Actions</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Add Property", href: "/dashboard/properties/new", icon: "🏠" },
              { label: "New Lead", href: "/dashboard/leads", icon: "👤" },
              { label: "Schedule Viewing", href: "/dashboard/calendar", icon: "📅" },
              { label: "AI Assistant", href: "/dashboard/assistant", icon: "🤖" },
            ].map(({ label, href, icon }) => (
              <Link
                key={label}
                href={href}
                className="bg-white/10 hover:bg-white/20 text-white text-sm font-medium py-3 px-4 rounded-lg text-center transition flex flex-col items-center gap-1.5"
              >
                <span className="text-xl">{icon}</span>
                {label}
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
