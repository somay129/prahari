'use client'

import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api'
import { EvidenceSurface, EvidenceHeader } from '@/components/ui/EvidenceSurface'
import { ConsolePanel } from '@/components/ui/ConsolePanel'

interface Question { id: string; text: string; options: string[] }
interface CheckResult {
  check_id: string; verdict: string; colour: string; risk_score: number
  summary: string; reasons: string[]; action: string
  false_positive_note: string; report_url: string; helpline: string
}

const LANGS = [
  { key: 'en', label: 'English' },
  { key: 'hi', label: 'हिन्दी' },
  { key: 'ta', label: 'தமிழ்' },
]

const ANSWER_LABELS: Record<string, Record<string, string>> = {
  en: { yes: 'Yes', no: 'No', unsure: 'Not sure' },
  hi: { yes: 'हाँ', no: 'नहीं', unsure: 'अनिश्चित' },
  ta: { yes: 'ஆம்', no: 'இல்லை', unsure: 'தெரியாது' },
}

const VERDICT_COLOUR: Record<string, string> = {
  SAFE: '#3B6B4A', CAUTION: '#B7791F', 'HIGH RISK': '#9B2C22',
}

export default function CitizenPage() {
  const [lang, setLang] = useState('en')
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [step, setStep] = useState(0)
  const [result, setResult] = useState<CheckResult | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    apiFetch<{ questions: Question[] }>(`/citizen/questions?lang=${lang}`)
      .then(r => setQuestions(r.questions)).catch(() => {})
  }, [lang])

  const answer = (qid: string, val: string) => {
    const next = { ...answers, [qid]: val }
    setAnswers(next)
    setTimeout(() => {
      if (step < questions.length - 1) setStep(s => s + 1)
      else submit(next)
    }, 200)
  }

  const goBack = () => {
    if (step === 0) return
    const prevQ = questions[step - 1]
    const next = { ...answers }
    delete next[prevQ.id]
    setAnswers(next)
    setStep(s => s - 1)
  }

  const submit = async (finalAnswers: Record<string, string>) => {
    setLoading(true)
    try {
      setResult(await apiFetch<CheckResult>('/citizen/check', {
        method: 'POST', body: JSON.stringify({ answers: finalAnswers, check_type: 'call', language: lang }),
      }))
    } catch {} finally { setLoading(false) }
  }

  const reset = () => { setAnswers({}); setStep(0); setResult(null) }

  const currentQ = questions[step]
  const verdictCol = result ? (VERDICT_COLOUR[result.verdict] ?? '#B7791F') : '#B7791F'
  const aLabels = ANSWER_LABELS[lang] ?? ANSWER_LABELS.en

  return (
    <div className="flex h-full min-h-0">
      {/* ── Left rail ─────────────────────────────── */}
      <div className="w-52 flex-shrink-0 py-7 px-5 flex flex-col gap-5" style={{ borderRight: '1px solid #26262B' }}>
        <div className="pb-5" style={{ borderBottom: '1px solid #26262B' }}>
          <div className="label-caps text-ink-dim mb-1" style={{ fontSize: 9 }}>VI · Citizen Shield</div>
          <h1 className="font-spectral text-ink-bright" style={{ fontSize: 18, fontWeight: 400 }}>Risk Check</h1>
          <p className="text-ink-muted mt-1" style={{ fontSize: 10, lineHeight: 1.5 }}>Guided 5-question assessment</p>
        </div>

        {/* Language selector */}
        <div>
          <div className="label-caps text-ink-dim mb-2.5" style={{ fontSize: 9 }}>Language</div>
          <div className="space-y-1">
            {LANGS.map(l => (
              <button
                key={l.key}
                onClick={() => { setLang(l.key); reset() }}
                className="w-full py-2 px-3 text-left transition-colors"
                style={{
                  fontSize: 11,
                  border: `1px solid ${lang === l.key ? '#9B2C22' : '#26262B'}`,
                  background: lang === l.key ? 'rgba(155,44,34,0.08)' : 'transparent',
                  color: lang === l.key ? '#9B2C22' : '#6B6B72',
                  borderRadius: 2,
                  cursor: 'pointer',
                }}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Progress */}
        {!result && questions.length > 0 && (
          <div>
            <div className="label-caps text-ink-dim mb-2.5" style={{ fontSize: 9 }}>Progress</div>
            <div className="flex gap-1">
              {questions.map((_, i) => (
                <div
                  key={i}
                  className="flex-1 h-0.5 transition-colors"
                  style={{ background: i < step ? '#9B2C22' : i === step ? 'rgba(155,44,34,0.4)' : '#26262B' }}
                />
              ))}
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="label-caps" style={{ fontSize: 9, color: '#6B6B72' }}>
                Question {step + 1} of {questions.length}
              </div>
              {step > 0 && (
                <button
                  onClick={goBack}
                  className="label-caps"
                  style={{ fontSize: 9, color: '#6B6B72', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#9A9AA5' }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#6B6B72' }}
                >
                  ← Back
                </button>
              )}
            </div>
          </div>
        )}

        {result && (
          <div>
            <button onClick={reset} className="w-full py-2 label-caps" style={{ fontSize: 9, background: 'transparent', border: '1px solid #26262B', color: '#6B6B72', borderRadius: 2, cursor: 'pointer' }}>
              Start Over
            </button>
          </div>
        )}

        <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid #26262B' }}>
          <div className="label-caps text-ink-dim mb-2" style={{ fontSize: 9 }}>Emergency Helpline</div>
          <a href="tel:1930" className="font-mono" style={{ fontSize: 18, color: '#9B2C22', textDecoration: 'none', letterSpacing: '-0.01em' }}>1930</a>
          <div style={{ fontSize: 9, color: '#6B6B72', marginTop: 2 }}>Cyber Crime · 24×7</div>
        </div>
      </div>

      {/* ── Paper interview surface ────────────────── */}
      <div className="flex-1 overflow-y-auto p-7 flex flex-col items-center justify-center" style={{ background: '#F3EFE6' }}>
        <div className="w-full" style={{ maxWidth: 540 }}>
          {loading && (
            <div className="text-center py-16">
              <div className="font-spectral text-paper-muted" style={{ fontSize: 20, fontWeight: 300, color: '#B5AFA4' }}>Calculating risk score...</div>
            </div>
          )}

          {!loading && !result && currentQ && (
            <div>
              <div className="label-caps mb-2" style={{ fontSize: 9, color: '#B5AFA4' }}>Question {step + 1}</div>
              <p className="font-spectral mb-8" style={{ fontSize: 20, fontWeight: 400, color: '#1A1814', lineHeight: 1.5 }}>
                {currentQ.text}
              </p>

              <div className="space-y-2">
                {[
                  { val: 'yes', accentCol: '#9B2C22' },
                  { val: 'no', accentCol: '#3B6B4A' },
                  { val: 'unsure', accentCol: '#B7791F' },
                ].map(o => (
                  <button
                    key={o.val}
                    onClick={() => answer(currentQ.id, o.val)}
                    className="w-full text-left py-3 px-4 transition-colors"
                    style={{
                      fontSize: 13,
                      color: '#4A443C',
                      border: `1px solid ${answers[currentQ.id] === o.val ? o.accentCol : '#D8D2C4'}`,
                      background: answers[currentQ.id] === o.val ? `${o.accentCol}10` : '#EDE9DF',
                      borderRadius: 2,
                      cursor: 'pointer',
                      fontFamily: 'var(--font-geist-sans)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = o.accentCol; e.currentTarget.style.color = o.accentCol }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = answers[currentQ.id] === o.val ? o.accentCol : '#D8D2C4'; e.currentTarget.style.color = '#4A443C' }}
                  >
                    {aLabels[o.val]}
                  </button>
                ))}
              </div>

              <div className="mt-8 pt-4" style={{ borderTop: '1px solid #D8D2C4' }}>
                <p style={{ fontSize: 10, color: '#B5AFA4', lineHeight: 1.6 }}>
                  Answer honestly based on what's happening right now. This check takes under 30 seconds.
                </p>
              </div>
            </div>
          )}

          {!loading && !result && questions.length === 0 && (
            <div className="text-center py-16">
              <div className="font-spectral" style={{ fontSize: 18, fontWeight: 300, color: '#B5AFA4' }}>Loading questions...</div>
            </div>
          )}

          {/* Verdict plate */}
          {result && (
            <div>
              {/* Stamp header */}
              <div className="mb-6 pb-5" style={{ borderBottom: '1px solid #D8D2C4' }}>
                <div className="label-caps mb-2" style={{ fontSize: 9, color: '#B5AFA4' }}>Assessment — {result.check_id}</div>
                <div className="font-spectral" style={{ fontSize: 32, fontWeight: 400, color: verdictCol, lineHeight: 1.1 }}>
                  {result.verdict}
                </div>
                <div className="font-mono mt-1" style={{ fontSize: 10, color: '#7A7269' }}>
                  Risk: {result.risk_score.toFixed(1)} / 100
                </div>
              </div>

              {/* Summary */}
              <p style={{ fontSize: 13, color: '#1A1814', lineHeight: 1.75, marginBottom: 20 }}>{result.summary}</p>

              {/* Reasons */}
              {result.reasons.length > 0 && (
                <div className="mb-5">
                  <div className="label-caps mb-3" style={{ fontSize: 9, color: '#B5AFA4' }}>Why this verdict</div>
                  <div className="space-y-2">
                    {result.reasons.map((r, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <div className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0" style={{ background: verdictCol }} />
                        <span style={{ fontSize: 12, color: '#4A443C', lineHeight: 1.6 }}>{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action */}
              <div className="p-4 mb-5" style={{ background: '#EDE9DF', border: '1px solid #D8D2C4', borderRadius: 2 }}>
                <div className="label-caps mb-2" style={{ fontSize: 9, color: '#B5AFA4' }}>Recommended Action</div>
                <p style={{ fontSize: 12, color: '#1A1814', lineHeight: 1.7 }}>{result.action}</p>
              </div>

              {/* Links */}
              <div className="flex gap-3 pt-4" style={{ borderTop: '1px solid #D8D2C4' }}>
                <a href="https://cybercrime.gov.in" target="_blank" rel="noopener" className="label-caps px-4 py-2 transition-colors" style={{ fontSize: 9, border: '1px solid #4A443C', color: '#1A1814', borderRadius: 2, textDecoration: 'none' }}>
                  cybercrime.gov.in
                </a>
                <a href="tel:1930" className="label-caps px-4 py-2" style={{ fontSize: 9, border: `1px solid ${verdictCol}60`, color: verdictCol, borderRadius: 2, textDecoration: 'none' }}>
                  Dial 1930
                </a>
              </div>

              <div className="mt-4" style={{ fontSize: 9, color: '#B5AFA4', fontFamily: 'var(--font-geist-mono)' }}>
                {result.false_positive_note}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
