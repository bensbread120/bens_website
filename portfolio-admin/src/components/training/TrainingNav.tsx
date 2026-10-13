"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const ITEMS = [
  { name: "Dashboard", path: "/training" },
  { name: "Plan", path: "/training/plan" },
  { name: "Races", path: "/training/races" },
  { name: "Activities", path: "/training/activities" },
  { name: "Settings", path: "/training/settings" },
]

export default function TrainingNav() {
  const pathname = usePathname()

  return (
    <nav className="mb-8 flex flex-wrap gap-2">
      {ITEMS.map((item) => {
        const active = item.path === "/training" ? pathname === item.path : pathname.startsWith(item.path)
        return (
          <Link
            key={item.path}
            href={item.path}
            className={`rounded-full px-4 py-1.5 text-sm transition ${
              active ? "bg-white text-gray-900 shadow" : "bg-black/30 text-gray-100 hover:bg-black/50"
            }`}
          >
            {item.name}
          </Link>
        )
      })}
    </nav>
  )
}
