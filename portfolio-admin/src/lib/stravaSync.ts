import { db } from "@/lib/db";
import {
  refreshStravaToken,
  getAthleteActivities,
  getActivityStreams,
} from "./strava";

export async function syncStravaActivities() {
  console.log("Starting Strava sync");

  const tokenData = await refreshStravaToken();
  const token = tokenData.access_token;

  const activities = await getAthleteActivities(token);

  for (const activity of activities) {
    const existing = await db.activity.findUnique({
      where: {
        stravaId: BigInt(activity.id),
      },
    });

    if (existing) {
      continue;
    }

    console.log(`New activity found: ${activity.name}`);

    const streams = await getActivityStreams(activity.id, token);

    await db.activity.create({
      data: {
        stravaId: BigInt(activity.id),
        name: activity.name,
        type: activity.type,
        distance: activity.distance,
        movingTime: activity.moving_time,
        elapsedTime: activity.elapsed_time,
        startDate: new Date(activity.start_date),
        timezone: activity.timezone,
        averageSpeed: activity.average_speed,
        maxSpeed: activity.max_speed,
        elevation: activity.total_elevation_gain,
        streams,
      },
    });
  }

  console.log("Strava sync complete");
}
