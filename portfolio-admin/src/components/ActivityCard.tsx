type Props = {
  name: string
  type: string
  distance: number
  movingTime: number
  startDate: string
}

export default function ActivityCard({
  name,
  type,
  distance,
  movingTime,
  startDate,
}: Props) {
  const km = (distance / 1000).toFixed(2)

  const time = new Date(movingTime * 1000).toISOString().slice(11, 19)

  return (
    <div className="p-6 rounded-xl bg-white shadow hover:shadow-lg transition">
      <h2 className="text-xl font-semibold mb-2">{name}</h2>

      <p className="text-gray-500 mb-4">{type}</p>

      <div className="flex gap-6 text-sm text-gray-600">
        <span>Distance: {km} km</span>
        <span>Time: {time}</span>
      </div>

      <p className="text-gray-400 text-sm mt-4">{startDate}</p>
    </div>
  )
}
