import { after } from "next/server";
import { handleStravaWebhookEvent, type StravaWebhookEvent } from "@/lib/stravaSync";

// Strava calls this once when the subscription is created, to verify we own the URL
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const verifyToken = process.env.STRAVA_WEBHOOK_VERIFY_TOKEN;

  if (!verifyToken || params.get("hub.mode") !== "subscribe" || params.get("hub.verify_token") !== verifyToken) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  return Response.json({ "hub.challenge": params.get("hub.challenge") });
}

// Strava expects a 200 within 2 seconds, so the actual work runs after responding
export async function POST(request: Request) {
  let event: StravaWebhookEvent;
  try {
    event = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const expectedSubscription = process.env.STRAVA_WEBHOOK_SUBSCRIPTION_ID;
  if (expectedSubscription && String(event.subscription_id) !== expectedSubscription) {
    return Response.json({ error: "Unknown subscription" }, { status: 403 });
  }

  after(async () => {
    try {
      await handleStravaWebhookEvent(event);
    } catch (error) {
      console.error("Strava webhook handling failed", error);
    }
  });

  return Response.json({ received: true });
}
