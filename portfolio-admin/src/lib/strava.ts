import { db } from "@/lib/db"

const STRAVA_BASE = "https://www.strava.com/api/v3"

// Fields we use from Strava's SummaryActivity / DetailedActivity
export type StravaActivity = {
  id: number
  name: string
  type: string
  sport_type?: string
  distance: number
  moving_time: number
  elapsed_time: number
  start_date: string
  start_date_local?: string
  timezone?: string
  average_speed?: number
  max_speed?: number
  total_elevation_gain?: number
  average_heartrate?: number
  max_heartrate?: number
}

type TokenResponse = {
  access_token: string
  refresh_token: string
  expires_at: number
}

async function refreshToken(refreshToken: string): Promise<TokenResponse> {
  const res = await fetch(`${STRAVA_BASE}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: process.env.STRAVA_CLIENT_ID!,
      client_secret: process.env.STRAVA_CLIENT_SECRET!,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) throw new Error(`Failed to refresh Strava token (${res.status})`);

  return res.json();
}

/**
 * Returns a valid access token, refreshing when needed. Strava may rotate the refresh
 * token on every refresh, so the latest one is persisted; STRAVA_REFRESH_TOKEN only
 * seeds the first refresh (or recovers if the stored token is revoked).
 */
export async function getAccessToken(): Promise<string> {
  const auth = await db.stravaAuth.findUnique({ where: { id: 1 } })
  if (auth && auth.expiresAt.getTime() > Date.now() + 60_000) return auth.accessToken

  const envToken = process.env.STRAVA_REFRESH_TOKEN
  const candidates = [auth?.refreshToken, envToken].filter((t, i, all): t is string => !!t && all.indexOf(t) === i)
  if (candidates.length === 0) throw new Error("No Strava refresh token. Set STRAVA_REFRESH_TOKEN.")

  let lastError: unknown
  for (const candidate of candidates) {
    try {
      const token = await refreshToken(candidate)
      const data = {
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        expiresAt: new Date(token.expires_at * 1000),
      }
      await db.stravaAuth.upsert({ where: { id: 1 }, create: { id: 1, ...data }, update: data })
      return token.access_token
    } catch (error) {
      lastError = error
    }
  }
  throw lastError
}

async function stravaGet<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${STRAVA_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Strava error:", res.status, path, text);
    throw new Error(
      res.status === 429 ? "Strava rate limit reached, try again in 15 minutes" : `Strava request failed (${res.status})`
    );
  }

  return res.json();
}

export async function getAthleteId(token: string): Promise<bigint> {
  const auth = await db.stravaAuth.findUnique({ where: { id: 1 } })
  if (auth?.athleteId) return auth.athleteId

  const athlete = await stravaGet<{ id: number }>("/athlete", token)
  await db.stravaAuth.update({ where: { id: 1 }, data: { athleteId: BigInt(athlete.id) } })
  return BigInt(athlete.id)
}

export function getAthleteActivities(
  token: string,
  { page = 1, perPage = 30, after }: { page?: number; perPage?: number; after?: number } = {}
) {
  const params = new URLSearchParams({ page: String(page), per_page: String(perPage) })
  if (after) params.set("after", String(after))
  return stravaGet<StravaActivity[]>(`/athlete/activities?${params}`, token)
}

export function getActivity(activityId: number | bigint, token: string) {
  return stravaGet<StravaActivity>(`/activities/${activityId}`, token)
}

export function getActivityStreams(activityId: number | bigint, token: string) {
  const streamKeys =
    "time,distance,latlng,altitude,velocity_smooth,heartrate";

  return stravaGet<Record<string, unknown>>(
    `/activities/${activityId}/streams?keys=${streamKeys}&key_by_type=true`,
    token
  )
}
