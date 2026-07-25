'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { RadarChart, HorizontalBar, ProfileBadge } from './ReportCharts'

// ─── Dimension labels ─────────────────────────────────────────────────────────

const DIMENSION_LABELS: Record<string, string> = {
  ai_adoption: 'Adopción IA',
  tool_exposure: 'Herramientas',
  context_engineering: 'Ing. de Contexto',
  specification_maturity: 'Madurez Specs',
  documentation_maturity: 'Documentación',
  agent_readiness: 'Agentes',
  team_adoption: 'Adopción Equipo',
  ai_leadership: 'Liderazgo IA',
  change_readiness: 'Apertura al Cambio',
}

const DIMENSION_ORDER = Object.keys(DIMENSION_LABELS)

// ─── Types ────────────────────────────────────────────────────────────────────

interface Respondent {
  email: string
  nombre?: string
  perfil?: string
  score?: number
  nivel?: string
  aiChampion?: boolean
  completado?: string
  tiempoMin?: number
  status?: 'completed' | 'pending'
}

interface ReportData {
  campaignName: string
  empresa: string
  companyContext?: string
  totalEnviados: number
  totalCompletados: number
  tasaRespuesta: number
  scorePromedio: number
  tiempoPromedio: number
  profileDistribution: Record<string, number>
  dimensionScores: Record<string, number>
  aiChampionCount: number
  aiChampionPct: number
  nivelDistribution: {
    fundacional: number
    intermedio: number
    avanzado: number
  }
  respondents: Respondent[]
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div
      style={{
        background: '#F3F4F6',
        borderRadius: 12,
        padding: 16,
        flex: '1 1 140px',
        minHeight: 80,
        animation: 'pulse 1.5s ease-in-out infinite',
      }}
    />
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SurveyReportsPage({ params }: { params: { campaignId: string } }) {
  const { campaignId } = params
  const router = useRouter()

  const [password, setPassword] = useState<string | null>(null)
  const [pwInput, setPwInput] = useState('')
  const [authError, setAuthError] = useState(false)
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // Narrative state
  const [narrativeStatus, setNarrativeStatus] = useState<'idle' | 'loading' | 'done'>('idle')
  const [narrative, setNarrative] = useState<string | null>(null)
  const [narrativeUpdatedAt, setNarrativeUpdatedAt] = useState<string | null>(null)

  // Table state
  const [search, setSearch] = useState('')
  const [sortCol, setSortCol] = useState<keyof Respondent>('email')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  // Read password from localStorage on mount
  useEffect(() => {
    const pw = localStorage.getItem('survey_admin_pw')
    setPassword(pw)
  }, [])

  // Fetch report data once we have a password
  useEffect(() => {
    if (password === null) return
    if (password === '') return
    fetchReport(password)
  }, [password]) // eslint-disable-line react-hooks/exhaustive-deps

  const authHeader = (pw: string) => 'Basic ' + btoa(':' + pw)

  async function fetchReport(pw: string) {
    setLoading(true)
    setFetchError(null)
    setAuthError(false)
    try {
      const res = await fetch(`/api/survey/reports/${campaignId}`, {
        headers: { Authorization: authHeader(pw) },
      })
      if (res.status === 401) {
        setAuthError(true)
        setLoading(false)
        return
      }
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const json = await res.json()

      // Map API response → ReportData interface
      const cld = json.courseLevelDistribution ?? {}
      const mapped: ReportData = {
        campaignName: json.campaign?.nombre ?? '',
        empresa: json.campaign?.empresa ?? '',
        companyContext: json.campaign?.company_context ?? '',
        totalEnviados: json.totalSent ?? 0,
        totalCompletados: json.totalCompleted ?? 0,
        tasaRespuesta: json.responseRate ?? 0,
        scorePromedio: json.avgScore ?? 0,
        tiempoPromedio: json.avgCompletionTimeMin ?? 0,
        profileDistribution: json.profileDistribution ?? {},
        dimensionScores: json.dimensionAverages ?? {},
        aiChampionCount: json.aiChampionCount ?? 0,
        aiChampionPct: json.aiChampionPct ?? 0,
        nivelDistribution: {
          fundacional: cld.foundational ?? cld.fundacional ?? 0,
          intermedio: cld.intermediate ?? cld.intermedio ?? 0,
          avanzado: cld.advanced ?? cld.avanzado ?? 0,
        },
        respondents: (json.respondents ?? []).map((r: Record<string, unknown>) => {
          const resp = Array.isArray(r.survey_responses) ? r.survey_responses[0] : r.survey_responses
          return {
            email: String(r.email ?? ''),
            nombre: r.nombre ? String(r.nombre) : undefined,
            perfil: resp?.profile_name ? String(resp.profile_name) : undefined,
            score: resp?.profile_score != null ? Number(resp.profile_score) : undefined,
            nivel: resp?.recommended_level ? String(resp.recommended_level) : undefined,
            aiChampion: resp?.possible_ai_champion === true,
            completado: r.completed_at ? String(r.completed_at) : undefined,
            tiempoMin: resp?.completion_time_seconds != null ? Math.round(Number(resp.completion_time_seconds) / 60) : undefined,
            status: r.status === 'completed' ? 'completed' : 'pending',
            scores: resp?.scores ?? {},
            answers: resp?.answers ?? {},
          }
        }),
      }
      setData(mapped)

      // Load saved narrative if available
      if (json.executiveNarrative) {
        setNarrative(json.executiveNarrative)
        setNarrativeUpdatedAt(json.executiveNarrativeUpdatedAt ?? null)
        setNarrativeStatus('done')
      }
    } catch (e: unknown) {
      setFetchError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  function handlePwSubmit(e: React.FormEvent) {
    e.preventDefault()
    localStorage.setItem('survey_admin_pw', pwInput)
    setPassword(pwInput)
  }

  async function generateNarrative() {
    if (!data || !password) return
    setNarrativeStatus('loading')
    try {
      const res = await fetch(`/api/survey/reports/${campaignId}/interpret`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader(password),
        },
        body: JSON.stringify({ stats: data }),
      })
      if (!res.ok) throw new Error('Error generando diagnóstico')
      const json = await res.json()
      setNarrative(json.narrative ?? json.text ?? JSON.stringify(json))
      setNarrativeUpdatedAt(new Date().toISOString())
      setNarrativeStatus('done')
    } catch {
      setNarrativeStatus('idle')
    }
  }

  // CSV export
  function exportCSV() {
    if (!data) return
    const rows = data.respondents
    const headers = ['Email', 'Nombre', 'Perfil', 'Score', 'Nivel', 'AI Champion', 'Completado', 'Tiempo (min)']
    const lines = [
      headers.join(','),
      ...rows.map(r =>
        [
          r.email,
          r.nombre ?? '',
          r.perfil ?? '',
          r.score ?? '',
          r.nivel ?? '',
          r.aiChampion ? 'Sí' : 'No',
          r.completado ?? '',
          r.tiempoMin ?? '',
        ]
          .map(v => `"${String(v).replace(/"/g, '""')}"`)
          .join(',')
      ),
    ]
    const BOM = '﻿'
    const blob = new Blob([BOM + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reporte-${campaignId}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Table filtering + sorting
  const filteredRespondents = useMemo(() => {
    if (!data) return []
    const q = search.toLowerCase()
    const filtered = data.respondents.filter(
      r =>
        !q ||
        r.email.toLowerCase().includes(q) ||
        (r.nombre ?? '').toLowerCase().includes(q)
    )
    return [...filtered].sort((a, b) => {
      const va = a[sortCol] ?? ''
      const vb = b[sortCol] ?? ''
      const cmp = String(va).localeCompare(String(vb), undefined, { numeric: true })
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [data, search, sortCol, sortDir])

  function toggleSort(col: keyof Respondent) {
    if (sortCol === col) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortCol(col)
      setSortDir('asc')
    }
  }

  function sortIndicator(col: keyof Respondent) {
    if (sortCol !== col) return ' ⇅'
    return sortDir === 'asc' ? ' ▲' : ' ▼'
  }

  // ── No password yet ──────────────────────────────────────────────────────────
  if (password === null) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F3FF' }}>
        <div style={{ background: '#fff', padding: 32, borderRadius: 16, border: '1px solid #E9D5FF', width: 320 }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 18, color: '#1F2937' }}>Acceso Administrador</h2>
          <form onSubmit={handlePwSubmit}>
            <input
              type="password"
              value={pwInput}
              onChange={e => setPwInput(e.target.value)}
              placeholder="Contraseña"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E9D5FF', fontSize: 14, boxSizing: 'border-box', marginBottom: 12 }}
              autoFocus
            />
            <button
              type="submit"
              style={{ width: '100%', padding: '10px 0', background: 'linear-gradient(135deg,#7C3AED,#D946EF)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >
              Entrar
            </button>
          </form>
        </div>
      </div>
    )
  }

  // ── Auth error ───────────────────────────────────────────────────────────────
  if (authError) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F3FF' }}>
        <div style={{ background: '#fff', padding: 32, borderRadius: 16, border: '1px solid #FCA5A5', width: 320, textAlign: 'center' }}>
          <p style={{ color: '#DC2626', fontSize: 15, margin: '0 0 16px' }}>Contraseña incorrecta</p>
          <button
            onClick={() => { localStorage.removeItem('survey_admin_pw'); setPassword(null); setAuthError(false) }}
            style={{ padding: '8px 20px', background: '#7C3AED', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  // ── Print styles ─────────────────────────────────────────────────────────────
  const printStyle = `
    @media print {
      @page { size: A4 portrait; margin: 16mm 14mm; }
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      body { background: #fff !important; }
      .no-print { display: none !important; }
      .print-header { display: block !important; }
      .print-break-before { page-break-before: always; }
      table { page-break-inside: auto; }
      tr { page-break-inside: avoid; }
      thead { display: table-header-group; }
    }
    @media screen { .print-header { display: none; } }
  `

  // ── Loading skeletons ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F9FAFB' }}>
        <style>{printStyle}</style>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: 24 }}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
            {[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
          <SkeletonCard />
        </div>
      </div>
    )
  }

  // ── Fetch error ──────────────────────────────────────────────────────────────
  if (fetchError) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F3FF' }}>
        <p style={{ color: '#DC2626' }}>Error: {fetchError}</p>
      </div>
    )
  }

  if (!data) return null

  const hasCompleted = data.totalCompletados > 0

  // ── Profile distribution ─────────────────────────────────────────────────────
  const profileEntries = Object.entries(data.profileDistribution).sort((a, b) => b[1] - a[1])

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        ${printStyle}
      `}</style>

      {/* Header */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: '#fff',
          borderBottom: '1px solid #E9D5FF',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <button
          className="no-print"
          onClick={() => router.push('/admin/surveys')}
          style={{ background: 'none', border: '1px solid #E9D5FF', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13, color: '#7C3AED', fontWeight: 500, whiteSpace: 'nowrap' }}
        >
          ← Campañas
        </button>

        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1F2937' }}>{data.campaignName}</div>
          <div style={{ fontSize: 12, color: '#6B7280' }}>{data.empresa}</div>
        </div>

        <div className="no-print" style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={exportCSV}
            style={{ background: '#F5F3FF', border: '1px solid #E9D5FF', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 13, color: '#7C3AED', fontWeight: 500 }}
          >
            ⬇ CSV
          </button>
          <button
            onClick={() => window.print()}
            style={{ background: 'linear-gradient(135deg,#7C3AED,#D946EF)', border: 'none', borderRadius: 8, padding: '6px 16px', cursor: 'pointer', fontSize: 13, color: '#fff', fontWeight: 600 }}
          >
            🖨 Exportar PDF
          </button>
        </div>
      </div>

      {/* Print-only cover header */}
      <div className="print-header" style={{ padding: '0 0 24px', borderBottom: '3px solid #7C3AED', marginBottom: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#7C3AED', marginBottom: 8 }}>
          Reporte de Adopción de Inteligencia Artificial
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#111827', marginBottom: 4 }}>{data.campaignName}</div>
        <div style={{ fontSize: 14, color: '#6B7280' }}>{data.empresa}</div>
        <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 8 }}>
          Generado el {new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })} · Human.AiX
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: 24 }}>

        {/* Stat cards */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
          {[
            { label: 'Total enviados', value: data.totalEnviados },
            { label: 'Total completados', value: data.totalCompletados },
            { label: 'Tasa de respuesta', value: `${data.tasaRespuesta}%` },
            { label: 'Score promedio', value: data.totalCompletados > 0 ? `${data.scorePromedio.toFixed(1)}` : '—' },
            { label: 'Tiempo promedio (min)', value: data.tiempoPromedio > 0 ? `${data.tiempoPromedio.toFixed(0)}` : '—' },
          ].map(card => (
            <div
              key={card.label}
              style={{
                flex: '1 1 140px',
                background: '#fff',
                border: '1px solid #E9D5FF',
                borderRadius: 12,
                padding: 16,
              }}
            >
              <div style={{ fontSize: 28, fontWeight: 800, color: '#7C3AED', lineHeight: 1.1 }}>{card.value}</div>
              <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>{card.label}</div>
            </div>
          ))}
        </div>

        {/* Banner when no completions yet */}
        {!hasCompleted && (
          <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: '14px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 20 }}>⏳</span>
            <div>
              <p style={{ color: '#92400E', fontSize: 13, fontWeight: 700, margin: '0 0 2px' }}>Todavía no hay respuestas completadas</p>
              <p style={{ color: '#B45309', fontSize: 12, margin: 0 }}>
                {data.totalEnviados === 0
                  ? 'Importa participantes y envía las invitaciones para comenzar a recibir respuestas.'
                  : `${data.totalEnviados} invitación${data.totalEnviados !== 1 ? 'es' : ''} enviada${data.totalEnviados !== 1 ? 's' : ''} — en cuanto alguien complete la encuesta, los reportes aparecerán aquí.`}
              </p>
            </div>
          </div>
        )}

        {/* Two-column: Profiles + Radar — only when there are completions */}
        {hasCompleted && <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 24 }}>
          {/* Profile distribution */}
          <div
            style={{
              flex: '1 1 280px',
              background: '#fff',
              border: '1px solid #E9D5FF',
              borderRadius: 12,
              padding: 20,
            }}
          >
            <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#1F2937' }}>Distribución de Perfiles</h3>
            <div style={{ marginBottom: 16 }}>
              {profileEntries.map(([name, count]) => {
                const pct = data.totalCompletados > 0 ? Math.round((count / data.totalCompletados) * 100) : 0
                return (
                  <ProfileBadge key={name} profileName={name} count={count} pct={pct} />
                )
              })}
            </div>
            <div>
              {profileEntries.map(([name, count]) => (
                <HorizontalBar
                  key={name}
                  label={name}
                  value={count}
                  max={data.totalCompletados}
                  showPct
                />
              ))}
            </div>
          </div>

          {/* Radar + dimension table */}
          <div
            style={{
              flex: '1 1 280px',
              background: '#fff',
              border: '1px solid #E9D5FF',
              borderRadius: 12,
              padding: 20,
            }}
          >
            <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#1F2937' }}>Dimensiones de Adopción IA</h3>
            <RadarChart dimensions={data.dimensionScores} labels={DIMENSION_LABELS} size={260} />
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16, fontSize: 12 }}>
              <tbody>
                {DIMENSION_ORDER.map(key => (
                  <tr key={key} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '5px 0', color: '#374151' }}>{DIMENSION_LABELS[key]}</td>
                    <td style={{ padding: '5px 0', textAlign: 'right', fontWeight: 600, color: '#7C3AED' }}>
                      {(data.dimensionScores[key] ?? 0).toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>}

        {/* AI Champion highlight — only when completions exist */}
        {hasCompleted && <>
        <div
          style={{
            background: 'linear-gradient(135deg,rgba(124,58,237,0.08),rgba(217,70,239,0.08))',
            border: '1px solid #E9D5FF',
            borderRadius: 12,
            padding: 24,
            marginBottom: 24,
            display: 'flex',
            gap: 20,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div style={{ fontSize: 48, fontWeight: 800, color: '#7C3AED', lineHeight: 1 }}>
              {data.aiChampionCount}
            </div>
            <div style={{ fontSize: 13, color: '#6D28D9', fontWeight: 500 }}>{data.aiChampionPct}% del cohorte</div>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#1F2937', marginBottom: 6 }}>
              posibles AI Champions en este cohorte
            </div>
            <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6 }}>
              Un AI Champion es un colaborador con alto nivel de adopción IA (score ≥ 80), uso activo de herramientas, y disposición para liderar el cambio en su equipo. Son los multiplicadores ideales para programas internos de IA.
            </div>
          </div>
        </div>

        {/* Course level distribution */}
        <div
          style={{
            background: '#fff',
            border: '1px solid #E9D5FF',
            borderRadius: 12,
            padding: 20,
            marginBottom: 24,
          }}
        >
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#1F2937' }}>Distribución por Nivel de Curso</h3>
          <HorizontalBar
            label="Fundacional"
            value={data.nivelDistribution.fundacional}
            max={data.totalCompletados}
            color="#3B82F6"
            showPct
          />
          <HorizontalBar
            label="Intermedio"
            value={data.nivelDistribution.intermedio}
            max={data.totalCompletados}
            color="#7C3AED"
            showPct
          />
          <HorizontalBar
            label="Avanzado"
            value={data.nivelDistribution.avanzado}
            max={data.totalCompletados}
            color="#D97706"
            showPct
          />
        </div>

        {/* AI Narrative */}
        <div
          style={{
            background: '#fff',
            border: '1px solid #E9D5FF',
            borderRadius: 12,
            padding: 20,
            marginBottom: 24,
          }}
        >
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#1F2937' }}>Diagnóstico Ejecutivo por IA</h3>

          {narrativeStatus === 'idle' && (
            <button
              className="no-print"
              onClick={generateNarrative}
              style={{
                background: 'linear-gradient(135deg,#7C3AED,#D946EF)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '10px 20px',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              ✨ Generar diagnóstico con IA
            </button>
          )}

          {narrativeStatus === 'loading' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#7C3AED', fontSize: 14 }}>
              <svg width={20} height={20} viewBox="0 0 24 24" style={{ animation: 'spin 1s linear infinite' }}>
                <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
                <circle cx={12} cy={12} r={10} fill="none" stroke="#E9D5FF" strokeWidth={3} />
                <path d="M12 2 a10 10 0 0 1 10 10" fill="none" stroke="#7C3AED" strokeWidth={3} strokeLinecap="round" />
              </svg>
              Generando diagnóstico…
            </div>
          )}

          {narrativeStatus === 'done' && narrative && (
            <div>
              {narrative.split('\n\n').map((para, i) => (
                <p key={i} style={{ fontSize: 14, lineHeight: 1.8, color: '#374151', margin: '0 0 14px' }}>{para}</p>
              ))}
              <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                <button
                  onClick={generateNarrative}
                  style={{
                    background: '#F5F3FF',
                    color: '#7C3AED',
                    border: '1px solid #E9D5FF',
                    borderRadius: 8,
                    padding: '8px 16px',
                    fontSize: 13,
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  ↻ Regenerar
                </button>
                {narrativeUpdatedAt && (
                  <span style={{ fontSize: 12, color: '#9CA3AF' }}>
                    Generado: {new Date(narrativeUpdatedAt).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
        </>}

        {/* Respondents table */}
        <div
          className="print-break-before"
          style={{
            background: '#fff',
            border: '1px solid #E9D5FF',
            borderRadius: 12,
            padding: 20,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1F2937' }}>Participantes</h3>
            <input
              className="no-print"
              type="search"
              placeholder="Buscar por email o nombre…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                padding: '7px 12px',
                borderRadius: 8,
                border: '1px solid #E9D5FF',
                fontSize: 13,
                width: 240,
                outline: 'none',
              }}
            />
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E9D5FF' }}>
                  {(
                    [
                      { key: 'email', label: 'Email' },
                      { key: 'nombre', label: 'Nombre' },
                      { key: 'perfil', label: 'Perfil' },
                      { key: 'score', label: 'Score' },
                      { key: 'nivel', label: 'Nivel' },
                      { key: 'aiChampion', label: 'AI Champion' },
                      { key: 'completado', label: 'Completado' },
                    ] as { key: keyof Respondent; label: string }[]
                  ).map(col => (
                    <th
                      key={col.key}
                      onClick={() => toggleSort(col.key)}
                      style={{
                        padding: '8px 10px',
                        textAlign: 'left',
                        color: '#6B7280',
                        fontWeight: 600,
                        cursor: 'pointer',
                        userSelect: 'none',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {col.label}
                      <span style={{ fontSize: 10, color: sortCol === col.key ? '#7C3AED' : '#D1D5DB' }}>
                        {sortIndicator(col.key)}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRespondents.map((r, i) => (
                  <tr
                    key={r.email}
                    style={{
                      background: i % 2 === 0 ? '#fff' : '#FAFAFA',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#F5F3FF')}
                    onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#FAFAFA')}
                  >
                    <td style={{ padding: '8px 10px', color: '#374151' }}>{r.email}</td>
                    <td style={{ padding: '8px 10px', color: '#374151' }}>{r.nombre ?? '—'}</td>
                    <td style={{ padding: '8px 10px' }}>
                      {r.perfil ? (
                        <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 99, background: '#F5F3FF', color: '#7C3AED', fontWeight: 500 }}>
                          {r.perfil}
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '8px 10px', fontWeight: 600, color: '#7C3AED' }}>
                      {r.score != null ? r.score.toFixed(1) : '—'}
                    </td>
                    <td style={{ padding: '8px 10px', color: '#374151' }}>{r.nivel ?? '—'}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                      {r.aiChampion ? (
                        <span style={{ fontSize: 16 }} title="AI Champion">⭐</span>
                      ) : (
                        <span style={{ color: '#D1D5DB', fontSize: 13 }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      {r.status === 'completed' ? (
                        <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 99, background: '#D1FAE5', color: '#065F46', fontWeight: 500 }}>
                          {r.completado ? new Date(r.completado).toLocaleDateString('es-MX') : 'Completado'}
                        </span>
                      ) : (
                        <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 99, background: '#F3F4F6', color: '#6B7280', fontWeight: 500 }}>
                          Pendiente
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredRespondents.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ padding: '24px 10px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
                      Sin resultados para &ldquo;{search}&rdquo;
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        {/* Print footer */}
        <div className="print-header" style={{ marginTop: 32, paddingTop: 16, borderTop: '1px solid #E9D5FF', display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#9CA3AF' }}>
          <span>Human.AiX — Diagnóstico de Adopción IA</span>
          <span>{data.campaignName} · {data.empresa}</span>
          <span>{new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>
      </div>
    </div>
  )
}
