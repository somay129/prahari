'use client'

import { useState, useRef, useEffect } from 'react'
import { apiFetch } from '@/lib/api'
import { SignalTrace, TracePoint } from '@/components/ui/SignalTrace'
import { EvidenceSeal } from '@/components/ui/EvidenceSeal'
import { VerifyPill } from '@/components/ui/VerifyPill'
import { ConsolePanel, PanelHeader } from '@/components/ui/ConsolePanel'
import { EvidenceSurface } from '@/components/ui/EvidenceSurface'

interface PatternMatch { tag: string; label: string; severity: string; matched_text?: string }
interface AnalyseResult {
  session_id: string; risk_score: number; risk_level: string; verdict: string
  recommended_action: string; matched_patterns: PatternMatch[]; engine_version: string
}
interface EvidenceResult { evidence_id: string; case_id: string }

const DEMO_LINES = [
  'This is officer Sharma from CBI headquarters. We have registered an FIR against your Aadhaar number for suspected money laundering activities worth 45 lakhs.',
  'You are currently under digital arrest. Do not leave your premises and do not hang up this call.',
  'We need you to stay on video call for identity verification. Turn on your camera immediately.',
  'You must transfer ₹2,00,000 to our secure escrow account within the next 2 hours to avoid immediate detention.',
  'Do not tell any family members about this call — it is a matter of national security and confidentiality is mandatory.',
  'Your bank account will be frozen and your passport will be cancelled if you do not comply immediately.',
  'Share your OTP and bank account number so we can verify your identity and process the clearance.',
]

export default function ScamPage() {
  const [transcript, setTranscript] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalyseResult | null>(null)
  const [evidence, setEvidence] = useState<EvidenceResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [replaying, setReplaying] = useState(false)
  const [replayLines, setReplayLines] = useState<string[]>([])
  const [tracePoints, setTracePoints] = useState<TracePoint[]>([])
  const [genEvLoading, setGenEvLoading] = useState(false)
  const replayRef = useRef(false)

  const analyse = async (text: string) => {
    if (!text.trim()) return
    setLoading(true); setError(null); setResult(null); setEvidence(null)
    try {
      const r = await apiFetch<AnalyseResult>('/scam/analyse', {
        method: 'POST', body: JSON.stringify({ transcript: text }),
      })
      setResult(r)
      // Build trace from final result
      setTracePoints([{ idx: 0, score: r.risk_score, patterns: r.matched_patterns.slice(0, 2) }])
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  const startReplay = async () => {
    setReplaying(true); replayRef.current = true
    setTracePoints([]); setResult(null); setEvidence(null); setReplayLines([])
    let score = 0
    const allPatterns: PatternMatch[] = []
    for (let i = 0; i < DEMO_LINES.length; i++) {
      if (!replayRef.current) break
      const line = DEMO_LINES[i]
      setReplayLines(prev => [...prev, line])
      try {
        const r = await apiFetch<{ risk_score: number; matched_patterns: PatternMatch[] }>(
          '/scam/analyse-line', { method: 'POST', body: JSON.stringify({ line, previous_score: score }) }
        )
        score = r.risk_score
        for (const p of r.matched_patterns) {
          if (!allPatterns.find(x => x.tag === p.tag)) allPatterns.push(p)
        }
        setTracePoints(prev => [...prev, {
          idx: i, score,
          patterns: r.matched_patterns.filter(p => !prev.some(pp => pp.patterns.find(x => x.tag === p.tag))),
          text: line,
        }])
      } catch {}
      await new Promise(res => setTimeout(res, 1200))
    }
    if (replayRef.current) {
      const r = await apiFetch<AnalyseResult>('/scam/analyse', {
        method: 'POST', body: JSON.stringify({ transcript: DEMO_LINES.join('\n') }),
      }).catch(() => null)
      if (r) setResult(r)
    }
    setReplaying(false)
  }

  const stopReplay = () => { replayRef.current = false; setReplaying(false); setReplayLines([]) }

  const generateEvidence = async () => {
    if (!result) return
    setGenEvLoading(true)
    try {
      setEvidence(await apiFetch<EvidenceResult>(`/scam/sessions/${result.session_id}/evidence`, { method: 'POST', body: '{}' }))
    } catch (e: any) { setError(e.message) }
    finally { setGenEvLoading(false) }
  }

  const currentScore = result?.risk_score ?? (tracePoints[tracePoints.length - 1]?.score ?? 0)
  const currentPatterns = result?.matched_patterns ?? tracePoints.flatMap(p => p.patterns).filter((p, i, arr) => arr.findIndex(x => x.tag === p.tag) === i)
  const isCritical = currentScore >= 75

  return (
    <div className="flex h-full min-h-0">
      {/* ── Left rail ─────────────────────────────────── */}
      <div className="w-52 flex-shrink-0 overflow-y-auto py-7 px-5 flex flex-col gap-5" style={{ borderRight: '1px solid #26262B' }}>
        <div className="pb-5" style={{ borderBottom: '1px solid #26262B' }}>
          <div className="label-caps text-ink-dim mb-1" style={{ fontSize: 9 }}>III · Scam Detection</div>
          <h1 className="font-spectral text-ink-bright" style={{ fontSize: 18, fontWeight: 400, lineHeight: 1.2 }}>
            Session Analysis
          </h1>
          <p className="text-ink-muted mt-1" style={{ fontSize: 10, lineHeight: 1.5 }}>
            10 pattern signals · real-time or full session
          </p>
        </div>

        {/* Score readout */}
        <div>
          <div className="label-caps text-ink-dim mb-2" style={{ fontSize: 9 }}>Risk Score</div>
          <div className="readout-value" style={{ fontSize: 48, color: isCritical ? '#9B2C22' : currentScore >= 50 ? '#B7791F' : '#3B6B4A', lineHeight: 1 }}>
            {Math.round(currentScore)}
          </div>
          <div className="label-caps mt-1" style={{ fontSize: 9, color: '#6B6B72' }}>/ 100</div>
          {isCritical && (
            <div className="mt-2 p-2" style={{ background: 'rgba(155,44,34,0.1)', border: '1px solid rgba(155,44,34,0.4)', borderRadius: 2 }}>
              <div className="label-caps" style={{ fontSize: 8, color: '#9B2C22' }}>CRITICAL THRESHOLD EXCEEDED</div>
              <div style={{ fontSize: 10, color: '#9B2C22', marginTop: 3, lineHeight: 1.4 }}>
                {result?.recommended_action ?? 'Terminate call. Dial 1930.'}
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="space-y-2">
          {replaying ? (
            <button onClick={stopReplay} className="w-full py-2 label-caps" style={{ fontSize: 9, background: 'transparent', border: '1px solid rgba(155,44,34,0.5)', color: '#9B2C22', borderRadius: 2, cursor: 'pointer' }}>
              Stop Replay
            </button>
          ) : (
            <button onClick={startReplay} className="w-full py-2 label-caps" style={{ fontSize: 9, background: '#9B2C22', border: 'none', color: '#F3EFE6', borderRadius: 2, cursor: 'pointer' }}>
              Demo Replay
            </button>
          )}
          <button onClick={() => setTranscript(DEMO_LINES.join('\n'))} className="w-full py-2 label-caps" style={{ fontSize: 9, background: 'transparent', border: '1px solid #26262B', color: '#6B6B72', borderRadius: 2, cursor: 'pointer' }}>
            Load Demo Text
          </button>
        </div>

        {/* Patterns fired */}
        {currentPatterns.length > 0 && (
          <div>
            <div className="label-caps text-ink-dim mb-2" style={{ fontSize: 9 }}>Patterns Detected</div>
            <div className="space-y-1.5">
              {currentPatterns.map(p => (
                <div key={p.tag} className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: p.severity === 'CRITICAL' ? '#9B2C22' : '#B7791F' }} />
                  <span style={{ fontSize: 10, color: '#9A9AA5' }}>{p.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Evidence */}
        {result && (
          <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid #26262B' }}>
            {evidence ? (
              <div className="flex flex-col items-center gap-2">
                <EvidenceSeal caseId={evidence.case_id} engineVersion={result.engine_version} size="sm" animate />
                <div className="label-caps" style={{ fontSize: 8, color: '#3B6B4A' }}>Evidence Sealed</div>
              </div>
            ) : (
              <button onClick={generateEvidence} disabled={genEvLoading} className="w-full py-2 label-caps" style={{ fontSize: 9, background: 'transparent', border: '1px solid #3B6B4A', color: '#3B6B4A', borderRadius: 2, cursor: 'pointer', opacity: genEvLoading ? 0.5 : 1 }}>
                {genEvLoading ? 'Generating...' : 'Generate Evidence'}
              </button>
            )}
          </div>
        )}

        {error && <div className="text-xs p-2" style={{ border: '1px solid rgba(155,44,34,0.4)', color: '#9B2C22', borderRadius: 2 }}>{error}</div>}
      </div>

      {/* ── Main canvas ───────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-7 min-w-0 flex flex-col gap-5">
        {/* Signal Trace instrument */}
        <ConsolePanel border noPad>
          <PanelHeader
            title="Signal Trace"
            sub={replaying ? `Streaming — ${tracePoints.length} / ${DEMO_LINES.length} lines processed` : 'Risk score over session timeline · threshold at 75'}
            right={
              result ? <VerifyPill label={result.risk_level} dot /> : replaying ? (
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#9B2C22', animation: 'pulse 1s infinite' }} />
                  <span className="label-caps text-ink-muted" style={{ fontSize: 9 }}>LIVE</span>
                </div>
              ) : null
            }
          />
          <div className="px-4 pb-4">
            {tracePoints.length > 0 ? (
              <SignalTrace points={tracePoints} height={220} live={replaying} />
            ) : (
              <div className="flex items-center justify-center" style={{ height: 220 }}>
                <div className="text-center">
                  <div className="font-spectral text-ink-dim" style={{ fontSize: 18, fontWeight: 300 }}>Awaiting Session</div>
                  <p style={{ fontSize: 10, color: '#3A3A42', marginTop: 6 }}>Run demo replay or paste a transcript to begin signal analysis</p>
                </div>
              </div>
            )}
          </div>
        </ConsolePanel>

        {/* Live transcript feed during replay */}
        {replaying && replayLines.length > 0 && (
          <ConsolePanel border noPad>
            <PanelHeader title="Live Session Feed" sub="Incoming call transcript — lines processed in real time" />
            <div className="px-4 pb-4 space-y-2">
              {replayLines.map((line, i) => (
                <div
                  key={i}
                  className="flex gap-3 py-1.5"
                  style={{ borderBottom: '1px solid #26262B', opacity: i === replayLines.length - 1 ? 1 : 0.55 }}
                >
                  <span className="font-mono flex-shrink-0" style={{ fontSize: 9, color: '#3A3A42', paddingTop: 2 }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span style={{ fontSize: 11, color: i === replayLines.length - 1 ? '#E8E6E1' : '#9A9AA5', lineHeight: 1.6 }}>
                    {line}
                  </span>
                </div>
              ))}
              {replaying && (
                <div className="flex items-center gap-2 py-1">
                  <div className="w-1 h-1 rounded-full" style={{ background: '#9B2C22', animation: 'pulse 1s infinite' }} />
                  <span className="label-caps" style={{ fontSize: 9, color: '#9B2C22' }}>PROCESSING NEXT LINE…</span>
                </div>
              )}
            </div>
          </ConsolePanel>
        )}

        {/* Transcript input (only when not replaying) */}
        {!replaying && (
          <ConsolePanel border noPad>
            <PanelHeader title="Session Transcript" sub="Paste call transcript or message log for full analysis" />
            <div className="px-4 pb-4 space-y-3">
              <textarea
                value={transcript}
                onChange={e => setTranscript(e.target.value)}
                placeholder="Paste a call transcript or message session here…"
                className="w-full bg-ink-base text-ink-text font-mono resize-none outline-none placeholder:text-ink-dim"
                style={{ fontSize: 11, lineHeight: 1.7, minHeight: 120, padding: '10px 0', border: 'none', borderBottom: '1px solid #26262B' }}
              />
              <button
                onClick={() => analyse(transcript)}
                disabled={!transcript.trim() || loading}
                className="label-caps px-5 py-2"
                style={{ fontSize: 9, background: (!transcript.trim() || loading) ? '#26262B' : '#9B2C22', color: (!transcript.trim() || loading) ? '#3A3A42' : '#F3EFE6', border: 'none', borderRadius: 2, cursor: (!transcript.trim() || loading) ? 'not-allowed' : 'pointer' }}
              >
                {loading ? 'Analysing...' : 'Analyse Session'}
              </button>
            </div>
          </ConsolePanel>
        )}

        {/* Result verdict (paper surface) */}
        {result && (
          <EvidenceSurface>
            <div className="flex items-start justify-between mb-4 pb-4" style={{ borderBottom: '1px solid #D8D2C4' }}>
              <div>
                <div className="label-caps mb-1" style={{ fontSize: 9, color: '#B5AFA4' }}>Session Analysis — {result.session_id}</div>
                <div className="font-spectral" style={{ fontSize: 20, fontWeight: 400, color: isCritical ? '#9B2C22' : currentScore >= 50 ? '#B7791F' : '#3B6B4A' }}>
                  {result.verdict}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {evidence && <EvidenceSeal caseId={evidence.case_id} engineVersion={result.engine_version} size="sm" onPaper animate />}
              </div>
            </div>
            <div style={{ fontSize: 12, color: '#4A443C', lineHeight: 1.7 }}>{result.recommended_action}</div>
            <div className="mt-4 pt-4 flex items-center gap-4" style={{ borderTop: '1px solid #D8D2C4' }}>
              <span className="font-mono" style={{ fontSize: 10, color: '#7A7269' }}>Risk: {result.risk_score}/100 · {result.matched_patterns.length} pattern(s) · {result.engine_version}</span>
              <a href="tel:1930" className="label-caps ml-auto" style={{ fontSize: 9, color: '#9B2C22', textDecoration: 'none', border: '1px solid rgba(155,44,34,0.5)', padding: '4px 10px', borderRadius: 2 }}>Dial 1930</a>
            </div>
          </EvidenceSurface>
        )}
      </div>
    </div>
  )
}
