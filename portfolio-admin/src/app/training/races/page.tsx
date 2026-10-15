import { deleteRace, saveRace } from "@/actions/training"
import ActionForm from "@/components/ActionForm"
import { Card } from "@/components/Card"
import { db } from "@/lib/db"
import { requireAdminPage } from "@/lib/session"
import { daysBetween } from "@/lib/training/dates"
import { fmtVert, longDate } from "@/lib/training/format"
import { recoveryDaysAfter, taperWeeksFor } from "@/lib/training/planner"
import { loadTrainingContext, toRace } from "@/lib/training/service"

const PRIORITIES = [
  { value: "A", label: "A: goal race", help: "Full periodised build and taper" },
  { value: "B", label: "B: tune-up", help: "Mini taper, replaces the long run" },
  { value: "C", label: "C: training race", help: "No taper, run as a long run" },
]

const input = "w-full rounded-md border border-gray-300 px-3 py-2 text-sm"

export default async function RacesPage() {
  await requireAdminPage()
  const { today } = await loadTrainingContext()
  const races = (await db.raceEvent.findMany({ orderBy: { date: "asc" } })).map((event) => ({ ...toRace(event), notes: event.notes }))
  const upcoming = races.filter((r) => r.date >= today)
  const past = races.filter((r) => r.date < today).reverse()

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <div className="space-y-6">
        <Card title="Upcoming races">
          {upcoming.length === 0 ? (
            <p className="text-gray-600">No races yet. Add your goal race to get a periodised plan with a taper.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {upcoming.map((race) => (
                <li key={race.id} className="flex flex-wrap items-start justify-between gap-4 py-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-gray-900 px-2 py-0.5 text-xs font-semibold text-white">{race.priority}</span>
                      <span className="font-medium text-gray-900">{race.name}</span>
                    </div>
                    <div className="mt-1 text-sm text-gray-600">
                      {longDate(race.date)} · in {daysBetween(today, race.date)} days
                    </div>
                    <div className="text-sm text-gray-600">
                      {race.distanceKm} km{race.elevationGainM ? ` · ${fmtVert(race.elevationGainM)} climbing` : ""}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {race.priority === "A"
                        ? `${taperWeeksFor(race.distanceKm)}-week taper, ~${recoveryDaysAfter(race)} days recovery after`
                        : race.priority === "B"
                          ? `Mini taper, ~${recoveryDaysAfter(race)} days recovery after`
                          : "Treated as a long run"}
                    </div>
                    {race.notes && <p className="mt-2 text-sm text-gray-700">{race.notes}</p>}
                  </div>
                  <ActionForm action={deleteRace} submitLabel="Remove" pendingLabel="Removing…" variant="danger">
                    <input type="hidden" name="id" value={race.id} />
                  </ActionForm>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {past.length > 0 && (
          <Card title="Past races">
            <ul className="divide-y divide-gray-100 text-sm">
              {past.map((race) => (
                <li key={race.id} className="flex justify-between gap-4 py-2">
                  <span>
                    <span className="font-medium text-gray-900">{race.name}</span>
                    <span className="ml-2 text-gray-500">{race.priority} · {race.distanceKm} km</span>
                  </span>
                  <span className="text-gray-500">{longDate(race.date)}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      <Card title="Add a race">
        <ActionForm action={saveRace} submitLabel="Add race" pendingLabel="Saving…" className="space-y-4">
          <label className="block text-sm">
            <span className="text-gray-700">Name</span>
            <input name="name" required className={input} />
          </label>
          <label className="block text-sm">
            <span className="text-gray-700">Date</span>
            <input name="date" type="date" required min={today} className={input} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="text-gray-700">Distance (km)</span>
              <input name="distanceKm" type="number" step="0.1" min="1" required className={input} />
            </label>
            <label className="block text-sm">
              <span className="text-gray-700">Climbing (m)</span>
              <input name="elevationGainM" type="number" step="10" min="0" className={input} />
            </label>
          </div>
          <fieldset className="text-sm">
            <legend className="text-gray-700">Priority</legend>
            {PRIORITIES.map((p, i) => (
              <label key={p.value} className="mt-2 flex items-start gap-2">
                <input type="radio" name="priority" value={p.value} defaultChecked={i === 0} className="mt-1" />
                <span>
                  <span className="text-gray-900">{p.label}</span>
                  <span className="block text-xs text-gray-500">{p.help}</span>
                </span>
              </label>
            ))}
          </fieldset>
          <label className="block text-sm">
            <span className="text-gray-700">Notes</span>
            <textarea name="notes" rows={2} className={input} />
          </label>
        </ActionForm>
      </Card>
    </div>
  )
}
