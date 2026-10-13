import Link from "next/link"
import ColumnChart from "@/components/charts/ColumnChart"
import LineChart from "@/components/charts/LineChart"
import { CHART } from "@/components/charts/scale"
import { Card, StatTile } from "@/components/training/Card"
import { db } from "@/lib/db"
import { requireAdminPage } from "@/lib/session"
import { addDays, daysBetween, fromISODate, weekStartOf } from "@/lib/training/dates"
import { FORM_LABELS, fmtDuration, fmtHours, fmtKm, fmtVert, shortDate } from "@/lib/training/format"
import { formStatus, isOnFeet } from "@/lib/training/load"
import { fitnessThrough, getRaces, loadTrainingContext } from "@/lib/training/service"
import { weeklySummaries } from "@/lib/training/weekly"

const WEEKS = 16
const FITNESS_DAYS = 120

export default async function TrainingDashboard() {
  await requireAdminPage()
  const context = await loadTrainingContext()
  const { today, activities } = context

  if (activities.length === 0) {
    return (
      <Card title="No activities yet">
        <p className="text-gray-700">
          Import your Strava history from{" "}
          <Link href="/training/settings" className="text-blue-600 hover:underline">
            Settings
          </Link>{" "}
          to populate the dashboard.
        </p>
      </Card>
    )
  }

  const thisWeek = weekStartOf(today)
  const weeks = weeklySummaries(activities, addDays(thisWeek, -(WEEKS - 1) * 7), thisWeek)
  const current = weeks[weeks.length - 1]
  const fitness = fitnessThrough(context, today).slice(-FITNESS_DAYS)
  const latest = fitness[fitness.length - 1]
  const monthAgo = fitness[Math.max(0, fitness.length - 29)]
  const form = FORM_LABELS[formStatus(latest.tsb)]

  const plan = await db.planWeek.findUnique({ where: { weekStart: fromISODate(thisWeek) } })
  const nextRace = (await getRaces()).find((r) => r.date >= today)
  const recent = activities.slice(-8).reverse()

  const weekLabel = (start: string) => shortDate(start)

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="This week on feet"
          value={fmtHours(current.hours)}
          detail={plan ? `of ${fmtHours(plan.targetHours)} planned` : `${fmtKm(current.km)} · ${fmtVert(current.vertM)}`}
        >
          {plan && (
            <div className="mt-3 h-2 rounded-full bg-sky-100">
              <div className="h-2 rounded-full bg-[#2a78d6]" style={{ width: `${Math.min(100, (current.hours / plan.targetHours) * 100)}%` }} />
            </div>
          )}
        </StatTile>
        <StatTile
          label="Fitness (CTL)"
          value={String(Math.round(latest.ctl))}
          detail={`${latest.ctl >= monthAgo.ctl ? "+" : "−"}${Math.abs(Math.round(latest.ctl - monthAgo.ctl))} vs 4 weeks ago`}
        />
        <StatTile label="Form (TSB)" value={String(Math.round(latest.tsb))}>
          <div className={`mt-1 text-sm font-medium ${form.className}`}>
            <span aria-hidden>{form.icon}</span> {form.label}
          </div>
        </StatTile>
        <StatTile
          label="Next race"
          value={nextRace ? `${daysBetween(today, nextRace.date)} days` : "None"}
          detail={
            nextRace ? (
              `${nextRace.name}, ${nextRace.distanceKm} km`
            ) : (
              <Link href="/training/races" className="text-blue-600 hover:underline">
                Add a race
              </Link>
            )
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Weekly time on feet">
          <ColumnChart
            title="Weekly hours on feet"
            unit="hours"
            data={weeks.map((w) => ({
              label: weekLabel(w.weekStart),
              value: w.hours,
              partial: w.weekStart === thisWeek,
              detail: [fmtKm(w.km), fmtVert(w.vertM), `Longest ${fmtDuration(w.longestMinutes)}`],
            }))}
          />
        </Card>
        <Card title="Weekly climbing">
          <ColumnChart
            title="Weekly elevation gain"
            unit="vert"
            data={weeks.map((w) => ({
              label: weekLabel(w.weekStart),
              value: w.vertM,
              partial: w.weekStart === thisWeek,
              detail: [fmtKm(w.km)],
            }))}
          />
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Fitness and fatigue">
          <LineChart
            title="Fitness (42-day load) and fatigue (7-day load)"
            labels={fitness.map((p) => shortDate(p.date))}
            unit="count"
            series={[
              { name: "Fitness (CTL)", color: CHART.series[0], values: fitness.map((p) => p.ctl) },
              { name: "Fatigue (ATL)", color: CHART.series[1], values: fitness.map((p) => p.atl) },
            ]}
          />
        </Card>
        <Card title="Form">
          <LineChart
            title="Form: fitness minus fatigue"
            labels={fitness.map((p) => shortDate(p.date))}
            unit="count"
            series={[{ name: "Form (TSB)", color: CHART.series[0], values: fitness.map((p) => p.tsb) }]}
          />
          <p className="mt-2 text-sm text-gray-600">
            Below −30 means heavy fatigue; −10 to −30 is normal while building; above +10 means fresh, ideal for racing.
          </p>
        </Card>
      </div>

      <Card
        title="Recent activities"
        action={
          <Link href="/training/activities" className="text-sm text-blue-600 hover:underline">
            View all
          </Link>
        }
      >
        <ul className="divide-y divide-gray-100">
          {recent.map((a) => (
            <li key={a.id}>
              <Link href={`/training/activities/${a.id}`} className="flex flex-wrap items-baseline justify-between gap-2 py-2 hover:bg-gray-50">
                <span>
                  <span className="font-medium text-gray-900">{a.name}</span>
                  <span className="ml-2 text-sm text-gray-500">
                    {shortDate(a.localDate)} · {a.sportType ?? a.type}
                  </span>
                </span>
                <span className="text-sm tabular-nums text-gray-600">
                  {isOnFeet(a) && `${fmtKm(a.distance / 1000)} · `}
                  {fmtDuration(a.movingTime / 60)}
                  {a.elevation ? ` · ${fmtVert(a.elevation)}` : ""}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
