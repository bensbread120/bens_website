// Calendar maths on athlete-local dates, represented as "YYYY-MM-DD" strings.
// Strings avoid the usual off-by-one bugs from mixing server UTC time with local days.

export type ISODate = string

const DAY_MS = 86_400_000

export function toISODate(date: Date): ISODate {
  return date.toISOString().slice(0, 10)
}

export function fromISODate(iso: ISODate): Date {
  return new Date(`${iso}T00:00:00.000Z`)
}

export function addDays(iso: ISODate, days: number): ISODate {
  return toISODate(new Date(fromISODate(iso).getTime() + days * DAY_MS))
}

export function daysBetween(from: ISODate, to: ISODate): number {
  return Math.round((fromISODate(to).getTime() - fromISODate(from).getTime()) / DAY_MS)
}

// 0 = Monday ... 6 = Sunday
export function dayIndex(iso: ISODate): number {
  return (fromISODate(iso).getUTCDay() + 6) % 7
}

export function weekStartOf(iso: ISODate): ISODate {
  return addDays(iso, -dayIndex(iso))
}

export function todayInZone(timeZone: string, now: Date = new Date()): ISODate {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now)
}

// Strava reports timezones as "(GMT+10:00) Australia/Brisbane"
export function parseStravaTimezone(value: string | null | undefined): string | null {
  if (!value) return null
  const zone = value.split(" ").pop()
  if (!zone || !zone.includes("/")) return null
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone: zone })
    return zone
  } catch {
    return null
  }
}

// startDateLocal is wall-clock time stored as UTC, so its UTC date is the local date.
export function activityLocalDate(
  activity: { startDate: Date; startDateLocal: Date | null },
  fallbackTimeZone: string
): ISODate {
  if (activity.startDateLocal) return toISODate(activity.startDateLocal)
  return todayInZone(fallbackTimeZone, activity.startDate)
}

export const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
