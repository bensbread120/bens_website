import type { AthleteProfile } from "@prisma/client"
import { db } from "@/lib/db"
import { parseStravaTimezone } from "./dates"

const DEFAULT_PROFILE: AthleteProfile = {
  id: 1,
  maxHr: null,
  restingHr: null,
  trimpFactor: 1.92,
  runDaysPerWeek: 5,
  longRunDay: 5,
  backToBack: true,
  maxWeeklyHours: null,
  timezone: null,
  coachNotes: null,
  updatedAt: new Date(0),
}

export async function getProfile(): Promise<AthleteProfile> {
  return (await db.athleteProfile.findUnique({ where: { id: 1 } })) ?? DEFAULT_PROFILE
}

// The profile's timezone, else the one Strava reported on the latest activity
export async function getAthleteTimezone(profile?: AthleteProfile): Promise<string> {
  const timezone = (profile ?? (await getProfile())).timezone
  if (timezone) return timezone

  const latest = await db.activity.findFirst({
    where: { timezone: { not: null } },
    orderBy: { startDate: "desc" },
    select: { timezone: true },
  })
  return parseStravaTimezone(latest?.timezone) ?? "UTC"
}
