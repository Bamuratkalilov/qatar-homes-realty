"use client"

import { useState, useRef, useEffect } from "react"
import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Bot, Send, User, Wand2, TrendingUp, FileText, Mail, Calendar } from "lucide-react"

interface Message {
  role: "user" | "assistant"
  content: string
}

const QUICK_PROMPTS = [
  { icon: TrendingUp, label: "Price a property", prompt: "What is the current rental price range for a 3-bedroom apartment in The Pearl-Qatar, and what factors affect the price?" },
  { icon: Mail, label: "Write follow-up email", prompt: "Write a professional follow-up email for a lead who viewed a luxury apartment in Lusail last week but hasn't responded yet." },
  { icon: FileText, label: "Draft property description", prompt: "Write a compelling listing description for a 4-bedroom villa in Al Waab, Doha, 450 sqm, with private pool, for sale at QAR 4,500,000." },
  { icon: Wand2, label: "Qualify a lead", prompt: "A client from India has a budget of QAR 1.2M-1.5M, wants a 2-bedroom apartment in a good area of Doha, looking to buy within 2 months. How would you qualify this lead?" },
  { icon: Calendar, label: "Schedule advice", prompt: "What are the best practices for scheduling property viewings in Qatar? What times and days work best for expats and locals?" },
  { icon: TrendingUp, label: "Market update", prompt: "Give me a brief overview of the current Qatar real estate market trends for 2025, focusing on the rental market in Doha." },
]

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Marhaba! I'm your AI real estate assistant, specialized in the Qatar property market. I can help you with:\n\n• **Property pricing** — market rates, price suggestions\n• **Lead qualification** — analyzing prospects\n• **Email drafting** — professional follow-ups\n• **Property descriptions** — compelling listings in English or Arabic\n• **Market insights** — Qatar real estate trends\n• **Legal guidance** — RERA regulations, contracts\n\nWhat can I help you with today?",
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function sendMessage(content: string) {
    if (!content.trim() || loading) return
    const userMsg: Message = { role: "user", content }
    setMessages((m) => [...m, userMsg])
    setInput("")
    setLoading(true)

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      })
      const data = await res.json()
      setMessages((m) => [...m, { role: "assistant", content: data.message || "Sorry, I couldn't process that." }])
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Sorry, I'm having trouble connecting. Please check your API key." }])
    } finally {
      setLoading(false)
    }
  }

  function formatMessage(content: string) {
    return content
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br/>")
      .replace(/• /g, "• ")
  }

  return (
    <div className="h-full flex flex-col" style={{ height: "calc(100vh - 0px)" }}>
      <Header title="AI Assistant" description="Claude AI — your daily real estate expert" />

      <div className="flex flex-1 overflow-hidden">
        {/* Quick Prompts sidebar */}
        <div className="hidden lg:block w-64 border-r border-slate-200 p-4 bg-slate-50 overflow-y-auto">
          <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Quick Actions</p>
          <div className="space-y-2">
            {QUICK_PROMPTS.map(({ icon: Icon, label, prompt }) => (
              <button
                key={label}
                onClick={() => sendMessage(prompt)}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-slate-700 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition flex items-start gap-2.5"
              >
                <Icon className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === "assistant" ? "bg-blue-600" : "bg-slate-200"}`}>
                  {msg.role === "assistant" ? <Bot className="w-4 h-4 text-white" /> : <User className="w-4 h-4 text-slate-600" />}
                </div>
                <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${msg.role === "assistant" ? "bg-white border border-slate-200 text-slate-800" : "bg-blue-600 text-white"}`}>
                  <div dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3">
                  <div className="flex gap-1 items-center h-5">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-slate-200 p-4 bg-white">
            <div className="flex gap-3 items-end">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage(input)
                  }
                }}
                placeholder="Ask me anything about Qatar real estate... (Enter to send, Shift+Enter for new line)"
                rows={2}
                className="flex-1 resize-none"
              />
              <Button onClick={() => sendMessage(input)} disabled={!input.trim() || loading} size="icon" className="h-10 w-10 flex-shrink-0">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
