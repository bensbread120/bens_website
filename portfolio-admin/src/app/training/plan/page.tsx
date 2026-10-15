import Link from "next/link"
import { generateCoachNotes, regeneratePlan } from "@/actions/training"
import ActionForm from "@/components/ActionForm"
import { Card } from "@/components/Card"
import { coachEnabled } from "@/lib/coach"
import { db } from "@/lib/db"
import { requireAdminPage } from "@/lib/session"
import { addDays, DAY_NAMES, fromISODate, toISODate, weekStartOf, type ISODate } from "@/lib/training/dates"
import {
  FORM_LABELS,
  KIND_STYLES,
  PHASE_LABELS,
  PHASE_STYLES,
  fmtDuration,
  fmtHours,
  fmtKm,
  fmtVert,
  longDate,
  shortDate,
} from "@/lib/training/format"
import { formStatus, isOnFeet } from "@/lib/training/load"
import { seasonOutline, type Phase, type WorkoutKind } from "@/lib/training/planner"
import { fitnessThrough, getRaces, loadTrainingContext } from "@/lib/training/service"

// Generating coach notes calls the Claude API
export const maxDuration = 60

type Props = {
  searchParams: Promise<{ week?: string }>
}

export default async function PlanPage({ searchParams }: Props) {
  await requireAdminPage()
  const context = await loadTrainingContext()
  const { today } = context
  const thisWeek = weekStartOf(today)

  const { week: weekParam } = await searchParams
  const weekStart = weekParam && /^\d{4}-\d{2}-\d{2}$/.test(weekParam) ? weekStartOf(weekParam) : thisWeek
  const plan = await db.planWeek.findUnique({
    where: { weekStart: fromISODate(weekStart) },
    include: { workouts: { orderBy: { date: "asc" } } },
  })
  const races = await getRaces()
  const actuals = context.activities.filter((a) => weekStartOf(a.localDate) === weekStart)
  const latest = fitnessThrough(context, today).at(-1)
  const form = latest ? FORM_LABELS[formStatus(latest.tsb)] : null

  const actualOnFeet = actuals.filter(isOnFeet)
  const actualHours = actualOnFeet.reduce((a, x) => a + x.movingTime / 3600, 0)
  const actualKm = actualOnFeet.reduce((a, x) => a + x.distance / 1000, 0)
  const actualVert = actualOnFeet.reduce((a, x) => a + (x.elevation ?? 0), 0)

  const targetRace = plan?.targetRaceId ? races.find((r) => r.id === plan.targetRaceId) : undefined
  const outlineWeeks = outlineLength(thisWeek, races.find((r) => r.priority === "A" && r.date >= today)?.date)
  const outline = seasonOutline(thisWeek, races, outlineWeeks)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 text-white">
        <Link href={`/training/plan?week=${addDays(weekStart, -7)}`} className="rounded-full bg-black/30 px-4 py-1.5 text-sm hover:bg-black/50">
          ← Previous week
        </Link>
        <h1 className="text-2xl font-semibold">Week of {longDate(weekStart)}</h1>
        <Link href={`/training/plan?week=${addDays(weekStart, 7)}`} className="rounded-full bg-black/30 px-4 py-1.5 text-sm hover:bg-black/50">
          Next week →
        </Link>
      </div>

      {weekStart === thisWeek && form && latest && formStatus(latest.tsb) === "overreaching" && (
        <div role="status" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-900 shadow-xl">
          <span aria-hidden>{form.icon}</span> <strong>Form is {Math.round(latest.tsb)}.</strong> {form.advice}
        </div>
      )}

      {!plan ? (
        <Card title="No plan for this week">
          {weekStart >= thisWeek ? (
            <ActionForm action={regeneratePlan} submitLabel="Generate plan" pendingLabel="Generating…">
              <input type="hidden" name="weekStart" value={weekStart} />
            </ActionForm>
          ) : (
            <p className="text-gray-600">Plans are only generated for the current and upcoming weeks.</p>
          )}
        </Card>
      ) : (
        <>
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-sm font-medium ${PHASE_STYLES[plan.phase as Phase]}`}>
                    {PHASE_LABELS[plan.phase as Phase]}
                  </span>
                  {plan.isDownWeek && <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">Down week</span>}
                  {targetRace && <span className="text-sm text-gray-600">Building toward {targetRace.name}</span>}
                </div>
                <dl className="mt-4 grid grid-cols-3 gap-6">
                  <Target label="Time on feet" planned={fmtHours(plan.targetHours)} actual={fmtHours(actualHours)} />
                  <Target label="Distance" planned={fmtKm(plan.targetDistanceKm)} actual={fmtKm(actualKm)} />
                  <Target label="Climbing" planned={fmtVert(plan.targetVertM)} actual={fmtVert(actualVert)} />
                </dl>
              </div>
              {weekStart >= thisWeek && (
                <ActionForm action={regeneratePlan} submitLabel="Regenerate" pendingLabel="Regenerating…" variant="secondary">
                  <input type="hidden" name="weekStart" value={weekStart} />
                </ActionForm>
              )}
            </div>
          </Card>

          <Card title="Sessions">
            <ol className="divide-y divide-gray-100">
              {plan.workouts.map((w) => {
                const date = toISODate(w.date)
                const done = actuals.filter((a) => a.localDate === date)
                const doneMinutes = done.filter(isOnFeet).reduce((a, x) => a + x.movingTime / 60, 0)
                const completed = w.kind !== "rest" && w.durationMinutes > 0 && doneMinutes >= w.durationMinutes * 0.6
                return (
                  <li key={w.id} className={`grid gap-2 py-4 sm:grid-cols-[8rem_1fr_14rem] ${date === today ? "-mx-3 rounded-lg bg-sky-50 px-3" : ""}`}>
                    <div>
                      <div className="font-medium text-gray-900">{DAY_NAMES[(w.date.getUTCDay() + 6) % 7]}</div>
                      <div className="text-sm text-gray-500">{shortDate(date)}{date === today && " · today"}</div>
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded px-2 py-0.5 text-xs font-medium ${KIND_STYLES[w.kind as WorkoutKind]}`}>{w.title}</span>
                        {w.kind !== "rest" && (
                          <span className="text-sm tabular-nums text-gray-600">
                            {fmtDuration(w.durationMinutes)}
                            {w.distanceKm ? ` · ~${fmtKm(w.distanceKm)}` : ""}
                            {w.vertM ? ` · ~${fmtVert(w.vertM)}` : ""}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-700">{w.description}</p>
                    </div>
                    <div className="text-sm text-gray-600">
                      {done.map((a) => (
                        <Link key={a.id} href={`/training/activities/${a.id}`} className="block hover:underline">
                          {completed && <span className="text-green-700" aria-label="Completed">✓ </span>}
                          {a.name} · {fmtDuration(a.movingTime / 60)}
                        </Link>
                      ))}
                    </div>
                  </li>
                )
              })}
            </ol>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Why this week looks like this">
              <ul className="list-disc space-y-2 pl-5 text-sm text-gray-700">
                {(plan.rationale as string[]).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-gray-500">Generated {plan.generatedAt.toLocaleString("en-AU", { timeZone: context.timezone })}</p>
            </Card>

            <Card
              title="Coach notes"
              action={
                coachEnabled() && (
                  <ActionForm action={generateCoachNotes} submitLabel={plan.aiNotes ? "Refresh" : "Write notes"} pendingLabel="Writing…" variant="secondary">
                    <input type="hidden" name="planWeekId" value={plan.id} />
                  </ActionForm>
                )
              }
            >
              {plan.aiNotes ? (
                <>
                  <div className="whitespace-pre-line text-sm text-gray-700">{plan.aiNotes}</div>
                  <p className="mt-4 text-xs text-gray-500">AI-generated commentary on the plan above. The plan itself is rule-based.</p>
                </>
              ) : coachEnabled() ? (
                <p className="text-sm text-gray-600">Optional AI commentary on this week, based on your recent training.</p>
              ) : (
                <p className="text-sm text-gray-600">
                  Optional. Set <code>ANTHROPIC_API_KEY</code> to get AI commentary on each week. The plan works without it.
                </p>
              )}
            </Card>
          </div>
        </>
      )}

      <Card title="Season outline">
        <p className="mb-4 text-sm text-gray-600">
          Phases from now to your next A race. Volumes are decided week by week from your actual training.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-gray-500">
              <tr>
                <th className="py-2 pr-4 font-medium">Week of</th>
                <th className="py-2 pr-4 font-medium">Phase</th>
                <th className="py-2 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {outline.map((w) => {
                const inWeek = races.filter((r) => r.date >= w.weekStart && r.date <= addDays(w.weekStart, 6))
                return (
                  <tr key={w.weekStart} className="border-t border-gray-100">
                    <td className="py-2 pr-4">
                      <Link href={`/training/plan?week=${w.weekStart}`} className="text-blue-600 hover:underline">
                        {shortDate(w.weekStart)}
                      </Link>
                    </td>
                    <td className="py-2 pr-4">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PHASE_STYLES[w.phase]}`}>{PHASE_LABELS[w.phase]}</span>
                    </td>
                    <td className="py-2 text-gray-700">
                      {[
                        w.scheduledDownWeek && w.phase !== "recovery" ? "Down week" : null,
                        w.phase === "taper" && w.taperIndex !== null ? `Taper ${w.taperIndex + 1} of ${w.taperWeeks}` : null,
                        ...inWeek.map((r) => `${r.priority} race: ${r.name} (${r.distanceKm} km)`),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

function Target({ label, planned, actual }: { label: string; planned: string; actual: string }) {
  return (
    <div>
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="text-xl font-semibold text-gray-900">{planned}</dd>
      <dd className="text-sm text-gray-600">{actual} done</dd>
    </div>
  )
}

// Through the A race plus two recovery weeks, between 8 and 40 weeks
function outlineLength(fromWeek: ISODate, raceDate?: ISODate) {
  if (!raceDate) return 8
  const weeks = Math.ceil((fromISODate(raceDate).getTime() - fromISODate(fromWeek).getTime()) / (7 * 86_400_000)) + 3
  return Math.min(40, Math.max(8, weeks))
}
