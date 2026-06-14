'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'

interface Response {
  aprendizajes?: string[]
  horas_proyectadas?: string
  area_impacto?: string
  nivel_listo?: string
  plan_90_dias?: unknown[]
  updated_at?: string
}

interface Diagnostic {
  email_status?: string
  sent_at?: string
}

interface ParticipantRow {
  id: string
  created_at: string
  nombre: string
  puesto: string
  departamento: string
  email: string
  curso_fecha: string
  responses?: Response[]
  diagnostics?: Diagnostic[]
}

const GOLD = '#C9A84C'

function buildBasicAuth(password: string) {
  return 'Basic ' + btoa(`admin:${password}`)
}

function SessionBadge({ status }: { status?: string }) {
  const map: Record<string, string> = { sent: '#22c55e', failed: '#ef4444', pending: '#888' }
  const color = map[status ?? 'pending'] ?? '#888'
  return (
    <span style={{ background: color, color: '#fff', fontSize: 10, padding: '2px 6px', borderRadius: 10, fontWeight: 700 }}>
      {status ?? 'pending'}
    </span>
  )
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ background: '#0d0d0d', border: `1px solid #1f1f1f`, borderRadius: 8, padding: '16px 20px', flex: 1, minWidth: 120 }}>
      <div style={{ color: GOLD, fontSize: 28, fontWeight: 800, lineHeight: 1 }}>{value}</div>
      <div style={{ color: '#666', fontSize: 11, marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
    </div>
  )
}

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [authError, setAuthError] = useState('')
  const [participants, setParticipants] = useState<ParticipantRow[]>([])
  const [dates, setDates] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [storedAuth, setStoredAuth] = useState('')

  const fetchData = useCallback(async (auth: string, fecha?: string) => {
    setLoading(true)
    const url = '/api/admin/data' + (fecha ? `?fecha=${fecha}` : '')
    const res = await fetch(url, { headers: { Authorization: auth } })
    if (res.status === 401) { setAuthed(false); setLoading(false); return }
    const json = await res.json()
    setParticipants(json.participants ?? [])
    setDates(json.dates ?? [])
    setLoading(false)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const auth = buildBasicAuth(password)
    setLoading(true)
    const res = await fetch('/api/admin/data', { headers: { Authorization: auth } })
    if (res.status === 401) { setAuthError('Contraseña incorrecta'); setLoading(false); return }
    const json = await res.json()
    setParticipants(json.participants ?? [])
    setDates(json.dates ?? [])
    setStoredAuth(auth)
    setAuthed(true)
    setLoading(false)
  }

  useEffect(() => {
    if (!authed || !storedAuth) return
    fetchData(storedAuth, selectedDate || undefined)
  }, [selectedDate, authed, storedAuth, fetchData])

  // Auto-refresh every 30s
  useEffect(() => {
    if (!authed || !storedAuth) return
    const id = setInterval(() => fetchData(storedAuth, selectedDate || undefined), 30000)
    return () => clearInterval(id)
  }, [authed, storedAuth, selectedDate, fetchData])

  // --- Metrics ---
  const resp = (p: ParticipantRow) => p.responses?.[0]
  const diag = (p: ParticipantRow) => p.diagnostics?.[0]

  const totalHours = participants.reduce((sum, p) => {
    const h = resp(p)?.horas_proyectadas
    const map: Record<string, number> = { '1h': 1, '2h': 2, '3h': 3, '5h': 5, '8h': 8, '+8h': 10 }
    return sum + (map[h ?? ''] ?? 0)
  }, 0)

  const nivelCounts: Record<string, number> = {}
  participants.forEach(p => {
    const n = resp(p)?.nivel_listo
    if (n) nivelCounts[n] = (nivelCounts[n] ?? 0) + 1
  })

  const aprendizajesCounts: Record<string, number> = {}
  participants.forEach(p => {
    (resp(p)?.aprendizajes ?? []).forEach(a => {
      aprendizajesCounts[a] = (aprendizajesCounts[a] ?? 0) + 1
    })
  })
  const topAprendizajes = Object.entries(aprendizajesCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const sentCount = participants.filter(p => diag(p)?.email_status === 'sent').length
  const completedCount = participants.filter(p => resp(p)?.plan_90_dias && (resp(p)?.plan_90_dias as unknown[]).length > 0).length

  // --- CSV Export ---
  const exportCSV = () => {
    const rows = [
      ['Nombre', 'Puesto', 'Departamento', 'Email', 'Fecha Curso', 'Horas/sem', 'Área Impacto', 'Nivel Listo', 'Email Status', 'Aprendizajes'],
      ...participants.map(p => [
        p.nombre, p.puesto, p.departamento, p.email, p.curso_fecha,
        resp(p)?.horas_proyectadas ?? '',
        resp(p)?.area_impacto ?? '',
        resp(p)?.nivel_listo ?? '',
        diag(p)?.email_status ?? '',
        (resp(p)?.aprendizajes ?? []).join(' | '),
      ])
    ]
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ai-course-${selectedDate || 'all'}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // --- Login Screen ---
  if (!authed) {
    return (
      <main style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <div style={{ width: '100%', maxWidth: 360, padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <Image src="https://www.humanaix.mx/assets/logos/LogoHumanAltablanco.png" alt="Human.AiX" width={160} height={40} style={{ objectFit: 'contain', marginBottom: 24 }} unoptimized />
            <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: '0 0 4px' }}>Panel de Administración</h1>
            <p style={{ color: '#666', fontSize: 13, margin: 0 }}>Desbloquea el Chip de IA</p>
          </div>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ width: '100%', background: '#0d0d0d', border: `1px solid ${authError ? '#ef4444' : '#2a2a2a'}`, borderRadius: 8, padding: '14px 16px', color: '#fff', fontSize: 15, boxSizing: 'border-box', outline: 'none', marginBottom: 12 }}
            />
            {authError && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>{authError}</p>}
            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', background: GOLD, color: '#000', border: 'none', borderRadius: 8, padding: '14px', fontWeight: 700, fontSize: 15, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Verificando…' : 'Ingresar'}
            </button>
          </form>
        </div>
      </main>
    )
  }

  // --- Dashboard ---
  return (
    <main style={{ minHeight: '100vh', background: '#050505', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: '#fff' }}>
      {/* Header */}
      <div style={{ background: '#0a0a0a', borderBottom: `1px solid #1a1a1a`, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Image src="https://www.humanaix.mx/assets/logos/LogoHumanAltablanco.png" alt="Human.AiX" width={120} height={30} style={{ objectFit: 'contain' }} unoptimized />
          <div style={{ width: 1, height: 24, background: '#2a2a2a' }} />
          <span style={{ color: '#888', fontSize: 13 }}>Panel Admin · Desbloquea el Chip de IA</span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {loading && <span style={{ color: '#555', fontSize: 12 }}>Actualizando…</span>}
          <button onClick={exportCSV} style={{ background: 'transparent', border: `1px solid #2a2a2a`, color: '#aaa', borderRadius: 6, padding: '7px 14px', fontSize: 12, cursor: 'pointer' }}>
            Exportar CSV
          </button>
          <button onClick={() => fetchData(storedAuth, selectedDate || undefined)} style={{ background: GOLD, color: '#000', border: 'none', borderRadius: 6, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            Actualizar
          </button>
        </div>
      </div>

      {/* Session Tabs */}
      <div style={{ borderBottom: `1px solid #1a1a1a`, padding: '0 24px', display: 'flex', gap: 4, overflowX: 'auto' }}>
        <button
          onClick={() => setSelectedDate('')}
          style={{ padding: '12px 16px', fontSize: 13, background: 'transparent', border: 'none', borderBottom: selectedDate === '' ? `2px solid ${GOLD}` : '2px solid transparent', color: selectedDate === '' ? GOLD : '#666', cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          Todas las sesiones
        </button>
        {dates.map(d => (
          <button
            key={d}
            onClick={() => setSelectedDate(d)}
            style={{ padding: '12px 16px', fontSize: 13, background: 'transparent', border: 'none', borderBottom: selectedDate === d ? `2px solid ${GOLD}` : '2px solid transparent', color: selectedDate === d ? GOLD : '#666', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            {new Date(d + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
        {/* Metrics */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
          <MetricCard label="Participantes" value={participants.length} />
          <MetricCard label="Completaron plan" value={completedCount} />
          <MetricCard label="Emails enviados" value={sentCount} />
          <MetricCard label="Horas/sem recuperadas" value={`${totalHours}h`} />
        </div>

        {/* Two-col: top aprendizajes + nivel listo */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
          <div style={{ background: '#0d0d0d', border: '1px solid #1f1f1f', borderRadius: 8, padding: 20, flex: 2, minWidth: 280 }}>
            <h3 style={{ color: GOLD, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 16px' }}>Top aprendizajes seleccionados</h3>
            {topAprendizajes.length === 0 && <p style={{ color: '#555', fontSize: 13 }}>Sin datos aún</p>}
            {topAprendizajes.map(([label, count]) => (
              <div key={label} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ color: '#ccc', fontSize: 13, flex: 1, marginRight: 12 }}>{label}</span>
                  <span style={{ color: GOLD, fontWeight: 700, fontSize: 13 }}>{count}</span>
                </div>
                <div style={{ height: 4, background: '#1a1a1a', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: GOLD, borderRadius: 2, width: `${Math.min(100, (count / participants.length) * 100)}%`, transition: 'width 0.5s' }} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: '#0d0d0d', border: '1px solid #1f1f1f', borderRadius: 8, padding: 20, flex: 1, minWidth: 220 }}>
            <h3 style={{ color: GOLD, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 16px' }}>Nivel de preparación</h3>
            {Object.keys(nivelCounts).length === 0 && <p style={{ color: '#555', fontSize: 13 }}>Sin datos aún</p>}
            {Object.entries(nivelCounts).sort((a, b) => b[1] - a[1]).map(([nivel, count]) => (
              <div key={nivel} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: '#ccc', fontSize: 12, flex: 1, marginRight: 8 }}>{nivel}</span>
                  <span style={{ color: GOLD, fontWeight: 700, fontSize: 13 }}>{count}</span>
                </div>
                <div style={{ height: 4, background: '#1a1a1a', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: GOLD, borderRadius: 2, width: `${Math.min(100, (count / participants.length) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Participants table */}
        <div style={{ background: '#0d0d0d', border: '1px solid #1f1f1f', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #1a1a1a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ color: '#fff', fontSize: 14, fontWeight: 600, margin: 0 }}>Participantes</h3>
            <span style={{ color: '#555', fontSize: 12 }}>{participants.length} registros</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1a1a1a' }}>
                  {['Nombre', 'Puesto', 'Depto', 'Email', 'Horas/sem', 'Área impacto', 'Nivel listo', 'Plan', 'Email'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#555', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {participants.length === 0 && (
                  <tr><td colSpan={9} style={{ padding: 40, textAlign: 'center', color: '#444' }}>Sin participantes en esta sesión</td></tr>
                )}
                {participants.map((p, i) => {
                  const r = resp(p)
                  const d = diag(p)
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid #111', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                      <td style={{ padding: '12px 14px', color: '#fff', fontWeight: 500, whiteSpace: 'nowrap' }}>{p.nombre}</td>
                      <td style={{ padding: '12px 14px', color: '#aaa', whiteSpace: 'nowrap' }}>{p.puesto}</td>
                      <td style={{ padding: '12px 14px', color: '#888', whiteSpace: 'nowrap' }}>{p.departamento}</td>
                      <td style={{ padding: '12px 14px', color: '#666', fontSize: 12 }}>{p.email}</td>
                      <td style={{ padding: '12px 14px', color: GOLD, fontWeight: 700, textAlign: 'center' }}>{r?.horas_proyectadas ?? '—'}</td>
                      <td style={{ padding: '12px 14px', color: '#aaa', fontSize: 12 }}>{r?.area_impacto ?? '—'}</td>
                      <td style={{ padding: '12px 14px', color: '#888', fontSize: 12 }}>{r?.nivel_listo ?? '—'}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        {r?.plan_90_dias && (r.plan_90_dias as unknown[]).length > 0
                          ? <span style={{ color: '#22c55e', fontSize: 12 }}>✓</span>
                          : <span style={{ color: '#444', fontSize: 12 }}>—</span>}
                      </td>
                      <td style={{ padding: '12px 14px' }}><SessionBadge status={d?.email_status} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  )
}
