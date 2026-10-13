"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/session"
import { writeCoachNotes } from "@/lib/coach"
import { importStravaHistory, recomputeTrainingLoads, syncStravaActivities } from "@/lib/stravaSync"
import { fromISODate } from "@/lib/training/dates"
import { ensurePlans, generatePlan, regenerateUpcomingPlans } from "@/lib/training/service"

export type ActionResult = { ok: boolean; message: string } | null

async function run(action: () => Promise<string>): Promise<ActionResult> {
  try {
    await requireAdmin()
    const message = await action()
    revalidatePath("/training", "layout")
    return { ok: true, message }
  } catch (error) {
    console.error(error)
    return { ok: false, message: error instanceof Error ? error.message : "Something went wrong" }
  }
}

const optionalNumber = z.preprocess((v) => (v === "" || v === null ? null : v), z.coerce.number().nullable())
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a date")

const raceSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  date: isoDate,
  distanceKm: z.coerce.number().positive("Distance must be positive").max(1000),
  elevationGainM: optionalNumber.pipe(z.number().min(0).max(30000).nullable()),
  priority: z.enum(["A", "B", "C"]),
  notes: z.string().trim().max(2000).optional().transform((v) => v || null),
})

export async function saveRace(_: ActionResult, formData: FormData): Promise<ActionResult> {
  return run(async () => {
    const parsed = raceSchema.safeParse(Object.fromEntries(formData))
    if (!parsed.success) throw new Error(parsed.error.issues[0].message)
    const { date, ...rest } = parsed.data
    const id = formData.get("id")?.toString()

    if (id) await db.raceEvent.update({ where: { id }, data: { ...rest, date: fromISODate(date) } })
    else await db.raceEvent.create({ data: { ...rest, date: fromISODate(date) } })

    await regenerateUpcomingPlans()
    return id ? "Race updated, plan regenerated" : "Race added, plan regenerated"
  })
}

export async function deleteRace(_: ActionResult, formData: FormData): Promise<ActionResult> {
  return run(async () => {
    await db.raceEvent.delete({ where: { id: String(formData.get("id")) } })
    await regenerateUpcomingPlans()
    return "Race removed, plan regenerated"
  })
}

const profileSchema = z.object({
  maxHr: optionalNumber.pipe(z.number().int().min(100).max(230).nullable()),
  restingHr: optionalNumber.pipe(z.number().int().min(25).max(100).nullable()),
  trimpFactor: z.coerce.number().refine((v) => v === 1.92 || v === 1.67),
  runDaysPerWeek: z.coerce.number().int().min(3).max(7),
  longRunDay: z.coerce.number().int().min(0).max(6),
  backToBack: z.preprocess((v) => v === "on", z.boolean()),
  maxWeeklyHours: optionalNumber.pipe(z.number().min(1).max(40).nullable()),
  timezone: z
    .string()
    .trim()
    .transform((v) => v || null)
    .refine((v) => {
      if (!v) return true
      try {
        new Intl.DateTimeFormat("en-CA", { timeZone: v })
        return true
      } catch {
        return false
      }
    }, "Unknown timezone, use a name like Australia/Melbourne"),
  coachNotes: z.string().trim().max(4000).transform((v) => v || null),
})

export async function saveProfile(_: ActionResult, formData: FormData): Promise<ActionResult> {
  return run(async () => {
    const parsed = profileSchema.safeParse({ ...Object.fromEntries(formData), backToBack: formData.get("backToBack") })
    if (!parsed.success) throw new Error(parsed.error.issues[0].message)

    const before = await db.athleteProfile.findUnique({ where: { id: 1 } })
    await db.athleteProfile.upsert({ where: { id: 1 }, create: { id: 1, ...parsed.data }, update: parsed.data })

    const hrChanged =
      before?.maxHr !== parsed.data.maxHr ||
      before?.restingHr !== parsed.data.restingHr ||
      (before?.trimpFactor ?? 1.92) !== parsed.data.trimpFactor
    const count = hrChanged ? await recomputeTrainingLoads() : 0
    await regenerateUpcomingPlans()
    return hrChanged ? `Saved. Training load recalculated for ${count} activities.` : "Saved, plan regenerated"
  })
}

export async function syncNow(): Promise<ActionResult> {
  return run(async () => {
    const { checked, created } = await syncStravaActivities()
    await ensurePlans()
    return `Checked ${checked} recent activities, ${created} new`
  })
}

export async function importHistory(_: ActionResult, formData: FormData): Promise<ActionResult> {
  return run(async () => {
    const months = z.coerce.number().int().min(1).max(36).parse(formData.get("months"))
    const { created, updated } = await importStravaHistory(months)
    await ensurePlans()
    return `Imported ${created} new and refreshed ${updated} existing activities`
  })
}

export async function regeneratePlan(_: ActionResult, formData: FormData): Promise<ActionResult> {
  return run(async () => {
    await generatePlan(isoDate.parse(formData.get("weekStart")))
    return "Plan regenerated"
  })
}

export async function generateCoachNotes(_: ActionResult, formData: FormData): Promise<ActionResult> {
  return run(async () => {
    await writeCoachNotes(String(formData.get("planWeekId")))
    return "Coach notes updated"
  })
}
