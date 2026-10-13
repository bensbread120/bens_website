// Optional AI coaching notes. The rule-based planner owns the plan; this only adds commentary,
// and everything works without ANTHROPIC_API_KEY.

import Anthropic from "@anthropic-ai/sdk"
import { db } from "@/lib/db"
import { addDays, toISODate, weekStartOf } from "@/lib/training/dates"
import { formStatus } from "@/lib/training/load"
import { fitnessThrough, getRaces, loadTrainingContext } from "@/lib/training/service"
import { weeklySummaries } from "@/lib/training/weekly"

export function coachEnabled() {
  return Boolean(process.env.ANTHROPIC_API_KEY)
}

const SYSTEM_PROMPT = `You are an experienced ultramarathon coach reviewing a training week for one athlete.

The week's plan was produced by a deterministic rule-based planner (periodisation, progressive volume, down weeks, tapers, fatigue guards). Your role is commentary, not replanning:
- Explain in plain language what this week is for and how it fits the road to the target race.
- Give practical cues for the key sessions (effort, terrain, power-hiking, descending, fuelling and kit rehearsal).
- Point out anything in the data that deserves attention (missed volume, fatigue, big jumps, long gaps), and suggest a specific adjustment if one is warranted. The athlete decides whether to act on it.
- Only use facts present in the data provided. Don't invent paces, heart rates or history.

Write at most 250 words. Plain text, short paragraphs, "- " bullets where helpful, no headings.`

export async function writeCoachNotes(planWeekId: string): Promise<string> {
  if (!coachEnabled()) throw new Error("AI coach is not configured (ANTHROPIC_API_KEY is not set)")

  const week = await db.planWeek.findUniqueOrThrow({
    where: { id: planWeekId },
    include: { workouts: { orderBy: { date: "asc" } } },
  })
  const weekStart = toISODate(week.weekStart)
  const context = await loadTrainingContext()
  const before = context.activities.filter((a) => a.localDate < weekStart)
  const history = weeklySummaries(before, addDays(weekStart, -8 * 7), addDays(weekStart, -7))
  const fitness = fitnessThrough({ ...context, activities: before }, addDays(weekStart, -1)).at(-1)
  const races = (await getRaces()).filter((r) => r.date >= addDays(weekStart, -28))
  const thisWeek = context.activities.filter((a) => weekStartOf(a.localDate) === weekStart)

  // Weekly aggregates only, not raw Strava streams
  const data = {
    today: context.today,
    weekStart,
    plan: {
      phase: week.phase,
      isDownWeek: week.isDownWeek,
      targetHours: week.targetHours,
      targetDistanceKm: week.targetDistanceKm,
      targetVertM: week.targetVertM,
      plannerReasoning: week.rationale,
      workouts: week.workouts.map((w) => ({
        date: toISODate(w.date),
        kind: w.kind,
        title: w.title,
        minutes: w.durationMinutes,
        km: w.distanceKm,
        vertM: w.vertM,
      })),
    },
    completedSoFarThisWeek: thisWeek.map((a) => ({
      date: a.localDate,
      type: a.sportType ?? a.type,
      minutes: Math.round(a.movingTime / 60),
      km: Math.round(a.distance / 100) / 10,
      vertM: Math.round(a.elevation ?? 0),
    })),
    previousWeeks: history.map((w) => ({
      weekStart: w.weekStart,
      hoursOnFeet: w.hours,
      km: w.km,
      vertM: w.vertM,
      longestRunMinutes: w.longestMinutes,
    })),
    fitnessGoingIntoWeek: fitness
      ? { fitnessCTL: fitness.ctl, fatigueATL: fitness.atl, form: Math.round(fitness.ctl - fitness.atl), formStatus: formStatus(fitness.ctl - fitness.atl) }
      : null,
    races,
    athleteNotes: context.profile.coachNotes,
  }

  const client = new Anthropic()
  const response = await client.beta.messages.create({
    model: "claude-opus-5-5",
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    output_config: { effort: "medium" },
    // Retry on another model if a safety classifier declines
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Training data (JSON):\n${JSON.stringify(data, null, 2)}\n\nWrite this week's coaching notes.`,
      },
    ],
  })

  if (response.stop_reason === "refusal") {
    throw new Error("The AI coach declined to write notes for this week")
  }

  const notes = response.content
    .flatMap((block) => (block.type === "text" ? [block.text] : []))
    .join("\n")
    .trim()
  if (!notes) throw new Error("The AI coach returned no notes")

  await db.planWeek.update({ where: { id: planWeekId }, data: { aiNotes: notes, aiNotesAt: new Date() } })
  return notes
}
