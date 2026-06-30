'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface ReadoutProps {
  value: number | string
  unit?: string
  label?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  colour?: 'default' | 'oxblood' | 'forest' | 'ochre' | 'muted'
  animate?: boolean
  prefix?: string
  className?: string
}

const COLOUR_MAP = {
  default:  '#E8E6E1',
  oxblood:  '#9B2C22',
  forest:   '#3B6B4A',
  ochre:    '#B7791F',
  muted:    '#6B6B72',
}

const SIZE_MAP = {
  sm:  { val: 22, unit: 9,  label: 9  },
  md:  { val: 32, unit: 10, label: 9  },
  lg:  { val: 48, unit: 11, label: 10 },
  xl:  { val: 64, unit: 13, label: 10 },
}

function tickCount(from: number, to: number, duration = 400): (cb: (v: number) => void) => () => void {
  return (cb) => {
    const start = performance.now()
    const diff = to - from
    const raf = (now: number) => {
      const p = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      cb(Math.round(from + diff * eased))
      if (p < 1) requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)
    return () => {}
  }
}

export function Readout({ value, unit, label, size = 'md', colour = 'default', animate = true, prefix, className }: ReadoutProps) {
  const isNumeric = typeof value === 'number'
  const [displayed, setDisplayed] = useState(isNumeric ? 0 : value)
  const prev = useRef(0)

  useEffect(() => {
    if (!isNumeric || !animate) { setDisplayed(value); return }
    const cancel = tickCount(prev.current, value as number)(setDisplayed)
    prev.current = value as number
    return cancel
  }, [value, isNumeric, animate])

  const sz = SIZE_MAP[size]
  const col = COLOUR_MAP[colour]

  return (
    <div className={cn('flex flex-col', className)}>
      <div
        className="readout-value tick-animate"
        style={{ fontSize: sz.val, color: col, lineHeight: 1.05, letterSpacing: '-0.02em' }}
      >
        {prefix}{isNumeric ? displayed : value}
      </div>
      {unit && (
        <div
          className="label-caps mt-0.5"
          style={{ fontSize: sz.unit, color: `${col}99` }}
        >
          {unit}
        </div>
      )}
      {label && (
        <div
          className="label-caps mt-1"
          style={{ fontSize: sz.label, color: '#6B6B72' }}
        >
          {label}
        </div>
      )}
    </div>
  )
}
