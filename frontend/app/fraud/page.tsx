'use client'

import { useState, useEffect, useRef } from 'react'
import { apiFetch } from '@/lib/api'
import { formatINR } from '@/lib/utils'
import { EvidenceSeal } from '@/components/ui/EvidenceSeal'
import { VerifyPill } from '@/components/ui/VerifyPill'
import { ConsolePanel, PanelHeader } from '@/components/ui/ConsolePanel'
import { EvidenceSurface } from '@/components/ui/EvidenceSurface'
import { Readout } from '@/components/ui/Readout'
import dynamic from 'next/dynamic'

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false })

interface Ring {
  ring_id: string; severity: string; member_count: number; victim_count: number
  total_exposure_inr: number; lead_time_days: number; confidence: number
}
interface GraphData {
  nodes: { id: string; label: string; type: string; role: string; ring_id: string; colour: string; risk: number }[]
  links: { source: string; target: string; weight: number }[]
}
interface RingDetail {
  ring_id: string; severity: string; member_count: number; victim_count: number
  total_exposure_inr: number; lead_time_days: number; confidence: number
  nodes: { id: string; node_type: string; label: string; role: string; degree: number; risk_score: number }[]
  edges: { source: string; target: string; weight: number }[]
  chain_of_custody: Record<string, string>
}

export default function FraudPage() {
  const [rings, setRings] = useState<Ring[]>([])
  const [graphData, setGraphData] = useState<GraphData | null>(null)
  const [selectedRing, setSelectedRing] = useState<Ring | null>(null)
  const [ringDetail, setRingDetail] = useState<RingDetail | null>(null)
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [evidenceMap, setEvidenceMap] = useState<Record<string, { evidence_id: string; case_id: string }>>({})
  const graphRef = useRef<any>(null)

  useEffect(() => {
    Promise.all([
      apiFetch<{ total: number; rings: Ring[] }>('/fraud/rings'),
      apiFetch<GraphData>('/fraud/graph-data'),
      apiFetch<any>('/fraud/stats'),
    ]).then(([r, g, s]) => { setRings(r.rings); setGraphData(g); setStats(s) })
      .catch(() => {}).finally(() => setLoading(false))
  }, [])

  const openRing = async (ring: Ring) => {
    setSelectedRing(ring)
    try { setRingDetail(await apiFetch<RingDetail>(`/fraud/rings/${ring.ring_id}`)) } catch {}
  }

  const generateEvidence = async (ring: Ring) => {
    try {
      const r = await apiFetch<{ evidence_id: string; case_id: string }>(`/fraud/rings/${ring.ring_id}/evidence`, { method: 'POST', body: '{}' })
      setEvidenceMap(prev => ({ ...prev, [ring.ring_id]: r }))
    } catch {}
  }

  return (
    <div className="flex h-full min-h-0">
      {/* ── Ring list sidebar ─────────────────────── */}
      <div className="w-52 flex-shrink-0 flex flex-col" style={{ borderRight: '1px solid #26262B' }}>
        <div className="px-5 py-5 pb-4" style={{ borderBottom: '1px solid #26262B' }}>
          <div className="label-caps text-ink-dim mb-1" style={{ fontSize: 9 }}>IV · Fraud Networks</div>
          <h1 className="font-spectral text-ink-bright" style={{ fontSize: 18, fontWeight: 400 }}>Ring Detection</h1>
          <p className="text-ink-muted mt-1" style={{ fontSize: 10, lineHeight: 1.5 }}>Community detection · Louvain algorithm</p>
        </div>

        {/* Stats */}
        <div className="px-5 py-4 grid grid-cols-2 gap-3" style={{ borderBottom: '1px solid #26262B' }}>
          <Readout value={stats?.rings_detected ?? 0} unit="Rings" size="sm" colour="oxblood" animate />
          <Readout value={stats?.total_victims ?? 0} unit="Victims" size="sm" colour="ochre" animate />
        </div>

        {/* Ring ledger */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-5 label-caps text-ink-dim" style={{ fontSize: 9 }}>Loading graph...</div>
          ) : rings.map(r => (
            <button
              key={r.ring_id}
              onClick={() => openRing(r)}
              className="w-full text-left px-5 py-3 transition-colors"
              style={{
                borderBottom: '1px solid #26262B',
                background: selectedRing?.ring_id === r.ring_id ? '#17171E' : 'transparent',
                borderLeft: selectedRing?.ring_id === r.ring_id ? '2px solid #9B2C22' : '2px solid transparent',
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono" style={{ fontSize: 9, color: '#6B6B72', letterSpacing: '0.04em' }}>{r.ring_id.slice(0, 12)}</span>
                <VerifyPill label={r.severity} />
              </div>
              <div className="flex justify-between mt-1.5">
                <span style={{ fontSize: 10, color: '#6B6B72' }}>{r.member_count} members</span>
                <span className="font-mono" style={{ fontSize: 10, color: '#9A9AA5' }}>{formatINR(r.total_exposure_inr)}</span>
              </div>
              <div className="mt-1.5 h-0.5" style={{ background: '#26262B' }}>
                <div className="h-full" style={{ width: `${r.confidence * 100}%`, background: r.severity === 'CRITICAL' ? '#9B2C22' : '#B7791F' }} />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Force graph canvas ────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        <ConsolePanel noPad border={false} className="flex-shrink-0">
          <PanelHeader
            title="Network Graph"
            sub="Click a node to inspect its ring"
            right={
              <div className="flex items-center gap-3">
                {[['#9B2C22','CRITICAL'],['#B7791F','HIGH'],['#6B6B72','MEDIUM'],['#3B6B4A','LOW']].map(([c,l]) => (
                  <div key={l} className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: c }} />
                    <span className="label-caps text-ink-dim" style={{ fontSize: 8 }}>{l}</span>
                  </div>
                ))}
              </div>
            }
          />
        </ConsolePanel>

        <div className="flex-1 relative" style={{ background: '#0A0A0B' }}>
          {!graphData && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="label-caps text-ink-dim" style={{ fontSize: 9 }}>Loading network graph…</div>
            </div>
          )}
          {graphData && !selectedRing && (
            <div
              className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-4 py-2"
              style={{ background: '#101015', border: '1px solid #26262B', borderRadius: 2, pointerEvents: 'none' }}
            >
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#9B2C22' }} />
              <span className="label-caps text-ink-muted" style={{ fontSize: 9 }}>
                Click a ring in the list or a node in the graph to open its intelligence package
              </span>
            </div>
          )}
          {graphData && (
            <ForceGraph2D
              ref={graphRef}
              graphData={graphData}
              backgroundColor="#0A0A0B"
              nodeLabel={(n: any) => `${n.label} (${n.role})`}
              nodeColor={(n: any) => n.colour}
              nodeRelSize={4}
              linkColor={() => '#26262B'}
              linkWidth={0.75}
              onNodeClick={(node: any) => {
                const ring = rings.find(r => r.ring_id === node.ring_id)
                if (ring) openRing(ring)
              }}
            />
          )}
        </div>
      </div>

      {/* ── Paper evidence panel (slides in) ─────── */}
      {selectedRing && (
        <div
          className="flex-shrink-0 overflow-y-auto flex flex-col"
          style={{ width: 340, borderLeft: '1px solid #26262B', background: '#F3EFE6' }}
        >
          {/* Panel header */}
          <div className="px-5 py-4 flex items-start justify-between" style={{ borderBottom: '1px solid #D8D2C4' }}>
            <div>
              <div className="label-caps mb-1" style={{ fontSize: 9, color: '#B5AFA4' }}>Intelligence Package</div>
              <div className="font-spectral" style={{ fontSize: 16, fontWeight: 400, color: '#1A1814' }}>{selectedRing.ring_id}</div>
            </div>
            <div className="flex items-center gap-2">
              {evidenceMap[selectedRing.ring_id] && (
                <EvidenceSeal caseId={evidenceMap[selectedRing.ring_id].case_id} size="sm" onPaper animate />
              )}
              <button onClick={() => { setSelectedRing(null); setRingDetail(null) }} style={{ fontSize: 16, color: '#B5AFA4', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-0" style={{ borderBottom: '1px solid #D8D2C4' }}>
            {[
              ['Members', selectedRing.member_count],
              ['Victims', selectedRing.victim_count],
              ['Exposure', formatINR(selectedRing.total_exposure_inr)],
              ['Lead Time', `${selectedRing.lead_time_days}d`],
            ].map(([k, v], i) => (
              <div key={String(k)} className="px-5 py-3" style={{ borderRight: i % 2 === 0 ? '1px solid #D8D2C4' : 'none', borderBottom: i < 2 ? '1px solid #D8D2C4' : 'none' }}>
                <div className="label-caps mb-1" style={{ fontSize: 9, color: '#B5AFA4' }}>{k}</div>
                <div className="font-mono" style={{ fontSize: 14, color: '#1A1814', fontWeight: 500 }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Member nodes */}
          {ringDetail && (
            <div className="px-5 py-4" style={{ borderBottom: '1px solid #D8D2C4' }}>
              <div className="label-caps mb-3" style={{ fontSize: 9, color: '#B5AFA4' }}>Members & Roles</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Node', 'Role', 'Risk'].map(h => (
                      <th key={h} style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#B5AFA4', padding: '0 0 6px', textAlign: h === 'Risk' ? 'right' : 'left', borderBottom: '1px solid #D8D2C4' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ringDetail.nodes.slice(0, 10).map((n, i) => (
                    <tr key={n.id}>
                      <td style={{ fontSize: 10, color: '#4A443C', padding: '5px 0', borderBottom: i < ringDetail.nodes.length - 1 ? '1px solid #D8D2C4' : 'none' }}>{n.label.slice(0, 12)}</td>
                      <td style={{ fontSize: 9, color: '#7A7269', padding: '5px 0', borderBottom: i < ringDetail.nodes.length - 1 ? '1px solid #D8D2C4' : 'none' }}>{n.role}</td>
                      <td style={{ fontSize: 10, fontFamily: 'var(--font-geist-mono)', textAlign: 'right', color: '#1A1814', padding: '5px 0', borderBottom: i < ringDetail.nodes.length - 1 ? '1px solid #D8D2C4' : 'none' }}>{(n.risk_score * 100).toFixed(0)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Chain of custody */}
          {ringDetail && (
            <div className="px-5 py-4" style={{ borderBottom: '1px solid #D8D2C4' }}>
              <div className="label-caps mb-3" style={{ fontSize: 9, color: '#B5AFA4' }}>Chain of Custody</div>
              <div className="space-y-1.5">
                {Object.entries(ringDetail.chain_of_custody).map(([k, v]) => (
                  <div key={k} className="flex gap-2">
                    <span style={{ fontSize: 9, color: '#B5AFA4', minWidth: 90, fontFamily: 'var(--font-geist-sans)' }}>{k}</span>
                    <span style={{ fontSize: 9, color: '#4A443C', fontFamily: 'var(--font-geist-mono)', wordBreak: 'break-all' }}>{String(v).slice(0, 24)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Evidence action */}
          <div className="px-5 py-4">
            {evidenceMap[selectedRing.ring_id] ? (
              <div className="text-center">
                <div className="label-caps mb-1" style={{ fontSize: 9, color: '#3B6B4A' }}>Evidence Package Sealed</div>
                <div className="font-mono" style={{ fontSize: 10, color: '#7A7269' }}>{evidenceMap[selectedRing.ring_id].case_id}</div>
              </div>
            ) : (
              <button
                onClick={() => generateEvidence(selectedRing)}
                className="w-full py-2 label-caps"
                style={{ fontSize: 9, background: 'transparent', border: '1px solid #4A443C', color: '#1A1814', borderRadius: 2, cursor: 'pointer' }}
              >
                Seal Intelligence Package
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
