import { cn } from '@/lib/utils'

interface ConsolePanelProps {
  children: React.ReactNode
  className?: string
  noPad?: boolean
  border?: boolean
}

export function ConsolePanel({ children, className, noPad = false, border = true }: ConsolePanelProps) {
  return (
    <div
      className={cn(
        'bg-ink-panel',
        border && 'border border-ink-border',
        !noPad && 'p-5',
        className,
      )}
    >
      {children}
    </div>
  )
}

interface PanelHeaderProps {
  title: string
  sub?: string
  right?: React.ReactNode
  serif?: boolean
}

export function PanelHeader({ title, sub, right, serif = false }: PanelHeaderProps) {
  return (
    <div className="flex items-start justify-between pb-3 mb-4 border-b border-ink-border">
      <div>
        {serif ? (
          <h2
            className="font-spectral text-ink-bright"
            style={{ fontSize: 18, fontWeight: 400, lineHeight: 1.2 }}
          >
            {title}
          </h2>
        ) : (
          <div className="label-caps text-ink-sub">{title}</div>
        )}
        {sub && <div className="text-xs text-ink-muted mt-1">{sub}</div>}
      </div>
      {right && <div className="flex items-center gap-2 ml-4 flex-shrink-0">{right}</div>}
    </div>
  )
}
