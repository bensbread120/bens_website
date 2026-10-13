import type { AthleteProfile, Prisma } from "@prisma/client"
import { db } from "@/lib/db"
import { computeTrainingLoad } from "@/lib/training/load"
import { getProfile } from "@/lib/training/profile"
import {
  getAccessToken,
  getActivity,
  getActivityStreams,
  getAthleteActivities,
  getAthleteId,
  type StravaActivity,
} from "./strava";

// start_date_local is wall-clock time with a misleading "Z" suffix; keep it as-is
function activityData(activity: StravaActivity, profile: AthleteProfile) {
  return {
    name: activity.name,
    type: activity.type,
    sportType: activity.sport_type ?? null,
    distance: activity.distance,
    movingTime: activity.moving_time,
    elapsedTime: activity.elapsed_time,
    startDate: new Date(activity.start_date),
    startDateLocal: activity.start_date_local ? new Date(activity.start_date_local) : null,
    timezone: activity.timezone ?? null,
    averageSpeed: activity.average_speed ?? null,
    maxSpeed: activity.max_speed ?? null,
    elevation: activity.total_elevation_gain ?? null,
    averageHeartrate: activity.average_heartrate ?? null,
    maxHeartrate: activity.max_heartrate ?? null,
    trainingLoad: computeTrainingLoad(
      {
        type: activity.type,
        sportType: activity.sport_type,
        movingTime: activity.moving_time,
        averageHeartrate: activity.average_heartrate ?? null,
      },
      profile
    ),
  }
}

async function upsertActivity(
  activity: StravaActivity,
  token: string,
  profile: AthleteProfile,
  { withStreams }: { withStreams: boolean }
): Promise<"created" | "updated"> {
  const stravaId = BigInt(activity.id)
  const existing = await db.activity.findUnique({ where: { stravaId }, select: { id: true, streams: true } })
  const data = activityData(activity, profile)

  // Streams are large and only needed for maps, so fetch them once per activity
  let streams: Prisma.InputJsonValue | undefined
  if (withStreams && !existing?.streams) {
    streams = (await getActivityStreams(activity.id, token)) as Prisma.InputJsonValue
  }

  if (existing) {
    await db.activity.update({ where: { stravaId }, data: { ...data, ...(streams ? { streams } : {}) } })
    return "updated"
  }

  console.log(`New activity found: ${activity.name}`);
  await db.activity.create({ data: { stravaId, ...data, streams } })
  return "created"
}

// Most recent activities with streams. Backstop for missed webhook events.
export async function syncStravaActivities() {
  console.log("Starting Strava sync");

  const token = await getAccessToken()
  const profile = await getProfile()
  const activities = await getAthleteActivities(token, { perPage: 30 })

  let created = 0
  for (const activity of activities) {
    if ((await upsertActivity(activity, token, profile, { withStreams: true })) === "created") created++
  }

  console.log("Strava sync complete");
  return { checked: activities.length, created }
}

// Summaries (no streams) for everything since `months` ago. Uses ~1 request per 200 activities.
export async function importStravaHistory(months: number) {
  const token = await getAccessToken()
  const profile = await getProfile()
  const after = Math.floor(Date.now() / 1000 - months * 30.44 * 86_400)

  let created = 0
  let updated = 0
  for (let page = 1; page <= 20; page++) {
    const activities = await getAthleteActivities(token, { page, perPage: 200, after })
    for (const activity of activities) {
      if ((await upsertActivity(activity, token, profile, { withStreams: false })) === "created") created++
      else updated++
    }
    if (activities.length < 200) break
  }
  return { created, updated }
}

export type StravaWebhookEvent = {
  object_type: "activity" | "athlete"
  object_id: number
  aspect_type: "create" | "update" | "delete"
  owner_id: number
  subscription_id: number
  updates?: Record<string, string>
}

export async function handleStravaWebhookEvent(event: StravaWebhookEvent) {
  if (event.object_type !== "activity") {
    console.log("Ignoring Strava athlete event", event.updates)
    return
  }

  const token = await getAccessToken()
  // Webhook posts are unsigned; only act on events for the connected athlete
  if ((await getAthleteId(token)) !== BigInt(event.owner_id)) {
    console.warn("Ignoring Strava event for unknown athlete", event.owner_id)
    return
  }

  if (event.aspect_type === "delete") {
    await db.activity.deleteMany({ where: { stravaId: BigInt(event.object_id) } })
    return
  }

  // Refetch rather than trusting the payload: it only carries changed fields
  const activity = await getActivity(event.object_id, token)
  await upsertActivity(activity, token, await getProfile(), { withStreams: true })
}

// Re-run the load calculation after heart-rate settings change
export async function recomputeTrainingLoads() {
  const profile = await getProfile()
  const activities = await db.activity.findMany({
    select: { id: true, type: true, sportType: true, movingTime: true, averageHeartrate: true },
  })

  const updates = activities.map((activity) =>
    db.activity.update({
      where: { id: activity.id },
      data: { trainingLoad: computeTrainingLoad(activity, profile) },
    })
  )
  for (let i = 0; i < updates.length; i += 200) {
    await db.$transaction(updates.slice(i, i + 200))
  }
  return activities.length
}
