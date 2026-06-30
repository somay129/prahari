'use client'

import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api'
import { formatINR } from '@/lib/utils'
import { ConsolePanel, PanelHeader } from '@/components/ui/ConsolePanel'
import { Readout } from '@/components/ui/Readout'
import dynamic from 'next/dynamic'

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false })

interface Complaint { id: string; lat: number; lng: number; city: string; category: string; severity: string; amount_inr: number; notes_seized: number; timestamp: string; patrol_score: number }
interface Hotspot { city: string; lat: number; lng: number; count: number; total_amount_inr: number; patrol_score: number; top_category: string }

const CATEGORIES = [
  { key: '', label: 'All', col: '#6B6B72' },
  { key: 'digital_arrest', label: 'Digital Arrest', col: '#9B2C22' },
  { key: 'counterfeit_seizure', label: 'Counterfeit', col: '#B7791F' },
  { key: 'mule_account', label: 'Mule Account', col: '#3B6B4A' },
  { key: 'phishing', label: 'Phishing', col: '#6B6B72' },
  { key: 'investment_fraud', label: 'Investment', col: '#6B1E16' },
]

export default function MapPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [hotspots, setHotspots] = useState<Hotspot[]>([])
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Hotspot | null>(null)

  useEffect(() => {
    Promise.all([
      apiFetch<{ total: number; points: Complaint[] }>(`/map/complaints${category ? `?category=${category}` : ''}`),
      apiFetch<{ hotspots: Hotspot[] }>('/map/hotspots'),
    ]).then(([c, h]) => { setComplaints(c.points); setHotspots(h.hotspots) })
      .catch(() => {}).finally(() => setLoading(false))
  }, [category])

  return (
    <div className="flex h-full min-h-0">
      {/* ── Left rail ─────────────────────────────── */}
      <div className="w-52 flex-shrink-0 flex flex-col" style={{ borderRight: '1px solid #26262B' }}>
        <div className="px-5 py-5 pb-4" style={{ borderBottom: '1px solid #26262B' }}>
          <div className="label-caps text-ink-dim mb-1" style={{ fontSize: 9 }}>V · Crime Map</div>
          <h1 className="font-spectral text-ink-bright" style={{ fontSize: 18, fontWeight: 400 }}>Geospatial</h1>
          <p className="text-ink-muted mt-1" style={{ fontSize: 10, lineHeight: 1.5 }}>500 complaint points · 15 Indian cities</p>
        </div>

        {/* Stats */}
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #26262B' }}>
          <Readout value={complaints.length} unit="Points Loaded" size="sm" animate />
        </div>

        {/* Category filter */}
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #26262B' }}>
          <div className="label-caps text-ink-dim mb-2.5" style={{ fontSize: 9 }}>Category</div>
          <div className="space-y-1">
            {CATEGORIES.map(c => (
              <button
                key={c.key}
                onClick={() => setCategory(c.key)}
                className="w-full flex items-center gap-2 py-1.5 px-2 text-left transition-colors"
                style={{
                  fontSize: 10,
                  border: `1px solid ${category === c.key ? c.col : 'transparent'}`,
                  background: category === c.key ? `${c.col}15` : 'transparent',
                  color: category === c.key ? c.col : '#6B6B72',
                  borderRadius: 2,
                  cursor: 'pointer',
                }}
              >
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: c.col }} />
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Patrol priority ledger */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-5 py-3 label-caps text-ink-dim" style={{ fontSize: 9, borderBottom: '1px solid #26262B' }}>
            Patrol Priority
          </div>
          {hotspots.slice(0, 15).map((h, i) => (
            <button
              key={h.city}
              onClick={() => setSelected(h)}
              className="w-full text-left px-5 py-2.5 transition-colors"
              style={{
                borderBottom: '1px solid #26262B',
                background: selected?.city === h.city ? '#17171E' : 'transparent',
                borderLeft: selected?.city === h.city ? '2px solid #9B2C22' : '2px solid transparent',
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span style={{ fontSize: 11, color: '#E8E6E1' }}>{h.city}</span>
                <span className="font-mono" style={{ fontSize: 9, color: '#3A3A42' }}>#{i + 1}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px" style={{ background: '#26262B' }}>
                  <div className="h-0.5 -mt-px transition-all" style={{
                    width: `${h.patrol_score * 100}%`,
                    background: h.patrol_score > 0.75 ? '#9B2C22' : h.patrol_score > 0.5 ? '#B7791F' : '#3B6B4A',
                  }} />
                </div>
                <span className="font-mono tabular-nums" style={{ fontSize: 9, color: '#6B6B72' }}>{h.count}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Map canvas ────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Selected hotspot info bar */}
        {selected && (
          <div className="flex-shrink-0 flex items-center gap-6 px-6 py-3" style={{ borderBottom: '1px solid #26262B', background: '#101015' }}>
            <div>
              <span className="label-caps text-ink-dim mr-2" style={{ fontSize: 9 }}>City</span>
              <span style={{ fontSize: 12, color: '#E8E6E1' }}>{selected.city}</span>
            </div>
            <div>
              <span className="label-caps text-ink-dim mr-2" style={{ fontSize: 9 }}>Reports</span>
              <span className="font-mono" style={{ fontSize: 12, color: '#E8E6E1' }}>{selected.count}</span>
            </div>
            <div>
              <span className="label-caps text-ink-dim mr-2" style={{ fontSize: 9 }}>Exposure</span>
              <span className="font-mono" style={{ fontSize: 12, color: '#B7791F' }}>{formatINR(selected.total_amount_inr)}</span>
            </div>
            <div>
              <span className="label-caps text-ink-dim mr-2" style={{ fontSize: 9 }}>Top</span>
              <span style={{ fontSize: 11, color: '#9A9AA5' }}>{selected.top_category.replace(/_/g, ' ')}</span>
            </div>
            <div>
              <span className="label-caps text-ink-dim mr-2" style={{ fontSize: 9 }}>Patrol Score</span>
              <span className="font-mono" style={{ fontSize: 12, color: selected.patrol_score > 0.75 ? '#9B2C22' : '#B7791F' }}>
                {(selected.patrol_score * 100).toFixed(0)}%
              </span>
            </div>
            <button onClick={() => setSelected(null)} style={{ marginLeft: 'auto', fontSize: 14, color: '#3A3A42', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
          </div>
        )}

        <div className="flex-1 relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="label-caps text-ink-dim" style={{ fontSize: 9 }}>Loading map data...</div>
            </div>
          ) : (
            <MapView complaints={complaints} hotspots={hotspots} category={category} onHotspotClick={setSelected} />
          )}
        </div>
      </div>
    </div>
  )
}
