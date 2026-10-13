import { importHistory, saveProfile, syncNow } from "@/actions/training"
import ActionForm from "@/components/ActionForm"
import { Card } from "@/components/training/Card"
import { coachEnabled } from "@/lib/coach"
import { db } from "@/lib/db"
import { requireAdminPage } from "@/lib/session"
import { DAY_NAMES } from "@/lib/training/dates"
import { shortDate } from "@/lib/training/format"
import { loadTrainingContext } from "@/lib/training/service"

// Importing a long history can take a while
export const maxDuration = 120

const input = "w-full rounded-md border border-gray-300 px-3 py-2 text-sm"

export default async function SettingsPage() {
  await requireAdminPage()
  const { profile, timezone, activities } = await loadTrainingContext()
  const auth = await db.stravaAuth.findUnique({ where: { id: 1 }, select: { updatedAt: true } })
  const latest = activities.at(-1)
  const missingLocalDates = await db.activity.count({ where: { startDateLocal: null } })

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
      <Card title="Athlete profile">
        <ActionForm action={saveProfile} submitLabel="Save" pendingLabel="Saving…" className="space-y-5">
          <fieldset className="grid gap-4 sm:grid-cols-3">
            <legend className="mb-2 text-sm font-medium text-gray-900">Heart rate</legend>
            <label className="block text-sm">
              <span className="text-gray-700">Max HR</span>
              <input name="maxHr" type="number" defaultValue={profile.maxHr ?? ""} className={input} />
            </label>
            <label className="block text-sm">
              <span className="text-gray-700">Resting HR</span>
              <input name="restingHr" type="number" defaultValue={profile.restingHr ?? ""} className={input} />
            </label>
            <label className="block text-sm">
              <span className="text-gray-700">Load model</span>
              <select name="trimpFactor" defaultValue={String(profile.trimpFactor)} className={input}>
                <option value="1.92">Male (1.92)</option>
                <option value="1.67">Female (1.67)</option>
              </select>
            </label>
            <p className="text-xs text-gray-500 sm:col-span-3">
              With max and resting HR set, training load uses heart rate (Banister TRIMP). Without them it&apos;s estimated from duration.
            </p>
          </fieldset>

          <fieldset className="grid gap-4 sm:grid-cols-3">
            <legend className="mb-2 text-sm font-medium text-gray-900">Training week</legend>
            <label className="block text-sm">
              <span className="text-gray-700">Run days per week</span>
              <select name="runDaysPerWeek" defaultValue={profile.runDaysPerWeek} className={input}>
                {[3, 4, 5, 6, 7].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-gray-700">Long run day</span>
              <select name="longRunDay" defaultValue={profile.longRunDay} className={input}>
                {DAY_NAMES.map((day, i) => (
                  <option key={day} value={i}>{day}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-gray-700">Max hours per week</span>
              <input name="maxWeeklyHours" type="number" step="0.5" defaultValue={profile.maxWeeklyHours ?? ""} placeholder="No limit" className={input} />
            </label>
            <label className="flex items-center gap-2 text-sm sm:col-span-3">
              <input name="backToBack" type="checkbox" defaultChecked={profile.backToBack} />
              <span className="text-gray-700">Back-to-back long runs when training for 50 km+</span>
            </label>
          </fieldset>

          <label className="block text-sm">
            <span className="text-gray-700">Timezone</span>
            <input name="timezone" defaultValue={profile.timezone ?? ""} placeholder={`Detected: ${timezone}`} className={input} />
            <span className="text-xs text-gray-500">Leave blank to use the timezone of your latest Strava activity.</span>
          </label>

          <label className="block text-sm">
            <span className="text-gray-700">Notes for the AI coach</span>
            <textarea
              name="coachNotes"
              rows={3}
              defaultValue={profile.coachNotes ?? ""}
              placeholder="Injury history, terrain you have access to, goals beyond finishing…"
              className={input}
            />
          </label>
        </ActionForm>
      </Card>

      <div className="space-y-6">
        <Card title="Strava">
          <dl className="mb-4 space-y-1 text-sm text-gray-700">
            <div>Activities stored: {activities.length}</div>
            <div>Latest: {latest ? `${latest.name} (${shortDate(latest.localDate)})` : "none"}</div>
            <div>Token last refreshed: {auth ? auth.updatedAt.toLocaleString("en-AU", { timeZone: timezone }) : "never"}</div>
            <div>Webhook: {process.env.STRAVA_WEBHOOK_VERIFY_TOKEN ? "configured" : "not configured (daily sync only)"}</div>
          </dl>
          <ActionForm action={syncNow} submitLabel="Sync recent activities" pendingLabel="Syncing…" variant="secondary" />
        </Card>

        <Card title="Import history">
          <p className="mb-4 text-sm text-gray-600">
            Imports activity summaries so fitness and weekly trends have history to work from. Also fills in fields
            for activities synced before this version.
            {missingLocalDates > 0 && ` ${missingLocalDates} stored activities need this.`}
          </p>
          <ActionForm action={importHistory} submitLabel="Import" pendingLabel="Importing…" className="flex items-end gap-3">
            <label className="block text-sm">
              <span className="text-gray-700">Months</span>
              <select name="months" defaultValue="12" className={input}>
                {[3, 6, 12, 24].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </label>
          </ActionForm>
        </Card>

        <Card title="AI coach">
          <p className="text-sm text-gray-600">
            {coachEnabled()
              ? "Enabled. Weekly plans get optional commentary from Claude."
              : "Disabled. Set ANTHROPIC_API_KEY to add optional commentary to weekly plans. Everything else works without it."}
          </p>
        </Card>
      </div>
    </div>
  )
}
