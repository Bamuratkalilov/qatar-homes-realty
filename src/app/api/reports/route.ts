import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const agentId = session.user.id
  const now = new Date()

  // Last 6 months breakdown
  const monthly = await Promise.all(
    Array.from({ length: 6 }, (_, i) => {
      const d     = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      const start = new Date(d.getFullYear(), d.getMonth(), 1)
      const end   = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)
      return Promise.all([
        db.lead.count({ where: { agentId, createdAt: { gte: start, lte: end } } }),
        db.lead.count({ where: { agentId, status: "CONVERTED", updatedAt: { gte: start, lte: end } } }),
        db.appointment.count({ where: { agentId, startTime: { gte: start, lte: end } } }),
      ]).then(([leads, converted, appointments]) => ({
        month: MONTH_NAMES[d.getMonth()],
        leads,
        converted,
        appointments,
      }))
    })
  )

  // Lead sources
  const sourceGroups = await db.lead.groupBy({
    by: ["source"],
    where: { agentId },
    _count: { source: true },
    orderBy: { _count: { source: "desc" } },
  })

  // Pipeline stages
  const pipelineGroups = await db.lead.groupBy({
    by: ["status"],
    where: { agentId },
    _count: { status: true },
  })

  // Totals
  const [totalLeads, totalConverted, totalProperties, totalClients, totalAppointments] = await Promise.all([
    db.lead.count({ where: { agentId } }),
    db.lead.count({ where: { agentId, status: "CONVERTED" } }),
    db.property.count({ where: { agentId, status: { not: "OFF_MARKET" } } }),
    db.client.count({ where: { agentId } }),
    db.appointment.count({ where: { agentId } }),
  ])

  // Portfolio value
  const portfolioValue = await db.property.aggregate({
    where: { agentId, status: "AVAILABLE" },
    _sum: { price: true },
  })

  // Top properties by views
  const topProperties = await db.property.findMany({
    where: { agentId },
    orderBy: { views: "desc" },
    take: 5,
    select: { id: true, title: true, views: true, type: true, listingType: true, price: true, status: true, photos: true },
  })

  // Recent conversions
  const recentConversions = await db.lead.findMany({
    where: { agentId, status: "CONVERTED" },
    orderBy: { updatedAt: "desc" },
    take: 5,
    select: {
      id: true, name: true, updatedAt: true,
      property: { select: { title: true, price: true, listingType: true } },
    },
  })

  // New leads this month
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const newLeadsThisMonth = await db.lead.count({
    where: { agentId, createdAt: { gte: startOfMonth } },
  })

  return NextResponse.json({
    monthly,
    sources: sourceGroups.map(s => ({ name: s.source.replace(/_/g, " "), value: s._count.source })),
    pipeline: pipelineGroups.map(s => ({ status: s.status.replace(/_/g, " "), count: s._count.status })),
    stats: {
      totalLeads, totalConverted, totalProperties, totalClients, totalAppointments,
      conversionRate: totalLeads > 0 ? Math.round((totalConverted / totalLeads) * 100) : 0,
      portfolioValue: portfolioValue._sum.price || 0,
      newLeadsThisMonth,
    },
    topProperties,
    recentConversions,
  })
}
