'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { QRCodeSVG } from 'qrcode.react'

const P = '#7C3AED'   // purple
const PL = '#F5F3FF'  // purple light bg
const PB = '#E9D5FF'  // purple border
const PG = 'linear-gradient(135deg,#7C3AED,#D946EF)'

interface EventRow {
  id: string; codigo: string; nombre: string; empresa: string
  fecha_evento: string; mensaje_bienvenida?: string; expires_at?: string
  created_at: string; participants?: { count: number }[]
}
interface ChatMsg { role: 'user' | 'assistant'; content: string }
interface Compromiso { titulo: string; descripcion: string; metrica: string }
interface ResponseData {
  aprendizajes?: string[]; tareas_repetitivas?: string; chat_messages?: ChatMsg[]
  horas_proyectadas?: string; area_impacto?: string; nivel_listo?: string; plan_90_dias?: Compromiso[]
  calificacion?: number
}
interface DiagnosticData { email_status?: string; sent_at?: string }
interface ParticipantRow {
  id: string; created_at: string; nombre: string; puesto: string
  departamento: string; email: string; curso_fecha: string; event_id?: string
  responses?: ResponseData[]; diagnostics?: DiagnosticData[]
}

function buildAuth(pw: string) { return 'Basic ' + btoa(`admin:${pw}`) }
const HOURS: Record<string, number> = { '1h': 1, '2h': 2, '3h': 3, '5h': 5, '8h': 8, '+8h': 10 }

function StatusPill({ status }: { status?: string }) {
  const map: Record<string, string> = { sent: '#22c55e', failed: '#ef4444', pending: '#9CA3AF' }
  const color = map[status ?? 'pending'] ?? '#9CA3AF'
  return <span style={{ background: color + '22', color, border: `1px solid ${color}44`, fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>{status ?? 'pending'}</span>
}

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{ background: PL, border: `1px solid ${PB}`, borderRadius: 12, padding: '16px 20px', flex: 1, minWidth: 110 }}>
      <div style={{ background: PG, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: 26, fontWeight: 800, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ color: '#8B5CF6', fontSize: 11, marginTop: 2 }}>{sub}</div>}
      <div style={{ color: '#9CA3AF', fontSize: 11, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
    </div>
  )
}

function Bar({ count, total, label }: { count: number; total: number; label: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ color: '#374151', fontSize: 13, flex: 1, marginRight: 12 }}>{label}</span>
        <span style={{ color: P, fontWeight: 700, fontSize: 13 }}>{count} <span style={{ color: '#9CA3AF', fontWeight: 400 }}>({Math.round(count / Math.max(1, total) * 100)}%)</span></span>
      </div>
      <div style={{ height: 6, background: '#E5E7EB', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', background: PG, borderRadius: 4, width: `${Math.min(100, count / Math.max(1, total) * 100)}%`, transition: 'width 0.5s' }} />
      </div>
    </div>
  )
}

// ─── Participant Detail Modal ────────────────────────────────────────────────
function ParticipantDetail({ p, auth, onClose }: { p: ParticipantRow; auth: string; onClose: () => void }) {
  const r = p.responses?.[0]
  const d = p.diagnostics?.[0]
  const userMsgs = (r?.chat_messages ?? []).filter(m => m.role === 'user')

  const downloadDiagnostic = async () => {
    const res = await fetch(`/api/admin/diagnostic?participant_id=${p.id}`, { headers: { Authorization: auth } })
    if (!res.ok) { alert('No hay diagnóstico disponible para este participante'); return }
    const html = await res.text()
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `diagnostico-${p.nombre.replace(/\s+/g, '-')}.html`
    a.click(); URL.revokeObjectURL(url)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '24px 16px' }} onClick={onClose}>
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 20, maxWidth: 680, width: '100%', overflow: 'hidden', boxShadow: '0 20px 60px rgba(124,58,237,0.15)' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ background: PG, padding: '24px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: '0 0 4px' }}>{p.nombre}</h2>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, margin: 0 }}>{p.puesto} · {p.departamento}</p>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, margin: '4px 0 0' }}>{p.email}</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {r?.calificacion && (
              <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 700 }}>
                ★ {r.calificacion}/10
              </span>
            )}
            <StatusPill status={d?.email_status} />
            <button onClick={downloadDiagnostic} style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', color: '#fff', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>⬇ Diagnóstico</button>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>✕ Cerrar</button>
          </div>
        </div>

        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Impact snapshot */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[
              { l: 'Horas/semana', v: r?.horas_proyectadas ?? '—' },
              { l: 'Horas/año', v: r?.horas_proyectadas ? `${(HOURS[r.horas_proyectadas] ?? 0) * 52}h` : '—' },
              { l: 'Área de impacto', v: r?.area_impacto ?? '—' },
              { l: 'Nivel listo', v: r?.nivel_listo ?? '—' },
            ].map(({ l, v }) => (
              <div key={l} style={{ background: PL, border: `1px solid ${PB}`, borderRadius: 10, padding: '10px 14px', flex: 1, minWidth: 130 }}>
                <div style={{ color: '#9CA3AF', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{l}</div>
                <div style={{ color: P, fontWeight: 700, fontSize: 13 }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Aprendizajes */}
          <div>
            <h3 style={{ color: P, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10, fontWeight: 700 }}>Top 5 aprendizajes seleccionados</h3>
            {(r?.aprendizajes ?? []).length === 0 && <p style={{ color: '#9CA3AF', fontSize: 13 }}>Sin datos</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(r?.aprendizajes ?? []).map((a, i) => (
                <div key={i} style={{ background: PL, border: `1px solid ${PB}`, borderRadius: 8, padding: '8px 14px', display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: PG, color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</div>
                  <span style={{ color: '#374151', fontSize: 13 }}>{a}</span>
                </div>
              ))}
            </div>
          </div>

          {/* User responses */}
          <div>
            <h3 style={{ color: P, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10, fontWeight: 700 }}>Respuestas — tareas con potencial IA</h3>
            {userMsgs.length === 0 && <p style={{ color: '#9CA3AF', fontSize: 13 }}>Sin conversación registrada</p>}
            {userMsgs.map((m, i) => (
              <div key={i} style={{ background: '#FAFAFA', border: '1px solid #E5E7EB', borderRadius: 8, padding: '10px 14px', marginBottom: 8 }}>
                <div style={{ color: '#9CA3AF', fontSize: 10, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Respuesta {i + 1}</div>
                <p style={{ color: '#374151', fontSize: 13, lineHeight: 1.6, margin: 0 }}>{m.content}</p>
              </div>
            ))}
          </div>

          {/* Full chat */}
          <div>
            <h3 style={{ color: P, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10, fontWeight: 700 }}>Conversación completa con el coach IA</h3>
            <div style={{ background: '#FAFAFA', border: '1px solid #E5E7EB', borderRadius: 12, padding: 16, maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(r?.chat_messages ?? []).map((m, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  {m.role === 'assistant' && (
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: PG, color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 8, flexShrink: 0, marginTop: 2 }}>IA</div>
                  )}
                  <div style={{
                    maxWidth: '80%', padding: '8px 12px', fontSize: 12, lineHeight: 1.6, whiteSpace: 'pre-wrap',
                    background: m.role === 'user' ? PG : '#fff',
                    border: m.role === 'user' ? 'none' : `1px solid ${PB}`,
                    color: m.role === 'user' ? '#fff' : '#374151',
                    borderRadius: m.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                  }}>{m.content}</div>
                </div>
              ))}
              {(r?.chat_messages ?? []).length === 0 && <p style={{ color: '#9CA3AF', fontSize: 13 }}>Sin conversación</p>}
            </div>
          </div>

          {/* Plan */}
          <div>
            <h3 style={{ color: P, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10, fontWeight: 700 }}>Plan de acción 90 días</h3>
            {(r?.plan_90_dias ?? []).length === 0 && <p style={{ color: '#9CA3AF', fontSize: 13 }}>Sin plan generado</p>}
            {(r?.plan_90_dias ?? []).map((c, i) => (
              <div key={i} style={{ background: '#FAFAFA', border: '1px solid #E5E7EB', borderRadius: 12, padding: 16, marginBottom: 10 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: PG, color: '#fff', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</div>
                  <strong style={{ color: '#111827', fontSize: 14 }}>{c.titulo}</strong>
                </div>
                <p style={{ color: '#6B7280', fontSize: 13, lineHeight: 1.6, margin: '0 0 8px 36px' }}>{c.descripcion}</p>
                <div style={{ marginLeft: 36, background: PL, border: `1px solid ${PB}`, borderRadius: 8, padding: '6px 12px', fontSize: 12, color: P }}>
                  <span style={{ fontWeight: 600 }}>📊 Métrica: </span>{c.metrica}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── QR Modal ───────────────────────────────────────────────────────────────
function QRModal({ event, baseUrl, onClose }: { event: EventRow; baseUrl: string; onClose: () => void }) {
  const url = `${baseUrl}/e/${event.codigo}`
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }} onClick={onClose}>
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 20, padding: 40, maxWidth: 440, width: '90%', textAlign: 'center', boxShadow: '0 20px 60px rgba(124,58,237,0.15)' }} onClick={e => e.stopPropagation()}>
        <div style={{ background: PG, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4, fontWeight: 700 }}>{event.empresa}</div>
        <h2 style={{ color: '#111827', fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{event.nombre}</h2>
        <p style={{ color: '#9CA3AF', fontSize: 12, marginBottom: 24 }}>{new Date(event.fecha_evento + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <div style={{ display: 'inline-block', background: '#fff', padding: 16, borderRadius: 12, border: `2px solid ${PB}`, marginBottom: 20 }}>
          <QRCodeSVG value={url} size={200} bgColor="#ffffff" fgColor="#7C3AED" level="M" />
        </div>
        <div style={{ background: PL, border: `1px solid ${PB}`, borderRadius: 10, padding: '12px 16px', marginBottom: 24 }}>
          <p style={{ color: '#9CA3AF', fontSize: 11, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>URL de acceso</p>
          <p style={{ color: P, fontSize: 14, fontWeight: 600, wordBreak: 'break-all' }}>{url}</p>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button onClick={() => navigator.clipboard.writeText(url)} style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', color: '#374151', borderRadius: 10, padding: '10px 20px', fontSize: 13, cursor: 'pointer' }}>Copiar URL</button>
          <button onClick={onClose} style={{ background: PG, border: 'none', color: '#fff', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Cerrar</button>
        </div>
      </div>
    </div>
  )
}

// ─── Create Event Modal ──────────────────────────────────────────────────────
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

  const inp: React.CSSProperties = { width: '100%', background: '#FAFAFA', border: '1px solid #E5E7EB', borderRadius: 10, padding: '11px 14px', color: '#111827', fontSize: 14, outline: 'none', boxSizing: 'border-box' }
  const lbl: React.CSSProperties = { display: 'block', color: '#6B7280', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, fontWeight: 600 }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }} onClick={onClose}>
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 20, padding: 32, maxWidth: 440, width: '90%', boxShadow: '0 20px 60px rgba(124,58,237,0.15)' }} onClick={e => e.stopPropagation()}>
        <h2 style={{ color: '#111827', fontSize: 18, fontWeight: 700, marginBottom: 24 }}>Nuevo evento</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div><label style={lbl}>Nombre del evento *</label><input style={inp} value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Ej: Sesión Liderazgo IA" required /></div>
          <div><label style={lbl}>Empresa / Cliente *</label><input style={inp} value={form.empresa} onChange={e => setForm(f => ({ ...f, empresa: e.target.value }))} placeholder="Ej: BBVA México" required /></div>
          <div><label style={lbl}>Fecha del evento *</label><input type="date" style={inp} value={form.fecha_evento} onChange={e => setForm(f => ({ ...f, fecha_evento: e.target.value }))} required /></div>
          <div><label style={lbl}>Mensaje de bienvenida (opcional)</label><input style={inp} value={form.mensaje_bienvenida} onChange={e => setForm(f => ({ ...f, mensaje_bienvenida: e.target.value }))} placeholder="Ej: ¡Bienvenidos al cierre!" /></div>
          <div>
            <label style={lbl}>Expiración (opcional)</label>
            <input type="datetime-local" style={inp} value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} />
            <p style={{ color: '#9CA3AF', fontSize: 11, marginTop: 4 }}>El link se desactiva después de esta fecha.</p>
          </div>
          {error && <p style={{ color: '#EF4444', fontSize: 13, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '8px 12px' }}>{error}</p>}
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, background: '#F9FAFB', border: '1px solid #E5E7EB', color: '#6B7280', borderRadius: 10, padding: '12px', fontSize: 14, cursor: 'pointer' }}>Cancelar</button>
            <button type="submit" disabled={saving} style={{ flex: 1, background: PG, border: 'none', color: '#fff', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? 'Creando…' : 'Crear evento'}</button>
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

  const allTasks = participants.flatMap(p =>
    (resp(p)?.chat_messages ?? []).filter(m => m.role === 'user' && m.content.length > 20)
      .map(m => ({ nombre: p.nombre, puesto: p.puesto, task: m.content.slice(0, 200) }))
  )

  const exportCSV = () => {
    const rows = [
      ['Nombre', 'Puesto', 'Departamento', 'Email', 'Evento', 'Horas/semana', 'Horas/año', 'Área de impacto', 'Nivel listo', 'Email Status', 'Aprendizaje 1', 'Aprendizaje 2', 'Aprendizaje 3', 'Aprendizaje 4', 'Aprendizaje 5', 'Plan 90 días', 'Respuestas conversación'],
      ...participants.map(p => {
        const r = resp(p); const ev = events.find(e => e.id === p.event_id)
        const aps = r?.aprendizajes ?? []
        const plan = (r?.plan_90_dias ?? []).map((c, i) => `${i + 1}. ${c.titulo}: ${c.descripcion} [Métrica: ${c.metrica}]`).join(' | ')
        const chat = (r?.chat_messages ?? []).filter(m => m.role === 'user').map((m, i) => `R${i + 1}: ${m.content}`).join(' | ')
        return [p.nombre, p.puesto, p.departamento, p.email, ev ? `${ev.empresa} – ${ev.nombre}` : '',
          r?.horas_proyectadas ?? '', `${(HOURS[r?.horas_proyectadas ?? ''] ?? 0) * 52}h`,
          r?.area_impacto ?? '', r?.nivel_listo ?? '', diag(p)?.email_status ?? '',
          aps[0] ?? '', aps[1] ?? '', aps[2] ?? '', aps[3] ?? '', aps[4] ?? '', plan, chat]
      })
    ]
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    a.download = `haix-reporte-${selectedEventId}.csv`; a.click()
  }

  // ── Login ──
  if (!authed) {
    return (
      <main style={{ minHeight: '100vh', background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "-apple-system,'Segoe UI',sans-serif" }}>
        <div style={{ width: '100%', maxWidth: 380, padding: '0 24px' }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 40, boxShadow: '0 20px 60px rgba(124,58,237,0.12)', border: `1px solid ${PB}` }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <Image src="https://www.humanaix.mx/assets/logos/LogoHaix.png" alt="Human.AiX" width={140} height={36} style={{ objectFit: 'contain', marginBottom: 20 }} unoptimized />
              <h1 style={{ color: '#111827', fontSize: 18, fontWeight: 700, margin: '0 0 4px' }}>Panel de Administración</h1>
              <p style={{ color: '#9CA3AF', fontSize: 13 }}>Desbloquea el Chip de IA</p>
            </div>
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)}
                style={{ background: '#FAFAFA', border: `1px solid ${authError ? '#EF4444' : '#E5E7EB'}`, borderRadius: 10, padding: '13px 16px', color: '#111827', fontSize: 15, outline: 'none' }} />
              {authError && <p style={{ color: '#EF4444', fontSize: 13, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '8px 12px' }}>{authError}</p>}
              <button type="submit" disabled={loading} style={{ background: PG, color: '#fff', border: 'none', borderRadius: 10, padding: '13px', fontWeight: 700, fontSize: 15, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Verificando…' : 'Ingresar →'}
              </button>
            </form>
          </div>
        </div>
      </main>
    )
  }

  // ── Dashboard ──
  return (
    <main style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: "-apple-system,'Segoe UI',sans-serif", color: '#111827' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Image src="https://www.humanaix.mx/assets/logos/LogoHaix.png" alt="Human.AiX" width={110} height={28} style={{ objectFit: 'contain' }} unoptimized />
          <div style={{ width: 1, height: 20, background: '#E5E7EB' }} />
          <span style={{ color: '#9CA3AF', fontSize: 12 }}>Admin · Desbloquea el Chip de IA</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {loading && <span style={{ color: '#D1D5DB', fontSize: 12 }}>Actualizando…</span>}
          <button onClick={exportCSV} style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', color: '#6B7280', borderRadius: 8, padding: '7px 14px', fontSize: 12, cursor: 'pointer' }}>⬇ CSV</button>
          <button onClick={() => fetchAll(auth, selectedEventId)} style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', color: '#6B7280', borderRadius: 8, padding: '7px 12px', fontSize: 12, cursor: 'pointer' }}>↻</button>
          <button onClick={() => setShowCreate(true)} style={{ background: PG, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>+ Nuevo evento</button>
        </div>
      </div>

      {/* Event tabs */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '0 24px', display: 'flex', gap: 2, overflowX: 'auto' }}>
        {['all', ...events.map(e => e.id)].map(id => {
          const ev = events.find(e => e.id === id)
          const label = id === 'all' ? 'Todos los eventos' : `${ev?.empresa} · ${new Date((ev?.fecha_evento ?? '') + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}`
          const active = selectedEventId === id
          return (
            <button key={id} onClick={() => setSelectedEventId(id)}
              style={{ padding: '11px 16px', fontSize: 13, fontWeight: active ? 600 : 400, background: 'transparent', border: 'none', borderBottom: active ? `2px solid ${P}` : '2px solid transparent', color: active ? P : '#9CA3AF', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {label}
            </button>
          )
        })}
        {selectedEventId !== 'all' && (() => {
          const ev = events.find(e => e.id === selectedEventId)
          return ev ? (
            <button onClick={() => setQrEvent(ev)} style={{ marginLeft: 'auto', padding: '8px 14px', background: PG, border: 'none', color: '#fff', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', alignSelf: 'center', margin: '4px 0 4px auto' }}>
              📱 QR / URL
            </button>
          ) : null
        })()}
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>

        {/* Metrics */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <Stat label="Participantes" value={participants.length} />
          <Stat label="Horas/sem grupo" value={`${totalHours}h`} sub={`≈${avgHours}h promedio`} />
          <Stat label="Horas/año grupo" value={`${annualHours}h`} sub="impacto proyectado" />
          <Stat label="Con plan 90d" value={planCount} />
          <Stat label="Emails enviados" value={sentCount} />
        </div>

        {/* Event cards (all view) */}
        {selectedEventId === 'all' && events.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ color: P, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14, fontWeight: 700 }}>Eventos</h3>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {events.map(ev => {
                const expired = ev.expires_at && new Date(ev.expires_at) < new Date()
                return (
                  <div key={ev.id} style={{ background: '#fff', border: `1px solid ${PB}`, borderRadius: 14, padding: '18px 20px', minWidth: 220, flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div>
                        <p style={{ color: P, fontSize: 11, margin: '0 0 2px', fontWeight: 600 }}>{ev.empresa}</p>
                        <p style={{ color: '#111827', fontWeight: 700, margin: 0 }}>{ev.nombre}</p>
                      </div>
                      <span style={{ background: expired ? '#F3F4F6' : '#D1FAE5', color: expired ? '#9CA3AF' : '#059669', fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>
                        {expired ? 'cerrado' : 'activo'}
                      </span>
                    </div>
                    <p style={{ color: '#9CA3AF', fontSize: 12, margin: '8px 0' }}>
                      {new Date(ev.fecha_evento + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
                      <span style={{ color: P, fontWeight: 700 }}>{ev.participants?.[0]?.count ?? 0} <span style={{ color: '#9CA3AF', fontWeight: 400, fontSize: 12 }}>participantes</span></span>
                      <button onClick={() => setQrEvent(ev)} style={{ background: PL, border: `1px solid ${PB}`, color: P, borderRadius: 8, padding: '5px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                        QR / URL
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Inner tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid #E5E7EB' }}>
          {(['participantes', 'reporte'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{ padding: '10px 18px', fontSize: 13, fontWeight: 600, background: 'transparent', border: 'none', borderBottom: activeTab === tab ? `2px solid ${P}` : '2px solid transparent', color: activeTab === tab ? P : '#9CA3AF', cursor: 'pointer' }}>
              {tab === 'participantes' ? '👥 Participantes' : '📊 Reporte del Facilitador'}
            </button>
          ))}
        </div>

        {/* ── PARTICIPANTES ── */}
        {activeTab === 'participantes' && (
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#111827', fontWeight: 600, fontSize: 14 }}>Participantes <span style={{ color: '#9CA3AF', fontWeight: 400, fontSize: 13 }}>— clic para ver detalle</span></span>
              <span style={{ color: '#D1D5DB', fontSize: 12 }}>{participants.length} registros</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #F3F4F6', background: '#FAFAFA' }}>
                    {['Nombre', 'Puesto', 'Depto', 'Horas/sem', 'Área impacto', 'Nivel', 'Aprendizajes', 'Plan', 'Email'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#9CA3AF', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', whiteSpace: 'nowrap', letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {participants.length === 0 && <tr><td colSpan={9} style={{ padding: 40, textAlign: 'center', color: '#D1D5DB' }}>Sin participantes aún</td></tr>}
                  {participants.map((p, i) => {
                    const r = resp(p); const d = diag(p)
                    return (
                      <tr key={p.id} onClick={() => setDetailP(p)}
                        style={{ borderBottom: '1px solid #F9FAFB', cursor: 'pointer', transition: 'background 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = PL)}
                        onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#FAFAFA')}>
                        <td style={{ padding: '12px 14px', color: '#111827', fontWeight: 600, whiteSpace: 'nowrap' }}>{p.nombre}</td>
                        <td style={{ padding: '12px 14px', color: '#6B7280', whiteSpace: 'nowrap' }}>{p.puesto}</td>
                        <td style={{ padding: '12px 14px', color: '#9CA3AF' }}>{p.departamento}</td>
                        <td style={{ padding: '12px 14px', color: P, fontWeight: 700, textAlign: 'center' }}>{r?.horas_proyectadas ?? '—'}</td>
                        <td style={{ padding: '12px 14px', color: '#6B7280', fontSize: 12 }}>{r?.area_impacto ?? '—'}</td>
                        <td style={{ padding: '12px 14px', color: '#9CA3AF', fontSize: 12 }}>{r?.nivel_listo ?? '—'}</td>
                        <td style={{ padding: '12px 14px', color: '#9CA3AF', fontSize: 12, textAlign: 'center' }}>{(r?.aprendizajes ?? []).length}/5</td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          {(r?.plan_90_dias?.length ?? 0) > 0 ? <span style={{ color: '#059669', fontWeight: 700 }}>✓ {r?.plan_90_dias?.length}</span> : <span style={{ color: '#D1D5DB' }}>—</span>}
                        </td>
                        <td style={{ padding: '12px 14px' }}><StatusPill status={d?.email_status} /></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── REPORTE ── */}
        {activeTab === 'reporte' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Insight card */}
            <div style={{ background: PG, borderRadius: 16, padding: 24, color: '#fff' }}>
              <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12, opacity: 0.8, fontWeight: 600 }}>💡 Insights de liderazgo IA</div>
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 32, fontWeight: 800 }}>{totalHours}h</div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>horas/sem recuperadas</div>
                </div>
                <div>
                  <div style={{ fontSize: 32, fontWeight: 800 }}>{annualHours}h</div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>horas/año del grupo</div>
                </div>
                <div>
                  <div style={{ fontSize: 32, fontWeight: 800 }}>{Math.round((nivelCount['🔥 Listo, arranco mañana'] ?? 0) / Math.max(1, participants.length) * 100)}%</div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>listos para arrancar</div>
                </div>
              </div>
              {Object.keys(areaCount).length > 0 && (
                <p style={{ marginTop: 16, fontSize: 14, opacity: 0.9, lineHeight: 1.7 }}>
                  Área de mayor impacto percibido: <strong>{Object.entries(areaCount).sort((a, b) => b[1] - a[1])[0]?.[0]}</strong>
                </p>
              )}
            </div>

            {/* Top aprendizajes */}
            <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20 }}>
              <h3 style={{ color: P, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 16px', fontWeight: 700 }}>Top aprendizajes del grupo</h3>
              {topAp.map(([label, count]) => <Bar key={label} label={label} count={count} total={participants.length} />)}
              {topAp.length === 0 && <p style={{ color: '#D1D5DB', fontSize: 13 }}>Sin datos aún</p>}
            </div>

            {/* Nivel + Área */}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20, flex: 1, minWidth: 240 }}>
                <h3 style={{ color: P, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 16px', fontWeight: 700 }}>Nivel de preparación IA</h3>
                {Object.entries(nivelCount).sort((a, b) => b[1] - a[1]).map(([n, c]) => <Bar key={n} label={n} count={c} total={participants.length} />)}
              </div>
              <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20, flex: 1, minWidth: 240 }}>
                <h3 style={{ color: P, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 16px', fontWeight: 700 }}>Área de mayor impacto</h3>
                {Object.entries(areaCount).sort((a, b) => b[1] - a[1]).map(([a, c]) => <Bar key={a} label={a} count={c} total={participants.length} />)}
              </div>
            </div>

            {/* Tasks */}
            <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20 }}>
              <h3 style={{ color: P, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 16px', fontWeight: 700 }}>
                Tareas con potencial IA ({allTasks.length})
              </h3>
              {allTasks.length === 0 && <p style={{ color: '#D1D5DB', fontSize: 13 }}>Sin conversaciones registradas aún</p>}
              {allTasks.map((t, i) => (
                <div key={i} style={{ background: '#FAFAFA', border: '1px solid #F3F4F6', borderRadius: 10, padding: '12px 16px', marginBottom: 8 }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                    <span style={{ color: P, fontSize: 11, fontWeight: 700 }}>{t.nombre}</span>
                    <span style={{ color: '#D1D5DB' }}>·</span>
                    <span style={{ color: '#9CA3AF', fontSize: 11 }}>{t.puesto}</span>
                  </div>
                  <p style={{ color: '#374151', fontSize: 13, lineHeight: 1.6, margin: 0 }}>{t.task}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {detailP && <ParticipantDetail p={detailP} auth={auth} onClose={() => setDetailP(null)} />}
      {qrEvent && <QRModal event={qrEvent} baseUrl={baseUrl} onClose={() => setQrEvent(null)} />}
      {showCreate && <CreateEventModal auth={auth} onClose={() => setShowCreate(false)} onCreated={ev => { setEvents(prev => [ev, ...prev]); setShowCreate(false); setQrEvent(ev) }} />}
    </main>
  )
}
