'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Banknote, Phone, Network, Map,
  Shield, Archive, BarChart3, ChevronRight
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/',          label: 'Overview',             icon: LayoutDashboard },
  { href: '/currency',  label: 'Currency Verification', icon: Banknote },
  { href: '/scam',      label: 'Scam Detection',        icon: Phone },
  { href: '/fraud',     label: 'Fraud Networks',        icon: Network },
  { href: '/map',       label: 'Crime Map',             icon: Map },
  { href: '/citizen',   label: 'Citizen Shield',        icon: Shield },
  { href: '/evidence',  label: 'Evidence Vault',        icon: Archive },
  { href: '/metrics',   label: 'Metrics',               icon: BarChart3 },
]

export function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="w-56 flex-shrink-0 flex flex-col border-r border-bg-border bg-bg-panel">
      <div className="px-4 py-5 border-b border-bg-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-signal-blue rounded flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-text-primary tracking-wide">PRAHARI</div>
            <div className="text-[10px] text-text-muted font-mono uppercase tracking-widest">v1.0.0</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-3 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded text-sm transition-colors group ${
                active
                  ? 'bg-signal-blue/15 text-signal-blue border border-signal-blue/30'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-signal-blue' : 'text-text-muted group-hover:text-text-secondary'}`} />
              <span className="flex-1 text-[13px] font-medium">{label}</span>
              {active && <ChevronRight className="w-3 h-3 text-signal-blue" />}
            </Link>
          )
        })}
      </nav>

      <div className="px-4 py-3 border-t border-bg-border">
        <div className="text-[10px] text-text-muted font-mono leading-relaxed">
          DEMO DATA<br />
          Synthetic • Evaluation only
        </div>
      </div>
    </aside>
  )
}
