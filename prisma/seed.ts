import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { config } from "dotenv"

config({ path: ".env.local" })

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("Seeding database...")

  // Create demo agent
  const agent = await prisma.user.upsert({
    where: { email: "agent@qatarhomes.com" },
    update: {},
    create: {
      email: "agent@qatarhomes.com",
      name: "Ahmad Al-Mansoori",
      role: "AGENT",
    },
  })

  console.log(`Created agent: ${agent.email}`)

  // Create demo properties
  const properties = await Promise.all([
    prisma.property.upsert({
      where: { id: "demo-prop-1" },
      update: {},
      create: {
        id: "demo-prop-1",
        title: "Luxury 3BR Apartment in The Pearl-Qatar",
        description: "Stunning luxury apartment with panoramic sea views in the prestigious Pearl-Qatar. Features premium finishes, open-plan kitchen, and access to world-class amenities including pool, gym, and 24-hour concierge.",
        type: "APARTMENT",
        listingType: "RENT",
        status: "AVAILABLE",
        price: 180000,
        area: 185,
        bedrooms: 3,
        bathrooms: 3,
        floor: 8,
        totalFloors: 22,
        address: "Porto Arabia, The Pearl-Qatar",
        district: "The Pearl-Qatar",
        city: "Doha",
        photos: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800"],
        amenities: ["Pool", "Gym", "Parking", "Concierge", "Sea View", "Furnished", "Central AC"],
        featured: true,
        agentId: agent.id,
      },
    }),
    prisma.property.upsert({
      where: { id: "demo-prop-2" },
      update: {},
      create: {
        id: "demo-prop-2",
        title: "Modern Villa with Private Pool in Al Waab",
        description: "Spacious 5-bedroom villa in the prestigious Al Waab area, featuring a private pool, landscaped garden, home cinema, and fully-equipped kitchen. Ideal for families seeking luxury living in Doha.",
        type: "VILLA",
        listingType: "SALE",
        status: "AVAILABLE",
        price: 3500000,
        area: 450,
        bedrooms: 5,
        bathrooms: 5,
        floor: null,
        address: "Al Waab Street, Al Waab",
        district: "Al Waab",
        city: "Doha",
        photos: ["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800"],
        amenities: ["Private Pool", "Garden", "Parking", "Home Cinema", "Maid Room", "Central AC"],
        featured: true,
        agentId: agent.id,
      },
    }),
    prisma.property.upsert({
      where: { id: "demo-prop-3" },
      update: {},
      create: {
        id: "demo-prop-3",
        title: "Studio Apartment in Lusail City",
        description: "Modern studio apartment in the heart of Lusail City, close to all amenities. Perfect for young professionals. Fully furnished with quality appliances.",
        type: "STUDIO",
        listingType: "RENT",
        status: "AVAILABLE",
        price: 60000,
        area: 65,
        bedrooms: null,
        bathrooms: 1,
        address: "Fox Hills, Lusail City",
        district: "Lusail",
        city: "Lusail",
        photos: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800"],
        amenities: ["Parking", "Gym", "Furnished", "Central AC"],
        featured: false,
        agentId: agent.id,
      },
    }),
  ])

  console.log(`Created ${properties.length} demo properties`)

  // Create demo leads
  await prisma.lead.upsert({
    where: { id: "demo-lead-1" },
    update: {},
    create: {
      id: "demo-lead-1",
      name: "Mohammed Al-Rashid",
      phone: "+974 5555 1234",
      email: "m.rashid@email.com",
      source: "PROPERTY_FINDER",
      status: "QUALIFIED",
      score: 78,
      budget: 150000,
      budgetMax: 200000,
      propertyType: "APARTMENT",
      bedrooms: 3,
      notes: "Looking for 3BR in The Pearl or Lusail. Qatar national, urgent timeline.",
      aiSummary: "High-quality lead with clear budget and strong preference. Recommended action: Schedule viewing immediately. Timeline: Wants to move within 1 month.",
      agentId: agent.id,
    },
  })

  await prisma.lead.upsert({
    where: { id: "demo-lead-2" },
    update: {},
    create: {
      id: "demo-lead-2",
      name: "Sarah Johnson",
      phone: "+974 5544 9876",
      email: "sarah.j@company.com",
      source: "REFERRAL",
      status: "NEW",
      score: 0,
      budget: 90000,
      budgetMax: 120000,
      propertyType: "APARTMENT",
      bedrooms: 2,
      notes: "British expat, new to Qatar. Company relocation package.",
      agentId: agent.id,
    },
  })

  // Create demo client
  await prisma.client.upsert({
    where: { id: "demo-client-1" },
    update: {},
    create: {
      id: "demo-client-1",
      name: "Abdullah Al-Thani",
      phone: "+974 5511 2233",
      email: "a.thani@email.com",
      nationality: "Qatari",
      idNumber: "28012345678",
      notes: "Existing client, owns 2 properties through us. Looking to invest in Lusail.",
      agentId: agent.id,
    },
  })

  console.log("Demo data seeded successfully!")
  console.log("\n📧 Login with: agent@qatarhomes.com (any password for demo)")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
