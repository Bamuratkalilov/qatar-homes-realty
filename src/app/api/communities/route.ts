import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const communities = await db.community.findMany({
      orderBy: { sortOrder: "asc" },
    })

    // Attach live listing counts + avg prices from our own property data
    const enriched = await Promise.all(
      communities.map(async (c) => {
        const [rentStats, saleStats, totalCount] = await Promise.all([
          db.property.aggregate({
            where: { district: c.district, listingType: "RENT", status: "AVAILABLE" },
            _avg: { price: true },
            _count: true,
          }),
          db.property.aggregate({
            where: { district: c.district, listingType: "SALE", status: "AVAILABLE" },
            _avg: { price: true },
            _count: true,
          }),
          db.property.count({
            where: { district: c.district, status: "AVAILABLE" },
          }),
        ])

        return {
          ...c,
          liveAvgRent: rentStats._avg.price ? Math.round(rentStats._avg.price) : c.avgRentQar,
          liveAvgSale: saleStats._avg.price ? Math.round(saleStats._avg.price) : c.avgSaleQar,
          listingCount: totalCount,
        }
      })
    )

    return NextResponse.json({ communities: enriched })
  } catch {
    return NextResponse.json({ communities: [] })
  }
}
