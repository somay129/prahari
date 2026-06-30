import { cn } from '@/lib/utils'

interface EvidenceSurfaceProps {
  children: React.ReactNode
  className?: string
  noPad?: boolean
}

export function EvidenceSurface({ children, className, noPad = false }: EvidenceSurfaceProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden paper-grain',
        !noPad && 'p-6',
        className,
      )}
      style={{ background: '#F3EFE6', color: '#1A1814' }}
    >
      {children}
    </div>
  )
}

interface EvidenceHeaderProps {
  title: string
  sub?: string
  right?: React.ReactNode
  number?: string
}

export function EvidenceHeader({ title, sub, right, number }: EvidenceHeaderProps) {
  return (
    <div
      className="flex items-start justify-between pb-4 mb-5"
      style={{ borderBottom: '1px solid #D8D2C4' }}
    >
      <div>
        <div className="flex items-baseline gap-3">
          {number && (
            <span
              className="font-mono"
              style={{ fontSize: 10, color: '#B5AFA4', letterSpacing: '0.06em' }}
            >
              {number}
            </span>
          )}
          <h2
            className="font-spectral"
            style={{ fontSize: 20, fontWeight: 400, lineHeight: 1.15, color: '#1A1814' }}
          >
            {title}
          </h2>
        </div>
        {sub && (
          <div style={{ fontSize: 11, color: '#7A7269', marginTop: 4, fontFamily: 'var(--font-geist-sans)' }}>
            {sub}
          </div>
        )}
      </div>
      {right && <div className="ml-4 flex-shrink-0">{right}</div>}
    </div>
  )
}
