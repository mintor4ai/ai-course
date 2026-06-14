'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { QRCodeSVG } from 'qrcode.react'

const PURPLE = '#7C3AED'
const GOLD = '#C9A84C'

interface EventRow {
  id: string; codigo: string; nombre: string; empresa: string
  fecha_evento: string; mensaje_bienvenida?: string; expires_at?: string
  created_at: string; participants?: { count: number }[]
}

interface ChatMsg { role: 'user' | 'assistant'; content: string }
interface Compromiso { titulo: string; descripcion: string; metrica: string }

interface ResponseData {
  aprendizajes?: string[]
  tareas_repetitivas?: string
  chat_messages?: ChatMsg[]
  horas_proyectadas?: string
  area_impacto?: string
  nivel_listo?: string
  plan_90_dias?: Compromiso[]
}

interface DiagnosticData { email_status?: string; sent_at?: string }

interface ParticipantRow {
  id: string; created_at: string; nombre: string; puesto: string
  departamento: string; email: string; curso_fecha: string; event_id?: string
  responses?: ResponseData[]; diagnostics?: DiagnosticData[]
}

function buildAuth(pw: string) { return 'Basic ' + btoa(`admin:${pw}`) }
const HOURS: Record<string, number> = { '1h': 1, '2h': 2, '3h': 3, '5h': 5, '8h': 8, '+8h': 10 }

// ─── Helpers ─────────────────────────────────────────────────────────────────
function Pill({ color, label }: { color: string; label: string }) {
  return <span style={{ background: color, color: '#fff', fontSize: 10, padding: '2px 7px', borderRadius: 10, fontWeight: 700 }}>{label}</span>
}

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{ background: '#0d0d0d', border: '1px solid #1f1f1f', borderRadius: 8, padding: '16px 20px', flex: 1, minWidth: 110 }}>
      <div style={{ color: GOLD, fontSize: 26, fontWeight: 800, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ color: PURPLE, fontSize: 11, marginTop: 2 }}>{sub}</div>}
      <div style={{ color: '#555', fontSize: 11, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
    </div>
  )
}

// ─── Participant Detail Modal ─────────────────────────────────────────────────
function ParticipantDetail({ p, onClose }: { p: ParticipantRow; onClose: () => void }) {
  const r = p.responses?.[0]
  const d = p.diagnostics?.[0]
  const userMsgs = (r?.chat_messages ?? []).filter(m => m.role === 'user')

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 50, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '24px 16px' }} onClick={onClose}>
      <div style={{ background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: 16, maxWidth: 700, width: '100%', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ background: '#111', borderBottom: '1px solid #1f1f1f', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: '0 0 4px' }}>{p.nombre}</h2>
            <p style={{ color: '#888', fontSize: 13, margin: 0 }}>{p.puesto} · {p.departamento}</p>
            <p style={{ color: '#555', fontSize: 12, margin: '4px 0 0' }}>{p.email}</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Pill color={d?.email_status === 'sent' ? '#22c55e' : d?.email_status === 'failed' ? '#ef4444' : '#555'} label={`Email: ${d?.email_status ?? 'pending'}`} />
            <button onClick={onClose} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#aaa', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13 }}>✕ Cerrar</button>
          </div>
        </div>

        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Impact snapshot */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[
              { l: 'Horas/semana', v: r?.horas_proyectadas ?? '—' },
              { l: 'Horas/año', v: r?.horas_proyectadas ? `${(HOURS[r.horas_proyectadas] ?? 0) * 52}h` : '—' },
              { l: 'Área de impacto', v: r?.area_impacto ?? '—' },
              { l: 'Nivel listo', v: r?.nivel_listo ?? '—' },
            ].map(({ l, v }) => (
              <div key={l} style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 8, padding: '10px 14px', flex: 1, minWidth: 120 }}>
                <div style={{ color: '#555', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{l}</div>
                <div style={{ color: GOLD, fontWeight: 700, fontSize: 13 }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Aprendizajes */}
          <div>
            <h3 style={{ color: GOLD, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Top 5 aprendizajes seleccionados</h3>
            {(r?.aprendizajes ?? []).length === 0 && <p style={{ color: '#444', fontSize: 13 }}>Sin datos</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(r?.aprendizajes ?? []).map((a, i) => (
                <div key={i} style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 8, padding: '8px 14px', display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{ color: GOLD, fontWeight: 700, fontSize: 12, flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ color: '#ccc', fontSize: 13 }}>{a}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tareas / chat */}
          <div>
            <h3 style={{ color: GOLD, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Tareas identificadas con potencial IA</h3>
            {userMsgs.length === 0 && <p style={{ color: '#444', fontSize: 13 }}>Sin conversación registrada</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {userMsgs.map((m, i) => (
                <div key={i} style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 8, padding: '10px 14px' }}>
                  <div style={{ color: '#555', fontSize: 10, marginBottom: 4 }}>Respuesta {i + 1}</div>
                  <p style={{ color: '#ccc', fontSize: 13, lineHeight: 1.6, margin: 0 }}>{m.content}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Conversación completa */}
          <div>
            <h3 style={{ color: GOLD, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Conversación completa con el coach IA</h3>
            <div style={{ background: '#050505', border: '1px solid #1f1f1f', borderRadius: 10, padding: 16, maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(r?.chat_messages ?? []).map((m, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  {m.role === 'assistant' && (
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: GOLD, color: '#000', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 8, flexShrink: 0, marginTop: 2 }}>IA</div>
                  )}
                  <div style={{
                    maxWidth: '80%', padding: '8px 12px', fontSize: 12, lineHeight: 1.6, whiteSpace: 'pre-wrap',
                    background: m.role === 'user' ? 'rgba(201,168,76,0.15)' : '#1a1a1a',
                    border: `1px solid ${m.role === 'user' ? 'rgba(201,168,76,0.3)' : '#2a2a2a'}`,
                    color: m.role === 'user' ? '#e5c97a' : '#ccc',
                    borderRadius: m.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                  }}>{m.content}</div>
                </div>
              ))}
              {(r?.chat_messages ?? []).length === 0 && <p style={{ color: '#444', fontSize: 13 }}>Sin conversación</p>}
            </div>
          </div>

          {/* Plan 90 días */}
          <div>
            <h3 style={{ color: GOLD, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Plan de acción 90 días</h3>
            {(r?.plan_90_dias ?? []).length === 0 && <p style={{ color: '#444', fontSize: 13 }}>Sin plan generado</p>}
            {(r?.plan_90_dias ?? []).map((c, i) => (
              <div key={i} style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 10, padding: 16, marginBottom: 10 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: GOLD, color: '#000', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</div>
                  <strong style={{ color: '#fff', fontSize: 14 }}>{c.titulo}</strong>
                </div>
                <p style={{ color: '#aaa', fontSize: 13, lineHeight: 1.6, margin: '0 0 8px 34px' }}>{c.descripcion}</p>
                <div style={{ marginLeft: 34, background: '#0d0d0d', border: '1px solid #1f1f1f', borderRadius: 6, padding: '6px 12px', fontSize: 12, color: '#777' }}>
                  <span style={{ color: GOLD }}>📊 Métrica: </span>{c.metrica}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── QR Modal ────────────────────────────────────────────────────────────────
function QRModal({ event, baseUrl, onClose }: { event: EventRow; baseUrl: string; onClose: () => void }) {
  const url = `${baseUrl}/e/${event.codigo}`
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }} onClick={onClose}>
      <div style={{ background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: 16, padding: 40, maxWidth: 440, width: '90%', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
        <p style={{ color: GOLD, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>{event.empresa}</p>
        <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginBottom: 6 }}>{event.nombre}</h2>
        <p style={{ color: '#666', fontSize: 12, marginBottom: 24 }}>
          {new Date(event.fecha_evento + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
        <div style={{ display: 'inline-block', background: '#fff', padding: 16, borderRadius: 12, marginBottom: 20 }}>
          <QRCodeSVG value={url} size={200} bgColor="#ffffff" fgColor="#000000" level="M" />
        </div>
        <div style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: 8, padding: '12px 16px', marginBottom: 24 }}>
          <p style={{ color: '#888', fontSize: 11, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>URL de acceso</p>
          <p style={{ color: GOLD, fontSize: 14, fontWeight: 600, wordBreak: 'break-all' }}>{url}</p>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button onClick={() => navigator.clipboard.writeText(url)} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#aaa', borderRadius: 8, padding: '10px 20px', fontSize: 13, cursor: 'pointer' }}>Copiar URL</button>
          <button onClick={onClose} style={{ background: GOLD, border: 'none', color: '#000', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Cerrar</button>
        </div>
      </div>
    </div>
  )
}

// ─── Create Event Modal ───────────────────────────────────────────────────────
function CreateEventModal({ auth, onCreated, onClose }: { auth: string; onCreated: (e: EventRow) => void; onClose: () => void }) {
  const [form, setForm] = useState({ nombre: '', empresa: '', fecha_evento: new Date().toISOString().slice(0, 10), mensaje_bienvenida: '', expires_at: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault(); setSaving(true); setError('')
    try {
      const res = await fetch('/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: auth },
        body: JSON.stringify({ nombre: form.nombre, empresa: form.empresa, fecha_evento: form.fecha_evento, mensaje_bienvenida: form.mensaje_bienvenida || undefined, expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : undefined }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onCreated(data.event)
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error') }
    finally { setSaving(false) }
  }

  const inp = { width: '100%', background: '#111', border: '1px solid #2a2a2a', borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const }
  const lbl = { display: 'block', color: '#666', fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 6 }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }} onClick={onClose}>
      <div style={{ background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: 16, padding: 32, maxWidth: 440, width: '90%' }} onClick={e => e.stopPropagation()}>
        <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginBottom: 24 }}>Nuevo evento</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div><label style={lbl}>Nombre del evento *</label><input style={inp} value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Ej: Sesión Liderazgo IA" required /></div>
          <div><label style={lbl}>Empresa / Cliente *</label><input style={inp} value={form.empresa} onChange={e => setForm(f => ({ ...f, empresa: e.target.value }))} placeholder="Ej: BBVA México" required /></div>
          <div><label style={lbl}>Fecha del evento *</label><input type="date" style={inp} value={form.fecha_evento} onChange={e => setForm(f => ({ ...f, fecha_evento: e.target.value }))} required /></div>
          <div><label style={lbl}>Mensaje de bienvenida (opcional)</label><input style={inp} value={form.mensaje_bienvenida} onChange={e => setForm(f => ({ ...f, mensaje_bienvenida: e.target.value }))} placeholder="Ej: ¡Bienvenidos al cierre!" /></div>
          <div><label style={lbl}>Expiración (opcional)</label><input type="datetime-local" style={inp} value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} /><p style={{ color: '#555', fontSize: 11, marginTop: 4 }}>El link se desactiva después de esta fecha.</p></div>
          {error && <p style={{ color: '#f87171', fontSize: 13 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#aaa', borderRadius: 8, padding: '12px', fontSize: 14, cursor: 'pointer' }}>Cancelar</button>
            <button type="submit" disabled={saving} style={{ flex: 1, background: GOLD, border: 'none', color: '#000', borderRadius: 8, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? 'Creando…' : 'Crear evento'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [authError, setAuthError] = useState('')
  const [auth, setAuth] = useState('')
  const [loading, setLoading] = useState(false)

  const [events, setEvents] = useState<EventRow[]>([])
  const [selectedEventId, setSelectedEventId] = useState('all')
  const [participants, setParticipants] = useState<ParticipantRow[]>([])
  const [detailP, setDetailP] = useState<ParticipantRow | null>(null)
  const [qrEvent, setQrEvent] = useState<EventRow | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [baseUrl, setBaseUrl] = useState('')
  const [activeTab, setActiveTab] = useState<'participantes' | 'reporte'>('participantes')

  useEffect(() => { setBaseUrl(window.location.origin) }, [])

  const fetchAll = useCallback(async (a: string, evId: string) => {
    setLoading(true)
    const [evRes, partRes] = await Promise.all([
      fetch('/api/events', { headers: { Authorization: a } }),
      fetch('/api/admin/data' + (evId !== 'all' ? `?event_id=${evId}` : ''), { headers: { Authorization: a } }),
    ])
    if (evRes.status === 401 || partRes.status === 401) { setAuthed(false); setLoading(false); return }
    const evData = await evRes.json(); const partData = await partRes.json()
    setEvents(evData.events ?? []); setParticipants(partData.participants ?? [])
    setLoading(false)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const a = buildAuth(password); setLoading(true)
    const res = await fetch('/api/events', { headers: { Authorization: a } })
    if (res.status === 401) { setAuthError('Contraseña incorrecta'); setLoading(false); return }
    setAuth(a); setAuthed(true); fetchAll(a, 'all')
  }

  useEffect(() => { if (authed && auth) fetchAll(auth, selectedEventId) }, [selectedEventId, authed, auth, fetchAll])
  useEffect(() => {
    if (!authed || !auth) return
    const id = setInterval(() => fetchAll(auth, selectedEventId), 30000)
    return () => clearInterval(id)
  }, [authed, auth, selectedEventId, fetchAll])

  // ── Metrics ──
  const resp = (p: ParticipantRow) => p.responses?.[0]
  const diag = (p: ParticipantRow) => p.diagnostics?.[0]
  const totalHours = participants.reduce((s, p) => s + (HOURS[resp(p)?.horas_proyectadas ?? ''] ?? 0), 0)
  const annualHours = totalHours * 52
  const sentCount = participants.filter(p => diag(p)?.email_status === 'sent').length
  const planCount = participants.filter(p => (resp(p)?.plan_90_dias?.length ?? 0) > 0).length
  const avgHours = participants.length ? (totalHours / participants.length).toFixed(1) : '0'

  const apCount: Record<string, number> = {}
  participants.forEach(p => (resp(p)?.aprendizajes ?? []).forEach(a => { apCount[a] = (apCount[a] ?? 0) + 1 }))
  const topAp = Object.entries(apCount).sort((a, b) => b[1] - a[1]).slice(0, 8)

  const nivelCount: Record<string, number> = {}
  participants.forEach(p => { const n = resp(p)?.nivel_listo; if (n) nivelCount[n] = (nivelCount[n] ?? 0) + 1 })

  const areaCount: Record<string, number> = {}
  participants.forEach(p => { const a = resp(p)?.area_impacto; if (a) areaCount[a] = (areaCount[a] ?? 0) + 1 })

  // Extract all tasks from conversations
  const allTasks = participants.flatMap(p =>
    (resp(p)?.chat_messages ?? [])
      .filter(m => m.role === 'user' && m.content.length > 20)
      .map(m => ({ nombre: p.nombre, puesto: p.puesto, task: m.content.slice(0, 200) }))
  )

  // ── Export CSV ──
  const exportCSV = () => {
    const rows = [
      ['Nombre', 'Puesto', 'Departamento', 'Email', 'Evento', 'Horas/semana', 'Horas/año', 'Área de impacto', 'Nivel listo', 'Email Status',
       'Aprendizaje 1', 'Aprendizaje 2', 'Aprendizaje 3', 'Aprendizaje 4', 'Aprendizaje 5',
       'Compromisos plan 90 días', 'Respuestas conversación'],
      ...participants.map(p => {
        const r = resp(p); const ev = events.find(e => e.id === p.event_id)
        const aps = r?.aprendizajes ?? []
        const plan = (r?.plan_90_dias ?? []).map((c, i) => `${i + 1}. ${c.titulo}: ${c.descripcion} [Métrica: ${c.metrica}]`).join(' | ')
        const chat = (r?.chat_messages ?? []).filter(m => m.role === 'user').map((m, i) => `R${i + 1}: ${m.content}`).join(' | ')
        return [
          p.nombre, p.puesto, p.departamento, p.email,
          ev ? `${ev.empresa} – ${ev.nombre}` : '',
          r?.horas_proyectadas ?? '', `${(HOURS[r?.horas_proyectadas ?? ''] ?? 0) * 52}h`,
          r?.area_impacto ?? '', r?.nivel_listo ?? '', diag(p)?.email_status ?? '',
          aps[0] ?? '', aps[1] ?? '', aps[2] ?? '', aps[3] ?? '', aps[4] ?? '',
          plan, chat,
        ]
      })
    ]
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    a.download = `haix-reporte-${selectedEventId}.csv`; a.click()
  }

  // ── Login ──
  if (!authed) {
    return (
      <main style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "-apple-system,'Segoe UI',sans-serif" }}>
        <div style={{ width: '100%', maxWidth: 360, padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <Image src="https://www.humanaix.mx/assets/logos/LogoHumanAltablanco.png" alt="Human.AiX" width={150} height={38} style={{ objectFit: 'contain', marginBottom: 20 }} unoptimized />
            <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: '0 0 4px' }}>Panel de Administración</h1>
            <p style={{ color: '#555', fontSize: 13 }}>Desbloquea el Chip de IA</p>
          </div>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)}
              style={{ background: '#0d0d0d', border: `1px solid ${authError ? '#ef4444' : '#2a2a2a'}`, borderRadius: 8, padding: '13px 16px', color: '#fff', fontSize: 15, outline: 'none' }} />
            {authError && <p style={{ color: '#f87171', fontSize: 13 }}>{authError}</p>}
            <button type="submit" disabled={loading} style={{ background: GOLD, color: '#000', border: 'none', borderRadius: 8, padding: '13px', fontWeight: 700, fontSize: 15, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Verificando…' : 'Ingresar'}
            </button>
          </form>
        </div>
      </main>
    )
  }

  // ── Dashboard ──
  return (
    <main style={{ minHeight: '100vh', background: '#050505', fontFamily: "-apple-system,'Segoe UI',sans-serif", color: '#fff' }}>
      {/* Header */}
      <div style={{ background: '#0a0a0a', borderBottom: '1px solid #1a1a1a', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Image src="https://www.humanaix.mx/assets/logos/LogoHumanAltablanco.png" alt="Human.AiX" width={110} height={28} style={{ objectFit: 'contain' }} unoptimized />
          <div style={{ width: 1, height: 20, background: '#2a2a2a' }} />
          <span style={{ color: '#555', fontSize: 12 }}>Admin · Desbloquea el Chip de IA</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {loading && <span style={{ color: '#444', fontSize: 12 }}>Actualizando…</span>}
          <button onClick={exportCSV} style={{ background: 'transparent', border: '1px solid #2a2a2a', color: '#888', borderRadius: 6, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>⬇ CSV completo</button>
          <button onClick={() => fetchAll(auth, selectedEventId)} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#aaa', borderRadius: 6, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>↻</button>
          <button onClick={() => setShowCreate(true)} style={{ background: GOLD, color: '#000', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>+ Nuevo evento</button>
        </div>
      </div>

      {/* Event tabs */}
      <div style={{ borderBottom: '1px solid #1a1a1a', padding: '0 24px', display: 'flex', gap: 2, overflowX: 'auto' }}>
        {['all', ...events.map(e => e.id)].map(id => {
          const ev = events.find(e => e.id === id)
          const label = id === 'all' ? 'Todos los eventos' : `${ev?.empresa} · ${new Date((ev?.fecha_evento ?? '') + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}`
          return (
            <button key={id} onClick={() => setSelectedEventId(id)}
              style={{ padding: '11px 14px', fontSize: 13, background: 'transparent', border: 'none', borderBottom: selectedEventId === id ? `2px solid ${GOLD}` : '2px solid transparent', color: selectedEventId === id ? GOLD : '#555', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {label}
            </button>
          )
        })}
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>

        {/* Metrics */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
          <Stat label="Participantes" value={participants.length} />
          <Stat label="Horas/sem grupo" value={`${totalHours}h`} sub={`≈${avgHours}h promedio`} />
          <Stat label="Horas/año grupo" value={`${annualHours}h`} sub="impacto proyectado" />
          <Stat label="Con plan 90d" value={planCount} />
          <Stat label="Emails enviados" value={sentCount} />
        </div>

        {/* Inner tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid #1a1a1a' }}>
          {(['participantes', 'reporte'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{ padding: '10px 18px', fontSize: 13, fontWeight: 600, background: 'transparent', border: 'none', borderBottom: activeTab === tab ? `2px solid ${GOLD}` : '2px solid transparent', color: activeTab === tab ? GOLD : '#555', cursor: 'pointer', textTransform: 'capitalize' }}>
              {tab === 'participantes' ? '👥 Participantes' : '📊 Reporte del Facilitador'}
            </button>
          ))}
        </div>

        {/* ── PARTICIPANTES TAB ── */}
        {activeTab === 'participantes' && (
          <div style={{ background: '#0d0d0d', border: '1px solid #1f1f1f', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #1a1a1a', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>Participantes <span style={{ color: '#555', fontWeight: 400 }}>— clic para ver detalle completo</span></span>
              <span style={{ color: '#444', fontSize: 12 }}>{participants.length} registros</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1a1a1a' }}>
                    {['Nombre', 'Puesto', 'Depto', 'Horas/sem', 'Área impacto', 'Nivel', 'Aprendizajes', 'Plan', 'Email'].map(h => (
                      <th key={h} style={{ padding: '9px 12px', textAlign: 'left', color: '#444', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {participants.length === 0 && <tr><td colSpan={9} style={{ padding: 40, textAlign: 'center', color: '#333' }}>Sin participantes aún</td></tr>}
                  {participants.map((p, i) => {
                    const r = resp(p); const d = diag(p)
                    return (
                      <tr key={p.id} onClick={() => setDetailP(p)} style={{ borderBottom: '1px solid #111', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)', cursor: 'pointer' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(201,168,76,0.05)')}
                        onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)')}>
                        <td style={{ padding: '11px 12px', color: '#fff', fontWeight: 500, whiteSpace: 'nowrap' }}>{p.nombre}</td>
                        <td style={{ padding: '11px 12px', color: '#aaa', whiteSpace: 'nowrap' }}>{p.puesto}</td>
                        <td style={{ padding: '11px 12px', color: '#777' }}>{p.departamento}</td>
                        <td style={{ padding: '11px 12px', color: GOLD, fontWeight: 700, textAlign: 'center' }}>{r?.horas_proyectadas ?? '—'}</td>
                        <td style={{ padding: '11px 12px', color: '#888', fontSize: 12 }}>{r?.area_impacto ?? '—'}</td>
                        <td style={{ padding: '11px 12px', color: '#777', fontSize: 11 }}>{r?.nivel_listo ?? '—'}</td>
                        <td style={{ padding: '11px 12px', color: '#666', fontSize: 11 }}>{(r?.aprendizajes ?? []).length}/5</td>
                        <td style={{ padding: '11px 12px', textAlign: 'center' }}>
                          {(r?.plan_90_dias?.length ?? 0) > 0 ? <span style={{ color: '#22c55e' }}>✓ {r?.plan_90_dias?.length}</span> : <span style={{ color: '#333' }}>—</span>}
                        </td>
                        <td style={{ padding: '11px 12px' }}>
                          <Pill color={d?.email_status === 'sent' ? '#22c55e' : d?.email_status === 'failed' ? '#ef4444' : '#555'} label={d?.email_status ?? 'pending'} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── REPORTE FACILITADOR ── */}
        {activeTab === 'reporte' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Top aprendizajes */}
            <div style={{ background: '#0d0d0d', border: '1px solid #1f1f1f', borderRadius: 8, padding: 20 }}>
              <h3 style={{ color: GOLD, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 16px' }}>Top aprendizajes del grupo</h3>
              {topAp.map(([label, count]) => (
                <div key={label} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ color: '#ccc', fontSize: 13, flex: 1, marginRight: 12 }}>{label}</span>
                    <span style={{ color: GOLD, fontWeight: 700, fontSize: 13 }}>{count} ({Math.round(count / Math.max(1, participants.length) * 100)}%)</span>
                  </div>
                  <div style={{ height: 4, background: '#1a1a1a', borderRadius: 2 }}>
                    <div style={{ height: '100%', background: `linear-gradient(90deg,${GOLD},#E2C97E)`, borderRadius: 2, width: `${Math.min(100, count / Math.max(1, participants.length) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Nivel + Área */}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ background: '#0d0d0d', border: '1px solid #1f1f1f', borderRadius: 8, padding: 20, flex: 1, minWidth: 240 }}>
                <h3 style={{ color: GOLD, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 16px' }}>Nivel de preparación IA</h3>
                {Object.entries(nivelCount).sort((a, b) => b[1] - a[1]).map(([nivel, count]) => (
                  <div key={nivel} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ color: '#ccc', fontSize: 12, flex: 1 }}>{nivel}</span>
                      <span style={{ color: GOLD, fontWeight: 700, fontSize: 12 }}>{count}</span>
                    </div>
                    <div style={{ height: 3, background: '#1a1a1a', borderRadius: 2 }}>
                      <div style={{ height: '100%', background: GOLD, borderRadius: 2, width: `${Math.min(100, count / Math.max(1, participants.length) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ background: '#0d0d0d', border: '1px solid #1f1f1f', borderRadius: 8, padding: 20, flex: 1, minWidth: 240 }}>
                <h3 style={{ color: GOLD, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 16px' }}>Área de mayor impacto</h3>
                {Object.entries(areaCount).sort((a, b) => b[1] - a[1]).map(([area, count]) => (
                  <div key={area} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ color: '#ccc', fontSize: 12, flex: 1 }}>{area}</span>
                      <span style={{ color: GOLD, fontWeight: 700, fontSize: 12 }}>{count}</span>
                    </div>
                    <div style={{ height: 3, background: '#1a1a1a', borderRadius: 2 }}>
                      <div style={{ height: '100%', background: GOLD, borderRadius: 2, width: `${Math.min(100, count / Math.max(1, participants.length) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tasks from conversations */}
            <div style={{ background: '#0d0d0d', border: '1px solid #1f1f1f', borderRadius: 8, padding: 20 }}>
              <h3 style={{ color: GOLD, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 16px' }}>
                Tareas con potencial IA identificadas en conversaciones ({allTasks.length})
              </h3>
              {allTasks.length === 0 && <p style={{ color: '#444', fontSize: 13 }}>Sin conversaciones registradas aún</p>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {allTasks.map((t, i) => (
                  <div key={i} style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 8, padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span style={{ color: GOLD, fontSize: 11, fontWeight: 700 }}>{t.nombre}</span>
                      <span style={{ color: '#555', fontSize: 11 }}>·</span>
                      <span style={{ color: '#777', fontSize: 11 }}>{t.puesto}</span>
                    </div>
                    <p style={{ color: '#bbb', fontSize: 13, lineHeight: 1.5, margin: 0 }}>{t.task}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Liderazgo insight */}
            <div style={{ background: 'rgba(201,168,76,0.06)', border: `1px solid ${GOLD}33`, borderRadius: 8, padding: 20 }}>
              <h3 style={{ color: GOLD, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 12px' }}>💡 Insights de liderazgo IA</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ color: '#ccc', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
                  El grupo proyecta recuperar <strong style={{ color: GOLD }}>{totalHours}h semanales</strong> — equivalente a{' '}
                  <strong style={{ color: GOLD }}>{annualHours}h anuales</strong> de capacidad liberada ({participants.length} personas).
                </p>
                {Object.keys(nivelCount).length > 0 && (() => {
                  const listos = nivelCount['🔥 Listo, arranco mañana'] ?? 0
                  const pct = Math.round(listos / Math.max(1, participants.length) * 100)
                  return <p style={{ color: '#ccc', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
                    <strong style={{ color: GOLD }}>{pct}% del grupo</strong> se declara listo para implementar mañana — candidatos ideales para quick wins y casos de éxito internos.
                  </p>
                })()}
                {Object.keys(areaCount).length > 0 && (
                  <p style={{ color: '#ccc', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
                    El área de mayor impacto percibido es <strong style={{ color: GOLD }}>{Object.entries(areaCount).sort((a, b) => b[1] - a[1])[0]?.[0]}</strong> — prioridad para el plan de adopción del equipo.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {detailP && <ParticipantDetail p={detailP} onClose={() => setDetailP(null)} />}
      {qrEvent && <QRModal event={qrEvent} baseUrl={baseUrl} onClose={() => setQrEvent(null)} />}
      {showCreate && <CreateEventModal auth={auth} onClose={() => setShowCreate(false)} onCreated={ev => { setEvents(prev => [ev, ...prev]); setShowCreate(false); setQrEvent(ev) }} />}
    </main>
  )
}
