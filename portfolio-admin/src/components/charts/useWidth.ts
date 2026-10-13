"use client"

import { useEffect, useRef, useState } from "react"

// Tracks an element's width so SVG text stays at real pixel size
export function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    if (!ref.current) return
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return [ref, width] as const
}
