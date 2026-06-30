'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'

export function TopBar() {
  const [time, setTime] = useState('')

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString('en-IN', { hour12: false, timeZone: 'Asia/Kolkata' }) + ' IST')
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="h-11 flex-shrink-0 border-b border-bg-border bg-bg-panel flex items-center px-4 gap-4">
      <div className="flex-1 flex items-center gap-3">
        <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-widest">
          Digital Public Safety Intelligence Platform
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-signal-amber/40 bg-signal-amber/10">
          <AlertTriangle className="w-3 h-3 text-signal-amber" />
          <span className="text-[10px] font-bold text-signal-amber font-mono tracking-widest uppercase">
            DEMO DATA
          </span>
        </div>

        <div className="h-4 w-px bg-bg-border" />

        <span className="text-[11px] text-text-muted font-mono tabular-nums">{time}</span>

        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-signal-green animate-pulse" />
          <span className="text-[10px] text-signal-green font-mono">ONLINE</span>
        </div>
      </div>
    </header>
  )
}
