'use client'

import { useState, useEffect, useCallback } from 'react'

const P = '#7C3AED'
const PL = '#F5F3FF'
const PB = '#E9D5FF'
const PG = 'linear-gradient(135deg,#7C3AED,#D946EF)'

function buildAuth(pw: string) { return 'Basic ' + btoa(`admin:${pw}`) }

interface PromptVersion {
  id: string
  prompt_key: string
  content: string
  is_active: boolean
  created_at: string
}

interface PromptConfig {
  key: string
  title: string
  badge: string
  guidance: string
  requiredBlocks?: string[]
}

const PROMPT_CONFIGS: PromptConfig[] = [
  {
    key: 'diagnostic_individual',
    title: 'Diagnóstico Individual',
    badge: 'Encuesta · Email al participante',
    guidance: 'Instrucciones estáticas de rol y formato. El bloque de datos del participante se agrega automáticamente en el código.',
    requiredBlocks: ['CASO_RAPIDO:', 'RECOMENDACION:', 'PROXIMO_PASO:'],
  },
  {
    key: 'diagnostic_executive',
    title: 'Diagnóstico Ejecutivo',
    badge: 'Reportes · Panel de interpretación AI',
    guidance: 'Instrucciones estáticas de rol y formato. Los datos estadísticos del cohorte se agregan automáticamente.',
    requiredBlocks: ['Mínimo 100 caracteres de salida'],
  },
  {
    key: 'survey_generator',
    title: 'Generador de Encuestas',
    badge: 'Campañas · Generación con IA',
    guidance: 'Prompt de sistema completo. Debe instruir a Claude a responder ÚNICAMENTE con JSON válido con estructura { version: 1, sections: [] }.',
    requiredBlocks: ['JSON válido con array "sections"'],
  },
  {
    key: 'chat_coach',
    title: 'Coach de Chat',
    badge: 'Curso · Módulo de chat coach',
    guidance: 'Prompt de sistema. Usa {nombre}, {puesto} y {departamento} como placeholders que se sustituirán con los datos reales del participante.',
    requiredBlocks: ['Mínimo 50 caracteres de salida'],
  },
  {
    key: 'diagnostic_mckinsey',
    title: 'Diagnóstico McKinsey',
    badge: 'Curso · Módulo de diagnóstico',
    guidance: 'Prompt de sistema. Usa {nombre}, {puesto}, {departamento}, {aprendizajes}, {tareasResumen}, {horas_proyectadas}, {area_impacto}, {nivel_listo} como placeholders.',
    requiredBlocks: ['PERFIL:', 'OPORTUNIDADES:', 'CIERRE:'],
  },
  {
    key: 'plan_adoption',
    title: 'Plan de Adopción',
    badge: 'Curso · Módulo de plan 90 días',
    guidance: 'Prompt de sistema. Usa {nombre}, {puesto}, {departamento}, {aprendizajes}, {tareasResumen}, {horas_proyectadas}, {area_impacto}, {nivel_listo} como placeholders. Debe retornar JSON array.',
    requiredBlocks: ['JSON array con objetos { titulo, descripcion, metrica }'],
  },
]

interface Campaign {
  id: string
  nombre: string
  empresa: string
}

interface Respondent {
  id: string
  email: string
  nombre?: string
  status: string
}

function VersionHistory({ promptKey, auth, onRestore }: { promptKey: string; auth: string; onRestore: () => void }) {
  const [versions, setVersions] = useState<PromptVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/admin/prompts/versions?key=${promptKey}`, { headers: { Authorization: auth } })
    if (res.ok) {
      const data = await res.json()
      setVersions(data.versions ?? [])
    }
    setLoading(false)
  }, [promptKey, auth])

  useEffect(() => { load() }, [load])

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta versión?')) return
    setActionLoading(id)
    const res = await fetch('/api/admin/prompts/versions', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: auth },
      body: JSON.stringify({ id }),
    })
    if (!res.ok) {
      const data = await res.json()
      alert(data.error ?? 'Error al eliminar')
    }
    setActionLoading(null)
    load()
  }

  const handleRestore = async (id: string) => {
    setActionLoading(id)
    const res = await fetch('/api/admin/prompts/versions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: auth },
      body: JSON.stringify({ id }),
    })
    if (!res.ok) {
      const data = await res.json()
      alert(data.error ?? 'Error al activar')
    } else {
      onRestore()
    }
    setActionLoading(null)
    load()
  }

  if (loading) return <div style={{ color: '#9CA3AF', fontSize: 13, padding: '8px 0' }}>Cargando historial...</div>
  if (!versions.length) return <div style={{ color: '#9CA3AF', fontSize: 13, padding: '8px 0' }}>Sin versiones guardadas aún.</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {versions.map(v => (
        <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: v.is_active ? PL : '#F9FAFB', border: `1px solid ${v.is_active ? PB : '#E5E7EB'}`, borderRadius: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              {v.is_active && <span style={{ background: '#22C55E', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 8px', borderRadius: 10 }}>● Activa</span>}
              <span style={{ color: '#6B7280', fontSize: 12 }}>
                {new Date(v.created_at).toLocaleString('es-MX', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div style={{ color: '#374151', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
              {v.content.slice(0, 80)}…
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            {!v.is_active && (
              <>
                <button
                  onClick={() => handleRestore(v.id)}
                  disabled={actionLoading === v.id}
                  style={{ padding: '5px 12px', borderRadius: 8, border: `1px solid ${PB}`, background: '#fff', color: P, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                >
                  {actionLoading === v.id ? '...' : 'Restaurar'}
                </button>
                <button
                  onClick={() => handleDelete(v.id)}
                  disabled={actionLoading === v.id}
                  style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid #FECACA', background: '#FFF5F5', color: '#EF4444', fontSize: 12, cursor: 'pointer' }}
                >
                  ✕
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function PromptCard({ config, auth, activeContent }: { config: PromptConfig; auth: string; activeContent: string }) {
  const [content, setContent] = useState(activeContent)
  const [showGuidance, setShowGuidance] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showTest, setShowTest] = useState(false)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [selectedCampaign, setSelectedCampaign] = useState('')
  const [respondents, setRespondents] = useState<Respondent[]>([])
  const [selectedRespondent, setSelectedRespondent] = useState('')
  const [testOutput, setTestOutput] = useState('')
  const [testValid, setTestValid] = useState<boolean | null>(null)
  const [testValidMsg, setTestValidMsg] = useState('')
  const [testLoading, setTestLoading] = useState(false)
  const [testedOk, setTestedOk] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [historyKey, setHistoryKey] = useState(0)

  useEffect(() => { setContent(activeContent) }, [activeContent])

  const loadCampaigns = useCallback(async () => {
    const res = await fetch('/api/survey/campaigns', { headers: { Authorization: auth } })
    if (res.ok) {
      const data = await res.json()
      setCampaigns(data.campaigns ?? [])
    }
  }, [auth])

  const loadRespondents = useCallback(async (cid: string) => {
    if (!cid) return
    const res = await fetch(`/api/survey/respondents?campaign_id=${cid}`, { headers: { Authorization: auth } })
    if (res.ok) {
      const data = await res.json()
      setRespondents((data.respondents ?? []).filter((r: Respondent) => r.status === 'completed'))
    }
  }, [auth])

  const handleTest = async () => {
    setTestLoading(true)
    setTestOutput('')
    setTestValid(null)
    const res = await fetch('/api/admin/prompts/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: auth },
      body: JSON.stringify({ key: config.key, content, respondentId: selectedRespondent || undefined }),
    })
    const data = await res.json()
    if (res.ok) {
      setTestOutput(data.output)
      setTestValid(data.valid)
      setTestValidMsg(data.validationMessage)
      if (data.valid) setTestedOk(true)
    } else {
      setTestOutput(data.error ?? 'Error desconocido')
      setTestValid(false)
      setTestValidMsg('Error al ejecutar la prueba.')
    }
    setTestLoading(false)
  }

  const handleSave = async (skipTest = false) => {
    if (!skipTest && !testedOk) {
      if (!confirm('No has probado el prompt o la prueba falló. ¿Guardar de todas formas?')) return
    }
    setSaving(true)
    const res = await fetch('/api/admin/prompts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: auth },
      body: JSON.stringify({ key: config.key, content }),
    })
    setSaving(false)
    if (res.ok) {
      setSaved(true)
      setTestedOk(false)
      setHistoryKey(k => k + 1)
      setTimeout(() => setSaved(false), 3000)
    } else {
      const data = await res.json()
      alert(data.error ?? 'Error al guardar')
    }
  }

  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
      {/* Card header */}
      <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid #F3F4F6' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <h3 style={{ color: '#111827', fontSize: 16, fontWeight: 800, margin: 0 }}>{config.title}</h3>
          <span style={{ background: PL, color: P, border: `1px solid ${PB}`, fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 20 }}>{config.badge}</span>
        </div>
        {config.requiredBlocks && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {config.requiredBlocks.map(b => (
              <span key={b} style={{ background: '#F3F4F6', color: '#6B7280', fontSize: 11, padding: '2px 8px', borderRadius: 6, fontFamily: 'monospace' }}>{b}</span>
            ))}
          </div>
        )}
      </div>

      {/* Guidance */}
      <div style={{ padding: '10px 24px', borderBottom: '1px solid #F9FAFB' }}>
        <button onClick={() => setShowGuidance(g => !g)} style={{ background: 'none', border: 'none', color: P, fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0 }}>
          {showGuidance ? '▼' : '▶'} ¿Qué debe contener?
        </button>
        {showGuidance && (
          <p style={{ color: '#6B7280', fontSize: 13, margin: '8px 0 0', lineHeight: 1.6 }}>{config.guidance}</p>
        )}
      </div>

      {/* Textarea */}
      <div style={{ padding: '16px 24px' }}>
        <textarea
          value={content}
          onChange={e => { setContent(e.target.value); setTestedOk(false) }}
          rows={14}
          style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', border: '1.5px solid #E5E7EB', borderRadius: 10, fontFamily: 'monospace', fontSize: 12, lineHeight: 1.7, resize: 'vertical', color: '#111827', outline: 'none' }}
          placeholder="Prompt de sistema..."
        />
      </div>

      {/* Test panel */}
      <div style={{ padding: '0 24px 16px' }}>
        <button
          onClick={() => { setShowTest(t => !t); if (!campaigns.length) loadCampaigns() }}
          style={{ padding: '8px 16px', borderRadius: 10, border: `1.5px solid ${PB}`, background: PL, color: P, fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: showTest ? 12 : 0 }}
        >
          {showTest ? '▼' : '▶'} Probar antes de guardar
        </button>

        {showTest && (
          <div style={{ background: '#F9FAFB', borderRadius: 12, border: '1px solid #E5E7EB', padding: 16 }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
              <select
                value={selectedCampaign}
                onChange={e => { setSelectedCampaign(e.target.value); setSelectedRespondent(''); loadRespondents(e.target.value) }}
                style={{ flex: 1, minWidth: 160, padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, color: '#374151' }}
              >
                <option value="">— Campaña (opcional) —</option>
                {campaigns.map(c => <option key={c.id} value={c.id}>{c.nombre} · {c.empresa}</option>)}
              </select>
              {respondents.length > 0 && (
                <select
                  value={selectedRespondent}
                  onChange={e => setSelectedRespondent(e.target.value)}
                  style={{ flex: 1, minWidth: 160, padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, color: '#374151' }}
                >
                  <option value="">— Participante (opcional) —</option>
                  {respondents.map(r => <option key={r.id} value={r.id}>{r.nombre ?? r.email}</option>)}
                </select>
              )}
              <button
                onClick={handleTest}
                disabled={testLoading}
                style={{ padding: '8px 20px', borderRadius: 10, border: 'none', background: PG, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: testLoading ? 0.7 : 1 }}
              >
                {testLoading ? 'Probando...' : 'Ejecutar prueba →'}
              </button>
            </div>

            {testOutput && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 18 }}>{testValid ? '✅' : '❌'}</span>
                  <span style={{ fontSize: 13, color: testValid ? '#16A34A' : '#DC2626', fontWeight: 600 }}>{testValidMsg}</span>
                </div>
                <pre style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: 12, fontSize: 12, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 300, overflowY: 'auto', margin: 0, color: '#374151' }}>
                  {testOutput}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Save button */}
      <div style={{ padding: '0 24px 20px', display: 'flex', gap: 10, alignItems: 'center' }}>
        <button
          onClick={() => handleSave()}
          disabled={saving}
          style={{ padding: '10px 24px', borderRadius: 12, border: 'none', background: testedOk ? PG : '#6B7280', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}
        >
          {saving ? 'Guardando...' : saved ? '✓ Guardado' : '💾 Guardar y activar'}
        </button>
        {saved && <span style={{ color: '#16A34A', fontSize: 13, fontWeight: 600 }}>Versión activa actualizada</span>}
        {!testedOk && <span style={{ color: '#9CA3AF', fontSize: 12 }}>Prueba el prompt para habilitar el guardado directo</span>}
      </div>

      {/* Version history */}
      <div style={{ borderTop: '1px solid #F3F4F6', padding: '12px 24px 20px' }}>
        <button onClick={() => setShowHistory(h => !h)} style={{ background: 'none', border: 'none', color: '#6B7280', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0, marginBottom: showHistory ? 12 : 0 }}>
          {showHistory ? '▼' : '▶'} Historial de versiones
        </button>
        {showHistory && (
          <VersionHistory
            key={historyKey}
            promptKey={config.key}
            auth={auth}
            onRestore={() => { setHistoryKey(k => k + 1) }}
          />
        )}
      </div>
    </div>
  )
}

export default function ConfigAdmin() {
  const [password, setPassword] = useState('')
  const [auth, setAuth] = useState('')
  const [authed, setAuthed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [authError, setAuthError] = useState('')
  const [activePrompts, setActivePrompts] = useState<Record<string, string>>({})
  const [promptsLoading, setPromptsLoading] = useState(false)

  const loadPrompts = useCallback(async (a: string) => {
    setPromptsLoading(true)
    const res = await fetch('/api/admin/prompts', { headers: { Authorization: a } })
    if (res.ok) {
      const data = await res.json()
      const map: Record<string, string> = {}
      for (const p of data.prompts ?? []) {
        map[p.key] = p.content
      }
      setActivePrompts(map)
    }
    setPromptsLoading(false)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setAuthError('')
    const a = buildAuth(password)
    const res = await fetch('/api/admin/prompts', { headers: { Authorization: a } })
    setLoading(false)
    if (res.status === 401) {
      setAuthError('Contraseña incorrecta')
    } else {
      setAuth(a)
      setAuthed(true)
      const data = await res.json()
      const map: Record<string, string> = {}
      for (const p of data.prompts ?? []) {
        map[p.key] = p.content
      }
      setActivePrompts(map)
    }
  }

  if (!authed) return (
    <main style={{ minHeight: '100vh', background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 40, maxWidth: 380, width: '90%', boxShadow: '0 8px 40px rgba(124,58,237,0.12)', border: `1px solid ${PB}` }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <p style={{ color: P, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 8px' }}>Configuración de Prompts</p>
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
          <a href="/admin/surveys" style={{ color: '#9CA3AF', fontSize: 12, textDecoration: 'none' }}>← Volver a Encuestas</a>
        </div>
      </div>
    </main>
  )

  return (
    <main style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #F3F4F6', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ color: P, fontSize: 15, fontWeight: 800 }}>⚙ Configuración de Prompts</span>
        </div>
        <a href="/admin/surveys" style={{ padding: '8px 16px', borderRadius: 10, border: '1.5px solid #E5E7EB', background: '#fff', color: '#6B7280', fontSize: 13, textDecoration: 'none' }}>
          ← Encuestas
        </a>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px' }}>
        <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
          Administra los prompts de IA activos en la plataforma. Los cambios se aplican de inmediato. El código mantiene defaults de fallback si la DB está vacía.
        </p>

        {promptsLoading ? (
          <div style={{ textAlign: 'center', color: '#9CA3AF', padding: 40 }}>Cargando prompts...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {PROMPT_CONFIGS.map(config => (
              <PromptCard
                key={config.key}
                config={config}
                auth={auth}
                activeContent={activePrompts[config.key] ?? ''}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
