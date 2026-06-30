'use client'

import { useState, useEffect } from 'react'
import { apiFetch, apiUrl } from '@/lib/api'
import { EvidenceSeal } from '@/components/ui/EvidenceSeal'
import { VerifyPill } from '@/components/ui/VerifyPill'
import { ConsolePanel, PanelHeader } from '@/components/ui/ConsolePanel'

interface EvidenceRecord {
  id: string; case_id: string; source_module: string; timestamp: string
  content_hash: string; engine_version: string; verdict: string
  confidence: number; decision_trace: Record<string, any>; metadata: Record<string, any>
}

const MODULE_COLS: Record<string, string> = {
  currency: '#B7791F', scam: '#9B2C22', fraud: '#9B2C22', citizen: '#3B6B4A',
}
const MODULE_LABELS: Record<string, string> = {
  currency: 'Currency', scam: 'Scam', fraud: 'Fraud', citizen: 'Citizen',
}

export default function EvidencePage() {
  const [records, setRecords] = useState<EvidenceRecord[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [moduleFilter, setModuleFilter] = useState('')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 20

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(page * PAGE_SIZE) })
    if (moduleFilter) params.set('module', moduleFilter)
    apiFetch<{ total: number; records: EvidenceRecord[] }>(`/evidence/?${params}`)
      .then(r => { setTotal(r.total); setRecords(r.records) })
      .catch(() => {}).finally(() => setLoading(false))
  }, [moduleFilter, page])

  const filtered = search
    ? records.filter(r =>
        r.case_id.toLowerCase().includes(search.toLowerCase()) ||
        r.id.toLowerCase().includes(search.toLowerCase()) ||
        r.verdict.toLowerCase().includes(search.toLowerCase()))
    : records

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="flex h-full min-h-0">
      {/* ── Left rail ─────────────────────────────── */}
      <div className="w-52 flex-shrink-0 py-7 px-5 flex flex-col gap-5" style={{ borderRight: '1px solid #26262B' }}>
        <div className="pb-5" style={{ borderBottom: '1px solid #26262B' }}>
          <div className="label-caps text-ink-dim mb-1" style={{ fontSize: 9 }}>VII · Evidence</div>
          <h1 className="font-spectral text-ink-bright" style={{ fontSize: 18, fontWeight: 400 }}>Vault</h1>
          <p className="text-ink-muted mt-1" style={{ fontSize: 10, lineHeight: 1.5 }}>SHA-256 sealed · tamper-evident · PDF export</p>
        </div>

        {/* Total count */}
        <div>
          <div className="label-caps text-ink-dim mb-1" style={{ fontSize: 9 }}>Total Records</div>
          <div className="readout-value" style={{ fontSize: 40, color: '#E8E6E1', lineHeight: 1 }}>{total}</div>
        </div>

        <hr className="rule" />

        {/* Module filter */}
        <div>
          <div className="label-caps text-ink-dim mb-2.5" style={{ fontSize: 9 }}>Module Filter</div>
          <div className="space-y-1">
            {['', 'currency', 'scam', 'fraud', 'citizen'].map(m => (
              <button
                key={m}
                onClick={() => { setModuleFilter(m); setPage(0) }}
                className="w-full py-1.5 px-3 text-left transition-colors"
                style={{
                  fontSize: 11,
                  border: `1px solid ${moduleFilter === m ? '#9B2C22' : '#26262B'}`,
                  background: moduleFilter === m ? 'rgba(155,44,34,0.08)' : 'transparent',
                  color: moduleFilter === m ? '#9B2C22' : '#6B6B72',
                  borderRadius: 2,
                  cursor: 'pointer',
                }}
              >
                {m ? (MODULE_LABELS[m] ?? m) : 'All Modules'}
              </button>
            ))}
          </div>
        </div>

        <hr className="rule" />

        {/* Search */}
        <div>
          <div className="label-caps text-ink-dim mb-2" style={{ fontSize: 9 }}>Search</div>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Case ID, verdict…"
            className="w-full bg-transparent font-mono outline-none placeholder:text-ink-dim"
            style={{ fontSize: 11, color: '#E8E6E1', border: '1px solid #26262B', borderRadius: 2, padding: '6px 10px' }}
          />
        </div>
      </div>

      {/* ── Evidence ledger ───────────────────────── */}
      <div className="flex-1 overflow-y-auto p-7 min-w-0">
        <ConsolePanel noPad border>
          <PanelHeader
            title="Evidence Ledger"
            sub={`${total} records · all modules · SHA-256 integrity`}
            serif
            right={
              <div className="flex items-center gap-3">
                {page > 0 && (
                  <button onClick={() => setPage(p => p - 1)} className="label-caps text-ink-muted hover:text-ink-sub" style={{ fontSize: 9, background: 'none', border: 'none', cursor: 'pointer' }}>← Prev</button>
                )}
                <span className="label-caps text-ink-dim" style={{ fontSize: 9 }}>
                  {page + 1} / {totalPages || 1}
                </span>
                {page < totalPages - 1 && (
                  <button onClick={() => setPage(p => p + 1)} className="label-caps text-ink-muted hover:text-ink-sub" style={{ fontSize: 9, background: 'none', border: 'none', cursor: 'pointer' }}>Next →</button>
                )}
              </div>
            }
          />

          {loading ? (
            <div className="py-16 text-center label-caps text-ink-dim" style={{ fontSize: 9 }}>Loading records...</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <div className="font-spectral text-ink-dim" style={{ fontSize: 18, fontWeight: 300 }}>No records yet</div>
              <p style={{ fontSize: 11, color: '#3A3A42', marginTop: 6 }}>Generate evidence packages from any module to populate the vault</p>
            </div>
          ) : (
            <table className="ledger">
              <thead>
                <tr>
                  <th style={{ width: 32 }}></th>
                  <th>Case ID</th>
                  <th>Module</th>
                  <th>Verdict</th>
                  <th className="num">Confidence</th>
                  <th className="num">Timestamp UTC</th>
                  <th className="num">Export</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <>
                    <tr
                      key={r.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                    >
                      <td>
                        <span style={{ fontSize: 10, color: '#3A3A42', fontFamily: 'var(--font-geist-mono)' }}>
                          {expanded === r.id ? '▾' : '▸'}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <EvidenceSeal caseId={r.case_id} hash={r.content_hash} engineVersion={r.engine_version} size="sm" />
                          <span className="font-mono" style={{ fontSize: 10, color: '#9A9AA5', letterSpacing: '0.04em' }}>{r.case_id}</span>
                        </div>
                      </td>
                      <td>
                        <span className="label-caps" style={{ fontSize: 9, color: MODULE_COLS[r.source_module] ?? '#6B6B72' }}>
                          {MODULE_LABELS[r.source_module] ?? r.source_module}
                        </span>
                      </td>
                      <td><VerifyPill label={r.verdict} /></td>
                      <td className="num">
                        <span className="font-mono tabular-nums" style={{ fontSize: 11, color: '#9A9AA5' }}>
                          {r.confidence != null ? `${(r.confidence * 100).toFixed(1)}%` : '—'}
                        </span>
                      </td>
                      <td className="num">
                        <span className="font-mono tabular-nums" style={{ fontSize: 10, color: '#6B6B72' }}>
                          {new Date(r.timestamp).toISOString().slice(0, 19).replace('T', ' ')}
                        </span>
                      </td>
                      <td className="num">
                        <a
                          href={apiUrl(`/evidence/${r.id}/pdf`)}
                          target="_blank"
                          rel="noopener"
                          onClick={e => e.stopPropagation()}
                          className="label-caps"
                          style={{ fontSize: 8, color: '#3B6B4A', textDecoration: 'none', border: '1px solid rgba(59,107,74,0.4)', padding: '2px 6px', borderRadius: 2 }}
                        >
                          PDF
                        </a>
                      </td>
                    </tr>
                    {expanded === r.id && (
                      <tr key={`${r.id}-detail`}>
                        <td />
                        <td colSpan={6} style={{ padding: 0 }}>
                          <div className="py-4 px-5 space-y-3" style={{ background: '#17171E', borderBottom: '1px solid #26262B' }}>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <div className="label-caps text-ink-dim mb-1" style={{ fontSize: 8 }}>Content Hash</div>
                                <div className="font-mono" style={{ fontSize: 9, color: '#6B6B72', wordBreak: 'break-all' }}>{r.content_hash}</div>
                              </div>
                              <div>
                                <div className="label-caps text-ink-dim mb-1" style={{ fontSize: 8 }}>Engine Version</div>
                                <div className="font-mono" style={{ fontSize: 9, color: '#6B6B72' }}>{r.engine_version}</div>
                              </div>
                            </div>
                            <div>
                              <div className="label-caps text-ink-dim mb-1" style={{ fontSize: 8 }}>Decision Trace</div>
                              <pre className="font-mono text-ink-sub overflow-x-auto" style={{ fontSize: 9, lineHeight: 1.6 }}>
                                {JSON.stringify(r.decision_trace, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          )}
        </ConsolePanel>
      </div>
    </div>
  )
}
