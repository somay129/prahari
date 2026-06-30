'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const SECTIONS = [
  { roman: 'I',    href: '/',         label: 'Overview' },
  { roman: 'II',   href: '/currency', label: 'Currency Verification' },
  { roman: 'III',  href: '/scam',     label: 'Scam Detection' },
  { roman: 'IV',   href: '/fraud',    label: 'Fraud Networks' },
  { roman: 'V',    href: '/map',      label: 'Crime Map' },
  { roman: 'VI',   href: '/citizen',  label: 'Citizen Shield' },
  { roman: 'VII',  href: '/evidence', label: 'Evidence Vault' },
  { roman: 'VIII', href: '/metrics',  label: 'Metrics' },
]

export function IndexRail() {
  const pathname = usePathname()

  return (
    <aside className="w-52 flex-shrink-0 flex flex-col border-r border-ink-border bg-ink-panel">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-ink-border">
        <div className="flex items-baseline gap-2.5">
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ background: '#9B2C22', marginBottom: '1px' }}
          />
          <div>
            <div
              className="text-ink-bright tracking-tight font-spectral"
              style={{ fontSize: 17, fontWeight: 400, lineHeight: 1.1 }}
            >
              PRAHARI
            </div>
            <div className="label-caps text-ink-muted mt-0.5" style={{ fontSize: 9 }}>
              Intelligence Platform
            </div>
          </div>
        </div>
      </div>

      {/* Case file index */}
      <nav className="flex-1 py-3 overflow-y-auto">
        <div className="px-5 pb-2 pt-1">
          <div className="label-caps text-ink-muted" style={{ fontSize: 9 }}>Case File Index</div>
        </div>
        {SECTIONS.map(({ roman, href, label }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-baseline gap-3 px-5 py-2 transition-colors group ${
                active
                  ? 'bg-ink-raised border-l-2 border-l-oxblood'
                  : 'border-l-2 border-l-transparent hover:bg-ink-raised/60'
              }`}
            >
              <span
                className="font-mono flex-shrink-0 text-right"
                style={{
                  fontSize: 9,
                  width: 22,
                  letterSpacing: '0.04em',
                  color: active ? '#9B2C22' : '#3A3A42',
                }}
              >
                {roman}
              </span>
              <span
                className={`text-xs leading-tight font-geist transition-colors ${
                  active
                    ? 'text-ink-bright'
                    : 'text-ink-muted group-hover:text-ink-sub'
                }`}
                style={{ fontSize: 11 }}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* Footer note */}
      <div className="px-5 py-3 border-t border-ink-border">
        <div className="font-mono text-ink-dim" style={{ fontSize: 9, lineHeight: 1.6 }}>
          <div>0 external API calls</div>
          <div>Offline capable</div>
        </div>
      </div>
    </aside>
  )
}
