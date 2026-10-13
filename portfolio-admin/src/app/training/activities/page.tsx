import Link from "next/link"
import { Card } from "@/components/training/Card"
import { requireAdminPage } from "@/lib/session"
import { fmtDuration, fmtKm, fmtVert, shortDate } from "@/lib/training/format"
import { loadTrainingContext } from "@/lib/training/service"

const LIMIT = 200

export default async function ActivitiesPage() {
  await requireAdminPage()
  const { activities } = await loadTrainingContext()
  const rows = activities.slice(-LIMIT).reverse()

  return (
    <Card title={`Activities (latest ${Math.min(LIMIT, activities.length)})`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-gray-500">
            <tr>
              <th className="py-2 pr-4 font-medium">Date</th>
              <th className="py-2 pr-4 font-medium">Name</th>
              <th className="py-2 pr-4 font-medium">Type</th>
              <th className="py-2 pr-4 text-right font-medium">Distance</th>
              <th className="py-2 pr-4 text-right font-medium">Time</th>
              <th className="py-2 pr-4 text-right font-medium">Climbing</th>
              <th className="py-2 pr-4 text-right font-medium">Avg HR</th>
              <th className="py-2 text-right font-medium">Load</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {rows.map((a) => (
              <tr key={a.id} className="border-t border-gray-100">
                <td className="whitespace-nowrap py-2 pr-4 text-gray-600">{shortDate(a.localDate)} {a.localDate.slice(0, 4)}</td>
                <td className="py-2 pr-4">
                  <Link href={`/training/activities/${a.id}`} className="text-blue-600 hover:underline">
                    {a.name}
                  </Link>
                </td>
                <td className="py-2 pr-4 text-gray-600">{a.sportType ?? a.type}</td>
                <td className="py-2 pr-4 text-right">{fmtKm(a.distance / 1000)}</td>
                <td className="py-2 pr-4 text-right">{fmtDuration(a.movingTime / 60)}</td>
                <td className="py-2 pr-4 text-right">{a.elevation ? fmtVert(a.elevation) : "–"}</td>
                <td className="py-2 pr-4 text-right">{a.averageHeartrate ? Math.round(a.averageHeartrate) : "–"}</td>
                <td className="py-2 text-right">{a.trainingLoad ? Math.round(a.trainingLoad) : "–"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
