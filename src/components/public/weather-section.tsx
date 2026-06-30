"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

// Qatar / Doha historical averages
const DATA = {
  temperature: {
    label: "Average temperature (°C)",
    high: [23, 25, 29, 34, 39, 42, 42, 42, 39, 34, 29, 24],
    low:  [14, 15, 18, 22, 27, 30, 31, 31, 28, 24, 19, 15],
  },
  rain: {
    label: "Average rainfall (mm)",
    values: [12, 18, 14, 8, 3, 0, 0, 0, 0, 1, 4, 12],
  },
  uv: {
    label: "Average UV index",
    values: [4, 5, 7, 8, 10, 11, 11, 10, 9, 7, 5, 4],
    max: 11,
  },
  humidity: {
    label: "Average humidity (%)",
    values: [60, 58, 52, 44, 38, 40, 50, 55, 55, 55, 58, 60],
    max: 100,
  },
}

type Tab = "temperature" | "rain" | "uv" | "humidity"

const TABS: { key: Tab; label: string }[] = [
  { key: "temperature", label: "Temperature" },
  { key: "rain",        label: "Rainfall" },
  { key: "uv",          label: "UV Index" },
  { key: "humidity",    label: "Humidity" },
]

function TempChart() {
  const { high, low } = DATA.temperature
  const absMax = 45
  const absMin = 10
  const range  = absMax - absMin

  return (
    <div className="mt-4">
      <p className="text-xs text-slate-500 mb-4">{DATA.temperature.label}</p>
      <div className="flex items-end gap-1 h-48">
        {MONTHS.map((m, i) => {
          const hiPct  = ((high[i] - absMin) / range) * 100
          const loPct  = ((low[i]  - absMin) / range) * 100
          const barH   = hiPct - loPct

          return (
            <div key={m} className="flex-1 flex flex-col items-center gap-0.5 h-full relative">
              {/* High label */}
              <span className="absolute text-[10px] font-semibold text-orange-500"
                style={{ bottom: `${hiPct}%`, transform: "translateY(calc(-100% - 2px))" }}>
                {high[i]}
              </span>
              {/* Bar container */}
              <div className="absolute w-full" style={{ bottom: `${loPct}%`, height: `${barH}%` }}>
                <div className="w-3/4 mx-auto h-full rounded-md bg-gradient-to-b from-orange-400 to-blue-400" />
              </div>
              {/* Low label */}
              <span className="absolute text-[10px] font-medium text-blue-500"
                style={{ bottom: `${loPct}%`, transform: "translateY(calc(100% + 2px))" }}>
                {low[i]}
              </span>
            </div>
          )
        })}
      </div>
      <div className="flex gap-1 mt-2">
        {MONTHS.map(m => (
          <div key={m} className="flex-1 text-center text-[10px] text-slate-400">{m}</div>
        ))}
      </div>
      <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-orange-400 inline-block" /> High</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-blue-400 inline-block" /> Low</span>
      </div>
    </div>
  )
}

function SimpleBarChart({ values, max, unit, colorClass }: { values: number[]; max: number; unit: string; colorClass: string }) {
  const chartMax = max || Math.max(...values) * 1.2 || 1

  return (
    <div className="mt-4">
      <div className="flex items-end gap-1 h-40">
        {values.map((v, i) => {
          const pct = (v / chartMax) * 100
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-0.5">
              <span className="text-[10px] font-semibold text-slate-600">{v}</span>
              <div
                className={cn("w-3/4 rounded-t-md transition-all", colorClass)}
                style={{ height: `${Math.max(pct, 2)}%` }}
              />
            </div>
          )
        })}
      </div>
      <div className="flex gap-1 mt-2">
        {MONTHS.map(m => (
          <div key={m} className="flex-1 text-center text-[10px] text-slate-400">{m}</div>
        ))}
      </div>
      <p className="text-xs text-slate-400 mt-2">Unit: {unit}</p>
    </div>
  )
}

export function WeatherSection() {
  const [tab, setTab] = useState<Tab>("temperature")

  return (
    <div className="border border-slate-200 rounded-2xl p-5 mb-8">
      <div className="flex items-start justify-between mb-1">
        <h2 className="text-lg font-semibold text-slate-900">Historical weather</h2>
      </div>
      <p className="text-sm text-slate-500 mb-4">Doha, Qatar — monthly averages</p>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap mb-2">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
              tab === t.key
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Charts */}
      {tab === "temperature" && <TempChart />}
      {tab === "rain"        && (
        <SimpleBarChart
          values={DATA.rain.values}
          max={Math.max(...DATA.rain.values) * 1.3}
          unit="mm"
          colorClass="bg-blue-400"
        />
      )}
      {tab === "uv"          && (
        <SimpleBarChart
          values={DATA.uv.values}
          max={DATA.uv.max}
          unit="index (max 11)"
          colorClass="bg-amber-400"
        />
      )}
      {tab === "humidity"    && (
        <SimpleBarChart
          values={DATA.humidity.values}
          max={DATA.humidity.max}
          unit="%"
          colorClass="bg-teal-400"
        />
      )}
    </div>
  )
}
