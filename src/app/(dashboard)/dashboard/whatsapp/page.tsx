"use client"

import { useState, useEffect, useRef } from "react"
import { MessageCircle, Bot, User, Phone, ExternalLink, RefreshCw } from "lucide-react"
import Link from "next/link"
import { relativeTime } from "@/lib/utils"

interface WaMessage {
  id: string
  role: string
  content: string
  createdAt: string
}

interface Conversation {
  id: string
  phone: string
  name: string | null
  updatedAt: string
  lead: { id: string; name: string; status: string } | null
  messages: WaMessage[]
}

export default function WhatsAppPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  async function load() {
    try {
      const res = await fetch("/api/whatsapp/conversations")
      const data = await res.json()
      setConversations(data.conversations || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [selected, conversations])

  const active = conversations.find((c) => c.id === selected)
  const displayName = (c: Conversation) => c.name || c.phone

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Sidebar — conversation list */}
      <div className="w-80 border-r border-slate-200 flex flex-col bg-white flex-shrink-0">
        <div className="px-4 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-slate-900 text-[15px]">WhatsApp AI</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={load}
            className="text-slate-400 hover:text-slate-600 transition"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && conversations.length === 0 && (
            <div className="p-6 text-center text-slate-400 text-sm">Loading…</div>
          )}
          {!loading && conversations.length === 0 && (
            <div className="p-6 text-center">
              <MessageCircle className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No conversations yet</p>
              <p className="text-slate-300 text-xs mt-1">
                Messages will appear here when clients WhatsApp you
              </p>
            </div>
          )}
          {conversations.map((c) => {
            const last = c.messages[c.messages.length - 1]
            return (
              <button
                key={c.id}
                onClick={() => setSelected(c.id)}
                className={`w-full text-left px-4 py-3.5 border-b border-slate-50 hover:bg-slate-50 transition ${
                  selected === c.id ? "bg-green-50 border-l-2 border-l-green-500" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[13px] font-semibold text-slate-800 truncate">
                        {displayName(c)}
                      </p>
                      <span className="text-[10px] text-slate-400 flex-shrink-0">
                        {relativeTime(c.updatedAt)}
                      </span>
                    </div>
                    {last && (
                      <p className="text-[12px] text-slate-400 truncate mt-0.5">
                        {last.role === "assistant" ? "AI: " : ""}
                        {last.content}
                      </p>
                    )}
                    {c.lead && (
                      <span className="inline-block mt-1 text-[10px] bg-green-100 text-green-700 rounded-full px-2 py-0.5 font-medium">
                        Lead saved
                      </span>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main — conversation view */}
      <div className="flex-1 flex flex-col bg-slate-50">
        {!active ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Select a conversation</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-5 py-3.5 bg-white border-b border-slate-200 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
                  <Phone className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-[14px]">
                    {displayName(active)}
                  </p>
                  <p className="text-xs text-slate-400">{active.phone}</p>
                </div>
              </div>
              {active.lead && (
                <Link
                  href={`/dashboard/leads`}
                  className="flex items-center gap-1.5 text-xs bg-green-50 text-green-700 border border-green-200 rounded-lg px-3 py-1.5 hover:bg-green-100 transition font-medium"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View Lead
                </Link>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-3">
              {active.messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex items-end gap-2 ${m.role === "user" ? "justify-start" : "justify-end"}`}
                >
                  {m.role === "user" && (
                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                  )}
                  <div
                    className={`max-w-[65%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                      m.role === "user"
                        ? "bg-white text-slate-800 rounded-bl-sm shadow-sm border border-slate-100"
                        : "bg-green-600 text-white rounded-br-sm"
                    }`}
                  >
                    {m.content}
                    <p
                      className={`text-[10px] mt-1 ${
                        m.role === "user" ? "text-slate-400" : "text-green-200"
                      }`}
                    >
                      {relativeTime(m.createdAt)}
                    </p>
                  </div>
                  {m.role === "assistant" && (
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-3.5 h-3.5 text-green-600" />
                    </div>
                  )}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
