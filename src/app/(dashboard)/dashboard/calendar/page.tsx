"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { cn } from "@/lib/utils"
import {
  Plus, ChevronLeft, ChevronRight, X, MapPin, Clock,
  Calendar, Eye, Phone, Users, Loader2, CheckCircle, XCircle,
} from "lucide-react"

interface Appointment {
  id: string
  title: string
  description?: string
  startTime: string
  endTime: string
  type: string
  status: string
  location?: string
  notes?: string
  lead?: { name: string; phone: string }
  client?: { name: string; phone: string }
  property?: { title: string; address: string }
}

const TYPE_STYLES: Record<string, { bg: string; text: string; dot: string; pill: string }> = {
  VIEWING:   { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400", pill: "bg-emerald-100 text-emerald-700" },
  MEETING:   { bg: "bg-violet-50",  text: "text-violet-700",  dot: "bg-violet-400",  pill: "bg-violet-100 text-violet-700"  },
  CALL:      { bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-400",    pill: "bg-blue-100 text-blue-700"      },
  FOLLOW_UP: { bg: "bg-orange-50",  text: "text-orange-700",  dot: "bg-orange-400",  pill: "bg-orange-100 text-orange-700"  },
}

const DAYS    = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const MONTHS  = ["January","February","March","April","May","June","July","August","September","October","November","December"]
const TYPE_OPTIONS = [
  { value: "VIEWING",   label: "Viewing"  },
  { value: "MEETING",   label: "Meeting"  },
  { value: "CALL",      label: "Call"     },
  { value: "FOLLOW_UP", label: "Follow-up"},
]

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}
function daysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate() }
function buildCells(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1).getDay()
  const total = daysInMonth(year, month)
  const cells: (Date | null)[] = Array(first).fill(null)
  for (let d = 1; d <= total; d++) cells.push(new Date(year, month, d))
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export default function CalendarPage() {
  const today = useMemo(() => new Date(), [])
  const [view,        setView]        = useState<"day" | "week" | "month">("month")
  const [calMonth,    setCalMonth]    = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [miniMonth,   setMiniMonth]   = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedDay, setSelectedDay] = useState<Date>(today)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading,     setLoading]     = useState(true)
  const [showForm,    setShowForm]    = useState(false)
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null)
  const [form, setForm] = useState({ title: "", type: "VIEWING", startTime: "", endTime: "", location: "", notes: "" })
  const [saving, setSaving] = useState(false)

  const fetchAppointments = useCallback(async () => {
    try {
      const res = await fetch("/api/appointments")
      const data = await res.json()
      setAppointments(data.appointments || [])
    } catch { setAppointments([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAppointments() }, [fetchAppointments])

  const aptsByDate = useMemo(() => {
    const map: Record<string, Appointment[]> = {}
    for (const apt of appointments) {
      const key = new Date(apt.startTime).toDateString()
      if (!map[key]) map[key] = []
      map[key].push(apt)
    }
    return map
  }, [appointments])

  const mainCells = useMemo(() => buildCells(calMonth.getFullYear(), calMonth.getMonth()), [calMonth])
  const miniCells = useMemo(() => buildCells(miniMonth.getFullYear(), miniMonth.getMonth()), [miniMonth])

  const recentActivity = useMemo(() =>
    [...appointments].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()).slice(0, 6),
    [appointments])

  async function addAppointment(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setShowForm(false)
        setForm({ title: "", type: "VIEWING", startTime: "", endTime: "", location: "", notes: "" })
        fetchAppointments()
      }
    } finally { setSaving(false) }
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a))
    if (selectedApt?.id === id) setSelectedApt(prev => prev ? { ...prev, status } : null)
  }

  function navigateMain(dir: number) {
    setCalMonth(d => new Date(d.getFullYear(), d.getMonth() + dir, 1))
  }

  function selectDay(d: Date) {
    setSelectedDay(d)
    setCalMonth(new Date(d.getFullYear(), d.getMonth(), 1))
  }

  // ── Week days for week view ──────────────────────────────────────────────────
  const weekDays = useMemo(() => {
    const start = new Date(selectedDay)
    start.setDate(start.getDate() - start.getDay())
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      return d
    })
  }, [selectedDay])

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50">

      {/* ── Top Bar ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-3.5 bg-white border-b border-slate-200 flex-shrink-0">
        <h1 className="text-lg font-bold text-slate-900">Calendar</h1>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition shadow-sm">
          <Plus className="w-4 h-4" /> New Event
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Main Calendar ───────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white">

          {/* Nav bar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 flex-shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setCalMonth(new Date(today.getFullYear(), today.getMonth(), 1)); setSelectedDay(today) }}
                className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg hover:bg-slate-50 transition text-slate-600">
                Today
              </button>
              <div className="flex items-center gap-0.5">
                <button onClick={() => navigateMain(-1)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 transition">
                  <ChevronLeft className="w-4 h-4 text-slate-500" />
                </button>
                <span className="text-sm font-bold text-slate-900 min-w-[150px] text-center">
                  {MONTHS[calMonth.getMonth()]}, {calMonth.getFullYear()}
                </span>
                <button onClick={() => navigateMain(1)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 transition">
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            </div>

            {/* View tabs */}
            <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-0.5">
              {(["day","week","month"] as const).map(v => (
                <button key={v} onClick={() => setView(v)}
                  className={cn("px-3.5 py-1.5 text-xs font-semibold rounded-lg transition capitalize",
                    view === v ? "bg-white shadow-sm text-slate-900" : "text-slate-400 hover:text-slate-600")}>
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* ── Month View ──────────────────────────────────────────────────── */}
          {view === "month" && (
            <div className="flex-1 overflow-auto">
              {/* Day headers */}
              <div className="grid grid-cols-7 border-b border-slate-100">
                {DAYS.map(d => (
                  <div key={d} className="py-2.5 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {d}
                  </div>
                ))}
              </div>
              {/* Grid */}
              <div className="grid grid-cols-7 h-[calc(100%-40px)]" style={{ gridAutoRows: "1fr" }}>
                {mainCells.map((date, i) => {
                  if (!date) return (
                    <div key={i} className="border-b border-r border-slate-100 bg-slate-50/60 min-h-[100px]" />
                  )
                  const key      = date.toDateString()
                  const dayApts  = aptsByDate[key] || []
                  const isToday  = sameDay(date, today)
                  const isSel    = sameDay(date, selectedDay)
                  const isPast   = date < today && !isToday
                  return (
                    <div key={i}
                      onClick={() => setSelectedDay(date)}
                      className={cn(
                        "border-b border-r border-slate-100 p-1.5 cursor-pointer transition-colors min-h-[100px]",
                        isSel && !isToday ? "bg-blue-50/50" : "hover:bg-slate-50/80"
                      )}>
                      <div className={cn(
                        "w-7 h-7 flex items-center justify-center text-xs font-bold rounded-full mb-1",
                        isToday ? "bg-violet-600 text-white shadow-sm" :
                        isPast  ? "text-slate-300" : "text-slate-700"
                      )}>
                        {date.getDate()}
                      </div>
                      <div className="space-y-0.5">
                        {dayApts.slice(0, 3).map(apt => {
                          const s = TYPE_STYLES[apt.type] || TYPE_STYLES.MEETING
                          return (
                            <div key={apt.id}
                              onClick={e => { e.stopPropagation(); setSelectedApt(apt) }}
                              className={cn("px-1.5 py-0.5 rounded-md text-[10px] font-semibold truncate cursor-pointer hover:opacity-75 transition", s.pill)}>
                              {apt.title}
                            </div>
                          )
                        })}
                        {dayApts.length > 3 && (
                          <p className="text-[10px] text-slate-400 px-1.5">+{dayApts.length - 3} more</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Week View ───────────────────────────────────────────────────── */}
          {view === "week" && (
            <div className="flex-1 overflow-auto">
              <div className="grid grid-cols-7 border-b border-slate-100">
                {weekDays.map((d, i) => {
                  const isToday = sameDay(d, today)
                  const isSel   = sameDay(d, selectedDay)
                  return (
                    <div key={i} onClick={() => setSelectedDay(d)}
                      className="py-3 text-center cursor-pointer hover:bg-slate-50 border-r border-slate-100 last:border-0 transition">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{DAYS[i].slice(0,3)}</p>
                      <div className={cn("w-8 h-8 mx-auto flex items-center justify-center rounded-full text-sm font-bold transition",
                        isToday ? "bg-violet-600 text-white" :
                        isSel   ? "bg-blue-100 text-blue-700" : "text-slate-700 hover:bg-slate-100")}>
                        {d.getDate()}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="grid grid-cols-7 p-3 gap-2" style={{ gridAutoRows: "minmax(120px, auto)" }}>
                {weekDays.map((d, i) => {
                  const dayApts = aptsByDate[d.toDateString()] || []
                  return (
                    <div key={i} className="space-y-1.5">
                      {dayApts.length === 0 ? (
                        <div className="h-full min-h-[80px] border border-dashed border-slate-100 rounded-xl" />
                      ) : dayApts.map(apt => {
                        const s = TYPE_STYLES[apt.type] || TYPE_STYLES.MEETING
                        return (
                          <div key={apt.id} onClick={() => setSelectedApt(apt)}
                            className={cn("px-2.5 py-2 rounded-xl text-[11px] font-semibold cursor-pointer hover:opacity-80 transition border border-transparent", s.pill)}>
                            <p className="truncate">{apt.title}</p>
                            <p className="font-normal opacity-60 mt-0.5 text-[10px]">
                              {new Date(apt.startTime).toLocaleTimeString("en-QA", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Day View ────────────────────────────────────────────────────── */}
          {view === "day" && (
            <div className="flex-1 overflow-auto p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-lg font-bold text-slate-900">
                    {selectedDay.toLocaleDateString("en-QA", { weekday: "long", month: "long", day: "numeric" })}
                  </p>
                  <p className="text-xs text-slate-400">{selectedDay.getFullYear()}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { const d = new Date(selectedDay); d.setDate(d.getDate() - 1); selectDay(d) }}
                    className="w-8 h-8 flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50 transition">
                    <ChevronLeft className="w-4 h-4 text-slate-500" />
                  </button>
                  <button onClick={() => { const d = new Date(selectedDay); d.setDate(d.getDate() + 1); selectDay(d) }}
                    className="w-8 h-8 flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50 transition">
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </button>
                </div>
              </div>
              {(aptsByDate[selectedDay.toDateString()] || []).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                    <Calendar className="w-7 h-7 text-slate-300" />
                  </div>
                  <p className="font-semibold text-slate-700 mb-1">No events today</p>
                  <p className="text-sm text-slate-400 mb-4">Tap the button above to schedule</p>
                  <button onClick={() => setShowForm(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl">
                    <Plus className="w-4 h-4" /> Add Event
                  </button>
                </div>
              ) : (
                <div className="space-y-3 max-w-xl">
                  {(aptsByDate[selectedDay.toDateString()] || []).map(apt => {
                    const s = TYPE_STYLES[apt.type] || TYPE_STYLES.MEETING
                    return (
                      <div key={apt.id} onClick={() => setSelectedApt(apt)}
                        className="bg-white border border-slate-200 rounded-2xl p-4 cursor-pointer hover:border-slate-300 hover:shadow-sm transition flex gap-3">
                        <div className={cn("w-1 self-stretch rounded-full flex-shrink-0", s.dot)} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold text-slate-900">{apt.title}</p>
                            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-lg flex-shrink-0", s.pill)}>
                              {apt.type.replace("_"," ")}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(apt.startTime).toLocaleTimeString("en-QA", { hour: "2-digit", minute: "2-digit" })} –{" "}
                            {new Date(apt.endTime).toLocaleTimeString("en-QA", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                          {apt.location && (
                            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />{apt.location}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Right Sidebar ───────────────────────────────────────────────────── */}
        <div className="w-[260px] flex-shrink-0 border-l border-slate-200 bg-white flex flex-col overflow-y-auto">

          {/* Mini Calendar */}
          <div className="p-4 border-b border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-900">
                {MONTHS[miniMonth.getMonth()]}, {miniMonth.getFullYear()}
              </span>
              <div className="flex gap-0.5">
                <button onClick={() => setMiniMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
                  className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-slate-100 transition">
                  <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button onClick={() => setMiniMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
                  className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-slate-100 transition">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 mb-1">
              {["S","M","T","W","T","F","S"].map((d, i) => (
                <div key={i} className="text-center text-[9px] font-bold text-slate-300 py-0.5">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {miniCells.map((d, i) => {
                if (!d) return <div key={i} className="w-7 h-7" />
                const isToday = sameDay(d, today)
                const isSel   = sameDay(d, selectedDay)
                const hasApts = !!(aptsByDate[d.toDateString()]?.length)
                return (
                  <button key={i}
                    onClick={() => { setSelectedDay(d); setCalMonth(new Date(d.getFullYear(), d.getMonth(), 1)) }}
                    className={cn(
                      "w-7 h-7 mx-auto flex items-center justify-center rounded-full text-[11px] font-semibold transition relative",
                      isToday ? "bg-violet-600 text-white shadow-sm" :
                      isSel   ? "bg-blue-100 text-blue-700" :
                               "text-slate-500 hover:bg-slate-100"
                    )}>
                    {d.getDate()}
                    {hasApts && !isToday && !isSel && (
                      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-violet-400" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="p-4 flex-1">
            <p className="text-xs font-bold text-slate-900 mb-3 uppercase tracking-wider">Activity</p>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
              </div>
            ) : recentActivity.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No events yet</p>
            ) : (
              <div className="space-y-3">
                {recentActivity.map(apt => {
                  const s = TYPE_STYLES[apt.type] || TYPE_STYLES.MEETING
                  const person = apt.lead || apt.client
                  return (
                    <div key={apt.id}
                      onClick={() => setSelectedApt(apt)}
                      className="flex gap-2.5 cursor-pointer group">
                      <div className={cn("w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center", s.bg)}>
                        {apt.type === "VIEWING" ? <Eye    className={cn("w-3.5 h-3.5", s.text)} />
                        : apt.type === "CALL"   ? <Phone  className={cn("w-3.5 h-3.5", s.text)} />
                        :                         <Users  className={cn("w-3.5 h-3.5", s.text)} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-slate-800 truncate group-hover:text-blue-600 transition">{apt.title}</p>
                        {person && <p className="text-[10px] text-slate-400 truncate">{person.name}</p>}
                        <p className="text-[10px] text-slate-300 mt-0.5">
                          {new Date(apt.startTime).toLocaleDateString("en-QA", { month: "short", day: "numeric" })}
                          {" · "}
                          {new Date(apt.startTime).toLocaleTimeString("en-QA", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-md",
                          apt.status === "COMPLETED" ? "bg-green-100 text-green-700" :
                          apt.status === "CANCELLED" ? "bg-red-100 text-red-600" :
                          apt.status === "CONFIRMED" ? "bg-blue-100 text-blue-700" :
                          "bg-slate-100 text-slate-500")}>
                          {apt.status === "VIEWING_SCHEDULED" ? "SCHED" : apt.status.slice(0, 5)}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Event Detail Modal ────────────────────────────────────────────────── */}
      {selectedApt && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedApt(null)}>
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3">
              <div>
                <span className={cn("inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-lg mb-2",
                  (TYPE_STYLES[selectedApt.type] || TYPE_STYLES.MEETING).pill)}>
                  {selectedApt.type.replace("_"," ")}
                </span>
                <h3 className="font-bold text-slate-900 text-base">{selectedApt.title}</h3>
              </div>
              <button onClick={() => setSelectedApt(null)}
                className="w-7 h-7 flex items-center justify-center rounded-xl hover:bg-slate-100 transition flex-shrink-0">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-2.5 text-sm text-slate-600">
                <Clock className="w-4 h-4 text-slate-300 flex-shrink-0" />
                <span>
                  {new Date(selectedApt.startTime).toLocaleDateString("en-QA", { weekday: "short", month: "short", day: "numeric" })}
                  {" · "}
                  {new Date(selectedApt.startTime).toLocaleTimeString("en-QA", { hour: "2-digit", minute: "2-digit" })}
                  {" – "}
                  {new Date(selectedApt.endTime).toLocaleTimeString("en-QA", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              {selectedApt.location && (
                <div className="flex items-center gap-2.5 text-sm text-slate-600">
                  <MapPin className="w-4 h-4 text-slate-300 flex-shrink-0" />
                  <span>{selectedApt.location}</span>
                </div>
              )}
              {(selectedApt.lead || selectedApt.client) && (
                <div className="flex items-center gap-2.5 text-sm text-slate-600">
                  <Users className="w-4 h-4 text-slate-300 flex-shrink-0" />
                  <span>
                    {(selectedApt.lead || selectedApt.client)?.name}
                    {" · "}
                    {(selectedApt.lead || selectedApt.client)?.phone}
                  </span>
                </div>
              )}
              {selectedApt.property && (
                <div className="flex items-center gap-2.5 text-sm text-blue-600">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{selectedApt.property.title}</span>
                </div>
              )}
              {selectedApt.notes && (
                <p className="text-sm text-slate-500 bg-slate-50 rounded-xl px-3 py-2.5">{selectedApt.notes}</p>
              )}
              <div className={cn("inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-lg",
                selectedApt.status === "COMPLETED" ? "bg-green-100 text-green-700" :
                selectedApt.status === "CANCELLED" ? "bg-red-100 text-red-600" :
                selectedApt.status === "CONFIRMED" ? "bg-blue-100 text-blue-700" :
                "bg-slate-100 text-slate-600")}>
                {selectedApt.status}
              </div>
            </div>
            {selectedApt.status === "SCHEDULED" && (
              <div className="px-5 pb-5 flex gap-2">
                <button onClick={() => updateStatus(selectedApt.id, "COMPLETED")}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-green-50 hover:bg-green-100 text-green-700 text-sm font-semibold rounded-xl transition">
                  <CheckCircle className="w-4 h-4" /> Complete
                </button>
                <button onClick={() => updateStatus(selectedApt.id, "CANCELLED")}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold rounded-xl transition">
                  <XCircle className="w-4 h-4" /> Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── New Event Modal ───────────────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">New Event</h3>
              <button onClick={() => setShowForm(false)}
                className="w-7 h-7 flex items-center justify-center rounded-xl hover:bg-slate-100 transition">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <form onSubmit={addAppointment} className="p-5 space-y-4">
              {/* Type pills */}
              <div className="grid grid-cols-4 gap-1.5">
                {TYPE_OPTIONS.map(t => (
                  <button key={t.value} type="button" onClick={() => setForm(f => ({ ...f, type: t.value }))}
                    className={cn("py-2 text-[11px] font-bold rounded-xl border transition",
                      form.type === t.value
                        ? cn((TYPE_STYLES[t.value] || TYPE_STYLES.MEETING).pill, "border-transparent shadow-sm")
                        : "border-slate-200 text-slate-400 hover:bg-slate-50")}>
                    {t.label}
                  </button>
                ))}
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Viewing — The Pearl Villa"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Start *</label>
                  <input type="datetime-local" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">End *</label>
                  <input type="datetime-local" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Location</label>
                <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  placeholder="e.g. The Pearl, Porto Arabia"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2} placeholder="Any additional details..."
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition disabled:opacity-60">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Create Event
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-sm rounded-xl transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
