'use client'

import { useEffect, useState, useCallback } from 'react'
import { apiFetch } from '@/lib/api'
import { Readout } from '@/components/ui/Readout'
import { EvidenceSeal } from '@/components/ui/EvidenceSeal'
import { VerifyPill } from '@/components/ui/VerifyPill'
import { ConsolePanel, PanelHeader } from '@/components/ui/ConsolePanel'
import { formatINR } from '@/lib/utils'

interface OverviewStats {
  notes_verified: number
  scam_sessions_flagged: number
  fraud_rings_surfaced: number
  evidence_packages_generated: number
  total_exposure_prevented_inr: number
  citizen_checks: number
}

interface EvidenceRecord {
  id: string
  case_id: string
  source_module: string
  timestamp: string
  verdict: string
  confidence: number
}

const MODULE_COL: Record<string, string> = {
  currency: '#B7791F', scam: '#9B2C22', fraud: '#9B2C22', citizen: '#3B6B4A',
}
const MODULE_LABEL: Record<string, string> = {
  currency: 'Currency', scam: 'Scam', fraud: 'Fraud', citizen: 'Citizen',
}

export default function OverviewPage() {
  const [stats, setStats] = useState<OverviewStats | null>(null)
  const [register, setRegister] = useState<EvidenceRecord[]>([])
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)

  const refresh = useCallback(() => {
    apiFetch<OverviewStats>('/metrics/overview').then(setStats).catch(() => {})
    apiFetch<{ total: number; records: EvidenceRecord[] }>('/evidence/?limit=8')
      .then(r => { setRegister(r.records); setLastRefreshed(new Date()) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, 30_000)
    return () => clearInterval(id)
  }, [refresh])

  return (
    <div className="flex h-full min-h-0">
      {/* ── Primary canvas ───────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-8 py-7 min-w-0">

        {/* Page header */}
        <div className="mb-8 pb-6 border-b border-ink-border">
          <div className="label-caps text-ink-dim mb-1" style={{ fontSize: 9 }}>I · Operations</div>
          <h1
            className="font-spectral text-ink-bright"
            style={{ fontSize: 28, fontWeight: 300, lineHeight: 1.15, letterSpacing: '-0.01em' }}
          >
            Overview
          </h1>
          <p className="text-ink-muted mt-1.5" style={{ fontSize: 12 }}>
            Point-of-contact threat detection — stopping fraud at the point of contact, not the point of complaint.
          </p>
        </div>

        {/* Metric readout row */}
        <div
          className="grid grid-cols-2 lg:grid-cols-4 gap-0 mb-8"
          style={{ borderTop: '1px solid #26262B', borderLeft: '1px solid #26262B' }}
        >
          {[
            { val: stats?.notes_verified ?? 0,              unit: 'Notes Verified',     colour: 'default' as const },
            { val: stats?.scam_sessions_flagged ?? 0,       unit: 'Sessions Flagged',   colour: 'oxblood' as const },
            { val: stats?.fraud_rings_surfaced ?? 0,        unit: 'Rings Surfaced',     colour: 'ochre'   as const },
            { val: stats?.evidence_packages_generated ?? 0, unit: 'Evidence Records',   colour: 'forest'  as const },
          ].map(m => (
            <div
              key={m.unit}
              className="px-6 py-5"
              style={{ borderRight: '1px solid #26262B', borderBottom: '1px solid #26262B' }}
            >
              <Readout value={m.val} unit={m.unit} size="lg" colour={m.colour} animate />
            </div>
          ))}
        </div>

        {/* Detection register */}
        <ConsolePanel noPad border>
          <PanelHeader
            title="Detection Register"
            sub="All modules · evidence vault · reverse chronological"
            serif
            right={
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: '#3B6B4A', animation: 'pulse 2s infinite' }}
                  />
                  <span className="label-caps text-ink-dim" style={{ fontSize: 9 }}>LIVE</span>
                </div>
                {lastRefreshed && (
                  <span className="label-caps text-ink-dim" style={{ fontSize: 9 }}>
                    Updated {lastRefreshed.toLocaleTimeString('en-IN', { hour12: false, timeZone: 'Asia/Kolkata' })} IST
                  </span>
                )}
              </div>
            }
          />
          {register.length === 0 ? (
            <div className="py-14 text-center">
              <div className="font-spectral text-ink-dim" style={{ fontSize: 18, fontWeight: 300 }}>
                No evidence records yet
              </div>
              <p style={{ fontSize: 11, color: '#3A3A42', marginTop: 6, lineHeight: 1.6 }}>
                Run a currency check, scam analysis, or fraud ring seal to populate this register.
              </p>
            </div>
          ) : (
            <table className="ledger">
              <thead>
                <tr>
                  <th>Case ID</th>
                  <th>Module</th>
                  <th>Verdict</th>
                  <th className="num">Confidence</th>
                  <th className="num">Timestamp UTC</th>
                </tr>
              </thead>
              <tbody>
                {register.map(r => (
                  <tr key={r.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <EvidenceSeal caseId={r.case_id} size="sm" />
                        <span
                          className="font-mono"
                          style={{ fontSize: 11, color: '#9A9AA5', letterSpacing: '0.04em' }}
                        >
                          {r.case_id}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span
                        className="label-caps"
                        style={{ fontSize: 9, color: MODULE_COL[r.source_module] ?? '#6B6B72' }}
                      >
                        {MODULE_LABEL[r.source_module] ?? r.source_module}
                      </span>
                    </td>
                    <td>
                      <VerifyPill label={r.verdict} />
                    </td>
                    <td className="num">
                      <span className="font-mono tabular-nums" style={{ fontSize: 11, color: '#9A9AA5' }}>
                        {r.confidence != null ? `${(r.confidence * 100).toFixed(1)}%` : '—'}
                      </span>
                    </td>
                    <td className="num">
                      <span className="font-mono" style={{ fontSize: 10, color: '#6B6B72' }}>
                        {new Date(r.timestamp).toISOString().slice(0, 19).replace('T', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </ConsolePanel>
      </div>

      {/* ── Margin column ──────────────────────────────── */}
      <div
        className="w-56 flex-shrink-0 overflow-y-auto py-7 px-5 flex flex-col gap-6"
        style={{ borderLeft: '1px solid #26262B' }}
      >
        {/* Exposure prevented */}
        <div>
          <div className="label-caps text-ink-dim mb-3" style={{ fontSize: 9 }}>Exposure Prevented</div>
          <Readout
            value={stats ? formatINR(stats.total_exposure_prevented_inr) : '—'}
            unit="Est. INR"
            size="md"
            colour="forest"
            animate={false}
          />
        </div>

        <hr className="rule" />

        {/* Citizen checks */}
        <div>
          <div className="label-caps text-ink-dim mb-3" style={{ fontSize: 9 }}>Citizen Checks</div>
          <Readout value={stats?.citizen_checks ?? 0} unit="Self-assessments" size="md" animate />
        </div>

        <hr className="rule" />

        {/* System status */}
        <div>
          <div className="label-caps text-ink-dim mb-3" style={{ fontSize: 9 }}>System Status</div>
          <div className="space-y-2.5">
            {[
              ['Currency Engine',  true],
              ['Scam Engine',      true],
              ['Fraud Graph',      true],
              ['Evidence Vault',   true],
              ['Offline Mode',     true],
              ['External APIs',    false, '0 calls'],
            ].map(([label, ok, note]) => (
              <div key={String(label)} className="flex items-center justify-between">
                <span style={{ fontSize: 10, color: '#6B6B72' }}>{label as string}</span>
                <span
                  className="label-caps"
                  style={{ fontSize: 8, color: ok ? '#3B6B4A' : '#9B2C22' }}
                >
                  {note ? String(note) : (ok ? 'READY' : 'OFFLINE')}
                </span>
              </div>
            ))}
          </div>
        </div>

        <hr className="rule" />

        {/* Latest evidence seal — dynamic */}
        <div>
          <div className="label-caps text-ink-dim mb-3" style={{ fontSize: 9 }}>Latest Evidence</div>
          {register[0] ? (
            <div className="flex justify-center">
              <EvidenceSeal
                caseId={register[0].case_id}
                engineVersion="PRAHARI-1.0.0"
                size="md"
                animate
              />
            </div>
          ) : (
            <div className="text-center" style={{ fontSize: 10, color: '#3A3A42' }}>
              No records yet
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
