import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { config } from "dotenv"

config({ path: ".env.local" })

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const db = new PrismaClient({ adapter })

const PEARL_CONTENT = {
  intro: `The Pearl-Qatar is one of Doha's most iconic real estate destinations, known for its luxury apartments, waterfront lifestyle, marina views, fine dining, and freehold ownership opportunities. Built on around 4 million square meters of reclaimed land, The Pearl is a man-made island located just offshore from West Bay, one of Doha's main business districts.

For residents, The Pearl offers a premium lifestyle with sea views, walkable promenades, cafés, restaurants, retail shops, family-friendly communities, and high-quality residential towers. For investors, it remains one of Qatar's most attractive areas because it combines strong rental demand, luxury positioning, and foreign ownership eligibility.`,

  whyImportant: `The Pearl-Qatar is not just a residential address. It is a complete mixed-use waterfront community with residential, retail, and commercial spaces. The island includes luxury apartments, townhouses, villas, penthouses, serviced residences, shops, restaurants, hotels, and leisure destinations.

One of the biggest advantages of The Pearl is that it was among the first areas in Qatar where foreign nationals could own freehold property. This makes it especially attractive for expatriates and international investors who want to buy property in Doha.`,

  location: `The Pearl-Qatar enjoys a prime location close to West Bay, Lusail City, Katara Cultural Village, and Doha's major lifestyle and business areas. According to Visit Qatar, Hamad International Airport is around 30 to 40 minutes away by car, and the nearest Doha Metro station is Legtaifiya on the Red Line, with M110 Metrolink bus access to The Pearl.

This location makes The Pearl suitable for professionals working in West Bay or Lusail, families looking for a premium community, and investors targeting tenants who want luxury living near Doha's main business and entertainment zones.`,

  districts: [
    {
      name:     "Porto Arabia",
      photoKey: "porto-arabia",
      body:     "Porto Arabia is one of the most popular districts in The Pearl. It is known for its marina, waterfront promenade, luxury towers, restaurants, cafés, and retail outlets. Many apartments here offer marina views, sea views, or city views.\n\nThis area is ideal for professionals, couples, and families who want an active waterfront lifestyle with easy access to restaurants and shops.",
    },
    {
      name:     "Viva Bahriya",
      photoKey: "viva-bahriya",
      body:     "Viva Bahriya is known for beachfront living and a more relaxed atmosphere. Many residential towers in this area offer direct beach access or sea-facing views. It is popular among families and tenants who prefer a quieter environment compared to Porto Arabia.",
    },
    {
      name:     "Qanat Quartier",
      photoKey: "qanat-quartier",
      body:     "Qanat Quartier is one of the most visually attractive areas in The Pearl. Inspired by Venetian-style architecture, it features colourful low-rise buildings, canals, bridges, pedestrian-friendly streets, cafés, and boutique retail shops.\n\nThis district is excellent for people who want a unique lifestyle, walkable surroundings, and a community with strong visual character.",
    },
    {
      name:     "Medina Centrale",
      photoKey: "medina-centrale",
      body:     "Medina Centrale is the island's vibrant town centre, located between Porto Arabia and Viva Bahriya. It includes retail shops, restaurants, entertainment, services, and open spaces.\n\nIt is a practical area for families because many daily services, supermarkets, cafés, and leisure options are nearby.",
    },
    {
      name:     "Giardino Village and Floresta Gardens",
      photoKey: "giardino",
      body:     "These areas offer a quieter residential environment with a mix of apartments, townhouses, and family-oriented properties. They are suitable for residents looking for more privacy while still staying connected to The Pearl's facilities.",
    },
  ],

  propertyTypes: [
    "Studio apartments", "1-bedroom apartments", "2-bedroom apartments",
    "3-bedroom apartments", "4-bedroom apartments", "Duplex apartments",
    "Luxury penthouses", "Townhouses", "Villas", "Serviced residences",
    "Retail shops", "Commercial spaces",
  ],
  propertyTypeNote: "Most residential buildings offer facilities such as swimming pools, gyms, reception, security, parking, maintenance, and sometimes beach access or marina views.",

  renting: `The Pearl is one of the most preferred rental locations in Doha for expatriates, professionals, and families. Rental demand is supported by the area's premium lifestyle, waterfront views, security, restaurants, and proximity to business districts.

Tenants can choose between fully furnished, semi-furnished, and unfurnished apartments. Fully furnished units are popular among executives and new arrivals in Qatar, while semi-furnished and unfurnished units are preferred by long-term families who already have their own furniture.`,

  buying: `The Pearl is highly attractive for buyers because it is one of Qatar's designated areas for foreign ownership. Foreign investors can buy property in approved areas, including The Pearl, subject to Qatar's real estate ownership rules. Qatar's framework allows non-Qataris to own or use real estate in specific zones under Law No. 16 of 2018.

For buyers, The Pearl offers both lifestyle value and investment value. It is suitable for end-users who want luxury waterfront living and investors looking for rental income from premium tenants.`,

  lifestyle: [
    "Waterfront promenades", "Marina views", "Luxury restaurants",
    "Cafés and lounges", "Boutique shopping", "Beach access in selected areas",
    "Family-friendly walkways", "Pet-friendly zones in some communities",
    "Hotels and serviced residences", "Children's activities and entertainment",
  ],
  lifestyleNote: "The Pearl is especially attractive because it offers a self-contained lifestyle. Residents can walk to cafés, supermarkets, restaurants, pharmacies, salons, and leisure destinations without leaving the island.",

  investorReasons: [
    "Prime waterfront location", "Luxury brand image", "High rental demand",
    "Foreign ownership eligibility", "Strong demand from expatriates",
    "Wide range of property sizes", "Established community infrastructure",
    "Proximity to West Bay, Lusail, and Katara",
  ],
  investorNote: "For real estate investors, The Pearl is suitable for both long-term rental income and capital appreciation potential. Marina-view and sea-view units usually attract higher tenant interest because views are one of the strongest selling points in this market.",

  whoFor: [
    "Professionals working in West Bay or Lusail",
    "Families looking for a secure and premium community",
    "Executives who want luxury furnished apartments",
    "Expats looking for international-style living",
    "Investors targeting high-quality tenants",
    "Couples who prefer waterfront lifestyle",
    "Residents who enjoy cafés, restaurants, and walkable areas",
  ],

  pros: [
    "Luxury waterfront lifestyle",
    "High-quality residential towers",
    "Beautiful marina and sea views",
    "Strong community atmosphere",
    "Many restaurants and cafés",
    "Foreign ownership opportunities",
    "Good facilities in most buildings",
    "Close to West Bay, Katara, and Lusail",
  ],

  cons: [
    "Rental prices are usually higher than many other Doha areas",
    "Traffic can increase during weekends and peak hours",
    "Some buildings have limited visitor parking",
    "Service charges may vary by building",
    "Premium sea-view units can be expensive",
  ],

  tips: [
    "View: marina, sea, city, or community view",
    "Building facilities: gym, pool, parking, beach access",
    "Furniture condition",
    "Maintenance quality",
    "Parking availability",
    "Balcony size",
    "Floor level",
    "Accessibility to supermarkets and restaurants",
    "Rental contract terms",
    "Service charges for buyers",
    "Developer and building reputation",
  ],
  tipsNote: "For investors, it is also important to compare rental yield, occupancy demand, property condition, and long-term maintenance costs.",

  conclusion: `The Pearl-Qatar remains one of the most prestigious and desirable real estate destinations in Doha. With its waterfront lifestyle, luxury towers, family-friendly districts, restaurants, marina views, and foreign ownership opportunities, it continues to attract both residents and investors.

Whether you are looking to rent a stylish apartment, buy a waterfront home, or invest in Qatar's luxury property market, The Pearl offers one of the strongest lifestyle and real estate propositions in the country.

Qatar Homes Realty can help you find apartments, villas, and investment properties in The Pearl-Qatar based on your budget, preferred view, lifestyle needs, and investment goals.`,
}

async function main() {
  await db.community.update({
    where: { slug: "the-pearl-qatar" },
    data: { content: PEARL_CONTENT },
  })
  console.log("✓ The Pearl article content saved.")
}

main().catch(console.error).finally(() => db.$disconnect())
