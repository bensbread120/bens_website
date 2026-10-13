// Manage the Strava webhook subscription (one per app).
// Usage: npx tsx --env-file=.env script/strava-webhook.ts <list|create <callback-url>|delete <id>>
// `create` needs the deployed site to be reachable, since Strava calls the callback to verify it.

const BASE = "https://www.strava.com/api/v3/push_subscriptions"

async function main() {
  const [command, arg] = process.argv.slice(2)
  const clientId = process.env.STRAVA_CLIENT_ID
  const clientSecret = process.env.STRAVA_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new Error("STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET must be set")

  if (command === "list") {
    const res = await fetch(`${BASE}?${new URLSearchParams({ client_id: clientId, client_secret: clientSecret })}`)
    console.log(res.status, await res.json())
    return
  }

  if (command === "create" && arg) {
    const verifyToken = process.env.STRAVA_WEBHOOK_VERIFY_TOKEN
    if (!verifyToken) throw new Error("STRAVA_WEBHOOK_VERIFY_TOKEN must be set (and match the deployed site)")
    const res = await fetch(BASE, {
      method: "POST",
      body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, callback_url: arg, verify_token: verifyToken }),
    })
    const body = await res.json()
    console.log(res.status, body)
    if (res.ok) console.log(`Set STRAVA_WEBHOOK_SUBSCRIPTION_ID=${body.id} in Vercel to reject events from other subscriptions.`)
    return
  }

  if (command === "delete" && arg) {
    const res = await fetch(`${BASE}/${arg}?${new URLSearchParams({ client_id: clientId, client_secret: clientSecret })}`, {
      method: "DELETE",
    })
    console.log(res.status, res.status === 204 ? "Deleted" : await res.text())
    return
  }

  console.log("Usage: strava-webhook.ts <list | create <callback-url> | delete <id>>")
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
