'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { QRCodeSVG } from 'qrcode.react'

const GOLD = '#C9A84C'

// ─── Types ───────────────────────────────────────────────────────────────────
interface EventRow {
  id: string
  codigo: string
  nombre: string
  empresa: string
  fecha_evento: string
  mensaje_bienvenida?: string
  expires_at?: string
  created_at: string
  participants?: { count: number }[]
}

interface ResponseData {
  aprendizajes?: string[]
  horas_proyectadas?: string
  area_impacto?: string
  nivel_listo?: string
  plan_90_dias?: unknown[]
}

interface DiagnosticData {
  email_status?: string
}

interface ParticipantRow {
  id: string
  nombre: string
  puesto: string
  departamento: string
  email: string
  curso_fecha: string
  event_id?: string
  responses?: ResponseData[]
  diagnostics?: DiagnosticData[]
}

// ─── Auth helper ─────────────────────────────────────────────────────────────
function buildAuth(password: string) { return 'Basic ' + btoa(`admin:${password}`) }

// ─── Small components ────────────────────────────────────────────────────────
function Pill({ color, label }: { color: string; label: string }) {
  return <span style={{ background: color, color: '#fff', fontSize: 10, padding: '2px 7px', borderRadius: 10, fontWeight: 700 }}>{label}</span>
}

function Card({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ background: '#0d0d0d', border: '1px solid #1f1f1f', borderRadius: 8, padding: '16px 20px', flex: 1, minWidth: 110 }}>
      <div style={{ color: GOLD, fontSize: 26, fontWeight: 800, lineHeight: 1 }}>{value}</div>
      <div style={{ color: '#555', fontSize: 11, marginTop: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
    </div>
  )
}

// ─── QR Modal ────────────────────────────────────────────────────────────────
function QRModal({ event, baseUrl, onClose }: { event: EventRow; baseUrl: string; onClose: () => void }) {
  const url = `${baseUrl}/e/${event.codigo}`
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }} onClick={onClose}>
      <div style={{ background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: 16, padding: 40, maxWidth: 480, width: '90%', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
        <p style={{ color: GOLD, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>{event.empresa}</p>
        <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 700, marginBottom: 6 }}>{event.nombre}</h2>
        <p style={{ color: '#666', fontSize: 12, marginBottom: 28 }}>
          {new Date(event.fecha_evento + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>

        {/* QR */}
        <div style={{ display: 'inline-block', background: '#fff', padding: 16, borderRadius: 12, marginBottom: 20 }}>
          <QRCodeSVG value={url} size={200} bgColor="#ffffff" fgColor="#000000" level="M" />
        </div>

        {/* URL */}
        <div style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: 8, padding: '12px 16px', marginBottom: 24 }}>
          <p style={{ color: '#888', fontSize: 11, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>URL de acceso</p>
          <p style={{ color: GOLD, fontSize: 14, fontWeight: 600, wordBreak: 'break-all' }}>{url}</p>
        </div>

        {event.mensaje_bienvenida && (
          <p style={{ color: '#666', fontSize: 13, fontStyle: 'italic', marginBottom: 20 }}>"{event.mensaje_bienvenida}"</p>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button
            onClick={() => navigator.clipboard.writeText(url)}
            style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#aaa', borderRadius: 8, padding: '10px 20px', fontSize: 13, cursor: 'pointer' }}
          >
            Copiar URL
          </button>
          <button
            onClick={onClose}
            style={{ background: GOLD, border: 'none', color: '#000', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Create Event Form ───────────────────────────────────────────────────────
function CreateEventModal({ auth, onCreated, onClose }: { auth: string; onCreated: (e: EventRow) => void; onClose: () => void }) {
  const [form, setForm] = useState({ nombre: '', empresa: '', fecha_evento: new Date().toISOString().slice(0, 10), mensaje_bienvenida: '', expires_at: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: auth },
        body: JSON.stringify({
          nombre: form.nombre,
          empresa: form.empresa,
          fecha_evento: form.fecha_evento,
          mensaje_bienvenida: form.mensaje_bienvenida || undefined,
          expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onCreated(data.event)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = { width: '100%', background: '#111', border: '1px solid #2a2a2a', borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const }
  const labelStyle = { display: 'block', color: '#666', fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 6 }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }} onClick={onClose}>
      <div style={{ background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: 16, padding: 32, maxWidth: 440, width: '90%' }} onClick={e => e.stopPropagation()}>
        <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginBottom: 24 }}>Nuevo evento</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Nombre del evento *</label>
            <input style={inputStyle} value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Ej: Sesión Liderazgo IA" required />
          </div>
          <div>
            <label style={labelStyle}>Empresa / Cliente *</label>
            <input style={inputStyle} value={form.empresa} onChange={e => setForm(f => ({ ...f, empresa: e.target.value }))} placeholder="Ej: BBVA México" required />
          </div>
          <div>
            <label style={labelStyle}>Fecha del evento *</label>
            <input type="date" style={inputStyle} value={form.fecha_evento} onChange={e => setForm(f => ({ ...f, fecha_evento: e.target.value }))} required />
          </div>
          <div>
            <label style={labelStyle}>Mensaje de bienvenida (opcional)</label>
            <input style={inputStyle} value={form.mensaje_bienvenida} onChange={e => setForm(f => ({ ...f, mensaje_bienvenida: e.target.value }))} placeholder="Ej: ¡Bienvenidos al cierre del curso!" />
          </div>
          <div>
            <label style={labelStyle}>Fecha/hora de expiración (opcional)</label>
            <input type="datetime-local" style={inputStyle} value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} />
            <p style={{ color: '#555', fontSize: 11, marginTop: 4 }}>El link se desactiva después de esta fecha/hora.</p>
          </div>
          {error && <p style={{ color: '#f87171', fontSize: 13 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#aaa', borderRadius: 8, padding: '12px', fontSize: 14, cursor: 'pointer' }}>
              Cancelar
            </button>
            <button type="submit" disabled={saving} style={{ flex: 1, background: GOLD, border: 'none', color: '#000', borderRadius: 8, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Creando…' : 'Crear evento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main Admin Page ─────────────────────────────────────────────────────────
export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [authError, setAuthError] = useState('')
  const [auth, setAuth] = useState('')
  const [loading, setLoading] = useState(false)

  const [events, setEvents] = useState<EventRow[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>('all')
  const [participants, setParticipants] = useState<ParticipantRow[]>([])

  const [qrEvent, setQrEvent] = useState<EventRow | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [baseUrl, setBaseUrl] = useState('')

  useEffect(() => { setBaseUrl(window.location.origin) }, [])

  const fetchAll = useCallback(async (a: string, eventId: string) => {
    setLoading(true)
    const [evRes, partRes] = await Promise.all([
      fetch('/api/events', { headers: { Authorization: a } }),
      fetch('/api/admin/data' + (eventId !== 'all' ? `?event_id=${eventId}` : ''), { headers: { Authorization: a } }),
    ])
    if (evRes.status === 401 || partRes.status === 401) { setAuthed(false); setLoading(false); return }
    const evData = await evRes.json()
    const partData = await partRes.json()
    setEvents(evData.events ?? [])
    setParticipants(partData.participants ?? [])
    setLoading(false)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const a = buildAuth(password)
    setLoading(true)
    const res = await fetch('/api/events', { headers: { Authorization: a } })
    if (res.status === 401) { setAuthError('Contraseña incorrecta'); setLoading(false); return }
    const data = await res.json()
    setEvents(data.events ?? [])
    setAuth(a)
    setAuthed(true)
    fetchAll(a, 'all')
  }

  useEffect(() => {
    if (!authed || !auth) return
    fetchAll(auth, selectedEventId)
  }, [selectedEventId, authed, auth, fetchAll])

  useEffect(() => {
    if (!authed || !auth) return
    const id = setInterval(() => fetchAll(auth, selectedEventId), 30000)
    return () => clearInterval(id)
  }, [authed, auth, selectedEventId, fetchAll])

  // Metrics
  const resp = (p: ParticipantRow) => p.responses?.[0]
  const diag = (p: ParticipantRow) => p.diagnostics?.[0]
  const HOURS: Record<string, number> = { '1h': 1, '2h': 2, '3h': 3, '5h': 5, '8h': 8, '+8h': 10 }
  const totalHours = participants.reduce((s, p) => s + (HOURS[resp(p)?.horas_proyectadas ?? ''] ?? 0), 0)
  const sentCount = participants.filter(p => diag(p)?.email_status === 'sent').length
  const planCount = participants.filter(p => (resp(p)?.plan_90_dias as unknown[] | undefined)?.length ?? 0 > 0).length

  const apCount: Record<string, number> = {}
  participants.forEach(p => (resp(p)?.aprendizajes ?? []).forEach(a => { apCount[a] = (apCount[a] ?? 0) + 1 }))
  const topAp = Object.entries(apCount).sort((a, b) => b[1] - a[1]).slice(0, 5)

  const nivelCount: Record<string, number> = {}
  participants.forEach(p => { const n = resp(p)?.nivel_listo; if (n) nivelCount[n] = (nivelCount[n] ?? 0) + 1 })

  const exportCSV = () => {
    const rows = [
      ['Nombre', 'Puesto', 'Depto', 'Email', 'Evento', 'Horas/sem', 'Área', 'Nivel', 'Email Status', 'Aprendizajes'],
      ...participants.map(p => {
        const ev = events.find(e => e.id === p.event_id)
        return [p.nombre, p.puesto, p.departamento, p.email, ev ? `${ev.empresa} – ${ev.nombre}` : '',
          resp(p)?.horas_proyectadas ?? '', resp(p)?.area_impacto ?? '', resp(p)?.nivel_listo ?? '',
          diag(p)?.email_status ?? '', (resp(p)?.aprendizajes ?? []).join(' | ')]
      })
    ]
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    a.download = `haix-${selectedEventId}.csv`; a.click()
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
          <button onClick={exportCSV} style={{ background: 'transparent', border: '1px solid #2a2a2a', color: '#888', borderRadius: 6, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>CSV</button>
          <button onClick={() => fetchAll(auth, selectedEventId)} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#aaa', borderRadius: 6, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>↻</button>
          <button onClick={() => setShowCreate(true)} style={{ background: GOLD, color: '#000', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>+ Nuevo evento</button>
        </div>
      </div>

      {/* Event tabs */}
      <div style={{ borderBottom: '1px solid #1a1a1a', padding: '0 24px', display: 'flex', gap: 2, overflowX: 'auto' }}>
        <button onClick={() => setSelectedEventId('all')} style={{ padding: '11px 14px', fontSize: 13, background: 'transparent', border: 'none', borderBottom: selectedEventId === 'all' ? `2px solid ${GOLD}` : '2px solid transparent', color: selectedEventId === 'all' ? GOLD : '#555', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          Todos los eventos
        </button>
        {events.map(ev => (
          <button key={ev.id} onClick={() => setSelectedEventId(ev.id)}
            style={{ padding: '11px 14px', fontSize: 13, background: 'transparent', border: 'none', borderBottom: selectedEventId === ev.id ? `2px solid ${GOLD}` : '2px solid transparent', color: selectedEventId === ev.id ? GOLD : '#555', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {ev.empresa} · {new Date(ev.fecha_evento + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>

        {/* Events list (only when "all" or showing event cards) */}
        {selectedEventId === 'all' && events.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <h3 style={{ color: GOLD, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>Eventos activos</h3>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {events.map(ev => {
                const count = ev.participants?.[0]?.count ?? 0
                const expired = ev.expires_at && new Date(ev.expires_at) < new Date()
                return (
                  <div key={ev.id} style={{ background: '#0d0d0d', border: '1px solid #1f1f1f', borderRadius: 10, padding: '16px 18px', minWidth: 220, flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div>
                        <p style={{ color: GOLD, fontSize: 11, margin: '0 0 2px' }}>{ev.empresa}</p>
                        <p style={{ color: '#fff', fontWeight: 600, margin: 0 }}>{ev.nombre}</p>
                      </div>
                      {expired ? <Pill color="#555" label="cerrado" /> : <Pill color="#22c55e" label="activo" />}
                    </div>
                    <p style={{ color: '#555', fontSize: 12, margin: '8px 0' }}>
                      {new Date(ev.fecha_evento + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                      <span style={{ color: GOLD, fontWeight: 700 }}>{count} <span style={{ color: '#555', fontWeight: 400, fontSize: 12 }}>participantes</span></span>
                      <button onClick={() => setQrEvent(ev)} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#aaa', borderRadius: 6, padding: '5px 10px', fontSize: 11, cursor: 'pointer' }}>
                        QR / URL
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Show QR button when specific event selected */}
        {selectedEventId !== 'all' && (() => {
          const ev = events.find(e => e.id === selectedEventId)
          return ev ? (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
              <button onClick={() => setQrEvent(ev)} style={{ background: GOLD, color: '#000', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                📱 Mostrar QR / URL
              </button>
            </div>
          ) : null
        })()}

        {/* Metrics */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
          <Card label="Participantes" value={participants.length} />
          <Card label="Con plan 90d" value={planCount} />
          <Card label="Emails enviados" value={sentCount} />
          <Card label="Horas/sem recuperadas" value={`${totalHours}h`} />
        </div>

        {/* Charts row */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
          <div style={{ background: '#0d0d0d', border: '1px solid #1f1f1f', borderRadius: 8, padding: 18, flex: 2, minWidth: 260 }}>
            <h3 style={{ color: GOLD, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 14px' }}>Top aprendizajes</h3>
            {topAp.length === 0 && <p style={{ color: '#444', fontSize: 13 }}>Sin datos aún</p>}
            {topAp.map(([label, count]) => (
              <div key={label} style={{ marginBottom: 9 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ color: '#bbb', fontSize: 12, flex: 1, marginRight: 12 }}>{label}</span>
                  <span style={{ color: GOLD, fontWeight: 700, fontSize: 12 }}>{count}</span>
                </div>
                <div style={{ height: 3, background: '#1a1a1a', borderRadius: 2 }}>
                  <div style={{ height: '100%', background: GOLD, borderRadius: 2, width: `${Math.min(100, (count / Math.max(1, participants.length)) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ background: '#0d0d0d', border: '1px solid #1f1f1f', borderRadius: 8, padding: 18, flex: 1, minWidth: 200 }}>
            <h3 style={{ color: GOLD, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 14px' }}>Nivel de preparación</h3>
            {Object.entries(nivelCount).sort((a, b) => b[1] - a[1]).map(([nivel, count]) => (
              <div key={nivel} style={{ marginBottom: 9 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ color: '#bbb', fontSize: 12, flex: 1, marginRight: 8 }}>{nivel}</span>
                  <span style={{ color: GOLD, fontWeight: 700, fontSize: 12 }}>{count}</span>
                </div>
                <div style={{ height: 3, background: '#1a1a1a', borderRadius: 2 }}>
                  <div style={{ height: '100%', background: GOLD, borderRadius: 2, width: `${Math.min(100, (count / Math.max(1, participants.length)) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Participants table */}
        <div style={{ background: '#0d0d0d', border: '1px solid #1f1f1f', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #1a1a1a', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>Participantes</span>
            <span style={{ color: '#444', fontSize: 12 }}>{participants.length} registros</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1a1a1a' }}>
                  {['Nombre', 'Puesto', 'Depto', 'Email', 'Evento', 'Horas/sem', 'Área impacto', 'Nivel', 'Plan', 'Email'].map(h => (
                    <th key={h} style={{ padding: '9px 12px', textAlign: 'left', color: '#444', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {participants.length === 0 && (
                  <tr><td colSpan={10} style={{ padding: 40, textAlign: 'center', color: '#333' }}>Sin participantes aún</td></tr>
                )}
                {participants.map((p, i) => {
                  const r = resp(p)
                  const d = diag(p)
                  const ev = events.find(e => e.id === p.event_id)
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid #111', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                      <td style={{ padding: '11px 12px', color: '#fff', fontWeight: 500, whiteSpace: 'nowrap' }}>{p.nombre}</td>
                      <td style={{ padding: '11px 12px', color: '#aaa', whiteSpace: 'nowrap' }}>{p.puesto}</td>
                      <td style={{ padding: '11px 12px', color: '#777' }}>{p.departamento}</td>
                      <td style={{ padding: '11px 12px', color: '#555', fontSize: 12 }}>{p.email}</td>
                      <td style={{ padding: '11px 12px', color: '#888', fontSize: 12, whiteSpace: 'nowrap' }}>{ev ? `${ev.empresa}` : '—'}</td>
                      <td style={{ padding: '11px 12px', color: GOLD, fontWeight: 700, textAlign: 'center' }}>{r?.horas_proyectadas ?? '—'}</td>
                      <td style={{ padding: '11px 12px', color: '#888', fontSize: 12 }}>{r?.area_impacto ?? '—'}</td>
                      <td style={{ padding: '11px 12px', color: '#777', fontSize: 11 }}>{r?.nivel_listo ?? '—'}</td>
                      <td style={{ padding: '11px 12px', textAlign: 'center' }}>
                        {(r?.plan_90_dias as unknown[] | undefined)?.length ? <span style={{ color: '#22c55e' }}>✓</span> : <span style={{ color: '#333' }}>—</span>}
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
      </div>

      {/* Modals */}
      {qrEvent && <QRModal event={qrEvent} baseUrl={baseUrl} onClose={() => setQrEvent(null)} />}
      {showCreate && (
        <CreateEventModal auth={auth} onClose={() => setShowCreate(false)} onCreated={ev => {
          setEvents(prev => [ev, ...prev])
          setShowCreate(false)
          setQrEvent(ev)
        }} />
      )}
    </main>
  )
}
