"use client"

import { useEffect, useRef } from "react"
import mapboxgl from "mapbox-gl"

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

export default function ActivityMap({ geojson }: { geojson: GeoJSON.Feature<GeoJSON.LineString> | null }) {
  const mapRef = useRef<HTMLDivElement | null>(null)
  

  useEffect(() => {
    if (!mapRef.current || !geojson) return;

    const map = new mapboxgl.Map({
      container: mapRef.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: geojson.geometry.coordinates[0] as [number, number],
      zoom: 14,
    })

    map.on("load", () => {
      map.addSource("route", {
        type: "geojson",
        data: geojson,
      })

      map.addLayer({
        id: "route-line",
        type: "line",
        source: "route",
        paint: {
          "line-color": "#3b82f6",
          "line-width": 4,
        },
      })

      // Auto-fit bounds
      const bounds = geojson.geometry.coordinates.reduce(
        (b: mapboxgl.LngLatBounds, coord) =>
          b.extend(coord as [number, number]),
        new mapboxgl.LngLatBounds(
          geojson.geometry.coordinates[0] as [number, number],
          geojson.geometry.coordinates[0] as [number, number]
        )
      )

      map.fitBounds(bounds, { padding: 40 })
    })

    return () => map.remove()
  }, [geojson])

  return <div ref={mapRef} className="w-full h-[400px] rounded-xl" />
}