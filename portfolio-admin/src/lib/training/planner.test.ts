import { describe, expect, it } from "vitest"
import { addDays, dayIndex } from "./dates"
import {
  longRunCapMinutes,
  phaseForWeek,
  planWeek,
  recoveryDaysAfter,
  seasonOutline,
  taperWeeksFor,
  type PlannerInput,
  type Race,
  type WeekPlan,
} from "./planner"
import type { WeekSummary } from "./weekly"

const ULTRA: Race = {
  id: "ultra",
  name: "Mountain 100",
  date: "2027-03-14", // Sunday
  distanceKm: 100,
  elevationGainM: 5000,
  priority: "A",
}

// Weekly hours, oldest first, ending the week before weekStart
function history(weekStart: string, hours: number[], vertPerKm = 20): WeekSummary[] {
  return hours.map((h, i) => ({
    weekStart: addDays(weekStart, (i - hours.length) * 7),
    hours: h,
    km: h * 9,
    vertM: h * 9 * vertPerKm,
    longestMinutes: h * 60 * 0.3,
    sessions: 5,
    load: h * 80,
  }))
}

function input(overrides: Partial<PlannerInput> & { weekStart: string }): PlannerInput {
  return {
    history: history(overrides.weekStart, [8, 8, 8, 8, 8, 8, 8, 8]),
    recentPlans: [],
    fitness: { ctl: 60, atl: 65, tsb: -5 },
    races: [ULTRA],
    profile: { runDaysPerWeek: 5, longRunDay: 5, backToBack: true, maxWeeklyHours: null },
    ...overrides,
  }
}

function kinds(plan: WeekPlan) {
  return plan.workouts.map((w) => w.kind)
}

function trainingMinutes(plan: WeekPlan) {
  return plan.workouts.filter((w) => w.kind !== "race").reduce((a, w) => a + w.durationMinutes, 0)
}

describe("race helpers", () => {
  it("scales taper length with distance", () => {
    expect(taperWeeksFor(21)).toBe(1)
    expect(taperWeeksFor(50)).toBe(2)
    expect(taperWeeksFor(100)).toBe(3)
    expect(taperWeeksFor(160)).toBe(3)
  })

  it("caps long runs relative to the race", () => {
    expect(longRunCapMinutes(null)).toBe(150)
    expect(longRunCapMinutes(50)).toBeLessThan(longRunCapMinutes(100))
    expect(longRunCapMinutes(160)).toBe(330)
  })

  it("needs more recovery for longer, hillier A races", () => {
    expect(recoveryDaysAfter(ULTRA)).toBe(15)
    expect(recoveryDaysAfter({ ...ULTRA, distanceKm: 50, elevationGainM: 0 })).toBe(5)
    expect(recoveryDaysAfter({ ...ULTRA, priority: "B" })).toBe(5)
    expect(recoveryDaysAfter({ ...ULTRA, priority: "C" })).toBe(1)
  })
})

describe("phaseForWeek", () => {
  it("periodises backwards from the A race", () => {
    expect(phaseForWeek("2027-03-08", [ULTRA])).toMatchObject({ phase: "race", weeksToRace: 0, taperIndex: 2 })
    expect(phaseForWeek("2027-03-01", [ULTRA])).toMatchObject({ phase: "taper", weeksToRace: 1, taperIndex: 1 })
    expect(phaseForWeek("2027-02-22", [ULTRA])).toMatchObject({ phase: "taper", weeksToRace: 2, taperIndex: 0 })
    expect(phaseForWeek("2027-02-15", [ULTRA]).phase).toBe("peak")
    expect(phaseForWeek("2027-02-01", [ULTRA]).phase).toBe("peak")
    expect(phaseForWeek("2027-01-25", [ULTRA]).phase).toBe("build")
    // 8 build weeks: 13 weeks out is the first, 14 weeks out is still base
    expect(phaseForWeek("2026-12-07", [ULTRA])).toMatchObject({ phase: "build", weeksToRace: 13 })
    expect(phaseForWeek("2026-11-30", [ULTRA])).toMatchObject({ phase: "base", weeksToRace: 14 })
  })

  it("never schedules a down week inside the peak block", () => {
    const outline = seasonOutline("2026-10-12", [ULTRA], 22)
    const downWeeks = outline.filter((w) => w.scheduledDownWeek)
    expect(downWeeks.length).toBeGreaterThanOrEqual(4)
    expect(downWeeks.every((w) => w.phase === "build" || w.phase === "base")).toBe(true)
    // The week before peak starts is a down week
    expect(phaseForWeek("2027-01-25", [ULTRA]).scheduledDownWeek).toBe(true)
  })

  it("enters recovery after an A race", () => {
    const after = phaseForWeek("2027-03-15", [ULTRA])
    expect(after.phase).toBe("recovery")
    expect(after.recovery?.daysRemaining).toBe(15)
    expect(phaseForWeek("2027-03-22", [ULTRA])).toMatchObject({ phase: "recovery", recovery: { daysRemaining: 8 } })
    expect(phaseForWeek("2027-04-05", [ULTRA]).phase).toBe("base")
  })

  it("keeps the phase when only a few recovery days spill into the week", () => {
    const tuneUp: Race = { id: "b", name: "Trail 50", date: "2026-12-12", distanceKm: 50, elevationGainM: 2000, priority: "B" }
    const info = phaseForWeek("2026-12-14", [ULTRA, tuneUp])
    expect(info.phase).toBe("build")
    expect(info.recovery?.daysRemaining).toBe(2)
    // A race: 15 days of recovery, leaving 1 day in the third week
    expect(phaseForWeek("2027-03-29", [ULTRA]).phase).toBe("base")
  })

  it("plans general base without an A race", () => {
    const info = phaseForWeek("2026-10-12", [{ ...ULTRA, priority: "B" }])
    expect(info.phase).toBe("base")
    expect(info.targetRace).toBeNull()
  })
})

describe("planWeek", () => {
  const buildWeek = "2026-12-07"

  it("lays out a full week with the requested number of run days", () => {
    const plan = planWeek(input({ weekStart: buildWeek }))
    expect(plan.workouts).toHaveLength(7)
    expect(plan.workouts.map((w) => w.date)).toEqual([0, 1, 2, 3, 4, 5, 6].map((i) => addDays(buildWeek, i)))
    expect(plan.workouts.filter((w) => w.kind !== "rest")).toHaveLength(5)
  })

  it("puts the long run on the chosen day with a back-to-back for ultras", () => {
    const plan = planWeek(input({ weekStart: buildWeek }))
    expect(plan.phase).toBe("build")
    expect(plan.workouts[5].kind).toBe("long")
    expect(plan.workouts[6].kind).toBe("backToBack")
    expect(plan.workouts[6].durationMinutes).toBeLessThan(plan.workouts[5].durationMinutes)
  })

  it("skips back-to-backs for short races", () => {
    const half: Race = { ...ULTRA, distanceKm: 21, elevationGainM: null }
    const plan = planWeek(input({ weekStart: buildWeek, races: [half] }))
    expect(kinds(plan)).not.toContain("backToBack")
  })

  it("keeps hard sessions apart", () => {
    const hard = new Set(["long", "backToBack", "hills", "tempo", "intervals"])
    for (const week of ["2026-11-09", buildWeek, "2027-02-08"]) {
      const plan = planWeek(input({ weekStart: week, profile: { runDaysPerWeek: 6, longRunDay: 5, backToBack: true, maxWeeklyHours: null } }))
      const k = kinds(plan)
      for (let i = 1; i < 7; i++) {
        const pair = [k[i - 1], k[i]]
        const bothHard = hard.has(pair[0]) && hard.has(pair[1])
        const isWeekendBlock = pair[0] === "long" && pair[1] === "backToBack"
        expect(bothHard && !isWeekendBlock, `${week}: ${k.join(",")}`).toBe(false)
      }
    }
  })

  it("schedules two quality sessions in build", () => {
    const plan = planWeek(input({ weekStart: buildWeek }))
    expect(kinds(plan).filter((k) => k === "hills" || k === "tempo")).toHaveLength(2)
  })

  it("matches the weekly volume target", () => {
    for (const week of ["2026-11-09", buildWeek, "2027-02-08", "2027-02-22"]) {
      const plan = planWeek(input({ weekStart: week }))
      const minutes = trainingMinutes(plan)
      expect(Math.abs(minutes - plan.targetHours * 60) / (plan.targetHours * 60), `${week}`).toBeLessThan(0.12)
    }
  })

  it("progresses from last week's target when it was completed", () => {
    const plan = planWeek(
      input({
        weekStart: buildWeek,
        history: history(buildWeek, [7, 7, 7, 8]),
        recentPlans: [{ weekStart: addDays(buildWeek, -7), phase: "build", targetHours: 8, isDownWeek: false }],
      })
    )
    expect(plan.targetHours).toBeGreaterThan(8)
    expect(plan.targetHours).toBeLessThanOrEqual(9)
  })

  it("restarts from actual volume when last week was missed", () => {
    const plan = planWeek(
      input({
        weekStart: buildWeek,
        history: history(buildWeek, [5, 5, 5, 4]),
        recentPlans: [{ weekStart: addDays(buildWeek, -7), phase: "build", targetHours: 10, isDownWeek: false }],
      })
    )
    expect(plan.targetHours).toBeLessThan(7)
    expect(plan.rationale.join(" ")).toMatch(/restarts/)
  })

  it("assumes an unfinished previous week goes to plan when planning ahead", () => {
    // Planning next week mid-week: history stops before last week, which is still in progress
    const plan = planWeek(
      input({
        weekStart: buildWeek,
        history: history(addDays(buildWeek, -7), [7, 7, 7, 7]),
        recentPlans: [{ weekStart: addDays(buildWeek, -7), phase: "build", targetHours: 8, isDownWeek: false }],
      })
    )
    expect(plan.targetHours).toBeGreaterThan(8)
    expect(plan.rationale.join(" ")).toMatch(/assumption/)
  })

  it("ignores plans from more than two weeks ago", () => {
    const plan = planWeek(
      input({
        weekStart: buildWeek,
        history: history(buildWeek, [6, 6, 6, 6]),
        recentPlans: [{ weekStart: addDays(buildWeek, -49), phase: "base", targetHours: 1, isDownWeek: false }],
      })
    )
    expect(plan.targetHours).toBeGreaterThanOrEqual(6)
    expect(plan.rationale.join(" ")).toMatch(/4-week average/)
  })

  it("turns a week into a down week when form is very negative", () => {
    const plan = planWeek(input({ weekStart: buildWeek, fitness: { ctl: 60, atl: 100, tsb: -40 } }))
    expect(plan.isDownWeek).toBe(true)
    expect(kinds(plan)).not.toContain("hills")
    expect(kinds(plan)).not.toContain("tempo")
    expect(plan.targetHours).toBeLessThan(8)
  })

  it("holds volume when acute load spikes", () => {
    const plan = planWeek(input({ weekStart: buildWeek, fitness: { ctl: 40, atl: 65, tsb: -20 } }))
    expect(plan.targetHours).toBe(8)
  })

  it("respects the weekly hours cap", () => {
    const plan = planWeek(
      input({ weekStart: buildWeek, history: history(buildWeek, [12, 12, 12, 12]), profile: { runDaysPerWeek: 5, longRunDay: 5, backToBack: true, maxWeeklyHours: 10 } })
    )
    expect(plan.targetHours).toBe(10)
  })

  it("tapers volume through the final weeks", () => {
    const peakPlans = (weekStart: string) => [
      { weekStart: addDays(weekStart, -7), phase: "peak" as const, targetHours: 12, isDownWeek: false },
    ]
    const taper1 = planWeek(input({ weekStart: "2027-02-22", history: history("2027-02-22", [12, 12, 12, 12]), recentPlans: peakPlans("2027-02-22") }))
    const taper2 = planWeek(
      input({
        weekStart: "2027-03-01",
        history: history("2027-03-01", [12, 12, 12, 9]),
        recentPlans: [{ weekStart: "2027-02-22", phase: "taper", targetHours: 9, isDownWeek: false }, ...peakPlans("2027-02-22")],
      })
    )
    expect(taper1.targetHours).toBe(9)
    expect(taper2.targetHours).toBeLessThan(taper1.targetHours)
  })

  it("builds race week around the race", () => {
    const plan = planWeek(input({ weekStart: "2027-03-08", history: history("2027-03-08", [12, 12, 9, 6.5]) }))
    expect(plan.phase).toBe("race")
    const raceDay = dayIndex(ULTRA.date)
    expect(plan.workouts[raceDay]).toMatchObject({ kind: "race", distanceKm: 100, vertM: 5000 })
    expect(plan.workouts[raceDay - 1].kind).toBe("shakeout")
    expect(plan.workouts[raceDay - 2].kind).toBe("rest")
    expect(kinds(plan)).not.toContain("long")
    expect(kinds(plan)).not.toContain("hills")
    expect(kinds(plan)).toContain("strides")
    expect(plan.targetHours).toBeLessThan(5)
  })

  it("only plans easy running while recovering", () => {
    const plan = planWeek(input({ weekStart: "2027-03-15", history: history("2027-03-15", [12, 9, 6.5, 14]) }))
    expect(plan.phase).toBe("recovery")
    expect(new Set(kinds(plan))).toEqual(new Set(["rest", "recovery"]))
    expect(plan.workouts[0].kind).toBe("rest")
  })

  it("mini-tapers for a B race and lets it replace the long run", () => {
    const tuneUp: Race = { id: "b", name: "Trail 50", date: "2026-12-12", distanceKm: 50, elevationGainM: 2000, priority: "B" }
    const plan = planWeek(
      input({
        weekStart: buildWeek,
        races: [ULTRA, tuneUp],
        recentPlans: [{ weekStart: addDays(buildWeek, -7), phase: "build", targetHours: 8, isDownWeek: false }],
      })
    )
    expect(plan.workouts[5].kind).toBe("race")
    expect(kinds(plan)).not.toContain("long")
    expect(plan.targetHours).toBeLessThanOrEqual(6)
    // Nothing hard in the two days before the race
    expect(["hills", "tempo", "intervals"]).not.toContain(plan.workouts[3].kind)
    expect(["hills", "tempo", "intervals"]).not.toContain(plan.workouts[4].kind)
  })

  it("starts a normal week easy after a B race", () => {
    const tuneUp: Race = { id: "b", name: "Trail 50", date: "2026-12-12", distanceKm: 50, elevationGainM: 2000, priority: "B" }
    const plan = planWeek(input({ weekStart: "2026-12-14", races: [ULTRA, tuneUp] }))
    expect(plan.phase).toBe("build")
    expect(kinds(plan).slice(0, 2)).toEqual(["recovery", "recovery"])
    expect(["hills", "tempo"]).not.toContain(plan.workouts[2].kind)
    expect(kinds(plan)).toContain("long")
  })

  it("starts conservatively with no history", () => {
    const plan = planWeek(input({ weekStart: "2026-10-12", history: [], races: [] }))
    expect(plan.targetHours).toBeLessThanOrEqual(3.25)
    expect(plan.workouts.filter((w) => w.kind !== "rest").length).toBeGreaterThanOrEqual(3)
  })

  it("increases climbing toward a mountainous race", () => {
    const base = planWeek(input({ weekStart: "2026-11-09" }))
    const peak = planWeek(input({ weekStart: "2027-02-08" }))
    expect(peak.targetVertM / peak.targetDistanceKm).toBeGreaterThan(base.targetVertM / base.targetDistanceKm)
  })
})
