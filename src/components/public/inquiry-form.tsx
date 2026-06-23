"use client"

import { useState } from "react"
import { Phone, Mail, CheckCircle, Loader2, MessageSquare } from "lucide-react"

interface Props {
  propertyId: string
  propertyTitle: string
  agentName: string
  agencyPhone?: string
  agencyEmail?: string
}

export function InquiryForm({ propertyId, propertyTitle, agentName, agencyPhone, agencyEmail }: Props) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    message: `I'm interested in: ${propertyTitle}`,
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, propertyId }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error || "Something went wrong")
      } else {
        setSuccess(true)
      }
    } catch {
      setError("Connection error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-7 h-7 text-green-600" />
        </div>
        <h4 className="font-bold text-slate-900 mb-1">Inquiry Sent!</h4>
        <p className="text-sm text-slate-500 mb-4">
          {agentName} will contact you shortly.
        </p>
        {agencyPhone && (
          <a href={`https://wa.me/${agencyPhone.replace(/\D/g, "")}`}
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition">
            <MessageSquare className="w-4 h-4" />
            Chat on WhatsApp
          </a>
        )}
      </div>
    )
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text" value={form.name} required
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Your name"
          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <input
          type="tel" value={form.phone} required
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          placeholder="Phone number (+974…)"
          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <input
          type="email" value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          placeholder="Email address (optional)"
          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <textarea
          rows={3} value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="submit" disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {loading ? "Sending…" : "Send Inquiry"}
        </button>
      </form>

      <div className="mt-4 pt-4 border-t border-slate-100 flex gap-3">
        {agencyPhone && (
          <a href={`tel:${agencyPhone}`}
            className="flex-1 flex items-center justify-center gap-2 border border-slate-200 rounded-xl py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition">
            <Phone className="w-4 h-4" /> Call
          </a>
        )}
        {agencyEmail && (
          <a href={`mailto:${agencyEmail}`}
            className="flex-1 flex items-center justify-center gap-2 border border-slate-200 rounded-xl py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition">
            <Mail className="w-4 h-4" /> Email
          </a>
        )}
        {agencyPhone && (
          <a href={`https://wa.me/${agencyPhone.replace(/\D/g, "")}`}
            target="_blank" rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 border border-slate-200 rounded-xl py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition">
            <MessageSquare className="w-4 h-4 text-green-600" /> WhatsApp
          </a>
        )}
      </div>
    </>
  )
}
