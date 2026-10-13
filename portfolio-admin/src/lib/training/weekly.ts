import { addDays, daysBetween, weekStartOf, type ISODate } from "./dates"
import { isOnFeet } from "./load"

export type DatedActivity = {
  localDate: ISODate
  type: string
  sportType: string | null
  // metres
  distance: number
  // seconds
  movingTime: number
  elevation: number | null
  trainingLoad: number | null
}

export type WeekSummary = {
  weekStart: ISODate
  // Time on feet (runs + hikes), hours
  hours: number
  km: number
  vertM: number
  longestMinutes: number
  sessions: number
  // Training load from every activity, including cross-training
  load: number
}

export function emptyWeek(weekStart: ISODate): WeekSummary {
  return { weekStart, hours: 0, km: 0, vertM: 0, longestMinutes: 0, sessions: 0, load: 0 }
}

// One summary per week from fromWeek to toWeek inclusive, with empty weeks filled in
export function weeklySummaries(activities: DatedActivity[], fromWeek: ISODate, toWeek: ISODate): WeekSummary[] {
  const weeks = new Map<ISODate, WeekSummary>()
  const count = Math.floor(daysBetween(fromWeek, toWeek) / 7)
  for (let i = 0; i <= count; i++) {
    const start = addDays(fromWeek, i * 7)
    weeks.set(start, emptyWeek(start))
  }

  for (const activity of activities) {
    const week = weeks.get(weekStartOf(activity.localDate))
    if (!week) continue

    week.load += activity.trainingLoad ?? 0
    if (!isOnFeet(activity)) continue

    const minutes = activity.movingTime / 60
    week.hours += minutes / 60
    week.km += activity.distance / 1000
    week.vertM += activity.elevation ?? 0
    week.longestMinutes = Math.max(week.longestMinutes, minutes)
    week.sessions += 1
  }

  return [...weeks.values()].map((week) => ({
    ...week,
    hours: round2(week.hours),
    km: round2(week.km),
    vertM: Math.round(week.vertM),
    longestMinutes: Math.round(week.longestMinutes),
    load: Math.round(week.load),
  }))
}

export function dailyLoads(activities: DatedActivity[]): Map<ISODate, number> {
  const loads = new Map<ISODate, number>()
  for (const activity of activities) {
    loads.set(activity.localDate, (loads.get(activity.localDate) ?? 0) + (activity.trainingLoad ?? 0))
  }
  return loads
}

function round2(value: number) {
  return Math.round(value * 100) / 100
}
