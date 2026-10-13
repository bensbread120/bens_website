// Server-side glue between the database and the pure training modules.

import type { AthleteProfile, RaceEvent } from "@prisma/client"
import { db } from "@/lib/db"
import { activityLocalDate, addDays, dayIndex, fromISODate, toISODate, todayInZone, weekStartOf, type ISODate } from "./dates"
import { fitnessSeries, type FitnessPoint } from "./load"
import { planWeek, type Phase, type Priority, type Race, type WeekPlan } from "./planner"
import { getAthleteTimezone, getProfile } from "./profile"
import { dailyLoads, weeklySummaries, type DatedActivity } from "./weekly"

export type TrainingContext = {
  profile: AthleteProfile
  timezone: string
  today: ISODate
  activities: (DatedActivity & { id: string; name: string; averageHeartrate: number | null })[]
}

export async function loadTrainingContext(): Promise<TrainingContext> {
  const profile = await getProfile()
  const timezone = await getAthleteTimezone(profile)
  const rows = await db.activity.findMany({
    orderBy: { startDate: "asc" },
    select: {
      id: true,
      name: true,
      type: true,
      sportType: true,
      distance: true,
      movingTime: true,
      elevation: true,
      trainingLoad: true,
      averageHeartrate: true,
      startDate: true,
      startDateLocal: true,
    },
  })

  return {
    profile,
    timezone,
    today: todayInZone(timezone),
    activities: rows.map((row) => ({ ...row, localDate: activityLocalDate(row, timezone) })),
  }
}

// Fitness/fatigue/form for every day from the first activity through `to`
export function fitnessThrough(context: TrainingContext, to: ISODate): FitnessPoint[] {
  const first = context.activities[0]?.localDate
  if (!first || first > to) return []
  return fitnessSeries(dailyLoads(context.activities), first, to)
}

export function toRace(event: RaceEvent): Race {
  return {
    id: event.id,
    name: event.name,
    date: toISODate(event.date),
    distanceKm: event.distanceKm,
    elevationGainM: event.elevationGainM,
    priority: event.priority as Priority,
  }
}

export async function getRaces(): Promise<Race[]> {
  const events = await db.raceEvent.findMany({ orderBy: { date: "asc" } })
  return events.map(toRace)
}

function minDate(a: ISODate, b: ISODate) {
  return a < b ? a : b
}

export async function buildPlan(weekStart: ISODate, context?: TrainingContext): Promise<WeekPlan> {
  const ctx = context ?? (await loadTrainingContext())
  // A week counts as complete from its Sunday, so the Sunday-evening cron can judge it
  const lastCompleteWeek = dayIndex(ctx.today) === 6 ? weekStartOf(ctx.today) : addDays(weekStartOf(ctx.today), -7)
  const historyEnd = minDate(addDays(weekStart, -7), lastCompleteWeek)
  const before = ctx.activities.filter((a) => a.localDate < weekStart)
  const history = weeklySummaries(before, addDays(historyEnd, -11 * 7), historyEnd)

  // Data only exists up to today; projecting zero load into the future would fake freshness
  const series = fitnessThrough({ ...ctx, activities: before }, minDate(addDays(weekStart, -1), ctx.today))
  const last = series.at(-1)
  const fitness = last ? { ctl: last.ctl, atl: last.atl, tsb: last.ctl - last.atl } : { ctl: 0, atl: 0, tsb: 0 }

  const recentPlans = await db.planWeek.findMany({
    where: { weekStart: { lt: fromISODate(weekStart) } },
    orderBy: { weekStart: "desc" },
    take: 4,
  })

  return planWeek({
    weekStart,
    history,
    recentPlans: recentPlans.map((p) => ({
      weekStart: toISODate(p.weekStart),
      phase: p.phase as Phase,
      targetHours: p.targetHours,
      isDownWeek: p.isDownWeek,
    })),
    fitness,
    races: await getRaces(),
    profile: ctx.profile,
  })
}

// Generates (or regenerates) and stores the plan for a week. Clears stale AI notes.
export async function generatePlan(weekStart: ISODate, context?: TrainingContext) {
  const plan = await buildPlan(weekStart, context)
  const data = {
    phase: plan.phase,
    targetHours: plan.targetHours,
    targetDistanceKm: plan.targetDistanceKm,
    targetVertM: plan.targetVertM,
    longRunMinutes: plan.longRunMinutes,
    isDownWeek: plan.isDownWeek,
    targetRaceId: plan.targetRaceId,
    rationale: plan.rationale,
    aiNotes: null,
    aiNotesAt: null,
    generatedAt: new Date(),
  }

  return db.$transaction(async (tx) => {
    const week = await tx.planWeek.upsert({
      where: { weekStart: fromISODate(weekStart) },
      create: { weekStart: fromISODate(weekStart), ...data },
      update: data,
    })
    await tx.plannedWorkout.deleteMany({ where: { planWeekId: week.id } })
    await tx.plannedWorkout.createMany({
      data: plan.workouts.map((w) => ({
        planWeekId: week.id,
        date: fromISODate(w.date),
        kind: w.kind,
        title: w.title,
        description: w.description,
        durationMinutes: w.durationMinutes,
        distanceKm: w.distanceKm,
        vertM: w.vertM,
      })),
    })
    return week
  })
}

/**
 * Called daily. Creates this week's plan if missing, and from Sunday onwards next
 * week's too, so a fresh week is waiting each Monday. Existing plans are left alone
 * so a week doesn't shift under you mid-way through.
 */
export async function ensurePlans(context?: TrainingContext) {
  const ctx = context ?? (await loadTrainingContext())
  const thisWeek = weekStartOf(ctx.today)
  const weeks = [thisWeek]
  if (fromISODate(ctx.today).getUTCDay() === 0) weeks.push(addDays(thisWeek, 7))

  const created: ISODate[] = []
  for (const week of weeks) {
    const exists = await db.planWeek.findUnique({ where: { weekStart: fromISODate(week) }, select: { id: true } })
    if (!exists) {
      await generatePlan(week, ctx)
      created.push(week)
    }
  }
  return created
}

// After races or settings change, regenerate any plan from this week on
export async function regenerateUpcomingPlans() {
  const ctx = await loadTrainingContext()
  const upcoming = await db.planWeek.findMany({
    where: { weekStart: { gte: fromISODate(weekStartOf(ctx.today)) } },
    orderBy: { weekStart: "asc" },
    select: { weekStart: true },
  })
  for (const week of upcoming) await generatePlan(toISODate(week.weekStart), ctx)
  await ensurePlans(ctx)
}
