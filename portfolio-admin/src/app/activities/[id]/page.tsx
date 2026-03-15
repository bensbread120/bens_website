import { notFound } from "next/navigation"
import { db } from "@/lib/db"

type Props = {
  params: Promise<{
    id: string
  }>
}

export default async function ActivityPage({ params }: Props) {
  const { id } = await params

  const activity = await db.activity.findUnique({
    where: { id },
  })

  if (!activity) {
    notFound()
  }

  const distanceKm = (activity.distance / 1000).toFixed(2)

  const movingTime = new Date(activity.movingTime * 1000)
    .toISOString()
    .slice(11, 19)

  return (
    <article className="max-w-3xl mx-auto mt-10 px-6 py-16 bg-white rounded-xl">
      <h1 className="text-4xl font-bold mb-4">{activity.name}</h1>

      <p className="text-gray-400 mb-8">
        {new Intl.DateTimeFormat("en-AU", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(new Date(activity.startDate))}
      </p>

      <div className="grid grid-cols-2 gap-6 text-gray-700">
        <div>
          <p className="font-semibold">Type</p>
          <p>{activity.type}</p>
        </div>

        <div>
          <p className="font-semibold">Distance</p>
          <p>{distanceKm} km</p>
        </div>

        <div>
          <p className="font-semibold">Moving Time</p>
          <p>{movingTime}</p>
        </div>

        <div>
          <p className="font-semibold">Elevation</p>
          <p>{activity.elevation ?? 0} m</p>
        </div>
      </div>
    </article>
  )
}
