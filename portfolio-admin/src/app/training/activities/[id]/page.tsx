import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import ActivityMap from "@/components/ActivityMap"
import { Card } from "@/components/Card"
import { requireAdminPage } from "@/lib/session"
import { activityLocalDate } from "@/lib/training/dates"
import { fmtDuration, fmtKm, fmtVert, longDate } from "@/lib/training/format"
import { isRun } from "@/lib/training/load"
import { getAthleteTimezone } from "@/lib/training/profile"

type Props = {
  params: Promise<{
    id: string
  }>
}

function streamToGeoJSON(streams: unknown): GeoJSON.Feature<GeoJSON.LineString> | null {
  const coords = (streams as { latlng?: { data?: [number, number][] } } | null)?.latlng?.data
  if (!coords?.length) return null

  return {
    type: "Feature" as const,
    geometry: {
      type: "LineString" as const,
      coordinates: coords.map(([lat, lng]: [number, number]) => [
        lng,
        lat,
      ]),
    },
    properties: {},
  }
}

export default async function ActivityPage({ params }: Props) {
  await requireAdminPage()
  const { id } = await params

  const activity = await db.activity.findUnique({
    where: { id },
  })

  if (!activity) {
    notFound()
  }

  const geojson = streamToGeoJSON(activity.streams)
  const localDate = activityLocalDate(activity, await getAthleteTimezone())
  const speed = activity.averageSpeed ?? 0
  const pace = isRun(activity) && speed > 0 ? `${fmtPace(1000 / speed)} /km` : speed > 0 ? `${(speed * 3.6).toFixed(1)} km/h` : "–"

  const stats = [
    ["Type", activity.sportType ?? activity.type],
    ["Distance", fmtKm(activity.distance / 1000)],
    ["Moving time", fmtDuration(activity.movingTime / 60)],
    ["Elapsed time", fmtDuration(activity.elapsedTime / 60)],
    ["Climbing", fmtVert(activity.elevation ?? 0)],
    [isRun(activity) ? "Average pace" : "Average speed", pace],
    ["Average heart rate", activity.averageHeartrate ? `${Math.round(activity.averageHeartrate)} bpm` : "–"],
    ["Max heart rate", activity.maxHeartrate ? `${Math.round(activity.maxHeartrate)} bpm` : "–"],
    ["Training load", activity.trainingLoad ? String(Math.round(activity.trainingLoad)) : "–"],
  ]

  return (
    <Card>
      <h1 className="mb-1 text-3xl font-bold text-gray-900">{activity.name}</h1>
      <p className="mb-6 text-gray-500">{longDate(localDate)}</p>
      {geojson && (
        <div className="mb-6">
          <ActivityMap geojson={geojson} />
        </div>
      )}

      <dl className="grid grid-cols-2 gap-6 text-gray-700 sm:grid-cols-3">
        {stats.map(([label, value]) => (
          <div key={label}>
            <dt className="font-semibold">{label}</dt>
            <dd className="tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  )
}

function fmtPace(secondsPerKm: number) {
  const minutes = Math.floor(secondsPerKm / 60)
  const seconds = Math.round(secondsPerKm % 60)
  return seconds === 60 ? `${minutes + 1}:00` : `${minutes}:${String(seconds).padStart(2, "0")}`
}
