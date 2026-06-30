import { cn } from '@/lib/utils'
import { ShieldCheck } from 'lucide-react'

interface EvidenceBadgeProps {
  caseId: string
  evidenceId?: string
  className?: string
}

export function EvidenceBadge({ caseId, evidenceId, className }: EvidenceBadgeProps) {
  return (
    <div className={cn('flex items-center gap-2 px-2.5 py-1.5 rounded border border-signal-green/30 bg-signal-green/5', className)}>
      <ShieldCheck className="w-3.5 h-3.5 text-signal-green flex-shrink-0" />
      <div>
        <div className="font-mono text-[10px] text-signal-green font-semibold">{caseId}</div>
        {evidenceId && <div className="font-mono text-[9px] text-text-muted">EV-{evidenceId}</div>}
      </div>
    </div>
  )
}
