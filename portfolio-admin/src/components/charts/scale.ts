import { fmtHours, fmtKm, fmtVert } from "@/lib/training/format"

// Round axis ticks: steps of 1, 2, 2.5 or 5 × 10^n
export function niceTicks(min: number, max: number, count = 4): number[] {
  if (max === min) max = min + 1
  const rough = (max - min) / count
  const magnitude = 10 ** Math.floor(Math.log10(rough))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= rough) ?? 10 * magnitude
  const start = Math.floor(min / step) * step
  const ticks: number[] = []
  for (let v = start; v <= max + step * 0.5; v += step) ticks.push(Math.round(v * 1e6) / 1e6)
  if (ticks[ticks.length - 1] < max) ticks.push(ticks[ticks.length - 1] + step)
  return ticks
}

export function compact(value: number): string {
  if (Math.abs(value) >= 1000) return `${Math.round(value / 100) / 10}K`
  return String(Math.round(value * 10) / 10)
}

export const CHART = {
  series: ["#2a78d6", "#eb6834"],
  seriesLight: "#86b6ef",
  grid: "#e1e0d9",
  axis: "#c3c2b7",
  muted: "#898781",
  secondary: "#52514e",
  primary: "#0b0b0b",
  surface: "#ffffff",
}

export type Unit = "hours" | "km" | "vert" | "count"

export const FORMATTERS: Record<Unit, (value: number) => string> = {
  hours: fmtHours,
  km: fmtKm,
  vert: fmtVert,
  count: (v) => String(Math.round(v)),
}
