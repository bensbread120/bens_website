import { describe, expect, it } from "vitest"
import { activityLocalDate, addDays, dayIndex, daysBetween, parseStravaTimezone, todayInZone, weekStartOf } from "./dates"

describe("dates", () => {
  it("indexes days from Monday", () => {
    expect(dayIndex("2026-10-12")).toBe(0)
    expect(dayIndex("2026-10-18")).toBe(6)
  })

  it("finds the Monday of a week", () => {
    expect(weekStartOf("2026-10-18")).toBe("2026-10-12")
    expect(weekStartOf("2026-10-12")).toBe("2026-10-12")
    expect(weekStartOf("2026-10-19")).toBe("2026-10-19")
  })

  it("adds days across month and year boundaries", () => {
    expect(addDays("2026-12-30", 3)).toBe("2027-01-02")
    expect(daysBetween("2026-12-30", "2027-01-02")).toBe(3)
  })

  it("parses Strava's timezone format", () => {
    expect(parseStravaTimezone("(GMT+10:00) Australia/Brisbane")).toBe("Australia/Brisbane")
    expect(parseStravaTimezone("(GMT+00:00) Not/AZone")).toBeNull()
    expect(parseStravaTimezone(null)).toBeNull()
  })

  it("gets today's date in a timezone", () => {
    // 22:00 UTC on the 12th is the morning of the 13th in Brisbane (UTC+10)
    const now = new Date("2026-10-12T22:00:00Z")
    expect(todayInZone("Australia/Brisbane", now)).toBe("2026-10-13")
    expect(todayInZone("UTC", now)).toBe("2026-10-12")
  })

  it("buckets activities by local start date", () => {
    // A 6am Monday run in Brisbane starts on Sunday in UTC
    const activity = { startDate: new Date("2026-10-11T20:00:00Z"), startDateLocal: new Date("2026-10-12T06:00:00Z") }
    expect(activityLocalDate(activity, "UTC")).toBe("2026-10-12")
    expect(activityLocalDate({ ...activity, startDateLocal: null }, "Australia/Brisbane")).toBe("2026-10-12")
  })
})
