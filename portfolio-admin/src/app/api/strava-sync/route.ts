import { syncStravaActivities } from "@/lib/stravaSync";

export async function GET() {
  try {
    await syncStravaActivities();

    return Response.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "Strava sync failed" },
      { status: 500 }
    );
  }
}
