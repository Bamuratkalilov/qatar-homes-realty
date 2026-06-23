"use client"

import { useState, useEffect, useCallback } from "react"
import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { relativeTime } from "@/lib/utils"
import { Plus, FileText, X, Download, Send, CheckCircle, Edit2, Trash2 } from "lucide-react"

interface Document {
  id: string
  title: string
  type: string
  status: string
  signedAt?: string
  createdAt: string
  client: { name: string }
}

const docTypeOptions = [
  { value: "LEASE", label: "Lease Agreement" },
  { value: "CONTRACT", label: "Sale Contract" },
  { value: "MOU", label: "Memorandum of Understanding" },
  { value: "OFFER_LETTER", label: "Offer Letter" },
  { value: "ID_COPY", label: "ID Copy" },
  { value: "OTHER", label: "Other Document" },
]

const statusColors: Record<string, "default" | "warning" | "success" | "destructive" | "secondary"> = {
  DRAFT: "secondary", SENT: "warning", SIGNED: "success", EXPIRED: "destructive",
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: "", type: "LEASE", clientId: "" })
  const [clients, setClients] = useState<{ id: string; name: string }[]>([])

  const fetchDocuments = useCallback(async () => {
    try {
      const [docsRes, clientsRes] = await Promise.all([
        fetch("/api/documents"),
        fetch("/api/clients?select=id,name"),
      ])
      const docsData = await docsRes.json()
      const clientsData = await clientsRes.json()
      setDocuments(docsData.documents || [])
      setClients(clientsData.clients || [])
    } catch {
      setDocuments([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchDocuments() }, [fetchDocuments])

  async function createDocument(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      setShowForm(false)
      setForm({ title: "", type: "LEASE", clientId: "" })
      fetchDocuments()
    }
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/documents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    setDocuments((prev) => prev.map((d) => d.id === id ? { ...d, status, signedAt: status === "SIGNED" ? new Date().toISOString() : d.signedAt } : d))
  }

  return (
    <div>
      <Header
        title="Documents"
        description="E-signature and contract management"
        actions={
          <Button size="sm" className="gap-2" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4" /> New Document
          </Button>
        }
      />

      <div className="p-6">
        {/* Status Summary */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total", count: documents.length, color: "bg-slate-100 text-slate-700" },
            { label: "Draft", count: documents.filter((d) => d.status === "DRAFT").length, color: "bg-slate-100 text-slate-600" },
            { label: "Sent", count: documents.filter((d) => d.status === "SENT").length, color: "bg-amber-50 text-amber-700" },
            { label: "Signed", count: documents.filter((d) => d.status === "SIGNED").length, color: "bg-green-50 text-green-700" },
          ].map(({ label, count, color }) => (
            <div key={label} className={`rounded-xl p-4 ${color} text-center`}>
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-xs font-medium mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="text-center text-slate-400 py-12">Loading...</div>
        ) : documents.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-900">No documents yet</p>
            <p className="text-slate-500 text-sm mt-1 mb-4">Create your first document or upload a contract</p>
            <Button onClick={() => setShowForm(true)}>Create Document</Button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase px-4 py-3">Document</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase px-4 py-3">Client</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase px-4 py-3">Type</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase px-4 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase px-4 py-3">Date</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-900">{doc.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{doc.client?.name || "—"}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-500">{doc.type.replace("_", " ")}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusColors[doc.status]}>
                        {doc.status === "SIGNED" && <CheckCircle className="w-3 h-3 mr-1" />}
                        {doc.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {doc.signedAt ? `Signed ${relativeTime(doc.signedAt)}` : relativeTime(doc.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {doc.status === "DRAFT" && (
                          <button onClick={() => updateStatus(doc.id, "SENT")} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Send for signature">
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {doc.status === "SENT" && (
                          <button onClick={() => updateStatus(doc.id, "SIGNED")} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg" title="Mark as signed">
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg">
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Create Document</h3>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={createDocument} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Document Title *</label>
                <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Lease Agreement - Al Waab Villa" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Document Type *</label>
                <Select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} options={docTypeOptions} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Client *</label>
                <Select
                  value={form.clientId}
                  onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value }))}
                  placeholder="Select client..."
                  options={clients.map((c) => ({ value: c.id, label: c.name }))}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1">Create Document</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
