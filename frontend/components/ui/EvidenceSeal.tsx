'use client'

import { useEffect, useState } from 'react'

interface EvidenceSealProps {
  caseId: string
  hash?: string
  engineVersion?: string
  timestamp?: string
  size?: 'sm' | 'md' | 'lg'
  onPaper?: boolean
  animate?: boolean
}

export function EvidenceSeal({
  caseId,
  hash,
  engineVersion = 'PRAHARI-1.0.0',
  timestamp,
  size = 'md',
  onPaper = false,
  animate = false,
}: EvidenceSealProps) {
  const [show, setShow] = useState(!animate)

  useEffect(() => {
    if (animate) {
      const t = setTimeout(() => setShow(true), 60)
      return () => clearTimeout(t)
    }
  }, [animate])

  const dim = size === 'sm' ? 80 : size === 'md' ? 110 : 148
  const cx = dim / 2
  const r1 = dim / 2 - 4
  const r2 = dim / 2 - 9
  const shortHash = hash ? hash.slice(0, 8).toUpperCase() : ''
  const ts = timestamp
    ? new Date(timestamp).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10)

  if (!show) return null

  return (
    <div
      className={animate ? 'seal-animate' : ''}
      style={{ display: 'inline-block', userSelect: 'none' }}
      title={`Case: ${caseId}${hash ? ' · Hash: ' + hash : ''}`}
    >
      <svg
        width={dim}
        height={dim}
        viewBox={`0 0 ${dim} ${dim}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer ring */}
        <circle cx={cx} cy={cx} r={r1} fill="none" stroke="#9B2C22" strokeWidth="1.5" />
        {/* Inner ring */}
        <circle cx={cx} cy={cx} r={r2} fill="none" stroke="#9B2C22" strokeWidth="0.75" opacity="0.5" />

        {/* Subtle fill */}
        <circle cx={cx} cy={cx} r={r2 - 1} fill={onPaper ? 'rgba(155,44,34,0.04)' : 'rgba(155,44,34,0.06)'} />

        {/* PRAHARI text on arc */}
        <defs>
          <path
            id={`arc-top-${caseId}`}
            d={`M ${cx - r1 + 6},${cx} A ${r1 - 6},${r1 - 6} 0 0,1 ${cx + r1 - 6},${cx}`}
          />
          <path
            id={`arc-bot-${caseId}`}
            d={`M ${cx - r1 + 6},${cx} A ${r1 - 6},${r1 - 6} 0 0,0 ${cx + r1 - 6},${cx}`}
          />
        </defs>

        <text
          fill="#9B2C22"
          style={{ fontFamily: 'var(--font-geist-sans)', fontSize: size === 'sm' ? 6 : 7, fontWeight: 600, letterSpacing: '0.12em' }}
        >
          <textPath href={`#arc-top-${caseId}`} startOffset="50%" textAnchor="middle">
            PRAHARI EVIDENCE
          </textPath>
        </text>

        <text
          fill="#9B2C22"
          style={{ fontFamily: 'var(--font-geist-sans)', fontSize: size === 'sm' ? 6 : 7, fontWeight: 600, letterSpacing: '0.12em' }}
        >
          <textPath href={`#arc-bot-${caseId}`} startOffset="50%" textAnchor="middle">
            {ts}
          </textPath>
        </text>

        {/* Centre content */}
        {size !== 'sm' && (
          <>
            <text
              x={cx}
              y={cx - (size === 'lg' ? 10 : 7)}
              textAnchor="middle"
              fill="#9B2C22"
              style={{ fontFamily: 'var(--font-geist-mono)', fontSize: size === 'lg' ? 7.5 : 6.5, letterSpacing: '0.06em' }}
            >
              {caseId}
            </text>
            {shortHash && (
              <text
                x={cx}
                y={cx + (size === 'lg' ? 5 : 4)}
                textAnchor="middle"
                fill="#9B2C22"
                opacity="0.7"
                style={{ fontFamily: 'var(--font-geist-mono)', fontSize: size === 'lg' ? 6 : 5.5, letterSpacing: '0.04em' }}
              >
                {shortHash}…
              </text>
            )}
            <text
              x={cx}
              y={cx + (size === 'lg' ? 16 : 12)}
              textAnchor="middle"
              fill="#9B2C22"
              opacity="0.6"
              style={{ fontFamily: 'var(--font-geist-mono)', fontSize: size === 'lg' ? 5.5 : 5, letterSpacing: '0.04em' }}
            >
              {engineVersion.slice(0, 14)}
            </text>
          </>
        )}

        {size === 'sm' && (
          <text
            x={cx}
            y={cx + 3}
            textAnchor="middle"
            fill="#9B2C22"
            style={{ fontFamily: 'var(--font-geist-mono)', fontSize: 5.5, letterSpacing: '0.06em' }}
          >
            {caseId}
          </text>
        )}

        {/* Tick marks on ring */}
        {Array.from({ length: 36 }, (_, i) => {
          const angle = (i * 10 * Math.PI) / 180
          const isMajor = i % 9 === 0
          const r_in  = r1 - (isMajor ? 5 : 3)
          const r_out = r1 - 1
          const r = (n: number) => Math.round(n * 1000) / 1000
          return (
            <line
              key={i}
              x1={r(cx + r_in * Math.cos(angle))}
              y1={r(cx + r_in * Math.sin(angle))}
              x2={r(cx + r_out * Math.cos(angle))}
              y2={r(cx + r_out * Math.sin(angle))}
              stroke="#9B2C22"
              strokeWidth={isMajor ? 1 : 0.5}
              opacity={isMajor ? 0.6 : 0.3}
            />
          )
        })}
      </svg>
    </div>
  )
}
