import { addDays, daysBetween, type ISODate } from "./dates"

export const RUN_TYPES = new Set(["Run", "TrailRun", "VirtualRun"])
// Ultra training counts hiking as time on feet
export const ON_FEET_TYPES = new Set([...RUN_TYPES, "Hike", "Walk"])

type Typed = { type: string; sportType?: string | null }

export function isRun(activity: Typed): boolean {
  return RUN_TYPES.has(activity.sportType ?? activity.type)
}

export function isOnFeet(activity: Typed): boolean {
  return ON_FEET_TYPES.has(activity.sportType ?? activity.type)
}

export type HrProfile = {
  maxHr: number | null
  restingHr: number | null
  trimpFactor: number
}

// Load for an easy aerobic minute: Banister TRIMP at 65% heart-rate reserve
const EASY_HRR = 0.65
function trimpPerMinute(hrr: number, factor: number) {
  return hrr * 0.64 * Math.exp(factor * hrr)
}

const FALLBACK_INTENSITY: Record<string, number> = {
  Run: 1,
  TrailRun: 1,
  VirtualRun: 1,
  Hike: 0.6,
  Walk: 0.4,
  Ride: 0.7,
  VirtualRide: 0.7,
}

/**
 * Banister TRIMP from average heart rate when the HR profile is known; otherwise
 * an estimate that treats the session as easy aerobic effort scaled by sport.
 */
export function computeTrainingLoad(
  activity: Typed & { movingTime: number; averageHeartrate: number | null },
  profile: HrProfile
): number {
  const minutes = activity.movingTime / 60
  const { maxHr, restingHr, trimpFactor } = profile

  if (activity.averageHeartrate && maxHr && restingHr && maxHr > restingHr) {
    const hrr = Math.min(1, Math.max(0, (activity.averageHeartrate - restingHr) / (maxHr - restingHr)))
    return round1(minutes * trimpPerMinute(hrr, trimpFactor))
  }

  const intensity = FALLBACK_INTENSITY[activity.sportType ?? activity.type] ?? 0.6
  return round1(minutes * trimpPerMinute(EASY_HRR, trimpFactor) * intensity)
}

export type FitnessPoint = {
  date: ISODate
  load: number
  // Chronic training load (fitness), 42-day exponentially weighted average
  ctl: number
  // Acute training load (fatigue), 7-day exponentially weighted average
  atl: number
  // Training stress balance (form) going into the day: yesterday's CTL - ATL
  tsb: number
}

export const CTL_DAYS = 42
export const ATL_DAYS = 7

export function fitnessSeries(dailyLoad: Map<ISODate, number>, from: ISODate, to: ISODate): FitnessPoint[] {
  const points: FitnessPoint[] = []
  let ctl = 0
  let atl = 0
  const days = daysBetween(from, to)

  for (let i = 0; i <= days; i++) {
    const date = addDays(from, i)
    const load = dailyLoad.get(date) ?? 0
    const tsb = ctl - atl
    ctl += (load - ctl) / CTL_DAYS
    atl += (load - atl) / ATL_DAYS
    points.push({ date, load, ctl: round1(ctl), atl: round1(atl), tsb: round1(tsb) })
  }

  return points
}

export type FormStatus = "fresh" | "neutral" | "productive" | "overreaching"

// Thresholds follow the common TSB guidance used by TrainingPeaks-style dashboards
export function formStatus(tsb: number): FormStatus {
  if (tsb > 10) return "fresh"
  if (tsb > -10) return "neutral"
  if (tsb > -30) return "productive"
  return "overreaching"
}

function round1(value: number) {
  return Math.round(value * 10) / 10
}
