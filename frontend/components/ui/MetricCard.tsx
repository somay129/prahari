import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  label: string
  value: string | number
  sub?: string
  icon?: LucideIcon
  accent?: 'blue' | 'green' | 'amber' | 'red'
  className?: string
}

const ACCENT_STYLES = {
  blue:  'border-signal-blue/30 bg-signal-blue/5',
  green: 'border-signal-green/30 bg-signal-green/5',
  amber: 'border-signal-amber/30 bg-signal-amber/5',
  red:   'border-signal-red/30 bg-signal-red/5',
}
const ACCENT_ICON = {
  blue: 'text-signal-blue', green: 'text-signal-green',
  amber: 'text-signal-amber', red: 'text-signal-red',
}

export function MetricCard({ label, value, sub, icon: Icon, accent = 'blue', className }: MetricCardProps) {
  return (
    <div className={cn(
      'rounded border p-4 bg-bg-panel',
      ACCENT_STYLES[accent],
      className
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-text-muted mb-1">{label}</div>
          <div className="text-2xl font-bold font-mono text-text-primary tabular-nums">{value}</div>
          {sub && <div className="text-[11px] text-text-muted mt-1">{sub}</div>}
        </div>
        {Icon && (
          <div className={cn('flex-shrink-0 mt-0.5', ACCENT_ICON[accent])}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  )
}
