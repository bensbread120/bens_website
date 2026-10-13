// Rule-based ultra training planner. Pure functions only: everything it needs is passed in,
// so the same inputs always produce the same week and it can be unit tested without a DB.

import { addDays, dayIndex, daysBetween, fromISODate, DAY_NAMES, type ISODate } from "./dates"
import type { WeekSummary } from "./weekly"

export type Priority = "A" | "B" | "C"

export type Race = {
  id: string
  name: string
  date: ISODate
  distanceKm: number
  elevationGainM: number | null
  priority: Priority
}

export type Phase = "base" | "build" | "peak" | "taper" | "race" | "recovery"

export type WorkoutKind =
  | "rest"
  | "easy"
  | "recovery"
  | "long"
  | "backToBack"
  | "hills"
  | "tempo"
  | "intervals"
  | "strides"
  | "shakeout"
  | "race"

export type WorkoutDraft = {
  date: ISODate
  kind: WorkoutKind
  title: string
  description: string
  durationMinutes: number
  distanceKm: number | null
  vertM: number | null
}

export type PlannerProfile = {
  runDaysPerWeek: number
  // 0 = Monday ... 6 = Sunday
  longRunDay: number
  backToBack: boolean
  maxWeeklyHours: number | null
}

export type RecentPlan = {
  weekStart: ISODate
  phase: Phase
  targetHours: number
  isDownWeek: boolean
}

export type PlannerInput = {
  // Monday of the week being planned
  weekStart: ISODate
  // Completed weeks before weekStart, oldest first. When planning ahead this ends
  // at the last finished week, so unfinished weeks are never judged on partial data.
  history: WeekSummary[]
  // Plans for the weeks before weekStart, newest first
  recentPlans: RecentPlan[]
  // Fitness, fatigue and form going into the week
  fitness: { ctl: number; atl: number; tsb: number }
  races: Race[]
  profile: PlannerProfile
}

export type WeekPlan = {
  weekStart: ISODate
  phase: Phase
  // Training volume excluding any race in the week
  targetHours: number
  targetDistanceKm: number
  targetVertM: number
  longRunMinutes: number
  isDownWeek: boolean
  targetRaceId: string | null
  rationale: string[]
  workouts: WorkoutDraft[]
}

export const PEAK_WEEKS = 3
export const BUILD_WEEKS = 8
const DEFAULT_START_HOURS = 3
const DEFAULT_SPEED_KMH = 8.5
const BUILDING_PHASES = new Set<Phase>(["base", "build", "peak"])

// Weekly volume relative to peak, from the first taper week through race week
const TAPER_FACTORS: Record<number, number[]> = {
  1: [0.55],
  2: [0.65, 0.4],
  3: [0.75, 0.55, 0.35],
}

export function taperWeeksFor(distanceKm: number): number {
  if (distanceKm <= 30) return 1
  if (distanceKm <= 60) return 2
  return 3
}

// Longest single run worth doing in training; beyond this, recovery cost outweighs benefit
export function longRunCapMinutes(distanceKm: number | null): number {
  if (distanceKm === null) return 150
  if (distanceKm <= 30) return 120
  if (distanceKm <= 45) return 180
  if (distanceKm <= 60) return 210
  if (distanceKm <= 100) return 270
  return 330
}

// Roughly a day of easy running per 10 km raced, plus a day per 1000 m of climbing
export function recoveryDaysAfter(race: Race): number {
  if (race.priority === "C") return 1
  if (race.priority === "B") return clamp(Math.round(race.distanceKm / 20), 2, 10)
  return clamp(Math.round(race.distanceKm / 10 + (race.elevationGainM ?? 0) / 1000), 3, 28)
}

// A few leftover recovery days only make the start of the week easy; the week keeps its phase
const MIN_RECOVERY_WEEK_DAYS = 4

function isRecoveryWeek(recovery: PhaseInfo["recovery"]) {
  return recovery !== null && recovery.daysRemaining >= MIN_RECOVERY_WEEK_DAYS
}

export type PhaseInfo = {
  weekStart: ISODate
  phase: Phase
  targetRace: Race | null
  // 0 = race is this week
  weeksToRace: number | null
  taperWeeks: number
  // Position within the taper, 0 = first taper week
  taperIndex: number | null
  scheduledDownWeek: boolean
  recovery: { race: Race; daysRemaining: number } | null
}

export function phaseForWeek(weekStart: ISODate, races: Race[]): PhaseInfo {
  const sorted = [...races].sort((a, b) => a.date.localeCompare(b.date))
  const weekEnd = addDays(weekStart, 6)

  const targetRace = sorted.find((race) => race.priority === "A" && race.date >= weekStart) ?? null

  const lastHardRace = [...sorted]
    .reverse()
    .find((race) => race.priority !== "C" && race.date < weekStart)
  let recovery: PhaseInfo["recovery"] = null
  if (lastHardRace) {
    // Recovery covers the days race+1 .. race+N
    const daysRemaining = recoveryDaysAfter(lastHardRace) - daysBetween(lastHardRace.date, weekStart) + 1
    if (daysRemaining > 0) recovery = { race: lastHardRace, daysRemaining }
  }

  const base: PhaseInfo = {
    weekStart,
    phase: "base",
    targetRace,
    weeksToRace: null,
    taperWeeks: 0,
    taperIndex: null,
    scheduledDownWeek: false,
    recovery,
  }

  if (!targetRace) {
    // Without a goal race, keep a 3:1 load/down rhythm anchored to a fixed Monday
    const weekNumber = Math.floor(daysBetween("2024-01-01", weekStart) / 7)
    return {
      ...base,
      phase: isRecoveryWeek(recovery) ? "recovery" : "base",
      scheduledDownWeek: weekNumber % 4 === 3,
    }
  }

  const weeksToRace = targetRace.date <= weekEnd ? 0 : Math.floor(daysBetween(weekStart, targetRace.date) / 7)
  const taperWeeks = taperWeeksFor(targetRace.distanceKm)

  let phase: Phase
  if (weeksToRace === 0) phase = "race"
  else if (weeksToRace < taperWeeks) phase = "taper"
  else if (weeksToRace < taperWeeks + PEAK_WEEKS) phase = "peak"
  else if (weeksToRace < taperWeeks + PEAK_WEEKS + BUILD_WEEKS) phase = "build"
  else phase = "base"

  // Count back in 4-week blocks from the start of the taper so a down week
  // always falls just before the peak block, never inside it
  const weeksUntilTaper = weeksToRace - (taperWeeks - 1)
  const scheduledDownWeek = (phase === "build" || phase === "base") && weeksUntilTaper % 4 === 0

  return {
    ...base,
    phase: isRecoveryWeek(recovery) && phase !== "race" ? "recovery" : phase,
    weeksToRace,
    taperWeeks,
    taperIndex: phase === "taper" || phase === "race" ? taperWeeks - 1 - weeksToRace : null,
    scheduledDownWeek,
  }
}

// Phase outline for the coming weeks, independent of training data
export function seasonOutline(fromWeek: ISODate, races: Race[], weeks: number): PhaseInfo[] {
  return Array.from({ length: weeks }, (_, i) => phaseForWeek(addDays(fromWeek, i * 7), races))
}

export function planWeek(input: PlannerInput): WeekPlan {
  const { weekStart, history, recentPlans, fitness, races, profile } = input
  const why: string[] = []
  const info = phaseForWeek(weekStart, races)
  const { phase, targetRace } = info
  const runDays = clamp(Math.round(profile.runDaysPerWeek), 3, 7)

  const hoursOf = (weeks: WeekSummary[]) => weeks.map((w) => w.hours)
  const last4 = history.slice(-4)
  const last8 = history.slice(-8)
  const mean4 = mean(hoursOf(last4))
  const max4 = Math.max(0, ...hoursOf(last4))
  const max8 = Math.max(0, ...hoursOf(last8))
  const max12 = Math.max(0, ...hoursOf(history.slice(-12)))
  const speed = averageSpeed(last8)

  if (targetRace) {
    why.push(
      `Target: ${targetRace.name} (${targetRace.distanceKm} km) on ${formatDate(targetRace.date)}, ` +
        (info.weeksToRace === 0 ? "this week." : `${info.weeksToRace} week${info.weeksToRace === 1 ? "" : "s"} away.`)
    )
  } else {
    why.push("No A race scheduled, so this is general base building. Add an A race to get a periodised build and taper.")
  }

  // 1. Where progression continues from
  let base: number
  // Only the last two weeks' plans say anything about where training is now
  const lastBuildPlan = recentPlans.find(
    (p) => daysBetween(p.weekStart, weekStart) <= 14 && !p.isDownWeek && BUILDING_PHASES.has(p.phase)
  )
  const lastBuildWeek = lastBuildPlan && history.find((w) => w.weekStart === lastBuildPlan.weekStart)
  if (lastBuildPlan && !lastBuildWeek) {
    // That week hasn't finished yet (planning ahead), so assume it goes to plan
    base = lastBuildPlan.targetHours
    why.push(
      `Projected on the assumption that the ${fmtHours(lastBuildPlan.targetHours)} planned for the week of ` +
        `${formatDate(lastBuildPlan.weekStart)} is completed. Regenerate once it's done for an adjusted plan.`
    )
  } else if (lastBuildPlan && lastBuildWeek) {
    const actual = lastBuildWeek.hours
    const compliance = lastBuildPlan.targetHours > 0 ? actual / lastBuildPlan.targetHours : 1
    if (compliance >= 0.85) {
      base = lastBuildPlan.targetHours
      why.push(
        `You completed ${pct(compliance)} of the ${fmtHours(lastBuildPlan.targetHours)} planned for the week of ` +
          `${formatDate(lastBuildPlan.weekStart)}, so progression continues from that target` +
          (compliance > 1.2 ? " (not from the extra volume, which isn't banked as fitness yet)." : ".")
      )
    } else {
      base = Math.max(actual, mean4)
      why.push(
        `You completed ${pct(compliance)} of the ${fmtHours(lastBuildPlan.targetHours)} planned for the week of ` +
          `${formatDate(lastBuildPlan.weekStart)}, so progression restarts from ${fmtHours(base)} rather than the plan.`
      )
    }
  } else if (mean4 > 0) {
    base = mean4
    why.push(`Starting from your 4-week average of ${fmtHours(mean4)} on feet.`)
  } else {
    base = DEFAULT_START_HOURS
    why.push(`No recent training found, so starting conservatively at ${fmtHours(base)}.`)
  }

  // 2. Volume for the week
  const fatigued = fitness.tsb < -30
  const strained = fitness.ctl > 15 && fitness.atl / fitness.ctl > 1.5
  const rebuilding = max12 > 0 && base < 0.75 * max12
  let hours: number
  let isDownWeek = false
  let qualityCount: number

  if (phase === "recovery" && info.recovery) {
    const { race, daysRemaining } = info.recovery
    const full = daysRemaining >= 7
    hours = (max8 || base) * (full ? 0.35 : 0.6)
    qualityCount = 0
    why.push(
      `Recovering from ${race.name}: about ${recoveryDaysAfter(race)} easy days are needed after ` +
        `${race.distanceKm} km` +
        (race.elevationGainM ? ` and ${Math.round(race.elevationGainM)} m of climbing` : "") +
        `, ${daysRemaining} of which fall in this week. Easy running only, no long run or workouts.`
    )
  } else if ((phase === "taper" || phase === "race") && info.taperIndex !== null) {
    const peakTargets = recentPlans
      .filter((p) => daysBetween(p.weekStart, weekStart) <= 28 && (p.phase === "peak" || p.phase === "build"))
      .map((p) => p.targetHours)
    const peak = Math.max(base, max4, ...peakTargets)
    const factor = TAPER_FACTORS[info.taperWeeks][info.taperIndex]
    hours = peak * factor
    qualityCount = 1
    why.push(
      `Taper week ${info.taperIndex + 1} of ${info.taperWeeks}: volume drops to ${pct(factor)} of your ` +
        `${fmtHours(peak)} peak so you arrive fresh. Intensity stays in, in small doses, to keep you sharp.`
    )
    if (phase === "race") why.push("Volume for race week excludes the race itself.")
  } else {
    if (info.scheduledDownWeek || fatigued) {
      isDownWeek = true
      hours = base * 0.7
      why.push(
        fatigued
          ? `Form is ${fitness.tsb.toFixed(0)} (below -30), a sign of accumulated fatigue, so this becomes a down week at 70% volume.`
          : "Scheduled down week (every 4th week): 70% volume to absorb the last block."
      )
    } else if (strained) {
      hours = base
      why.push(
        `Short-term load is ${(fitness.atl / fitness.ctl).toFixed(1)}× your long-term load (above 1.5), ` +
          "so volume holds steady this week instead of increasing."
      )
    } else {
      const rate = phase === "peak" ? 0.03 : rebuilding ? 0.12 : phase === "build" ? 0.08 : 0.06
      hours = base + Math.min(base * rate, 1)
      why.push(
        rebuilding
          ? `Rebuilding toward your recent high of ${fmtHours(max12)}, so volume can climb faster (+${pct(rate)}).`
          : phase === "peak"
            ? "Peak block: volume stays near its high while the long runs get the most race-specific."
            : `${capitalise(phase)} phase: volume increases ${pct(rate)}, capped at +1h per week.`
      )
    }
    qualityCount = isDownWeek ? 1 : phase === "build" ? (runDays >= 5 ? 2 : 1) : phase === "peak" ? (runDays >= 6 ? 2 : 1) : 1
  }

  if (info.recovery && phase !== "recovery") {
    why.push(
      `The first ${info.recovery.daysRemaining} day${info.recovery.daysRemaining === 1 ? "" : "s"} stay easy ` +
        `to finish recovering from ${info.recovery.race.name}.`
    )
  }

  const weekEnd = addDays(weekStart, 6)
  const weekRaces = races.filter((r) => r.date >= weekStart && r.date <= weekEnd).sort((a, b) => a.date.localeCompare(b.date))
  const bRace = weekRaces.find((r) => r.priority === "B")
  if (bRace && phase !== "race" && phase !== "recovery") {
    hours = Math.min(hours, base * 0.75)
    qualityCount = Math.min(qualityCount, 1)
    why.push(`${bRace.name} is a B race: a mini taper (75% volume) and it replaces this week's long run.`)
  }
  const cRace = weekRaces.find((r) => r.priority === "C")
  if (cRace) why.push(`${cRace.name} is a C race: run it as a training effort in place of the long run.`)

  if (profile.maxWeeklyHours && hours > profile.maxWeeklyHours) {
    hours = profile.maxWeeklyHours
    why.push(`Capped at your ${fmtHours(profile.maxWeeklyHours)} weekly limit.`)
  }

  if (fatigued && qualityCount > 0 && phase !== "recovery") {
    qualityCount = 0
    why.push("Hard sessions are swapped for easy running until form recovers.")
  }

  hours = Math.round(hours * 4) / 4
  const totalMinutes = Math.round(hours * 60)

  // 3. Long run and back-to-back
  const raceKm = targetRace?.distanceKm ?? null
  const cap = longRunCapMinutes(raceKm)
  let longMinutes = 0
  let b2bMinutes = 0
  const hasRaceThisWeek = weekRaces.length > 0

  if (!hasRaceThisWeek && BUILDING_PHASES.has(phase)) {
    const share = isDownWeek ? 0.28 : phase === "base" ? 0.3 : phase === "build" ? 0.33 : 0.35
    longMinutes = clamp(totalMinutes * share, 45, cap)
    if (isDownWeek) longMinutes = Math.min(longMinutes, cap * 0.6)
    const useB2B =
      profile.backToBack && raceKm !== null && raceKm >= 50 && phase !== "base" && !isDownWeek && runDays >= 4
    if (useB2B) {
      b2bMinutes = longMinutes * 0.6
      why.push(
        "Back-to-back long runs: the second day trains running on tired legs, the specific demand of an ultra, " +
          "without the recovery cost of one very long run."
      )
    }
  } else if (!hasRaceThisWeek && phase === "taper" && info.taperIndex !== null) {
    longMinutes = Math.min(cap * (info.taperIndex === 0 ? 0.6 : 0.45), totalMinutes * 0.4)
  }
  longMinutes = round5(longMinutes)
  b2bMinutes = round5(b2bMinutes)

  // 4. Vert target
  const recentVertPerKm = sum(last8.map((w) => w.vertM)) / Math.max(1, sum(last8.map((w) => w.km)))
  const specificity: Record<Phase, number> = { base: 0.5, build: 0.8, peak: 1, taper: 0.6, race: 0.4, recovery: 0.3 }
  let vertPerKm = recentVertPerKm
  if (targetRace?.elevationGainM) {
    const raceVertPerKm = targetRace.elevationGainM / targetRace.distanceKm
    vertPerKm = recentVertPerKm + (raceVertPerKm - recentVertPerKm) * specificity[phase]
    if (BUILDING_PHASES.has(phase) && raceVertPerKm > recentVertPerKm * 1.2) {
      why.push(
        `${targetRace.name} averages ${Math.round(raceVertPerKm)} m of climbing per km versus your recent ` +
          `${Math.round(recentVertPerKm)} m/km, so climbing increases as the race gets closer.`
      )
    }
  }

  const workouts = layoutWeek({
    weekStart,
    info,
    weekRaces,
    runDays,
    profile,
    totalMinutes,
    longMinutes,
    b2bMinutes,
    qualityCount,
    isDownWeek,
    speed,
    vertPerKm,
  })

  const training = workouts.filter((w) => w.kind !== "race")
  return {
    weekStart,
    phase,
    targetHours: hours,
    targetDistanceKm: Math.round(sum(training.map((w) => w.distanceKm ?? 0))),
    targetVertM: Math.round(sum(training.map((w) => w.vertM ?? 0)) / 50) * 50,
    longRunMinutes: longMinutes,
    isDownWeek,
    targetRaceId: targetRace?.id ?? null,
    rationale: why,
    workouts,
  }
}

type LayoutInput = {
  weekStart: ISODate
  info: PhaseInfo
  weekRaces: Race[]
  runDays: number
  profile: PlannerProfile
  totalMinutes: number
  longMinutes: number
  b2bMinutes: number
  qualityCount: number
  isDownWeek: boolean
  speed: number
  vertPerKm: number
}

type Slot = Omit<WorkoutDraft, "date" | "distanceKm" | "vertM"> & { distanceKm?: number; vertM?: number }

const HARD_KINDS = new Set<WorkoutKind>(["long", "backToBack", "hills", "tempo", "intervals", "race"])
const QUALITY_KINDS = new Set<WorkoutKind>(["hills", "tempo", "intervals", "strides"])

function layoutWeek(input: LayoutInput): WorkoutDraft[] {
  const { weekStart, info, weekRaces, profile, totalMinutes, longMinutes, b2bMinutes, speed } = input
  const slots: (Slot | undefined)[] = Array(7).fill(undefined)
  const dateOf = (i: number) => addDays(weekStart, i)
  let runDays = input.runDays

  // Races and the days around them are fixed first
  for (const race of weekRaces) {
    const i = dayIndex(race.date)
    slots[i] = raceSlot(race, speed)
    if (race.priority === "C") continue

    if (i >= 1 && !slots[i - 1]) {
      slots[i - 1] =
        race.priority === "A"
          ? {
              kind: "shakeout",
              title: "Shakeout",
              description: "20 minutes very easy with 4 × 20s relaxed strides. Lay out kit and fuel.",
              durationMinutes: 20,
            }
          : {
              kind: "easy",
              title: "Pre-race easy",
              description: "Short and very easy to keep the legs ticking over.",
              durationMinutes: 30,
            }
    }
    if (race.priority === "A" && i >= 2 && !slots[i - 2]) {
      slots[i - 2] = restSlot("Rest before race day.")
    }
    const restAfter = race.priority === "A" ? 7 : 1
    for (let d = i + 1; d <= Math.min(6, i + restAfter); d++) {
      if (!slots[d]) slots[d] = restSlot("Post-race rest. Walking is fine.")
    }
  }

  // Recovery after an earlier race: rest for two days post-race, then short recovery runs
  if (info.phase === "recovery" && info.recovery) {
    runDays = Math.max(3, runDays - 1)
    const { race, daysRemaining } = info.recovery
    for (let i = 0; i < 7; i++) {
      if (slots[i]) continue
      const daysSince = daysBetween(race.date, dateOf(i))
      if (daysSince <= 2) slots[i] = restSlot("Post-race rest. Walking is fine.")
      else if (i < daysRemaining)
        slots[i] = {
          kind: "recovery",
          title: "Recovery jog",
          description: "Very easy, flat if possible. Walk breaks are fine; stop if anything hurts.",
          durationMinutes: 30,
        }
    }
  } else if (info.recovery) {
    // Last few recovery days spill into a normal week: keep them easy
    for (let i = 0; i < info.recovery.daysRemaining && i < 7; i++) {
      if (slots[i]) continue
      slots[i] = {
        kind: "recovery",
        title: "Recovery jog",
        description: `Still recovering from ${info.recovery.race.name}. Very easy, or rest if your legs are still sore.`,
        durationMinutes: 30,
      }
    }
  }

  const longDay = clamp(profile.longRunDay, 0, 6)
  const b2bDay = longDay === 6 ? 5 : longDay + 1
  if (longMinutes > 0 && !slots[longDay]) {
    slots[longDay] = longSlot(info, longMinutes, input.isDownWeek)
  }
  if (b2bMinutes > 0 && slots[longDay]?.kind === "long" && !slots[b2bDay]) {
    slots[b2bDay] = {
      kind: "backToBack",
      title: "Back-to-back long run",
      description:
        "Second long day on tired legs. Easy effort, race-like terrain, and practise eating and drinking as you would on race day.",
      durationMinutes: b2bMinutes,
    }
  }

  // Rest days, preferring the day after the long-run block and the day before it
  const anchor = weekRaces.length > 0 ? dayIndex(weekRaces[weekRaces.length - 1].date) : longDay
  const blockEnd = slots[b2bDay]?.kind === "backToBack" ? Math.max(longDay, b2bDay) : anchor
  const isRun = (s: Slot | undefined) => s !== undefined && s.kind !== "rest"
  const free = () => [0, 1, 2, 3, 4, 5, 6].filter((i) => !slots[i])
  const assignedRuns = slots.filter(isRun).length
  let restNeeded = free().length - Math.max(0, runDays - assignedRuns)
  const restOrder = unique([blockEnd + 1, longDay - 1, blockEnd + 3, blockEnd + 2, blockEnd + 4, blockEnd + 5].map(mod7))
  for (const i of restOrder) {
    if (restNeeded <= 0) break
    if (!slots[i]) {
      slots[i] = restSlot("Rest day. Easy walking, mobility or strength work is fine.")
      restNeeded--
    }
  }
  for (const i of free()) {
    if (restNeeded <= 0) break
    slots[i] = restSlot("Rest day. Easy walking, mobility or strength work is fine.")
    restNeeded--
  }

  // Quality sessions on remaining days, kept apart from each other and from the long run
  const qualityOrder = unique([blockEnd + 2, blockEnd + 4, blockEnd + 3, blockEnd + 5, blockEnd + 1].map(mod7))
  const sessions = qualitySessions(info, input.qualityCount, input.isDownWeek, weekRaces.length > 0)
  const qualityMinutes = clamp(round5(totalMinutes * 0.12), 40, 90)
  const isHard = (i: number) => i >= 0 && i <= 6 && slots[i] !== undefined && HARD_KINDS.has(slots[i]!.kind)
  const isQuality = (i: number) => i >= 0 && i <= 6 && slots[i] !== undefined && QUALITY_KINDS.has(slots[i]!.kind)
  const preRace = (i: number) =>
    weekRaces.some((r) => r.priority !== "C" && dayIndex(r.date) - i >= 0 && dayIndex(r.date) - i <= 2)

  for (const strict of [true, false]) {
    for (const i of qualityOrder) {
      if (sessions.length === 0) break
      if (slots[i] || preRace(i) || i === mod7(longDay - 1)) continue
      if (strict ? isHard(i - 1) || isHard(i + 1) : isQuality(i - 1) || isQuality(i + 1)) continue
      const session = sessions.shift()!
      slots[i] = { ...session, durationMinutes: session.kind === "strides" ? 0 : qualityMinutes }
    }
  }

  // Easy running fills whatever volume is left
  const fixedMinutes = sum(slots.map((s) => (s && s.kind !== "race" ? s.durationMinutes : 0)))
  const easyDays = free()
  const remaining = totalMinutes - fixedMinutes
  const stridesDays = [0, 1, 2, 3, 4, 5, 6].filter((i) => slots[i]?.kind === "strides")
  const easyCount = () => easyDays.length + stridesDays.length

  while (easyDays.length > 0 && remaining / easyCount() < 25) {
    // Too little volume to spread usefully: rest instead of junk miles
    const i = easyDays.pop()!
    slots[i] = restSlot("Rest day. Easy walking, mobility or strength work is fine.")
  }
  const easyMinutes = easyCount() > 0 ? Math.max(20, round5(remaining / easyCount())) : 0
  for (const i of easyDays) {
    slots[i] =
      easyMinutes >= 105
        ? {
            kind: "easy",
            title: "Medium-long run",
            description: "Steady aerobic effort on varied terrain. Practise eating on the move.",
            durationMinutes: easyMinutes,
          }
        : {
            kind: "easy",
            title: "Easy run",
            description: "Conversational effort. Hike the steep climbs if that's what you'd do on race day.",
            durationMinutes: easyMinutes,
          }
  }
  for (const i of stridesDays) slots[i]!.durationMinutes = easyMinutes

  // Distance and vert follow duration, with more climbing assigned to hill sessions and long runs
  const vertWeight: Partial<Record<WorkoutKind, number>> = { hills: 1.6, long: 1.3, backToBack: 1.3, easy: 0.8, recovery: 0.3 }
  const trainingMinutes = slots.map((s) => (s && s.kind !== "race" ? s.durationMinutes : 0))
  const totalKm = (sum(trainingMinutes) / 60) * speed
  const weightedMinutes = sum(slots.map((s, i) => trainingMinutes[i] * (s ? (vertWeight[s.kind] ?? 1) : 0)))
  const weekVert = totalKm * input.vertPerKm

  return slots.map((slot, i) => {
    const s = slot ?? restSlot("Rest day.")
    if (s.kind === "race") {
      return { ...s, date: dateOf(i), distanceKm: s.distanceKm ?? null, vertM: s.vertM ?? null }
    }
    if (s.kind === "rest") {
      return { ...s, date: dateOf(i), distanceKm: null, vertM: null }
    }
    const pace = s.kind === "long" || s.kind === "backToBack" ? speed * 0.92 : speed
    const vert = weightedMinutes > 0 ? (weekVert * trainingMinutes[i] * (vertWeight[s.kind] ?? 1)) / weightedMinutes : 0
    return {
      ...s,
      date: dateOf(i),
      distanceKm: Math.round((s.durationMinutes / 60) * pace * 10) / 10,
      vertM: Math.round(vert / 10) * 10,
    }
  })
}

function longSlot(info: PhaseInfo, minutes: number, isDownWeek: boolean): Slot {
  const race = info.targetRace
  if (info.phase === "taper") {
    return {
      kind: "long",
      title: "Taper long run",
      description: "Shorter long run at easy effort. Rehearse race kit, fuelling and pacing one last time.",
      durationMinutes: minutes,
    }
  }
  if (info.phase === "peak" && race) {
    return {
      kind: "long",
      title: "Race-specific long run",
      description:
        `On terrain like ${race.name}'s, at goal race effort. Use race-day kit and practise fuelling every 30–40 minutes.` +
        (race.elevationGainM ? " Include sustained climbs and descents." : ""),
      durationMinutes: minutes,
    }
  }
  return {
    kind: "long",
    title: isDownWeek ? "Easy long run" : "Long run",
    description: "Easy, conversational effort. Time on feet matters more than pace; hike the steep climbs.",
    durationMinutes: minutes,
  }
}

function qualitySessions(info: PhaseInfo, count: number, isDownWeek: boolean, raceWeek: boolean): Slot[] {
  if (count <= 0) return []
  const strides: Slot = {
    kind: "strides",
    title: "Easy + strides",
    description: "Easy run finishing with 6 × 20s relaxed fast strides on flat ground, full recovery.",
    durationMinutes: 0,
  }
  if (isDownWeek) return [strides]

  const library: Record<Phase, Slot[]> = {
    base: [
      {
        kind: "hills",
        title: "Hill sprints",
        description: "Easy run with 8 × 15–20s steep hill sprints, walk back down for full recovery. Builds strength cheaply.",
        durationMinutes: 0,
      },
    ],
    build: [
      {
        kind: "hills",
        title: "Hill repeats",
        description:
          "Warm up 15 min, then 6–10 × 3–4 min uphill at hard but controlled effort, jog or walk down. Power-hike the steepest pitches.",
        durationMinutes: 0,
      },
      {
        kind: "tempo",
        title: "Steady tempo",
        description: "Warm up 15 min, then 2–3 × 12–15 min at comfortably hard effort with 3 min easy between.",
        durationMinutes: 0,
      },
    ],
    peak: [
      {
        kind: "tempo",
        title: "Race-effort climbing",
        description:
          "45–60 min continuous at goal race effort on terrain like the race, practising fuelling as you go.",
        durationMinutes: 0,
      },
      {
        kind: "hills",
        title: "Vert session",
        description: "Repeated sustained climbs (10–20 min each) at steady effort, practising efficient descending.",
        durationMinutes: 0,
      },
    ],
    taper: [
      {
        kind: "intervals",
        title: "Sharpener",
        description: "Warm up, then 5 × 2 min at tempo effort with 2 min easy. Short and sharp, not a fitness session.",
        durationMinutes: 0,
      },
    ],
    race: [],
    recovery: [],
  }
  const sessions = raceWeek ? [strides] : library[info.phase]
  return sessions.slice(0, count).map((s) => ({ ...s }))
}

function raceSlot(race: Race, speed: number): Slot {
  // Rough finishing-time estimate: slower than training pace, plus an hour per 1000 m climbed
  const minutes = (race.distanceKm / (speed * 0.85)) * 60 + ((race.elevationGainM ?? 0) / 1000) * 60
  const label = race.priority === "A" ? "Goal race" : race.priority === "B" ? "Tune-up race" : "Training race"
  return {
    kind: "race",
    title: `${label}: ${race.name}`,
    description:
      race.priority === "A"
        ? "Start conservatively, eat early and often, and run your own race."
        : race.priority === "B"
          ? "Race it, but rehearse goal-race pacing and fuelling rather than emptying the tank."
          : "Treat as a supported long run at controlled effort.",
    durationMinutes: round5(minutes),
    distanceKm: race.distanceKm,
    vertM: race.elevationGainM ?? undefined,
  }
}

function restSlot(description: string): Slot {
  return { kind: "rest", title: "Rest", description, durationMinutes: 0 }
}

function averageSpeed(weeks: WeekSummary[]): number {
  const hours = sum(weeks.map((w) => w.hours))
  const km = sum(weeks.map((w) => w.km))
  return hours >= 2 ? km / hours : DEFAULT_SPEED_KMH
}

export function formatDate(iso: ISODate): string {
  const d = fromISODate(iso)
  return `${DAY_NAMES[dayIndex(iso)].slice(0, 3)} ${d.getUTCDate()} ${d.toLocaleString("en-AU", { month: "short", timeZone: "UTC" })}`
}

function fmtHours(hours: number) {
  return `${(Math.round(hours * 10) / 10).toString()}h`
}

function pct(fraction: number) {
  return `${Math.round(fraction * 100)}%`
}

function capitalise(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function mod7(value: number) {
  return ((value % 7) + 7) % 7
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)]
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function round5(value: number) {
  return Math.round(value / 5) * 5
}

function sum(values: number[]) {
  return values.reduce((a, b) => a + b, 0)
}

function mean(values: number[]) {
  return values.length ? sum(values) / values.length : 0
}
