import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Header } from "@/components/dashboard/header"
import { StatsCard } from "@/components/dashboard/stats-card"
import { formatPrice } from "@/lib/utils"
import { Building2, Users, UserCheck, Target, Star, Shield, TrendingUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"

async function getAdminData() {
  try {
    const [totalProperties, totalLeads, totalClients, totalAgents, convertedLeads, portfolioValue, agents] =
      await Promise.all([
        db.property.count(),
        db.lead.count(),
        db.client.count(),
        db.user.count({ where: { role: "AGENT" } }),
        db.lead.count({ where: { status: "CONVERTED" } }),
        db.property.aggregate({ where: { status: "AVAILABLE" }, _sum: { price: true } }),
        db.user.findMany({
          where: { role: "AGENT" },
          select: {
            id: true, name: true, email: true, createdAt: true,
            _count: { select: { properties: true, leads: true, clients: true } },
          },
        }),
      ])

    const agentsWithStats = await Promise.all(
      agents.map(async (a) => {
        const [converted, hotLeads, portfolioAgg] = await Promise.all([
          db.lead.count({ where: { agentId: a.id, status: "CONVERTED" } }),
          db.lead.count({ where: { agentId: a.id, score: { gt: 59 } } }),
          db.property.aggregate({ where: { agentId: a.id, status: "AVAILABLE" }, _sum: { price: true } }),
        ])
        return {
          ...a,
          converted,
          hotLeads,
          portfolioValue: portfolioAgg._sum.price || 0,
          conversionRate: a._count.leads > 0 ? Math.round((converted / a._count.leads) * 100) : 0,
        }
      })
    )

    agentsWithStats.sort((a, b) => b.converted - a.converted)

    const overallConversion = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0

    return {
      totalProperties, totalLeads, totalClients, totalAgents,
      overallConversion, portfolioValue: portfolioValue._sum.price || 0, agents: agentsWithStats,
    }
  } catch (e) {
    console.error(e)
    return {
      totalProperties: 0, totalLeads: 0, totalClients: 0, totalAgents: 0,
      overallConversion: 0, portfolioValue: 0, agents: [],
    }
  }
}

export default async function AdminPage() {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") redirect("/dashboard")

  const data = await getAdminData()

  return (
    <div>
      <Header
        title="Team Overview"
        description="Agency-wide performance and agent management"
        actions={
          <span className="inline-flex items-center gap-1.5 bg-purple-100 text-purple-700 text-xs font-semibold px-3 py-1.5 rounded-full">
            <Shield className="w-3 h-3" /> Admin
          </span>
        }
      />

      <div className="p-6 space-y-6">
        {/* Agency stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Total Properties" value={data.totalProperties} icon={Building2} color="blue" />
          <StatsCard title="Total Leads" value={data.totalLeads} icon={UserCheck} color="amber" />
          <StatsCard title="Total Clients" value={data.totalClients} icon={Users} color="green" />
          <StatsCard title="Conversion Rate" value={`${data.overallConversion}%`} icon={Target} color="purple" />
        </div>

        {/* Portfolio value banner */}
        <div className="bg-gradient-to-r from-purple-700 to-blue-700 rounded-xl p-6 text-white flex items-center justify-between">
          <div>
            <p className="text-purple-200 text-sm font-medium mb-1">Total Agency Portfolio</p>
            <p className="text-3xl font-bold">{formatPrice(data.portfolioValue)}</p>
            <p className="text-purple-200 text-xs mt-1">Active listings across all agents</p>
          </div>
          <TrendingUp className="w-16 h-16 text-white/20" />
        </div>

        {/* Agent leaderboard */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="p-5 border-b border-slate-100 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
            <h3 className="font-semibold text-slate-900">Agent Leaderboard</h3>
            <span className="text-xs text-slate-400">{data.totalAgents} agents</span>
          </div>

          {data.agents.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">No agents found</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {data.agents.map((agent, i) => (
                <div key={agent.id} className="px-5 py-4 flex items-center gap-4">
                  {/* Rank */}
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                    ${i === 0 ? "bg-amber-100 text-amber-600" : i === 1 ? "bg-slate-100 text-slate-500" : i === 2 ? "bg-orange-100 text-orange-600" : "bg-slate-50 text-slate-400"}`}>
                    {i + 1}
                  </div>

                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-bold flex-shrink-0">
                    {(agent.name || "A")[0]}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{agent.name || "Agent"}</p>
                    <p className="text-xs text-slate-400 truncate">{agent.email}</p>
                  </div>

                  {/* Stats */}
                  <div className="hidden sm:flex items-center gap-6 flex-shrink-0">
                    <div className="text-center">
                      <p className="text-sm font-bold text-slate-900">{agent._count.properties}</p>
                      <p className="text-[11px] text-slate-400">Properties</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-slate-900">{agent._count.leads}</p>
                      <p className="text-[11px] text-slate-400">Leads</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-green-600">{agent.converted}</p>
                      <p className="text-[11px] text-slate-400">Converted</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-slate-900">{agent.conversionRate}%</p>
                      <p className="text-[11px] text-slate-400">Rate</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-blue-600">{agent.hotLeads}</p>
                      <p className="text-[11px] text-slate-400">Hot leads</p>
                    </div>
                  </div>

                  {/* Portfolio */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-slate-900">{formatPrice(agent.portfolioValue)}</p>
                    <p className="text-[11px] text-slate-400">portfolio</p>
                  </div>

                  {i === 0 && <Star className="w-4 h-4 text-amber-400 fill-amber-400 flex-shrink-0" />}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Note for promoting to admin */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-500">
          <span className="font-medium text-slate-700">Tip:</span> To promote an agent to Admin, update their role in the database via Supabase dashboard → Table Editor → User table.
        </div>
      </div>
    </div>
  )
}
