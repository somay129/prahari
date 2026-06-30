import { cn } from '@/lib/utils'

type Verdict = 'GENUINE' | 'SUSPECT' | 'LIKELY COUNTERFEIT' | 'CRITICAL' | 'HIGH RISK' | 'ELEVATED' | 'LOW RISK' | 'SAFE' | 'CAUTION' | string

const STYLES: Record<string, { bg: string; text: string; border: string }> = {
  GENUINE:            { bg: 'rgba(59,107,74,0.12)',  text: '#3B6B4A', border: 'rgba(59,107,74,0.35)' },
  SAFE:               { bg: 'rgba(59,107,74,0.12)',  text: '#3B6B4A', border: 'rgba(59,107,74,0.35)' },
  'LOW RISK':         { bg: 'rgba(59,107,74,0.12)',  text: '#3B6B4A', border: 'rgba(59,107,74,0.35)' },
  SUSPECT:            { bg: 'rgba(183,121,31,0.12)', text: '#B7791F', border: 'rgba(183,121,31,0.35)' },
  CAUTION:            { bg: 'rgba(183,121,31,0.12)', text: '#B7791F', border: 'rgba(183,121,31,0.35)' },
  ELEVATED:           { bg: 'rgba(183,121,31,0.12)', text: '#B7791F', border: 'rgba(183,121,31,0.35)' },
  MEDIUM:             { bg: 'rgba(183,121,31,0.12)', text: '#B7791F', border: 'rgba(183,121,31,0.35)' },
  'LIKELY COUNTERFEIT':{ bg: 'rgba(155,44,34,0.12)', text: '#9B2C22', border: 'rgba(155,44,34,0.35)' },
  CRITICAL:           { bg: 'rgba(155,44,34,0.12)', text: '#9B2C22', border: 'rgba(155,44,34,0.35)' },
  'HIGH RISK':        { bg: 'rgba(155,44,34,0.12)', text: '#9B2C22', border: 'rgba(155,44,34,0.35)' },
  HIGH:               { bg: 'rgba(155,44,34,0.12)', text: '#9B2C22', border: 'rgba(155,44,34,0.35)' },
}

interface VerifyPillProps {
  label: string
  className?: string
  dot?: boolean
}

export function VerifyPill({ label, className, dot }: VerifyPillProps) {
  const key = Object.keys(STYLES).find(k => label.toUpperCase().includes(k)) ?? ''
  const style = STYLES[key] ?? { bg: 'rgba(107,107,114,0.12)', text: '#6B6B72', border: 'rgba(107,107,114,0.3)' }

  return (
    <span
      className={cn('inline-flex items-center gap-1.5 label-caps', className)}
      style={{
        background: style.bg,
        color: style.text,
        border: `1px solid ${style.border}`,
        padding: '3px 8px',
        borderRadius: 2,
        fontSize: 10,
      }}
    >
      {dot && (
        <span
          className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ background: style.text }}
        />
      )}
      {label}
    </span>
  )
}
