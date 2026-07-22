'use client'

import React from 'react'

// ─── Radar Chart ─────────────────────────────────────────────────────────────

const DIMENSION_ORDER = [
  'ai_adoption',
  'tool_exposure',
  'context_engineering',
  'specification_maturity',
  'documentation_maturity',
  'agent_readiness',
  'team_adoption',
  'ai_leadership',
  'change_readiness',
]

interface RadarChartProps {
  dimensions: Record<string, number>
  labels: Record<string, string>
  size?: number
}

export function RadarChart({ dimensions, labels, size = 280 }: RadarChartProps) {
  const cx = size / 2
  const cy = size / 2
  const radius = size * 0.38
  const n = 9

  const getPoint = (i: number, pct: number) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2
    return {
      x: cx + radius * pct * Math.cos(angle),
      y: cy + radius * pct * Math.sin(angle),
    }
  }

  const dataPoints = DIMENSION_ORDER.map((key, i) => {
    const score = dimensions[key] ?? 0
    return getPoint(i, score / 100)
  })

  const polygonPoints = dataPoints.map(p => `${p.x},${p.y}`).join(' ')

  const referenceCircles = [0.25, 0.5, 0.75, 1.0]

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block', margin: '0 auto' }}>
      {/* Reference circles */}
      {referenceCircles.map(pct => (
        <circle
          key={pct}
          cx={cx}
          cy={cy}
          r={radius * pct}
          fill="none"
          stroke="#F3F4F6"
          strokeWidth={0.5}
        />
      ))}

      {/* Axis lines */}
      {DIMENSION_ORDER.map((_, i) => {
        const tip = getPoint(i, 1)
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={tip.x}
            y2={tip.y}
            stroke="#E9D5FF"
            strokeWidth={1}
          />
        )
      })}

      {/* Data polygon */}
      <polygon
        points={polygonPoints}
        fill="rgba(124,58,237,0.15)"
        stroke="#7C3AED"
        strokeWidth={2}
        strokeLinejoin="round"
      />

      {/* Score dots */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill="#7C3AED" />
      ))}

      {/* Axis labels */}
      {DIMENSION_ORDER.map((key, i) => {
        const labelPct = 1.08
        const angle = (i / n) * 2 * Math.PI - Math.PI / 2
        const lx = cx + radius * labelPct * Math.cos(angle)
        const ly = cy + radius * labelPct * Math.sin(angle)
        const label = labels[key] ?? key
        const parts = label.length > 12 ? [label.slice(0, Math.ceil(label.length / 2)), label.slice(Math.ceil(label.length / 2))] : [label]

        return (
          <text
            key={key}
            x={lx}
            y={ly}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={9}
            fill="#6B7280"
          >
            {parts.length === 1 ? (
              parts[0]
            ) : (
              <>
                <tspan x={lx} dy="-5">{parts[0]}</tspan>
                <tspan x={lx} dy="10">{parts[1]}</tspan>
              </>
            )}
          </text>
        )
      })}
    </svg>
  )
}

// ─── Horizontal Bar ───────────────────────────────────────────────────────────

interface HorizontalBarProps {
  label: string
  value: number
  max: number
  color?: string
  showPct?: boolean
}

export function HorizontalBar({ label, value, max, color = '#7C3AED', showPct = false }: HorizontalBarProps) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  const fillWidth = max > 0 ? (value / max) * 100 : 0

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13, color: '#374151' }}>
        <span>{label}</span>
        <span style={{ color: '#6B7280', fontWeight: 500 }}>
          {value}{showPct ? ` (${pct}%)` : ''}
        </span>
      </div>
      <div style={{ height: 8, borderRadius: 99, background: '#F3F4F6', overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${fillWidth}%`,
            background: color,
            borderRadius: 99,
            transition: 'width 0.6s ease',
          }}
        />
      </div>
    </div>
  )
}

// ─── Profile Badge ────────────────────────────────────────────────────────────

interface ProfileBadgeProps {
  profileName: string
  count: number
  pct: number
}

function getProfileColor(name: string): { bg: string; text: string; border: string } {
  const n = name.toLowerCase()
  if (n.includes('champion')) return { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' }
  if (n.includes('enhanced') || n.includes('mejorado')) return { bg: '#F5F3FF', text: '#6D28D9', border: '#C4B5FD' }
  if (n.includes('practitioner') || n.includes('practicante')) return { bg: '#EFF6FF', text: '#1D4ED8', border: '#93C5FD' }
  // AI Explorer / default
  return { bg: '#F9FAFB', text: '#4B5563', border: '#D1D5DB' }
}

export function ProfileBadge({ profileName, count, pct }: ProfileBadgeProps) {
  const colors = getProfileColor(profileName)
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 12px',
        borderRadius: 99,
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        marginBottom: 8,
        marginRight: 8,
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>{profileName}</span>
      <span
        style={{
          fontSize: 12,
          color: colors.text,
          opacity: 0.8,
          background: 'rgba(0,0,0,0.06)',
          borderRadius: 99,
          padding: '1px 7px',
        }}
      >
        {count} · {pct}%
      </span>
    </div>
  )
}
