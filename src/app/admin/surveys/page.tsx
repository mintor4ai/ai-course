'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'

const P = '#7C3AED'
const PL = '#F5F3FF'
const PB = '#E9D5FF'
const PG = 'linear-gradient(135deg,#7C3AED,#D946EF)'

interface Campaign {
  id: string; nombre: string; empresa: string; tipo: string
  descripcion?: string; status: string; created_at: string
}
interface Respondent {
  id: string; email: string; nombre?: string; token: string
  status: string; sent_at?: string; completed_at?: string
  survey_responses?: { profile_name?: string; profile_score?: number }[]
}

function buildAuth(pw: string) { return 'Basic ' + btoa(`admin:${pw}`) }

function StatusChip({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    pending: ['#9CA3AF', 'Pendiente'],
    sent: ['#3B82F6', 'Enviado'],
    completed: ['#22C55E', 'Completado'],
    abandoned: ['#EF4444', 'Abandonado'],
    active: [P, 'Activa'],
    draft: ['#9CA3AF', 'Borrador'],
    closed: ['#6B7280', 'Cerrada'],
  }
  const [color, label] = map[status] ?? ['#9CA3AF', status]
  return <span style={{ background: color + '18', color, border: `1px solid ${color}40`, fontSize: 11, padding: '2px 10px', borderRadius: 20, fontWeight: 700 }}>{label}</span>
}

function ImportModal({ campaignId, auth, onClose, onDone }: { campaignId: string; auth: string; onClose: () => void; onDone: () => void }) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')

  const handleImport = async () => {
    setLoading(true); setResult('')
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
    const respondents = lines.map(line => {
      const [email, ...rest] = line.split(/[,;\t]/)
      return { email: email?.trim(), nombre: rest.join(' ').trim() || undefined }
    }).filter(r => r.email?.includes('@'))

    const res = await fetch('/api/survey/respondents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: auth },
      body: JSON.stringify({ campaign_id: campaignId, respondents }),
    })
    const data = await res.json()
    setLoading(false)
    if (res.ok) { setResult(`✓ ${data.imported} importados de ${data.total} en lista`); onDone() }
    else setResult('Error: ' + data.error)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 28, maxWidth: 500, width: '100%', boxShadow: '0 20px 60px rgba(124,58,237,0.2)' }} onClick={e => e.stopPropagation()}>
        <h3 style={{ color: '#111827', fontSize: 18, fontWeight: 800, margin: '0 0 6px' }}>Importar participantes</h3>
        <p style={{ color: '#9CA3AF', fontSize: 13, margin: '0 0 16px' }}>Un email por línea. Formato: <code style={{ background: PL, padding: '1px 6px', borderRadius: 4, color: P }}>email, Nombre Apellido</code></p>
        <textarea value={text} onChange={e => setText(e.target.value)} rows={8} placeholder={"juan@empresa.com, Juan García\nmaria@empresa.com, María López\notro@empresa.com"}
          style={{ width: '100%', padding: 12, border: `1.5px solid ${PB}`, borderRadius: 10, fontSize: 13, fontFamily: 'monospace', resize: 'vertical', outline: 'none', boxSizing: 'border-box', color: '#374151' }} />
        {result && <p style={{ color: result.startsWith('✓') ? '#22C55E' : '#EF4444', fontSize: 13, margin: '8px 0 0' }}>{result}</p>}
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '12px', border: '1.5px solid #E5E7EB', borderRadius: 10, background: '#fff', color: '#6B7280', fontSize: 14, cursor: 'pointer' }}>Cancelar</button>
          <button onClick={handleImport} disabled={!text.trim() || loading}
            style={{ flex: 2, padding: '12px', border: 'none', borderRadius: 10, background: text.trim() && !loading ? PG : '#E5E7EB', color: text.trim() && !loading ? '#fff' : '#9CA3AF', fontSize: 14, fontWeight: 700, cursor: text.trim() && !loading ? 'pointer' : 'not-allowed' }}>
            {loading ? 'Importando...' : `Importar ${text.split('\n').filter(l => l.trim().includes('@')).length} emails`}
          </button>
        </div>
      </div>
    </div>
  )
}

function CreateModal({ auth, onClose, onCreated }: { auth: string; onClose: () => void; onCreated: () => void }) {
  const [nombre, setNombre] = useState('')
  const [empresa, setEmpresa] = useState('')
  const [tipo, setTipo] = useState<'pre' | 'post'>('pre')
  const [descripcion, setDescripcion] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const create = async () => {
    if (!nombre || !empresa) return
    setLoading(true); setErr('')
    const res = await fetch('/api/survey/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: auth },
      body: JSON.stringify({ nombre, empresa, tipo, descripcion }),
    })
    setLoading(false)
    if (res.ok) { onCreated(); onClose() }
    else { const d = await res.json(); setErr(d.error) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 28, maxWidth: 460, width: '100%', boxShadow: '0 20px 60px rgba(124,58,237,0.2)' }} onClick={e => e.stopPropagation()}>
        <h3 style={{ color: '#111827', fontSize: 18, fontWeight: 800, margin: '0 0 20px' }}>Nueva campaña de encuesta</h3>
        {[
          { label: 'Nombre de la campaña', val: nombre, set: setNombre, ph: 'Ej. Diagnóstico Pre-Curso — Junio 2026' },
          { label: 'Empresa / Organización', val: empresa, set: setEmpresa, ph: 'Ej. Terminal Logistics' },
        ].map(({ label, val, set, ph }) => (
          <div key={label} style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', color: '#374151', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{label}</label>
            <input value={val} onChange={e => set(e.target.value)} placeholder={ph}
              style={{ width: '100%', padding: '11px 14px', border: `1.5px solid ${val ? PB : '#E5E7EB'}`, borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box', background: val ? PL : '#fff', color: '#111827' }} />
          </div>
        ))}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', color: '#374151', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Tipo</label>
          <div style={{ display: 'flex', gap: 10 }}>
            {(['pre', 'post'] as const).map(t => (
              <button key={t} onClick={() => setTipo(t)}
                style={{ flex: 1, padding: '10px', borderRadius: 10, border: `1.5px solid ${tipo === t ? P : '#E5E7EB'}`, background: tipo === t ? PL : '#fff', color: tipo === t ? P : '#6B7280', fontWeight: tipo === t ? 700 : 400, fontSize: 14, cursor: 'pointer' }}>
                {t === 'pre' ? '📋 Pre-curso' : '🎯 Post-curso'}
              </button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', color: '#374151', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Descripción (opcional)</label>
          <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={2} placeholder="Mensaje adicional que verán los participantes en el email de invitación"
            style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 14, resize: 'none', outline: 'none', boxSizing: 'border-box', color: '#374151' }} />
        </div>
        {err && <p style={{ color: '#EF4444', fontSize: 13, margin: '0 0 12px' }}>{err}</p>}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '12px', border: '1.5px solid #E5E7EB', borderRadius: 10, background: '#fff', color: '#6B7280', fontSize: 14, cursor: 'pointer' }}>Cancelar</button>
          <button onClick={create} disabled={!nombre || !empresa || loading}
            style={{ flex: 2, padding: '12px', border: 'none', borderRadius: 10, background: nombre && empresa ? PG : '#E5E7EB', color: nombre && empresa ? '#fff' : '#9CA3AF', fontSize: 14, fontWeight: 700, cursor: nombre && empresa ? 'pointer' : 'not-allowed' }}>
            {loading ? 'Creando...' : 'Crear campaña'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SurveysAdmin() {
  const [authed, setAuthed] = useState(false)
  const [auth, setAuth] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [loading, setLoading] = useState(false)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [tab, setTab] = useState<'all' | 'pre' | 'post'>('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [respondents, setRespondents] = useState<Record<string, Respondent[]>>({})
  const [showCreate, setShowCreate] = useState(false)
  const [importCampaignId, setImportCampaignId] = useState<string | null>(null)
  const [inviting, setInviting] = useState<string | null>(null)
  const [baseUrl, setBaseUrl] = useState('')

  useEffect(() => { setBaseUrl(window.location.origin) }, [])

  const fetchCampaigns = useCallback(async (a: string) => {
    setLoading(true)
    const res = await fetch('/api/survey/campaigns', { headers: { Authorization: a } })
    if (res.status === 401) { setAuthed(false); setLoading(false); return }
    const data = await res.json()
    setCampaigns(data.campaigns ?? [])
    setLoading(false)
  }, [])

  const fetchRespondents = useCallback(async (campaignId: string) => {
    const res = await fetch(`/api/survey/respondents?campaign_id=${campaignId}`, { headers: { Authorization: auth } })
    const data = await res.json()
    setRespondents(prev => ({ ...prev, [campaignId]: data.respondents ?? [] }))
  }, [auth])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const a = buildAuth(password); setLoading(true); setAuthError('')
    const res = await fetch('/api/survey/campaigns', { headers: { Authorization: a } })
    if (res.status === 401) { setAuthError('Contraseña incorrecta'); setLoading(false); return }
    setAuth(a); setAuthed(true); fetchCampaigns(a)
  }

  const toggleExpand = async (id: string) => {
    if (expanded === id) { setExpanded(null); return }
    setExpanded(id)
    if (!respondents[id]) await fetchRespondents(id)
  }

  const sendInvites = async (campaignId: string) => {
    setInviting(campaignId)
    const res = await fetch('/api/survey/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: auth },
      body: JSON.stringify({ campaign_id: campaignId }),
    })
    const data = await res.json()
    alert(`✓ ${data.sent} invitaciones enviadas`)
    setInviting(null)
    fetchRespondents(campaignId)
  }

  const exportCSV = (campaignId: string) => {
    const rs = respondents[campaignId] ?? []
    const rows = [
      ['Email', 'Nombre', 'Status', 'Enviado', 'Completado', 'Perfil IA', 'Score', 'URL personal'],
      ...rs.map(r => [
        r.email, r.nombre ?? '', r.status,
        r.sent_at ? new Date(r.sent_at).toLocaleString('es-MX') : '',
        r.completed_at ? new Date(r.completed_at).toLocaleString('es-MX') : '',
        r.survey_responses?.[0]?.profile_name ?? '',
        r.survey_responses?.[0]?.profile_score?.toString() ?? '',
        `${baseUrl}/s/${r.token}`,
      ])
    ]
    const csv = '﻿' + rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    a.download = `encuesta-${campaignId}.csv`; a.click()
  }

  const filtered = campaigns.filter(c => tab === 'all' || c.tipo === tab)

  if (!authed) return (
    <main style={{ minHeight: '100vh', background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 40, maxWidth: 380, width: '90%', boxShadow: '0 8px 40px rgba(124,58,237,0.12)', border: `1px solid ${PB}` }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Image src="https://www.humanaix.mx/assets/logos/LogoHaix.png" alt="Human.AiX" width={120} height={30} style={{ objectFit: 'contain' }} unoptimized />
          <p style={{ color: P, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '16px 0 4px' }}>Encuestas de Adopción IA</p>
          <h1 style={{ color: '#111827', fontSize: 20, fontWeight: 800, margin: 0 }}>Acceso Admin</h1>
        </div>
        <form onSubmit={handleLogin}>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Contraseña"
            style={{ width: '100%', padding: '13px 16px', border: `1.5px solid ${PB}`, borderRadius: 12, fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 8, color: '#111827' }} />
          {authError && <p style={{ color: '#EF4444', fontSize: 13, margin: '0 0 8px' }}>{authError}</p>}
          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: '14px', border: 'none', borderRadius: 12, background: PG, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
            {loading ? 'Verificando...' : 'Entrar →'}
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <a href="/admin" style={{ color: '#9CA3AF', fontSize: 12, textDecoration: 'none' }}>← Volver al admin principal</a>
        </div>
      </div>
    </main>
  )

  return (
    <main style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #F3F4F6', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Image src="https://www.humanaix.mx/assets/logos/LogoHaix.png" alt="Human.AiX" width={100} height={26} style={{ objectFit: 'contain' }} unoptimized />
          <div style={{ width: 1, height: 24, background: '#E5E7EB' }} />
          <span style={{ color: P, fontSize: 13, fontWeight: 700 }}>Encuestas de Adopción IA</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <a href="/admin" style={{ padding: '8px 16px', borderRadius: 10, border: '1.5px solid #E5E7EB', background: '#fff', color: '#6B7280', fontSize: 13, textDecoration: 'none' }}>
            Diagnósticos Post-Curso
          </a>
          <button onClick={() => setShowCreate(true)}
            style={{ padding: '8px 18px', borderRadius: 10, border: 'none', background: PG, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            + Nueva campaña
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 20px' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24, background: '#F3F4F6', borderRadius: 12, padding: 4, width: 'fit-content' }}>
          {([['all', 'Todas'], ['pre', '📋 Pre-curso'], ['post', '🎯 Post-curso']] as const).map(([v, l]) => (
            <button key={v} onClick={() => setTab(v)}
              style={{ padding: '8px 18px', borderRadius: 9, border: 'none', background: tab === v ? PG : 'transparent', color: tab === v ? '#fff' : '#6B7280', fontWeight: tab === v ? 700 : 400, fontSize: 13, cursor: 'pointer' }}>
              {l}
            </button>
          ))}
        </div>

        {/* Campaigns */}
        {loading && <p style={{ color: '#9CA3AF', textAlign: 'center', padding: 40 }}>Cargando...</p>}
        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9CA3AF' }}>
            <p style={{ fontSize: 40, margin: '0 0 12px' }}>📋</p>
            <p style={{ fontSize: 16, fontWeight: 600, color: '#6B7280', margin: '0 0 8px' }}>No hay campañas aún</p>
            <p style={{ fontSize: 14, margin: 0 }}>Crea tu primera campaña y empieza a recopilar diagnósticos de adopción IA.</p>
            <button onClick={() => setShowCreate(true)} style={{ marginTop: 20, padding: '12px 28px', borderRadius: 12, border: 'none', background: PG, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              + Nueva campaña
            </button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filtered.map(c => {
            const rs = respondents[c.id] ?? []
            const pending = rs.filter(r => r.status === 'pending').length
            const sent = rs.filter(r => r.status === 'sent').length
            const completed = rs.filter(r => r.status === 'completed').length
            const total = rs.length
            const pct = total ? Math.round(completed / total * 100) : 0

            return (
              <div key={c.id} style={{ background: '#fff', border: `1px solid ${expanded === c.id ? PB : '#E5E7EB'}`, borderRadius: 16, overflow: 'hidden', boxShadow: expanded === c.id ? `0 4px 20px rgba(124,58,237,0.1)` : 'none' }}>
                {/* Campaign header */}
                <div style={{ padding: '20px 24px', cursor: 'pointer' }} onClick={() => toggleExpand(c.id)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <span style={{ background: c.tipo === 'pre' ? '#EFF6FF' : PL, color: c.tipo === 'pre' ? '#3B82F6' : P, fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20, border: `1px solid ${c.tipo === 'pre' ? '#BFDBFE' : PB}` }}>
                          {c.tipo === 'pre' ? '📋 Pre-curso' : '🎯 Post-curso'}
                        </span>
                        <StatusChip status={c.status} />
                      </div>
                      <h3 style={{ color: '#111827', fontSize: 17, fontWeight: 800, margin: '0 0 2px' }}>{c.nombre}</h3>
                      <p style={{ color: '#6B7280', fontSize: 13, margin: 0 }}>{c.empresa} · {new Date(c.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                      {total > 0 && (
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ color: '#22C55E', fontWeight: 800, fontSize: 20 }}>{completed}</div>
                          <div style={{ color: '#9CA3AF', fontSize: 11 }}>completados / {total}</div>
                        </div>
                      )}
                      <span style={{ color: '#9CA3AF', fontSize: 18 }}>{expanded === c.id ? '▲' : '▼'}</span>
                    </div>
                  </div>
                  {total > 0 && (
                    <div style={{ marginTop: 12, height: 4, background: '#F3F4F6', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: PG, borderRadius: 4, width: `${pct}%`, transition: 'width 0.5s' }} />
                    </div>
                  )}
                </div>

                {/* Expanded content */}
                {expanded === c.id && (
                  <div style={{ borderTop: `1px solid ${PB}` }}>
                    {/* Action bar */}
                    <div style={{ padding: '14px 24px', background: PL, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                      <button onClick={() => setImportCampaignId(c.id)}
                        style={{ padding: '8px 18px', border: `1.5px solid ${PB}`, borderRadius: 10, background: '#fff', color: P, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                        📥 Importar emails
                      </button>
                      <button onClick={() => sendInvites(c.id)} disabled={inviting === c.id || pending + sent === 0}
                        style={{ padding: '8px 18px', border: 'none', borderRadius: 10, background: inviting === c.id || pending + sent === 0 ? '#E5E7EB' : PG, color: inviting === c.id || pending + sent === 0 ? '#9CA3AF' : '#fff', fontSize: 13, fontWeight: 700, cursor: inviting === c.id || pending + sent === 0 ? 'not-allowed' : 'pointer' }}>
                        {inviting === c.id ? 'Enviando...' : `📧 Enviar invitaciones${pending + sent > 0 ? ` (${pending + sent})` : ''}`}
                      </button>
                      {total > 0 && (
                        <button onClick={() => exportCSV(c.id)}
                          style={{ padding: '8px 18px', border: `1.5px solid #E5E7EB`, borderRadius: 10, background: '#fff', color: '#374151', fontSize: 13, cursor: 'pointer' }}>
                          ⬇ CSV
                        </button>
                      )}
                      <div style={{ marginLeft: 'auto', display: 'flex', gap: 20 }}>
                        {[['Pendientes', pending, '#9CA3AF'], ['Enviados', sent, '#3B82F6'], ['Completados', completed, '#22C55E']].map(([l, v, col]) => (
                          <div key={String(l)} style={{ textAlign: 'center' }}>
                            <div style={{ color: col as string, fontWeight: 800, fontSize: 18 }}>{v}</div>
                            <div style={{ color: '#9CA3AF', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{l}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Respondents table */}
                    {rs.length === 0 ? (
                      <div style={{ padding: '32px 24px', textAlign: 'center', color: '#9CA3AF' }}>
                        <p style={{ margin: 0 }}>Sin participantes aún. Importa una lista de emails para empezar.</p>
                      </div>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                          <thead>
                            <tr style={{ background: '#FAFAFA', borderBottom: '1px solid #F3F4F6' }}>
                              {['Email', 'Nombre', 'Status', 'Perfil IA', 'Score', 'URL personal'].map(h => (
                                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: '#9CA3AF', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, whiteSpace: 'nowrap' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {rs.map(r => (
                              <tr key={r.id} style={{ borderBottom: '1px solid #F9FAFB' }}>
                                <td style={{ padding: '12px 16px', color: '#374151' }}>{r.email}</td>
                                <td style={{ padding: '12px 16px', color: '#374151' }}>{r.nombre ?? '—'}</td>
                                <td style={{ padding: '12px 16px' }}><StatusChip status={r.status} /></td>
                                <td style={{ padding: '12px 16px', color: P, fontWeight: 600 }}>{r.survey_responses?.[0]?.profile_name ?? '—'}</td>
                                <td style={{ padding: '12px 16px', color: '#6B7280' }}>{r.survey_responses?.[0]?.profile_score != null ? `${r.survey_responses[0].profile_score}%` : '—'}</td>
                                <td style={{ padding: '12px 16px' }}>
                                  <button onClick={() => navigator.clipboard.writeText(`${baseUrl}/s/${r.token}`)}
                                    style={{ padding: '4px 12px', border: `1px solid ${PB}`, borderRadius: 8, background: PL, color: P, fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
                                    Copiar URL
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {showCreate && <CreateModal auth={auth} onClose={() => setShowCreate(false)} onCreated={() => fetchCampaigns(auth)} />}
      {importCampaignId && (
        <ImportModal
          campaignId={importCampaignId}
          auth={auth}
          onClose={() => setImportCampaignId(null)}
          onDone={() => { fetchRespondents(importCampaignId); setImportCampaignId(null) }}
        />
      )}
    </main>
  )
}
