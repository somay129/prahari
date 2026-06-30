'use client'

import { useEffect, useRef, useState } from 'react'

export interface TracePoint {
  idx: number
  score: number
  patterns: { tag: string; label: string; severity: string }[]
  text?: string
}

interface SignalTraceProps {
  points: TracePoint[]
  height?: number
  live?: boolean
}

const THRESHOLD = 75
const COL_NORMAL  = '#3B6B4A'
const COL_CAUTION = '#B7791F'
const COL_CRIT    = '#9B2C22'
const COL_GRID    = '#26262B'

function scoreColour(s: number) {
  if (s >= THRESHOLD) return COL_CRIT
  if (s >= 50) return COL_CAUTION
  return COL_NORMAL
}

export function SignalTrace({ points, height = 200, live = false }: SignalTraceProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [width, setWidth] = useState(600)

  useEffect(() => {
    const obs = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect.width
      if (w) setWidth(w)
    })
    if (svgRef.current?.parentElement) obs.observe(svgRef.current.parentElement)
    return () => obs.disconnect()
  }, [])

  const PAD = { l: 40, r: 16, t: 16, b: 32 }
  const W = width - PAD.l - PAD.r
  const H = height - PAD.t - PAD.b
  const n = Math.max(points.length, 1)

  const xOf = (i: number) => (i / Math.max(n - 1, 1)) * W
  const yOf = (s: number) => H - (s / 100) * H

  const buildPath = () => {
    if (points.length === 0) return ''
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xOf(i).toFixed(1)},${yOf(p.score).toFixed(1)}`).join(' ')
  }

  const threshY = yOf(THRESHOLD)

  const annotationsByIdx = new Map<number, TracePoint['patterns']>()
  points.forEach(p => {
    if (p.patterns.length > 0) annotationsByIdx.set(p.idx, p.patterns)
  })

  const currentScore = points.length > 0 ? points[points.length - 1].score : 0
  const traceCol = scoreColour(currentScore)
  const isCrit = currentScore >= THRESHOLD

  return (
    <div className="relative w-full" style={{ height }}>
      <svg
        ref={svgRef}
        width="100%"
        height={height}
        style={{ display: 'block', overflow: 'visible' }}
      >
        <defs>
          <clipPath id="trace-clip">
            <rect x={PAD.l} y={PAD.t} width={W} height={H} />
          </clipPath>
          {isCrit && (
            <linearGradient id="crit-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#9B2C22" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#9B2C22" stopOpacity="0" />
            </linearGradient>
          )}
        </defs>

        {/* Grid lines — Y axis */}
        {[0, 25, 50, 75, 100].map(v => {
          const y = PAD.t + yOf(v)
          return (
            <g key={v}>
              <line
                x1={PAD.l} y1={y} x2={PAD.l + W} y2={y}
                stroke={v === THRESHOLD ? '#9B2C22' : COL_GRID}
                strokeWidth={v === THRESHOLD ? 0.75 : 0.5}
                strokeDasharray={v === THRESHOLD ? 'none' : '3 4'}
                opacity={v === THRESHOLD ? 0.6 : 0.4}
              />
              <text
                x={PAD.l - 6}
                y={y + 3.5}
                textAnchor="end"
                fill={v === THRESHOLD ? '#9B2C22' : '#3A3A42'}
                style={{ fontFamily: 'var(--font-geist-mono)', fontSize: 8, opacity: 0.8 }}
              >
                {v}
              </text>
            </g>
          )
        })}

        {/* Threshold label */}
        <text
          x={PAD.l + W + 4}
          y={PAD.t + threshY + 3}
          fill="#9B2C22"
          style={{ fontFamily: 'var(--font-geist-sans)', fontSize: 8, fontWeight: 600, letterSpacing: '0.06em' }}
          opacity={0.8}
        >
          CRITICAL
        </text>

        {/* Critical fill above threshold */}
        {isCrit && points.length > 1 && (
          <polygon
            clipPath="url(#trace-clip)"
            points={[
              `${PAD.l + xOf(0)},${PAD.t + H}`,
              ...points.map(p => `${PAD.l + xOf(p.idx)},${PAD.t + yOf(p.score)}`),
              `${PAD.l + xOf(points.length - 1)},${PAD.t + H}`,
            ].join(' ')}
            fill="url(#crit-grad)"
          />
        )}

        {/* Trace line */}
        {points.length > 1 && (
          <path
            clipPath="url(#trace-clip)"
            d={buildPath()}
            transform={`translate(${PAD.l}, ${PAD.t})`}
            fill="none"
            stroke={traceCol}
            strokeWidth={1.5}
            strokeLinejoin="round"
            strokeLinecap="round"
            className={live ? 'trace-draw' : ''}
          />
        )}

        {/* Pattern annotations */}
        {Array.from(annotationsByIdx.entries()).map(([idx, pats]) => {
          const x = PAD.l + xOf(idx)
          const y = PAD.t + yOf(points.find(p => p.idx === idx)?.score ?? 0)
          return (
            <g key={idx}>
              <line x1={x} y1={PAD.t} x2={x} y2={PAD.t + H} stroke="#B7791F" strokeWidth={0.75} strokeDasharray="2 3" opacity={0.5} />
              <circle cx={x} cy={y} r={3} fill="#B7791F" opacity={0.9} />
              <text
                x={x + 4}
                y={PAD.t + 10}
                fill="#B7791F"
                style={{ fontFamily: 'var(--font-geist-sans)', fontSize: 7.5, letterSpacing: '0.05em' }}
                opacity={0.85}
              >
                {pats[0]?.label?.slice(0, 14)}
              </text>
            </g>
          )
        })}

        {/* Live dot */}
        {live && points.length > 0 && (
          <circle
            cx={PAD.l + xOf(points.length - 1)}
            cy={PAD.t + yOf(currentScore)}
            r={3}
            fill={traceCol}
          />
        )}

        {/* Axes */}
        <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={PAD.t + H} stroke="#3A3A42" strokeWidth={0.75} />
        <line x1={PAD.l} y1={PAD.t + H} x2={PAD.l + W} y2={PAD.t + H} stroke="#3A3A42" strokeWidth={0.75} />

        {/* Axis labels */}
        <text
          x={PAD.l + W / 2}
          y={height - 4}
          textAnchor="middle"
          fill="#3A3A42"
          style={{ fontFamily: 'var(--font-geist-sans)', fontSize: 8, letterSpacing: '0.06em' }}
        >
          SESSION TIMELINE
        </text>
        <text
          x={8}
          y={PAD.t + H / 2}
          textAnchor="middle"
          fill="#3A3A42"
          transform={`rotate(-90, 8, ${PAD.t + H / 2})`}
          style={{ fontFamily: 'var(--font-geist-sans)', fontSize: 8, letterSpacing: '0.06em' }}
        >
          RISK
        </text>
      </svg>
    </div>
  )
}
