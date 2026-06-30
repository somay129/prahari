'use client'

interface RiskGaugeProps {
  score: number  // 0-100
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

function scoreColour(score: number) {
  if (score >= 75) return '#E5484D'
  if (score >= 50) return '#F5A623'
  if (score >= 25) return '#3E63DD'
  return '#30A46C'
}

function scoreLabel(score: number) {
  if (score >= 75) return 'CRITICAL'
  if (score >= 50) return 'HIGH RISK'
  if (score >= 25) return 'ELEVATED'
  return 'LOW RISK'
}

export function RiskGauge({ score, size = 'md', showLabel = true }: RiskGaugeProps) {
  const clamped = Math.max(0, Math.min(100, score))
  const colour = scoreColour(clamped)
  const label = scoreLabel(clamped)

  const sizes = { sm: 80, md: 120, lg: 160 }
  const dim = sizes[size]
  const stroke = size === 'sm' ? 6 : 8
  const r = (dim - stroke * 2) / 2
  const cx = dim / 2
  const cy = dim / 2
  const circumference = Math.PI * r  // semicircle
  const progress = (clamped / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: dim, height: dim / 2 + 20 }}>
        <svg width={dim} height={dim / 2 + stroke} viewBox={`0 0 ${dim} ${dim / 2 + stroke}`}>
          <path
            d={`M ${stroke} ${dim / 2} A ${r} ${r} 0 0 1 ${dim - stroke} ${dim / 2}`}
            fill="none"
            stroke="#1C2530"
            strokeWidth={stroke}
            strokeLinecap="round"
          />
          <path
            d={`M ${stroke} ${dim / 2} A ${r} ${r} 0 0 1 ${dim - stroke} ${dim / 2}`}
            fill="none"
            stroke={colour}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${progress} ${circumference}`}
            style={{ transition: 'stroke-dasharray 0.6s ease, stroke 0.3s ease' }}
          />
        </svg>
        <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center">
          <span className="font-mono font-bold tabular-nums" style={{ color: colour, fontSize: size === 'sm' ? 18 : size === 'md' ? 26 : 36 }}>
            {Math.round(clamped)}
          </span>
        </div>
      </div>
      {showLabel && (
        <span className="text-[10px] font-bold tracking-widest uppercase font-mono" style={{ color: colour }}>
          {label}
        </span>
      )}
    </div>
  )
}
