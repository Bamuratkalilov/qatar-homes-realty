import type { Metadata } from "next"
import { Geist } from "next/font/google"
import "./globals.css"

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" })

export const metadata: Metadata = {
  title: "Qatar Homes Realty — Find Property in Qatar",
  description: "Discover premium residential properties for rent and sale across Doha, Lusail, The Pearl, and Qatar. Expert agents, RERA compliant.",
  keywords: "Qatar real estate, Doha apartments, Lusail villas, The Pearl Qatar, property for rent Qatar, buy property Doha",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geist.variable}>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  )
}
