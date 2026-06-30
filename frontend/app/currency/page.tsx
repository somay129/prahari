'use client'

import { useState, useRef } from 'react'
import { apiUpload, apiUrl } from '@/lib/api'
import { VerdictPlate } from '@/components/ui/VerdictPlate'
import { ConsolePanel, PanelHeader } from '@/components/ui/ConsolePanel'

type Denomination = '100' | '200' | '500' | '2000'

interface Feature {
  name: string
  display_name: string
  passed: boolean
  confidence: number
  detail: string
  region_bbox: number[] | null
}

interface VerifyResult {
  verification_id: string
  denomination: string
  verdict: string
  overall_confidence: number
  features: Feature[]
  annotated_image_b64: string
  image_hash: string
  engine_version: string
}

interface EvidenceResult {
  evidence_id: string
  case_id: string
}

const DENOMINATIONS: Denomination[] = ['100', '200', '500', '2000']

export default function CurrencyPage() {
  const [denom, setDenom] = useState<Denomination>('500')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<VerifyResult | null>(null)
  const [evidence, setEvidence] = useState<EvidenceResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [genEvLoading, setGenEvLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [webcam, setWebcam] = useState(false)
  const streamRef = useRef<MediaStream | null>(null)

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f); setPreview(URL.createObjectURL(f))
    setResult(null); setEvidence(null); setError(null)
  }

  const startWebcam = async () => {
    setWebcam(true)
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
    streamRef.current = stream
    if (videoRef.current) videoRef.current.srcObject = stream
  }

  const captureWebcam = () => {
    if (!videoRef.current) return
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    canvas.getContext('2d')!.drawImage(videoRef.current, 0, 0)
    canvas.toBlob(blob => {
      if (!blob) return
      const f = new File([blob], 'webcam.jpg', { type: 'image/jpeg' })
      setFile(f); setPreview(URL.createObjectURL(f))
      setResult(null); setEvidence(null); setError(null)
      stopWebcam()
    }, 'image/jpeg', 0.92)
  }

  const stopWebcam = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    setWebcam(false)
  }

  const verify = async () => {
    if (!file) return
    setLoading(true); setError(null); setResult(null); setEvidence(null)
    const form = new FormData()
    form.append('file', file)
    form.append('denomination', denom)
    try {
      setResult(await apiUpload<VerifyResult>('/currency/verify', form))
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const generateEvidence = async () => {
    if (!result) return
    setGenEvLoading(true)
    try {
      setEvidence(await apiUpload<EvidenceResult>(`/currency/verify/${result.verification_id}/evidence`, new FormData()))
    } catch (e: any) {
      setError(e.message)
    } finally {
      setGenEvLoading(false)
    }
  }

  return (
    <div className="flex h-full min-h-0">
      {/* ── Left instrument rail ──────────────────────────── */}
      <div
        className="w-52 flex-shrink-0 overflow-y-auto py-7 px-5 flex flex-col gap-5"
        style={{ borderRight: '1px solid #26262B' }}
      >
        {/* Page header */}
        <div className="pb-5" style={{ borderBottom: '1px solid #26262B' }}>
          <div className="label-caps text-ink-dim mb-1" style={{ fontSize: 9 }}>II · Currency</div>
          <h1
            className="font-spectral text-ink-bright"
            style={{ fontSize: 18, fontWeight: 400, lineHeight: 1.2 }}
          >
            Verification
          </h1>
          <p className="text-ink-muted mt-1" style={{ fontSize: 10, lineHeight: 1.5 }}>
            Multi-feature signal analysis — 7 independent checks
          </p>
        </div>

        {/* Denomination selector */}
        <div>
          <div className="label-caps text-ink-dim mb-2.5" style={{ fontSize: 9 }}>Denomination</div>
          <div className="grid grid-cols-2 gap-1.5">
            {DENOMINATIONS.map(d => (
              <button
                key={d}
                onClick={() => setDenom(d)}
                className="py-2 transition-colors font-mono"
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  border: `1px solid ${denom === d ? '#9B2C22' : '#26262B'}`,
                  background: denom === d ? 'rgba(155,44,34,0.1)' : 'transparent',
                  color: denom === d ? '#9B2C22' : '#6B6B72',
                  borderRadius: 2,
                  cursor: 'pointer',
                }}
              >
                ₹{d}
              </button>
            ))}
          </div>
        </div>

        {/* Image capture */}
        <div>
          <div className="label-caps text-ink-dim mb-2.5" style={{ fontSize: 9 }}>Specimen Input</div>

          {webcam ? (
            <div className="space-y-2">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full"
                style={{ border: '1px solid #26262B', borderRadius: 2 }}
              />
              <div className="flex gap-1.5">
                <button
                  onClick={captureWebcam}
                  className="flex-1 py-2 label-caps"
                  style={{ fontSize: 9, background: '#9B2C22', color: '#F3EFE6', border: 'none', borderRadius: 2, cursor: 'pointer' }}
                >
                  Capture
                </button>
                <button
                  onClick={stopWebcam}
                  className="px-3 py-2 label-caps"
                  style={{ fontSize: 9, border: '1px solid #26262B', color: '#6B6B72', background: 'transparent', borderRadius: 2, cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div
              className="text-center cursor-pointer transition-colors"
              style={{
                border: '1px dashed #3A3A42',
                borderRadius: 2,
                padding: preview ? 4 : '20px 8px',
              }}
              onClick={() => fileRef.current?.click()}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#6B6B72')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#3A3A42')}
            >
              {preview ? (
                <img src={preview} alt="Note" className="w-full object-contain" style={{ maxHeight: 100, borderRadius: 1 }} />
              ) : (
                <>
                  <div className="label-caps text-ink-dim mb-1" style={{ fontSize: 9 }}>Drop or click</div>
                  <div style={{ fontSize: 10, color: '#3A3A42' }}>JPG · PNG · max 20 MB</div>
                </>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
            </div>
          )}

          {!webcam && (
            <button
              onClick={startWebcam}
              className="w-full mt-1.5 py-2 label-caps transition-colors"
              style={{ fontSize: 9, border: '1px solid #26262B', color: '#6B6B72', background: 'transparent', borderRadius: 2, cursor: 'pointer' }}
            >
              Use Camera
            </button>
          )}
        </div>

        {/* Verify button */}
        <button
          onClick={verify}
          disabled={!file || loading}
          className="w-full py-2.5 label-caps transition-colors"
          style={{
            fontSize: 10,
            background: (!file || loading) ? '#26262B' : '#9B2C22',
            color: (!file || loading) ? '#3A3A42' : '#F3EFE6',
            border: 'none',
            borderRadius: 2,
            cursor: (!file || loading) ? 'not-allowed' : 'pointer',
            letterSpacing: '0.08em',
          }}
        >
          {loading ? 'Analysing...' : 'Verify Note'}
        </button>

        {error && (
          <div
            className="text-xs p-3"
            style={{ border: '1px solid rgba(155,44,34,0.4)', background: 'rgba(155,44,34,0.08)', color: '#9B2C22', borderRadius: 2 }}
          >
            {error}
          </div>
        )}

        {/* Spec */}
        <div style={{ borderTop: '1px solid #26262B', paddingTop: 16, marginTop: 'auto' }}>
          <div className="label-caps text-ink-dim mb-2" style={{ fontSize: 9 }}>Engine Spec</div>
          <div className="space-y-1.5">
            {[
              ['Checks', '7 features'],
              ['False-positive', '<3%'],
              ['Offline', 'Yes'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span style={{ fontSize: 10, color: '#6B6B72' }}>{k}</span>
                <span className="font-mono" style={{ fontSize: 10, color: '#9A9AA5' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main exhibit canvas ───────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-7 min-w-0">
        {result ? (
          <div className="space-y-5">
            <VerdictPlate
              denomination={result.denomination}
              verdict={result.verdict}
              confidence={result.overall_confidence}
              features={result.features}
              annotatedB64={result.annotated_image_b64}
              imageHash={result.image_hash}
              engineVersion={result.engine_version}
              verificationId={result.verification_id}
              caseId={evidence?.case_id}
              onGenerateEvidence={generateEvidence}
              evidenceReady={!!evidence}
              evidenceCase={evidence?.case_id}
              evidenceId={evidence?.evidence_id}
            />

            {/* Decision trace */}
            <ConsolePanel noPad border>
              <PanelHeader
                title="Decision Trace"
                sub="Per-feature signal readings from the verification engine"
              />
              <table className="ledger">
                <thead>
                  <tr>
                    <th>Feature</th>
                    <th>Detail</th>
                    <th className="num">Confidence</th>
                    <th className="num">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {result.features.map(f => (
                    <tr key={f.name}>
                      <td style={{ fontSize: 11, color: '#E8E6E1' }}>{f.display_name}</td>
                      <td style={{ fontSize: 10, color: '#6B6B72', maxWidth: 260 }}>
                        <span className="truncate block" title={f.detail}>{f.detail}</span>
                      </td>
                      <td className="num">
                        <span className="font-mono tabular-nums" style={{ fontSize: 11, color: '#9A9AA5' }}>
                          {(f.confidence * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="num">
                        <span
                          className="label-caps"
                          style={{ fontSize: 9, color: f.passed ? '#3B6B4A' : '#9B2C22' }}
                        >
                          {f.passed ? 'PASS' : 'FAIL'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ConsolePanel>
          </div>
        ) : (
          /* Empty state */
          <div
            className="h-full flex flex-col items-center justify-center"
            style={{ minHeight: 400 }}
          >
            <div
              className="text-center"
              style={{ maxWidth: 320 }}
            >
              <div
                className="font-spectral text-ink-dim mb-3"
                style={{ fontSize: 22, fontWeight: 300 }}
              >
                Awaiting Specimen
              </div>
              <p style={{ fontSize: 11, color: '#3A3A42', lineHeight: 1.7 }}>
                Upload a note image and select its denomination. The verification engine will run 7 independent feature checks and render a forensic exhibit here.
              </p>
              {loading && (
                <div className="mt-6 flex items-center justify-center gap-2">
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: '#9B2C22', animation: 'pulse 1s infinite' }}
                  />
                  <span className="label-caps text-ink-muted" style={{ fontSize: 9 }}>
                    Analysing specimen...
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
