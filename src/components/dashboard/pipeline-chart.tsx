"use client"

const STAGE_COLORS: Record<string, string> = {
  NEW: "#94a3b8",
  CONTACTED: "#60a5fa",
  QUALIFIED: "#34d399",
  VIEWING_SCHEDULED: "#fbbf24",
  NEGOTIATING: "#f97316",
  CONVERTED: "#22c55e",
  LOST: "#f87171",
}

interface PipelineStage {
  status: string
  count: number
  label: string
}

export function PipelineChart({ stages }: { stages: PipelineStage[] }) {
  const max = Math.max(...stages.map(s => s.count), 1)

  return (
    <div className="flex items-end gap-1.5 h-[180px] w-full px-1">
      {stages.map((s) => {
        const pct = Math.round((s.count / max) * 100)
        const color = STAGE_COLORS[s.status] || "#60a5fa"
        return (
          <div key={s.status} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
            <span className="text-[11px] font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
              {s.count}
            </span>
            <div
              className="w-full rounded-t-md transition-all duration-500"
              style={{ height: `${Math.max(pct, 4)}%`, background: color }}
              title={`${s.label}: ${s.count} leads`}
            />
            <span className="text-[10px] text-slate-400 text-center leading-tight w-full truncate px-0.5">
              {s.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
