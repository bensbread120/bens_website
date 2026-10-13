"use client"

import { useState } from "react"
import { CHART, FORMATTERS, compact, niceTicks, type Unit } from "./scale"
import { useWidth } from "./useWidth"

export type ColumnDatum = {
  label: string
  value: number
  // Extra tooltip lines
  detail?: string[]
  // Rendered lighter, e.g. the current week in progress
  partial?: boolean
}

type Props = {
  data: ColumnDatum[]
  unit: Unit
  title: string
  height?: number
}

const M = { top: 12, right: 8, bottom: 28, left: 40 }

// Single-series column chart with a per-column hover tooltip
export default function ColumnChart({ data, unit, title, height = 220 }: Props) {
  const format = FORMATTERS[unit]
  const [ref, width] = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)

  const plotW = Math.max(0, width - M.left - M.right)
  const plotH = height - M.top - M.bottom
  const ticks = niceTicks(0, Math.max(...data.map((d) => d.value), 1))
  const yMax = ticks[ticks.length - 1]
  const y = (v: number) => M.top + plotH - (v / yMax) * plotH
  const band = data.length ? plotW / data.length : 0
  const barW = Math.min(24, band * 0.6)
  const labelEvery = Math.max(1, Math.ceil(data.length / Math.max(1, plotW / 56)))

  return (
    <figure>
      <div ref={ref} className="relative" style={{ height }}>
        {width > 0 && (
          <svg width={width} height={height} role="img" aria-label={title} onPointerLeave={() => setHover(null)}>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={M.left} x2={width - M.right} y1={y(t)} y2={y(t)} stroke={t === 0 ? CHART.axis : CHART.grid} />
                <text x={M.left - 6} y={y(t)} dy="0.32em" textAnchor="end" fontSize={11} fill={CHART.muted} style={{ fontVariantNumeric: "tabular-nums" }}>
                  {compact(t)}
                </text>
              </g>
            ))}

            {data.map((d, i) => {
              const x = M.left + i * band + (band - barW) / 2
              const h = Math.max(0, y(0) - y(d.value))
              return (
                <g key={d.label}>
                  {h > 0 && (
                    <path
                      d={roundedTop(x, y(d.value), barW, h, Math.min(4, h, barW / 2))}
                      fill={d.partial ? CHART.seriesLight : CHART.series[0]}
                      opacity={hover === null || hover === i ? 1 : 0.6}
                    />
                  )}
                  {i % labelEvery === 0 && (
                    <text x={x + barW / 2} y={height - 10} textAnchor="middle" fontSize={11} fill={CHART.muted}>
                      {d.label}
                    </text>
                  )}
                  {/* Hit target spans the whole band, larger than the mark */}
                  <rect x={M.left + i * band} y={M.top} width={band} height={plotH} fill="transparent" onPointerEnter={() => setHover(i)} />
                </g>
              )
            })}
          </svg>
        )}

        {hover !== null && data[hover] && (
          <Tooltip x={M.left + hover * band + band / 2} width={width}>
            <div className="font-medium text-gray-900">{data[hover].label}</div>
            <div className="text-gray-700">{format(data[hover].value)}{data[hover].partial ? " so far" : ""}</div>
            {data[hover].detail?.map((line) => (
              <div key={line} className="text-gray-500">{line}</div>
            ))}
          </Tooltip>
        )}
      </div>

      <details className="mt-2 text-sm text-gray-500">
        <summary className="cursor-pointer">Show data</summary>
        <table className="mt-2 w-full text-left">
          <tbody>
            {data.map((d) => (
              <tr key={d.label} className="border-t border-gray-100">
                <td className="py-1">{d.label}</td>
                <td className="py-1 text-right tabular-nums">{format(d.value)}</td>
                <td className="py-1 pl-4">{d.detail?.join(" · ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  )
}

export function Tooltip({ x, width, children }: { x: number; width: number; children: React.ReactNode }) {
  const flip = x > width - 160
  return (
    <div
      className="pointer-events-none absolute top-0 z-10 rounded-md border border-black/10 bg-white px-3 py-2 text-xs shadow-md"
      style={flip ? { right: width - x + 8 } : { left: x + 8 }}
    >
      {children}
    </div>
  )
}

function roundedTop(x: number, y: number, w: number, h: number, r: number) {
  return `M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h} Z`
}
