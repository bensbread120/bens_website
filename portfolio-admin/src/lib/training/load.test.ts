import { describe, expect, it } from "vitest"
import { addDays } from "./dates"
import { computeTrainingLoad, fitnessSeries, formStatus, isOnFeet, isRun } from "./load"
import { weeklySummaries } from "./weekly"

const profile = { maxHr: 190, restingHr: 50, trimpFactor: 1.92 }

describe("training load", () => {
  it("uses heart rate when the profile is known", () => {
    const easy = computeTrainingLoad({ type: "Run", movingTime: 3600, averageHeartrate: 140 }, profile)
    const hard = computeTrainingLoad({ type: "Run", movingTime: 3600, averageHeartrate: 170 }, profile)
    expect(easy).toBeGreaterThan(60)
    expect(easy).toBeLessThan(120)
    expect(hard).toBeGreaterThan(easy * 1.5)
  })

  it("falls back to a duration estimate without heart rate", () => {
    const run = computeTrainingLoad({ type: "Run", movingTime: 3600, averageHeartrate: null }, profile)
    const hike = computeTrainingLoad({ type: "Hike", movingTime: 3600, averageHeartrate: null }, profile)
    expect(run).toBeGreaterThan(70)
    expect(hike).toBeLessThan(run)
  })

  it("prefers sport type over the coarse type", () => {
    expect(isRun({ type: "Run", sportType: "TrailRun" })).toBe(true)
    expect(isRun({ type: "Walk", sportType: "Hike" })).toBe(false)
    expect(isOnFeet({ type: "Walk", sportType: "Hike" })).toBe(true)
    expect(isOnFeet({ type: "Ride", sportType: "MountainBikeRide" })).toBe(false)
  })
})

describe("fitness series", () => {
  it("converges on a constant daily load", () => {
    const loads = new Map<string, number>()
    for (let i = 0; i < 300; i++) loads.set(addDays("2026-01-01", i), 100)
    const series = fitnessSeries(loads, "2026-01-01", addDays("2026-01-01", 299))
    const last = series.at(-1)!
    expect(last.ctl).toBeGreaterThan(99)
    expect(last.atl).toBeGreaterThan(99)
    expect(Math.abs(last.tsb)).toBeLessThan(1)
  })

  it("shows negative form after a load spike and recovery after rest", () => {
    const loads = new Map<string, number>()
    for (let i = 0; i < 60; i++) loads.set(addDays("2026-01-01", i), 50)
    for (let i = 60; i < 67; i++) loads.set(addDays("2026-01-01", i), 200)
    const series = fitnessSeries(loads, "2026-01-01", addDays("2026-01-01", 80))
    expect(series[67].tsb).toBeLessThan(-30)
    expect(series[80].tsb).toBeGreaterThan(series[67].tsb)
  })

  it("computes form from the previous day", () => {
    const loads = new Map([["2026-01-01", 100]])
    const series = fitnessSeries(loads, "2026-01-01", "2026-01-02")
    expect(series[0].tsb).toBe(0)
    expect(series[1].tsb).toBeLessThan(0)
  })

  it("labels form", () => {
    expect(formStatus(15)).toBe("fresh")
    expect(formStatus(0)).toBe("neutral")
    expect(formStatus(-20)).toBe("productive")
    expect(formStatus(-40)).toBe("overreaching")
  })
})

describe("weekly summaries", () => {
  it("fills empty weeks and counts only time on feet as volume", () => {
    const activities = [
      { localDate: "2026-10-12", type: "Run", sportType: "TrailRun", distance: 20000, movingTime: 7200, elevation: 800, trainingLoad: 150 },
      { localDate: "2026-10-14", type: "Ride", sportType: "Ride", distance: 40000, movingTime: 5400, elevation: 300, trainingLoad: 90 },
      { localDate: "2026-10-18", type: "Walk", sportType: "Hike", distance: 10000, movingTime: 10800, elevation: 1000, trainingLoad: 80 },
    ]
    const weeks = weeklySummaries(activities, "2026-10-05", "2026-10-19")
    expect(weeks.map((w) => w.weekStart)).toEqual(["2026-10-05", "2026-10-12", "2026-10-19"])
    expect(weeks[0].hours).toBe(0)
    expect(weeks[1]).toMatchObject({ hours: 5, km: 30, vertM: 1800, longestMinutes: 180, sessions: 2, load: 320 })
  })
})
