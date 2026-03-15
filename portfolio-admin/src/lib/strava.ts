const STRAVA_BASE = "https://www.strava.com/api/v3";

export async function refreshStravaToken() {
  const res = await fetch(`${STRAVA_BASE}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: process.env.STRAVA_CLIENT_ID!,
      client_secret: process.env.STRAVA_CLIENT_SECRET!,
      grant_type: "refresh_token",
      refresh_token: process.env.STRAVA_REFRESH_TOKEN!,
    }),
  });

  if (!res.ok) throw new Error("Failed to refresh Strava token");

  return res.json();
}

export async function getAthleteActivities(token: string) {
  const res = await fetch("https://www.strava.com/api/v3/athlete/activities?per_page=10", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Strava error:", res.status, text);
    throw new Error("Failed to fetch activities");
  }

  return res.json();
}


export async function getActivityStreams(activityId: number, token: string) {
  const streamKeys =
    "time,distance,latlng,altitude,velocity_smooth,heartrate";

  const res = await fetch(
    `${STRAVA_BASE}/activities/${activityId}/streams?keys=${streamKeys}&key_by_type=true`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) throw new Error("Failed to fetch streams");

  return res.json();
}
