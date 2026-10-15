"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

type Item = { name: string; path: string }

// Pill navigation for a private section; the first item is the section root
export default function SectionNav({ items }: { items: Item[] }) {
  const pathname = usePathname()

  return (
    <nav className="mb-8 flex flex-wrap gap-2">
      {items.map((item, i) => {
        const active = i === 0 ? pathname === item.path : pathname.startsWith(item.path)
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
