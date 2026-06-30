import { cn } from '@/lib/utils'

type Variant = 'genuine' | 'suspect' | 'counterfeit' | 'critical' | 'high' | 'medium' | 'low' | 'safe' | 'caution' | 'online' | 'default'

const VARIANT_STYLES: Record<Variant, string> = {
  genuine:     'bg-signal-green/15 text-signal-green border border-signal-green/30',
  safe:        'bg-signal-green/15 text-signal-green border border-signal-green/30',
  suspect:     'bg-signal-amber/15 text-signal-amber border border-signal-amber/30',
  caution:     'bg-signal-amber/15 text-signal-amber border border-signal-amber/30',
  medium:      'bg-signal-amber/15 text-signal-amber border border-signal-amber/30',
  low:         'bg-bg-border text-text-secondary border border-bg-border',
  counterfeit: 'bg-signal-red/15 text-signal-red border border-signal-red/30',
  critical:    'bg-signal-red/15 text-signal-red border border-signal-red/30',
  high:        'bg-signal-red/15 text-signal-red border border-signal-red/30',
  online:      'bg-signal-green/15 text-signal-green border border-signal-green/30',
  default:     'bg-bg-border text-text-secondary border border-bg-border',
}

const DOTS: Record<Variant, boolean> = {
  critical: true, high: true, counterfeit: true, online: true, genuine: false,
  suspect: false, medium: false, low: false, safe: false, caution: false, default: false,
}

interface StatusPillProps {
  variant?: Variant
  label: string
  dot?: boolean
  className?: string
}

export function StatusPill({ variant = 'default', label, dot, className }: StatusPillProps) {
  const showDot = dot ?? DOTS[variant]
  return (
    <span className={cn('status-pill', VARIANT_STYLES[variant], className)}>
      {showDot && <span className={cn('w-1.5 h-1.5 rounded-full inline-block', variant === 'online' ? 'bg-signal-green animate-pulse' : 'bg-current')} />}
      {label}
    </span>
  )
}
