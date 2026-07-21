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
interface SurveyResponse {
  profile_name?: string
  profile_score?: number
  answers?: Record<string, unknown>
  completion_time_seconds?: number
  diagnostic_html?: string
}
interface Respondent {
  id: string; email: string; nombre?: string; token: string
  status: string; sent_at?: string; completed_at?: string
  survey_responses?: SurveyResponse[]
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

const BARRIER_LABELS: Record<string, string> = {
  no_se_como: 'No sé cómo empezar',
  no_confio: 'No confío en los resultados',
  falta_tiempo: 'Falta de tiempo',
  confidencialidad: 'Seguridad / confidencialidad',
  no_acceso: 'Sin acceso o licencia',
  no_caso_uso: 'Sin casos de uso identificados',
  ninguna: 'Sin barreras',
}
const FREQ_LABELS: Record<string, string> = {
  nunca: 'Nunca', una_dos: 'Una o dos veces', mensual: 'Algunas veces al mes',
  semanal: 'Varias veces/semana', diario: 'Diariamente', flujo: 'Parte integral del flujo',
}

function DetailModal({ r, baseUrl, onClose }: { r: Respondent; baseUrl: string; onClose: () => void }) {
  const resp = r.survey_responses?.[0]
  const answers = resp?.answers as Record<string, unknown> | undefined
  const mins = resp?.completion_time_seconds ? Math.round(resp.completion_time_seconds / 60) : null

  const downloadDiagnostic = () => {
    if (!resp?.diagnostic_html) return
    const blob = new Blob([resp.diagnostic_html], { type: 'text/html;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `diagnostico-${(r.nombre ?? r.email).replace(/\s+/g, '-')}.html`
    a.click()
  }

  const barreras: string[] = Array.isArray(answers?.barreras)
    ? answers.barreras as string[]
    : answers?.barrera ? [answers.barrera as string] : []

  const herramientas: string[] = Array.isArray(answers?.herramientas)
    ? answers.herramientas as string[]
    : []

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 20, maxWidth: 560, width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(124,58,237,0.25)' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ background: PG, borderRadius: '20px 20px 0 0', padding: '24px 28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, margin: '0 0 4px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Detalle de participante</p>
              <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 800, margin: '0 0 4px' }}>{r.nombre ?? r.email}</h2>
              {r.nombre && <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, margin: 0 }}>{r.email}</p>}
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: 32, height: 32, borderRadius: '50%', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
            <StatusChip status={r.status} />
            {resp?.profile_name && (
              <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 11, padding: '2px 10px', borderRadius: 20, fontWeight: 700 }}>{resp.profile_name}</span>
            )}
            {resp?.profile_score != null && (
              <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 11, padding: '2px 10px', borderRadius: 20, fontWeight: 700 }}>Score: {resp.profile_score}%</span>
            )}
            {mins != null && (
              <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 11, padding: '2px 10px', borderRadius: 20 }}>{mins} min</span>
            )}
          </div>
        </div>

        <div style={{ padding: '24px 28px' }}>
          {r.status !== 'completed' ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#9CA3AF' }}>
              <p style={{ fontSize: 32, margin: '0 0 12px' }}>⏳</p>
              <p style={{ margin: 0 }}>Este participante aún no ha completado la encuesta.</p>
              <p style={{ margin: '8px 0 0', fontSize: 12 }}>
                URL personal: <a href={`${baseUrl}/s/${r.token}`} target="_blank" rel="noreferrer" style={{ color: P }}>{baseUrl}/s/{r.token}</a>
              </p>
            </div>
          ) : (
            <>
              {/* Perfil */}
              {answers && (
                <>
                  {(answers.puesto || answers.departamento || answers.role) && (
                    <div style={{ marginBottom: 20 }}>
                      <p style={{ color: '#9CA3AF', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, margin: '0 0 10px' }}>Perfil profesional</p>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {[answers.puesto, answers.departamento, answers.role].filter(Boolean).map((v, i) => (
                          <span key={i} style={{ background: PL, color: P, fontSize: 12, padding: '4px 12px', borderRadius: 20, fontWeight: 600 }}>{String(v)}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Uso de IA */}
                  <div style={{ marginBottom: 20 }}>
                    <p style={{ color: '#9CA3AF', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, margin: '0 0 10px' }}>Uso de IA</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div style={{ background: '#F9FAFB', borderRadius: 10, padding: '12px 14px' }}>
                        <p style={{ color: '#9CA3AF', fontSize: 11, margin: '0 0 4px' }}>Frecuencia</p>
                        <p style={{ color: '#111827', fontSize: 13, fontWeight: 600, margin: 0 }}>{FREQ_LABELS[answers.frecuencia as string] ?? (answers.frecuencia as string) ?? '—'}</p>
                      </div>
                      <div style={{ background: '#F9FAFB', borderRadius: 10, padding: '12px 14px' }}>
                        <p style={{ color: '#9CA3AF', fontSize: 11, margin: '0 0 4px' }}>Confianza</p>
                        <p style={{ color: '#111827', fontSize: 13, fontWeight: 600, margin: 0 }}>{answers.confianza ? `${answers.confianza} / 5` : '—'}</p>
                      </div>
                    </div>
                    {herramientas.length > 0 && (
                      <div style={{ marginTop: 10 }}>
                        <p style={{ color: '#9CA3AF', fontSize: 11, margin: '0 0 6px' }}>Herramientas usadas</p>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {herramientas.map(h => (
                            <span key={h} style={{ background: PL, color: P, fontSize: 12, padding: '3px 10px', borderRadius: 16, fontWeight: 600 }}>{h}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Barreras */}
                  {barreras.length > 0 && (
                    <div style={{ marginBottom: 20 }}>
                      <p style={{ color: '#9CA3AF', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, margin: '0 0 10px' }}>Barreras</p>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {barreras.map(b => (
                          <span key={b} style={{ background: '#FEF2F2', color: '#EF4444', border: '1px solid #FECACA', fontSize: 12, padding: '3px 10px', borderRadius: 16 }}>{BARRIER_LABELS[b] ?? b}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tarea frecuente */}
                  {answers.tareaFrecuente && (
                    <div style={{ marginBottom: 20 }}>
                      <p style={{ color: '#9CA3AF', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, margin: '0 0 10px' }}>Tarea frecuente</p>
                      <div style={{ background: '#F9FAFB', borderRadius: 10, padding: '14px', fontSize: 13, color: '#374151', lineHeight: 1.7 }}>{String(answers.tareaFrecuente)}</div>
                    </div>
                  )}

                  {/* Expectativa */}
                  {answers.expectativa && (
                    <div style={{ marginBottom: 24 }}>
                      <p style={{ color: '#9CA3AF', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, margin: '0 0 10px' }}>Expectativa del curso</p>
                      <div style={{ background: '#F9FAFB', borderRadius: 10, padding: '14px', fontSize: 13, color: '#374151', lineHeight: 1.7 }}>{String(answers.expectativa)}</div>
                    </div>
                  )}
                </>
              )}

              {/* Acciones */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {resp?.diagnostic_html && (
                  <button onClick={downloadDiagnostic}
                    style={{ flex: 1, padding: '12px', border: 'none', borderRadius: 12, background: PG, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', minWidth: 160 }}>
                    ⬇ Descargar diagnóstico
                  </button>
                )}
                <button onClick={() => navigator.clipboard.writeText(`${baseUrl}/s/${r.token}`)}
                  style={{ padding: '12px 20px', border: `1.5px solid ${PB}`, borderRadius: 12, background: PL, color: P, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  Copiar URL
                </button>
              </div>

              {r.completed_at && (
                <p style={{ color: '#9CA3AF', fontSize: 11, textAlign: 'center', marginTop: 16, margin: '16px 0 0' }}>
                  Completado el {new Date(r.completed_at).toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' })}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
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

const PROFILES = ['AI Explorer', 'AI Practitioner', 'AI Strategist', 'AI Catalyst Leader']
const PROFILE_COLORS: Record<string, string> = {
  'AI Explorer': '#9CA3AF',
  'AI Practitioner': '#3B82F6',
  'AI Strategist': '#8B5CF6',
  'AI Catalyst Leader': '#D946EF',
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
  const [selectedRespondent, setSelectedRespondent] = useState<Respondent | null>(null)
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
      ['Email', 'Nombre', 'Puesto', 'Departamento', 'Status', 'Perfil IA', 'Score', 'Frecuencia', 'Herramientas', 'Confianza', 'Barreras', 'Enviado', 'Completado', 'Tiempo (min)', 'URL personal'],
      ...rs.map(r => {
        const resp = r.survey_responses?.[0]
        const ans = resp?.answers as Record<string, unknown> | undefined
        const herramientas = Array.isArray(ans?.herramientas) ? (ans.herramientas as string[]).join('; ') : ''
        const barreras = Array.isArray(ans?.barreras) ? (ans.barreras as string[]).map(b => BARRIER_LABELS[b] ?? b).join('; ') : ans?.barrera ? String(ans.barrera) : ''
        const mins = resp?.completion_time_seconds ? Math.round(resp.completion_time_seconds / 60) : ''
        return [
          r.email, r.nombre ?? '', ans?.puesto ?? '', ans?.departamento ?? '', r.status,
          resp?.profile_name ?? '', resp?.profile_score?.toString() ?? '',
          ans?.frecuencia ?? '', herramientas, ans?.confianza?.toString() ?? '',
          barreras,
          r.sent_at ? new Date(r.sent_at).toLocaleString('es-MX') : '',
          r.completed_at ? new Date(r.completed_at).toLocaleString('es-MX') : '',
          mins.toString(),
          `${baseUrl}/s/${r.token}`,
        ]
      })
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

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '28px 20px' }}>
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
            const profileCounts = PROFILES.reduce((acc, p) => {
              acc[p] = rs.filter(r => r.survey_responses?.[0]?.profile_name === p).length
              return acc
            }, {} as Record<string, number>)

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

                    {/* Profile distribution */}
                    {completed > 0 && (
                      <div style={{ padding: '16px 24px', borderBottom: '1px solid #F3F4F6', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        <p style={{ color: '#9CA3AF', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 8px 0 0', alignSelf: 'center' }}>Perfiles:</p>
                        {PROFILES.map(p => {
                          const count = profileCounts[p]
                          if (!count) return null
                          return (
                            <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ width: 8, height: 8, borderRadius: '50%', background: PROFILE_COLORS[p], display: 'inline-block' }} />
                              <span style={{ color: PROFILE_COLORS[p], fontSize: 12, fontWeight: 700 }}>{count}</span>
                              <span style={{ color: '#6B7280', fontSize: 12 }}>{p}</span>
                            </div>
                          )
                        })}
                      </div>
                    )}

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
                              {['Email', 'Nombre', 'Status', 'Perfil IA', 'Score', 'Completado', ''].map(h => (
                                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: '#9CA3AF', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, whiteSpace: 'nowrap' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {rs.map(r => (
                              <tr key={r.id} style={{ borderBottom: '1px solid #F9FAFB', cursor: 'pointer' }}
                                onClick={() => setSelectedRespondent(r)}
                                onMouseEnter={e => (e.currentTarget.style.background = '#FAFAFA')}
                                onMouseLeave={e => (e.currentTarget.style.background = '')}>
                                <td style={{ padding: '12px 16px', color: '#374151' }}>{r.email}</td>
                                <td style={{ padding: '12px 16px', color: '#374151' }}>{r.nombre ?? '—'}</td>
                                <td style={{ padding: '12px 16px' }}><StatusChip status={r.status} /></td>
                                <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                                  {r.survey_responses?.[0]?.profile_name
                                    ? <span style={{ color: PROFILE_COLORS[r.survey_responses[0].profile_name] ?? P }}>{r.survey_responses[0].profile_name}</span>
                                    : <span style={{ color: '#9CA3AF' }}>—</span>}
                                </td>
                                <td style={{ padding: '12px 16px', color: '#6B7280' }}>{r.survey_responses?.[0]?.profile_score != null ? `${r.survey_responses[0].profile_score}%` : '—'}</td>
                                <td style={{ padding: '12px 16px', color: '#9CA3AF', fontSize: 12 }}>
                                  {r.completed_at ? new Date(r.completed_at).toLocaleDateString('es-MX') : '—'}
                                </td>
                                <td style={{ padding: '12px 16px' }}>
                                  <span style={{ color: P, fontSize: 12, fontWeight: 600 }}>Ver detalle →</span>
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
      {selectedRespondent && (
        <DetailModal
          r={selectedRespondent}
          baseUrl={baseUrl}
          onClose={() => setSelectedRespondent(null)}
        />
      )}
    </main>
  )
}
