"use client"

import { useState } from "react"
import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { formatPrice, PROPERTY_TYPES, QATAR_DISTRICTS } from "@/lib/utils"
import { TrendingUp, Wand2, Copy, CheckCheck, Mail, MessageSquare } from "lucide-react"

export default function MarketingPage() {
  const [pricingForm, setPricingForm] = useState({ type: "APARTMENT", bedrooms: "2", area: "120", district: "Al Sadd", listingType: "RENT" })
  const [pricingResult, setPricingResult] = useState<{ suggested: number; min: number; max: number; reasoning: string; marketTrend: string } | null>(null)
  const [pricingLoading, setPricingLoading] = useState(false)

  const [emailForm, setEmailForm] = useState({ type: "follow_up", clientName: "", agentName: "", context: "" })
  const [emailResult, setEmailResult] = useState("")
  const [emailLoading, setEmailLoading] = useState(false)

  const [copied, setCopied] = useState("")

  async function getPricingSuggestion() {
    setPricingLoading(true)
    try {
      const res = await fetch("/api/ai/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pricingForm),
      })
      const data = await res.json()
      setPricingResult(data)
    } finally {
      setPricingLoading(false)
    }
  }

  async function generateEmail() {
    setEmailLoading(true)
    try {
      const res = await fetch("/api/ai/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailForm),
      })
      const data = await res.json()
      setEmailResult(data.email || "")
    } finally {
      setEmailLoading(false)
    }
  }

  function copyToClipboard(text: string, key: string) {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(""), 2000)
  }

  return (
    <div>
      <Header title="Marketing & Pricing" description="AI-powered market pricing and email templates" />

      <div className="p-6 grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Pricing Tool */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Smart Pricing Tool</h2>
              <p className="text-xs text-slate-500">Get AI market price suggestions</p>
            </div>
          </div>

          <div className="space-y-3 mb-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Property Type</label>
                <Select value={pricingForm.type} onChange={(e) => setPricingForm((f) => ({ ...f, type: e.target.value }))} options={PROPERTY_TYPES} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Listing Type</label>
                <Select value={pricingForm.listingType} onChange={(e) => setPricingForm((f) => ({ ...f, listingType: e.target.value }))} options={[{ value: "RENT", label: "Rent" }, { value: "SALE", label: "Sale" }]} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Bedrooms</label>
                <Select value={pricingForm.bedrooms} onChange={(e) => setPricingForm((f) => ({ ...f, bedrooms: e.target.value }))} options={["1","2","3","4","5","6"].map((n) => ({ value: n, label: `${n} BR` }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Area (sqm)</label>
                <Input type="number" value={pricingForm.area} onChange={(e) => setPricingForm((f) => ({ ...f, area: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">District</label>
              <Select value={pricingForm.district} onChange={(e) => setPricingForm((f) => ({ ...f, district: e.target.value }))} options={QATAR_DISTRICTS.map((d) => ({ value: d, label: d }))} />
            </div>
          </div>

          <Button onClick={getPricingSuggestion} disabled={pricingLoading} className="w-full gap-2">
            <Wand2 className="w-4 h-4" />
            {pricingLoading ? "Analyzing market..." : "Get Price Suggestion"}
          </Button>

          {pricingResult && (
            <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-3">
              <div className="text-center">
                <p className="text-xs text-blue-600 font-medium uppercase">Suggested Price</p>
                <p className="text-3xl font-bold text-blue-700 mt-1">{formatPrice(pricingResult.suggested)}</p>
                {pricingForm.listingType === "RENT" && <p className="text-blue-500 text-sm">/month</p>}
              </div>
              <div className="flex justify-between text-sm">
                <div className="text-center">
                  <p className="text-slate-500 text-xs">Minimum</p>
                  <p className="font-semibold text-slate-700">{formatPrice(pricingResult.min)}</p>
                </div>
                <div className="text-center">
                  <p className="text-slate-500 text-xs">Market Trend</p>
                  <p className={`font-bold ${pricingResult.marketTrend === "UP" ? "text-green-600" : pricingResult.marketTrend === "DOWN" ? "text-red-600" : "text-amber-600"}`}>
                    {pricingResult.marketTrend === "UP" ? "↑ Rising" : pricingResult.marketTrend === "DOWN" ? "↓ Falling" : "→ Stable"}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-slate-500 text-xs">Maximum</p>
                  <p className="font-semibold text-slate-700">{formatPrice(pricingResult.max)}</p>
                </div>
              </div>
              <p className="text-xs text-blue-800 bg-blue-100 rounded-lg p-2">{pricingResult.reasoning}</p>
            </div>
          )}
        </div>

        {/* Email Generator */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center">
              <Mail className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Email Generator</h2>
              <p className="text-xs text-slate-500">AI-drafted professional emails</p>
            </div>
          </div>

          <div className="space-y-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Email Type</label>
              <Select value={emailForm.type} onChange={(e) => setEmailForm((f) => ({ ...f, type: e.target.value }))} options={[
                { value: "follow_up", label: "Follow-up after viewing" },
                { value: "welcome", label: "Welcome new lead" },
                { value: "offer", label: "Property offer" },
                { value: "reminder", label: "Appointment reminder" },
                { value: "thank_you", label: "Thank you" },
              ]} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Client Name</label>
              <Input value={emailForm.clientName} onChange={(e) => setEmailForm((f) => ({ ...f, clientName: e.target.value }))} placeholder="Mohammed Al-Rashid" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Your Name</label>
              <Input value={emailForm.agentName} onChange={(e) => setEmailForm((f) => ({ ...f, agentName: e.target.value }))} placeholder="Ahmad Al-Mansoori" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Additional Context</label>
              <Input value={emailForm.context} onChange={(e) => setEmailForm((f) => ({ ...f, context: e.target.value }))} placeholder="e.g. Viewed 3BR apartment in Lusail, interested in price negotiation" />
            </div>
          </div>

          <Button onClick={generateEmail} disabled={emailLoading} variant="outline" className="w-full gap-2 border-purple-200 text-purple-700 hover:bg-purple-50">
            <Wand2 className="w-4 h-4" />
            {emailLoading ? "Generating..." : "Generate Email"}
          </Button>

          {emailResult && (
            <div className="mt-4 relative">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700 whitespace-pre-line max-h-64 overflow-y-auto">
                {emailResult}
              </div>
              <button
                onClick={() => copyToClipboard(emailResult, "email")}
                className="absolute top-3 right-3 p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-slate-700 transition"
              >
                {copied === "email" ? <CheckCheck className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>

        {/* WhatsApp Message Generator */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 xl:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Quick WhatsApp Templates</h2>
              <p className="text-xs text-slate-500">Copy-ready messages for WhatsApp outreach</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              {
                key: "new_lead",
                label: "New Lead Response",
                text: "Hello! Thank you for your interest in our properties. My name is [Your Name] from Qatar Homes Realty. I'd be happy to help you find the perfect property in Qatar. Could you tell me more about what you're looking for?",
              },
              {
                key: "viewing_confirm",
                label: "Viewing Confirmation",
                text: "Dear [Name], this is to confirm your property viewing scheduled for [Date] at [Time]. The property is located at [Address]. Please feel free to call me at [Phone] if you need directions or have any questions. Looking forward to seeing you!",
              },
              {
                key: "follow_up",
                label: "Post-Viewing Follow-up",
                text: "Hi [Name], it was a pleasure showing you the property today! I hope it met your expectations. Do you have any questions or would you like to schedule a second viewing? I'm also available to discuss the contract terms if you're interested.",
              },
              {
                key: "new_listing",
                label: "New Listing Alert",
                text: "Hi [Name]! I have a new property that matches your requirements perfectly. It's a [BR] bedroom [Type] in [District], priced at QAR [Price]/month. It just became available today. Would you like to arrange a viewing this week?",
              },
              {
                key: "price_drop",
                label: "Price Reduction",
                text: "Great news [Name]! The landlord of the property you viewed has reduced the price to QAR [New Price]/month. This is a limited offer. Would you like to move forward? I can arrange the paperwork quickly.",
              },
              {
                key: "document_reminder",
                label: "Document Reminder",
                text: "Hi [Name], just a friendly reminder that we need the following documents to proceed: QID copy, salary certificate/bank statement, and passport copy. Please WhatsApp them to me at your earliest convenience. Thank you!",
              },
            ].map(({ key, label, text }) => (
              <div key={key} className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-700">{label}</span>
                  <button onClick={() => copyToClipboard(text, key)} className="p-1 text-slate-400 hover:text-slate-700">
                    {copied === key ? <CheckCheck className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-slate-600 line-clamp-3">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
