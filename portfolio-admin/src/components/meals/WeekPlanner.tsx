"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { rerollNight, setNight } from "@/actions/meals"
import { DAY_NAMES, type ISODate } from "@/lib/training/dates"

export type NightView = {
  date: ISODate
  kind: "recipe" | "out" | null
  recipeId: string | null
  recipeName: string | null
  note: string | null
}

type Props = {
  nights: NightView[]
  // Sunday before this week, for Monday's lunch
  previousNight: NightView | null
  recipes: { id: string; name: string }[]
  today: ISODate
  editable: boolean
}

export default function WeekPlanner({ nights, previousNight, recipes, today, editable }: Props) {
  return (
    <ol className="divide-y divide-gray-100">
      {nights.map((night, i) => (
        <NightRow
          key={night.date}
          night={night}
          lunchFrom={i === 0 ? previousNight : nights[i - 1]}
          recipes={recipes}
          isToday={night.date === today}
          editable={editable}
          dayName={DAY_NAMES[i]}
        />
      ))}
    </ol>
  )
}

function NightRow({
  night,
  lunchFrom,
  recipes,
  isToday,
  editable,
  dayName,
}: {
  night: NightView
  lunchFrom: NightView | null
  recipes: Props["recipes"]
  isToday: boolean
  editable: boolean
  dayName: string
}) {
  const [pending, startTransition] = useTransition()
  const [note, setNote] = useState(night.note ?? "")
  const value = night.kind === "out" ? "out" : (night.recipeId ?? "")
  // Keep an archived recipe selectable on weeks that already use it
  const options = night.recipeId && !recipes.some((r) => r.id === night.recipeId)
    ? [...recipes, { id: night.recipeId, name: `${night.recipeName} (archived)` }]
    : recipes

  function call(action: () => ReturnType<typeof setNight>) {
    startTransition(async () => {
      const result = await action()
      if (result && !result.ok) toast.error(result.message)
    })
  }

  const day = new Date(`${night.date}T00:00:00Z`).toLocaleDateString("en-AU", { day: "numeric", month: "short", timeZone: "UTC" })

  return (
    <li className={`grid gap-2 py-3 sm:grid-cols-[8rem_1fr] ${isToday ? "-mx-3 rounded-lg bg-sky-50 px-3" : ""}`}>
      <div>
        <div className="font-medium text-gray-900">{dayName}</div>
        <div className="text-sm text-gray-500">
          {day}
          {isToday && " · today"}
        </div>
      </div>
      <div className={pending ? "opacity-60" : ""}>
        {editable ? (
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label={`Dinner on ${dayName}`}
              value={value}
              disabled={pending}
              onChange={(e) => call(() => setNight(night.date, e.target.value, note))}
              className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Not planned</option>
              <option value="out">Eating out</option>
              {options.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              title="Pick a different random recipe"
              aria-label={`Random recipe for ${dayName}`}
              disabled={pending}
              onClick={() => call(() => rerollNight(night.date))}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              🎲
            </button>
            {night.kind === "out" && (
              <input
                aria-label={`Where on ${dayName}`}
                placeholder="Where? (optional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onBlur={() => note !== (night.note ?? "") && call(() => setNight(night.date, "out", note))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm sm:w-56"
              />
            )}
          </div>
        ) : (
          <div className="text-gray-900">
            {night.kind === "recipe" && <span className="font-medium">{night.recipeName}</span>}
            {night.kind === "out" && <span>Eating out{night.note ? `: ${night.note}` : ""}</span>}
            {!night.kind && <span className="text-gray-400">Not planned</span>}
          </div>
        )}
        <p className="mt-1 text-xs text-gray-500">Lunch: {lunchText(lunchFrom)}</p>
      </div>
    </li>
  )
}

function lunchText(previous: NightView | null) {
  if (previous?.kind === "recipe") return `leftover ${previous.recipeName}`
  if (previous?.kind === "out") return "no leftovers (out the night before)"
  return "no leftovers planned"
}
