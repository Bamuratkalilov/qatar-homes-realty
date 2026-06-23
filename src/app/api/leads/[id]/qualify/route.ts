import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { qualifyLead } from "@/lib/claude"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  const lead = await db.lead.findUnique({ where: { id, agentId: session.user.id } })
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 })

  const result = await qualifyLead({
    name: lead.name,
    budget: lead.budget,
    budgetMax: lead.budgetMax,
    propertyType: lead.propertyType,
    bedrooms: lead.bedrooms,
    notes: lead.notes,
    source: lead.source,
  })

  await db.lead.update({
    where: { id },
    data: {
      score: result.score,
      aiSummary: `${result.summary} Recommended action: ${result.recommendedAction}. Timeline: ${result.estimatedTimeline}`,
      status: result.priority === "HIGH" && lead.status === "NEW" ? "QUALIFIED" : lead.status,
    },
  })

  return NextResponse.json(result)
}
