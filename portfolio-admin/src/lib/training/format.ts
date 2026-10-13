import { fromISODate, type ISODate } from "./dates"
import type { FormStatus } from "./load"
import type { Phase, WorkoutKind } from "./planner"

export function fmtDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  if (h === 0) return `${m}m`
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

export function fmtHours(hours: number): string {
  return `${Math.round(hours * 10) / 10}h`
}

export function fmtKm(km: number): string {
  return `${km >= 100 ? Math.round(km) : Math.round(km * 10) / 10} km`
}

export function fmtVert(m: number): string {
  return `${Math.round(m).toLocaleString("en-AU")} m`
}

export function shortDate(iso: ISODate): string {
  return fromISODate(iso).toLocaleDateString("en-AU", { day: "numeric", month: "short", timeZone: "UTC" })
}

export function longDate(iso: ISODate): string {
  return fromISODate(iso).toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  })
}

export const PHASE_LABELS: Record<Phase, string> = {
  base: "Base",
  build: "Build",
  peak: "Peak",
  taper: "Taper",
  race: "Race week",
  recovery: "Recovery",
}

export const PHASE_STYLES: Record<Phase, string> = {
  base: "bg-sky-100 text-sky-900",
  build: "bg-indigo-100 text-indigo-900",
  peak: "bg-violet-100 text-violet-900",
  taper: "bg-amber-100 text-amber-900",
  race: "bg-rose-100 text-rose-900",
  recovery: "bg-emerald-100 text-emerald-900",
}

export const KIND_STYLES: Record<WorkoutKind, string> = {
  rest: "bg-gray-100 text-gray-600",
  easy: "bg-sky-50 text-sky-800",
  recovery: "bg-emerald-50 text-emerald-800",
  long: "bg-indigo-100 text-indigo-900",
  backToBack: "bg-indigo-100 text-indigo-900",
  hills: "bg-orange-100 text-orange-900",
  tempo: "bg-orange-100 text-orange-900",
  intervals: "bg-orange-100 text-orange-900",
  strides: "bg-sky-50 text-sky-800",
  shakeout: "bg-sky-50 text-sky-800",
  race: "bg-rose-100 text-rose-900",
}

export const FORM_LABELS: Record<FormStatus, { label: string; icon: string; className: string; advice: string }> = {
  fresh: { label: "Fresh", icon: "▲", className: "text-green-700", advice: "Well rested. A good time for a key session or race." },
  neutral: { label: "Neutral", icon: "●", className: "text-gray-600", advice: "Balanced. Train as planned." },
  productive: {
    label: "Productive",
    icon: "▼",
    className: "text-amber-700",
    advice: "Carrying normal training fatigue. Keep easy days genuinely easy.",
  },
  overreaching: {
    label: "Overreaching",
    icon: "✕",
    className: "text-red-700",
    advice: "Heavily fatigued. Consider swapping today's session for easy running or rest.",
  },
}
