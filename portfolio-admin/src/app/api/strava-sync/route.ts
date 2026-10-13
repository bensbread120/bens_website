import { db } from "@/lib/db";
import { coachEnabled, writeCoachNotes } from "@/lib/coach";
import { syncStravaActivities } from "@/lib/stravaSync";
import { fromISODate } from "@/lib/training/dates";
import { ensurePlans } from "@/lib/training/service";

// Leaves room for the optional AI coach call
export const maxDuration = 120;

// Daily cron: backstop sync for missed webhooks, then make sure the week's plan exists
export async function GET(request: Request) {
  // Vercel Cron sends `Authorization: Bearer $CRON_SECRET` when CRON_SECRET is set
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // A Strava outage shouldn't stop the week's plan being created from data already stored
  let sync: Awaited<ReturnType<typeof syncStravaActivities>> | null = null;
  try {
    sync = await syncStravaActivities();
  } catch (error) {
    console.error("Strava sync failed", error);
  }

  try {
    const createdPlans = await ensurePlans();

    // Coach notes are a bonus: never fail the sync over them
    if (coachEnabled()) {
      for (const weekStart of createdPlans) {
        try {
          const week = await db.planWeek.findUniqueOrThrow({ where: { weekStart: fromISODate(weekStart) } });
          await writeCoachNotes(week.id);
        } catch (error) {
          console.error("Coach notes failed", error);
        }
      }
    }

    // Non-2xx when the sync failed, so it shows up in Vercel's cron logs
    return Response.json(
      {
        success: sync !== null,
        ...(sync ?? { error: "Strava sync failed" }),
        createdPlans,
      },
      { status: sync ? 200 : 502 }
    );
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "Plan generation failed" },
      { status: 500 }
    );
  }
}
