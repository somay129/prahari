'use client'

import { useRef, useEffect, useState } from 'react'
import { EvidenceSurface } from './EvidenceSurface'
import { EvidenceSeal } from './EvidenceSeal'
import { VerifyPill } from './VerifyPill'
import { apiUrl } from '@/lib/api'

interface Feature {
  name: string
  display_name: string
  passed: boolean
  confidence: number
  detail: string
  region_bbox: number[] | null
}

interface VerdictPlateProps {
  denomination: string
  verdict: string
  confidence: number
  features: Feature[]
  annotatedB64: string
  imageHash: string
  engineVersion: string
  verificationId: string
  caseId?: string
  onGenerateEvidence?: () => void
  evidenceReady?: boolean
  evidenceCase?: string
  evidenceId?: string
}

export function VerdictPlate({
  denomination, verdict, confidence, features,
  annotatedB64, imageHash, engineVersion, verificationId,
  caseId, onGenerateEvidence, evidenceReady, evidenceCase, evidenceId,
}: VerdictPlateProps) {
  const verdictColour =
    verdict === 'GENUINE' ? '#3B6B4A' :
    verdict === 'SUSPECT' ? '#B7791F' : '#9B2C22'

  return (
    <EvidenceSurface className="relative" noPad>
      {/* Exhibit header strip */}
      <div
        className="flex items-center justify-between px-6 py-3"
        style={{ borderBottom: '1px solid #D8D2C4' }}
      >
        <div className="flex items-baseline gap-3">
          <span
            className="font-mono"
            style={{ fontSize: 9, color: '#B5AFA4', letterSpacing: '0.08em' }}
          >
            EXHIBIT
          </span>
          <span
            className="font-mono"
            style={{ fontSize: 11, color: '#4A443C', letterSpacing: '0.06em' }}
          >
            {caseId ?? verificationId}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono" style={{ fontSize: 9, color: '#B5AFA4', letterSpacing: '0.05em' }}>
            ₹{denomination} NOTE · ENGINE {engineVersion}
          </span>
          {evidenceReady && evidenceCase && (
            <EvidenceSeal
              caseId={evidenceCase}
              hash={imageHash}
              engineVersion={engineVersion}
              size="sm"
              onPaper
              animate
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-[1fr_200px] gap-0">
        {/* Left: annotated image */}
        <div className="p-6" style={{ borderRight: '1px solid #D8D2C4' }}>
          <div
            className="label-caps mb-3"
            style={{ fontSize: 9, color: '#B5AFA4', letterSpacing: '0.08em' }}
          >
            Specimen
          </div>
          <div className="relative">
            <img
              src={`data:image/jpeg;base64,${annotatedB64}`}
              alt="Annotated currency note"
              className="w-full object-contain"
              style={{ imageRendering: 'crisp-edges', maxHeight: 240 }}
            />
          </div>
          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: '#3B6B4A', opacity: 0.8 }} />
              <span style={{ fontSize: 10, color: '#7A7269' }}>Pass</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: '#9B2C22', opacity: 0.8 }} />
              <span style={{ fontSize: 10, color: '#7A7269' }}>Fail</span>
            </div>
            <div className="ml-auto font-mono" style={{ fontSize: 9, color: '#B5AFA4' }}>
              {imageHash.slice(0, 12)}…
            </div>
          </div>
        </div>

        {/* Right margin column: feature readings */}
        <div className="flex flex-col" style={{ background: '#EDE9DF' }}>
          <div
            className="px-4 py-3 label-caps"
            style={{ fontSize: 9, color: '#B5AFA4', borderBottom: '1px solid #D8D2C4' }}
          >
            Feature Readings
          </div>
          <div className="flex-1 overflow-y-auto">
            {features.map((f, i) => (
              <div
                key={f.name}
                className="px-4 py-2.5"
                style={{ borderBottom: i < features.length - 1 ? '1px solid #D8D2C4' : 'none' }}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span style={{ fontSize: 10, color: '#4A443C', fontFamily: 'var(--font-geist-sans)', fontWeight: 500 }}>
                    {f.display_name}
                  </span>
                  <span
                    className="font-mono tabular-nums"
                    style={{ fontSize: 10, color: f.passed ? '#3B6B4A' : '#9B2C22' }}
                  >
                    {(f.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="flex-1 h-px"
                    style={{ background: f.passed ? '#3B6B4A' : '#9B2C22', opacity: 0.4 }}
                  />
                  <span
                    className="label-caps"
                    style={{ fontSize: 8, color: f.passed ? '#3B6B4A' : '#9B2C22' }}
                  >
                    {f.passed ? 'PASS' : 'FAIL'}
                  </span>
                </div>
                <div style={{ fontSize: 9, color: '#B5AFA4', marginTop: 2, fontFamily: 'var(--font-geist-sans)' }}>
                  {f.detail.slice(0, 36)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Verdict stamp bar */}
      <div
        className="flex items-center justify-between px-6 py-4"
        style={{ borderTop: '1px solid #D8D2C4' }}
      >
        <div className="flex items-center gap-4">
          <div>
            <div
              className="font-spectral"
              style={{ fontSize: 22, fontWeight: 400, color: verdictColour, lineHeight: 1 }}
            >
              {verdict}
            </div>
            <div className="font-mono mt-1" style={{ fontSize: 10, color: '#7A7269' }}>
              Confidence: {(confidence * 100).toFixed(1)}% · {new Date().toISOString().slice(0, 19)} UTC
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!evidenceReady && (
            <button
              onClick={onGenerateEvidence}
              className="label-caps px-4 py-2 transition-colors"
              style={{
                fontSize: 10,
                color: '#1A1814',
                border: '1px solid #4A443C',
                background: 'transparent',
                borderRadius: 2,
                cursor: 'pointer',
              }}
              onMouseEnter={e => {
                const t = e.currentTarget
                t.style.background = '#1A1814'
                t.style.color = '#F3EFE6'
              }}
              onMouseLeave={e => {
                const t = e.currentTarget
                t.style.background = 'transparent'
                t.style.color = '#1A1814'
              }}
            >
              Generate Evidence Package
            </button>
          )}
          {evidenceReady && evidenceId && (
            <a
              href={apiUrl(`/evidence/${evidenceId}/pdf`)}
              target="_blank"
              rel="noopener noreferrer"
              className="label-caps px-4 py-2 transition-colors"
              style={{
                fontSize: 10,
                color: '#3B6B4A',
                border: '1px solid rgba(59,107,74,0.5)',
                borderRadius: 2,
                textDecoration: 'none',
              }}
            >
              Download PDF
            </a>
          )}
        </div>
      </div>
    </EvidenceSurface>
  )
}
