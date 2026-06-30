import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface SectionHeaderProps {
  title: string
  subtitle?: string
  icon?: LucideIcon
  actions?: React.ReactNode
  className?: string
}

export function SectionHeader({ title, subtitle, icon: Icon, actions, className }: SectionHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4 mb-6', className)}>
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-8 h-8 rounded bg-signal-blue/15 border border-signal-blue/30 flex items-center justify-center flex-shrink-0">
            <Icon className="w-4 h-4 text-signal-blue" />
          </div>
        )}
        <div>
          <h1 className="text-base font-bold text-text-primary tracking-tight">{title}</h1>
          {subtitle && <p className="text-[12px] text-text-muted mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  )
}
