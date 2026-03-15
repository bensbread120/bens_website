import Link from "next/link"
import { getActivities } from "@/actions/activity"
import { Activity } from "@prisma/client"
import ActivityCard from "@/components/ActivityCard"

type Props = {
  searchParams: Promise<{
    synced?: string
  }>
}

export default async function ActivitiesPage({ searchParams }: Props) {
  const activities: Activity[] = await getActivities()

  const { synced } = await searchParams
  const syncedActivities = synced === "1"

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 py-20">
        <h1 className="text-4xl font-bold text-center mb-12">
          Activities
        </h1>

        <div className="grid gap-8">
          {activities.map((activity) => (
            <Link
              href={`/activities/${activity.id}`}
              key={activity.id}
            >
              <ActivityCard
                name={activity.name}
                type={activity.type}
                distance={activity.distance}
                movingTime={activity.movingTime}
                startDate={new Intl.DateTimeFormat("en-AU", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                }).format(new Date(activity.startDate))}
              />
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}
