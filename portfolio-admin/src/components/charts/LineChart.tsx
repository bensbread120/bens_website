"use client"

import { useState } from "react"
import { Tooltip } from "./ColumnChart"
import { CHART, FORMATTERS, compact, niceTicks, type Unit } from "./scale"
import { useWidth } from "./useWidth"

export type LineSeries = {
  name: string
  color: string
  values: number[]
}

type Props = {
  labels: string[]
  series: LineSeries[]
  unit: Unit
  title: string
  height?: number
}

const M = { top: 12, right: 12, bottom: 28, left: 40 }

// Line chart with a shared crosshair tooltip. One y-axis only.
export default function LineChart({ labels, series, unit, title, height = 240 }: Props) {
  const format = FORMATTERS[unit]
  const [ref, width] = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)

  const all = series.flatMap((s) => s.values)
  const ticks = niceTicks(Math.min(0, ...all), Math.max(1, ...all))
  const yMin = ticks[0]
  const yMax = ticks[ticks.length - 1]
  const plotW = Math.max(0, width - M.left - M.right)
  const plotH = height - M.top - M.bottom
  const step = labels.length > 1 ? plotW / (labels.length - 1) : 0
  const x = (i: number) => M.left + i * step
  const y = (v: number) => M.top + plotH - ((v - yMin) / (yMax - yMin)) * plotH
  const xTickEvery = Math.max(1, Math.ceil(labels.length / Math.max(1, plotW / 90)))

  function onMove(event: React.PointerEvent<SVGSVGElement>) {
    const box = event.currentTarget.getBoundingClientRect()
    const i = Math.round((event.clientX - box.left - M.left) / (step || 1))
    setHover(Math.min(labels.length - 1, Math.max(0, i)))
  }

  return (
    <figure>
      {series.length > 1 && (
        <figcaption className="mb-2 flex flex-wrap gap-4 text-xs text-gray-600">
          {series.map((s) => (
            <span key={s.name} className="flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-4 rounded" style={{ background: s.color }} />
              {s.name}
            </span>
          ))}
        </figcaption>
      )}

      <div ref={ref} className="relative" style={{ height }}>
        {width > 0 && labels.length > 0 && (
          <svg width={width} height={height} role="img" aria-label={title} onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={M.left} x2={width - M.right} y1={y(t)} y2={y(t)} stroke={t === 0 ? CHART.axis : CHART.grid} />
                <text x={M.left - 6} y={y(t)} dy="0.32em" textAnchor="end" fontSize={11} fill={CHART.muted} style={{ fontVariantNumeric: "tabular-nums" }}>
                  {compact(t)}
                </text>
              </g>
            ))}

            {labels.map((label, i) =>
              i % xTickEvery === 0 ? (
                <text key={label} x={x(i)} y={height - 10} textAnchor="middle" fontSize={11} fill={CHART.muted}>
                  {label}
                </text>
              ) : null
            )}

            {series.map((s) => (
              <path
                key={s.name}
                d={s.values.map((v, i) => `${i ? "L" : "M"}${x(i)},${y(v)}`).join(" ")}
                fill="none"
                stroke={s.color}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ))}

            {hover !== null && (
              <g>
                <line x1={x(hover)} x2={x(hover)} y1={M.top} y2={M.top + plotH} stroke={CHART.axis} />
                {series.map((s) => (
                  <circle key={s.name} cx={x(hover)} cy={y(s.values[hover])} r={4} fill={s.color} stroke={CHART.surface} strokeWidth={2} />
                ))}
              </g>
            )}

            <rect x={M.left} y={M.top} width={plotW} height={plotH} fill="transparent" />
          </svg>
        )}

        {hover !== null && labels[hover] && (
          <Tooltip x={x(hover)} width={width}>
            <div className="font-medium text-gray-900">{labels[hover]}</div>
            {series.map((s) => (
              <div key={s.name} className="flex items-center gap-1.5 text-gray-700">
                <span className="inline-block h-2 w-2 rounded-full" style={{ background: s.color }} />
                {s.name}: {format(s.values[hover])}
              </div>
            ))}
          </Tooltip>
        )}
      </div>

      <details className="mt-2 text-sm text-gray-500">
        <summary className="cursor-pointer">Show data</summary>
        <div className="max-h-64 overflow-y-auto">
          <table className="mt-2 w-full text-left">
            <thead>
              <tr>
                <th className="py-1 font-medium">Date</th>
                {series.map((s) => (
                  <th key={s.name} className="py-1 text-right font-medium">{s.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {labels.map((label, i) => (
                <tr key={label} className="border-t border-gray-100">
                  <td className="py-1">{label}</td>
                  {series.map((s) => (
                    <td key={s.name} className="py-1 text-right tabular-nums">{format(s.values[i])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  )
}
