'use client'

import { useEffect, useState } from 'react'

export function ConsoleTopBar() {
  const [time, setTime] = useState('')
  const [date, setDate] = useState('')

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString('en-IN', { hour12: false, timeZone: 'Asia/Kolkata' }))
      setDate(now.toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata',
      }).toUpperCase())
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <header className="h-10 flex-shrink-0 border-b border-ink-border bg-ink-panel flex items-center px-5 gap-0">
      {/* Left: classification bar */}
      <div
        className="flex items-center gap-2 px-2.5 py-1 mr-4"
        style={{ borderRight: '1px solid #26262B' }}
      >
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#B7791F' }} />
        <span className="label-caps" style={{ color: '#B7791F', fontSize: 9 }}>DEMO DATA</span>
      </div>

      {/* Centre: platform label */}
      <div className="flex-1">
        <span className="label-caps text-ink-dim" style={{ fontSize: 9 }}>
          Digital Public Safety Intelligence Platform
        </span>
      </div>

      {/* Right: datetime + status */}
      <div className="flex items-center gap-4">
        <div className="font-mono text-ink-muted" style={{ fontSize: 10 }}>
          <span className="text-ink-sub">{date}</span>
          <span className="mx-2 text-ink-dim">·</span>
          <span className="text-ink-text tabular-nums">{time}</span>
          <span className="ml-1 text-ink-dim" style={{ fontSize: 9 }}>IST</span>
        </div>

        <div
          className="flex items-center gap-1.5 pl-4"
          style={{ borderLeft: '1px solid #26262B' }}
        >
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: '#3B6B4A', animation: 'pulse 2s infinite' }}
          />
          <span className="label-caps" style={{ color: '#3B6B4A', fontSize: 9 }}>
            ALL SYSTEMS OPERATIONAL
          </span>
        </div>
      </div>
    </header>
  )
}
