'use client'

import { useState } from 'react'
import Image from 'next/image'

interface Campaign { nombre: string; empresa: string; tipo: string; descripcion?: string }
interface Props { respondentId: string; email: string; nombre: string; campaign: Campaign }

const P = '#7C3AED'
const PG = 'linear-gradient(135deg,#7C3AED,#D946EF)'
const PL = '#F5F3FF'
const PB = '#E9D5FF'

const ROLES = [
  { v: 'director', l: 'Director / Directora' },
  { v: 'gerente', l: 'Gerente' },
  { v: 'coordinador', l: 'Coordinador / Coordinadora' },
  { v: 'especialista', l: 'Especialista / Analista' },
  { v: 'otro', l: 'Otro' },
]
const FRECUENCIAS = [
  { v: 'nunca', l: 'Nunca la he usado', pts: 0 },
  { v: 'una_dos', l: 'La he probado una o dos veces', pts: 1 },
  { v: 'mensual', l: 'Algunas veces al mes', pts: 2 },
  { v: 'semanal', l: 'Varias veces por semana', pts: 3 },
  { v: 'diario', l: 'La uso diariamente', pts: 4 },
  { v: 'flujo', l: 'Es parte integral de mi flujo de trabajo', pts: 5 },
]
const HERRAMIENTAS = [
  'ChatGPT', 'Claude', 'Microsoft Copilot', 'Gemini', 'Perplexity', 'NotebookLM', 'Gamma', 'Make.com', 'Otra', 'Ninguna',
]
const BARRERAS = [
  { v: 'no_se_como', l: 'No sé cómo empezar o qué pedirle' },
  { v: 'no_confio', l: 'No confío en los resultados que da' },
  { v: 'falta_tiempo', l: 'Falta de tiempo para experimentar' },
  { v: 'confidencialidad', l: 'Preocupaciones de seguridad o confidencialidad' },
  { v: 'no_acceso', l: 'No tengo acceso o licencia' },
  { v: 'no_caso_uso', l: 'No identifico casos de uso relevantes para mi trabajo' },
  { v: 'ninguna', l: 'No tengo barreras — ya la uso bien' },
]

export default function SurveyForm({ respondentId, email, nombre: initialNombre, campaign }: Props) {
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const [nombre, setNombre] = useState(initialNombre)
  const [puesto, setPuesto] = useState('')
  const [departamento, setDepartamento] = useState('')
  const [role, setRole] = useState('')
  const [frecuencia, setFrecuencia] = useState('')
  const [herramientas, setHerramientas] = useState<string[]>([])
  const [barrera, setBarrera] = useState('')
  const [tareaFrecuente, setTareaFrecuente] = useState('')
  const [expectativa, setExpectativa] = useState('')
  const [confianza, setConfianza] = useState(0)

  const toggleHerramienta = (h: string) => {
    if (h === 'Ninguna') { setHerramientas(['Ninguna']); return }
    setHerramientas(prev => {
      const without = prev.filter(x => x !== 'Ninguna')
      return without.includes(h) ? without.filter(x => x !== h) : [...without, h]
    })
  }

  const canNext = [
    nombre.trim().length >= 2 && puesto.trim().length >= 2 && departamento.trim().length >= 2 && role !== '',
    frecuencia !== '' && herramientas.length > 0 && confianza > 0,
    barrera !== '',
    tareaFrecuente.trim().length >= 30,
    expectativa.trim().length >= 20,
  ][step] ?? false

  const submit = async () => {
    setLoading(true); setError('')
    try {
      const frecPts = FRECUENCIAS.find(f => f.v === frecuencia)?.pts ?? 0
      const adoptionScore = Math.round((frecPts / 5) * 50 + (confianza / 5) * 50)
      const profile = adoptionScore >= 75 ? 'AI Catalyst Leader'
        : adoptionScore >= 50 ? 'AI Strategist'
        : adoptionScore >= 25 ? 'AI Practitioner'
        : 'AI Explorer'

      const res = await fetch('/api/survey/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          respondentId, nombre, puesto, departamento, role,
          answers: { frecuencia, herramientas, barrera, tareaFrecuente, expectativa, confianza },
          scores: { adoptionScore },
          profileName: profile,
          profileScore: adoptionScore,
        }),
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Error') }
      setDone(true)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al enviar')
    } finally { setLoading(false) }
  }

  if (done) return (
    <main style={{ minHeight: '100vh', background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      <div style={{ maxWidth: 440, width: '100%', textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: PL, border: `2px solid ${P}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={P}><path d="M20 6L9 17L4 12" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <h1 style={{ color: '#111827', fontSize: 24, fontWeight: 800, margin: '0 0 12px' }}>¡Listo, {nombre.split(' ')[0]}!</h1>
        <p style={{ color: '#6B7280', fontSize: 14, lineHeight: 1.8, margin: '0 0 8px' }}>
          Tu diagnóstico fue registrado. Revisa tu correo en <strong style={{ color: P }}>{email}</strong> — te enviamos tu perfil de adopción de IA con recomendaciones personalizadas.
        </p>
        <p style={{ color: '#C4B5FD', fontSize: 12, marginTop: 32, fontStyle: 'italic' }}>"Tú eres el piloto. La IA es tu copiloto." — Human.AiX</p>
      </div>
    </main>
  )

  const TOTAL = 5
  const pct = Math.round((step / TOTAL) * 100)

  return (
    <main style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      {/* Progress */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#fff', borderBottom: '1px solid #F3F4F6' }}>
        <div style={{ height: 4, background: '#F3F4F6' }}>
          <div style={{ height: '100%', background: PG, width: `${pct}%`, transition: 'width 0.4s' }} />
        </div>
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Image src="https://www.humanaix.mx/assets/logos/LogoHaix.png" alt="Human.AiX" width={100} height={26} style={{ objectFit: 'contain' }} unoptimized />
          <span style={{ color: '#9CA3AF', fontSize: 12 }}>Paso {step + 1} de {TOTAL}</span>
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '32px 20px 120px' }}>
        {/* Step 0 — Perfil */}
        {step === 0 && (
          <div>
            <p style={{ color: P, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 8px' }}>01 · Tu perfil</p>
            <h2 style={{ color: '#111827', fontSize: 22, fontWeight: 800, margin: '0 0 24px' }}>
              {campaign.empresa} — {campaign.nombre}
            </h2>
            {[
              { label: 'Nombre completo', val: nombre, set: setNombre, ph: 'Tu nombre' },
              { label: 'Puesto / cargo', val: puesto, set: setPuesto, ph: 'Ej. Gerente de Operaciones' },
              { label: 'Departamento o área', val: departamento, set: setDepartamento, ph: 'Ej. Recursos Humanos' },
            ].map(({ label, val, set, ph }) => (
              <div key={label} style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', color: '#374151', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{label}</label>
                <input value={val} onChange={e => set(e.target.value)} placeholder={ph}
                  style={{ width: '100%', padding: '12px 14px', border: `1.5px solid ${val.length > 1 ? PB : '#E5E7EB'}`, borderRadius: 10, fontSize: 14, color: '#111827', outline: 'none', boxSizing: 'border-box', background: val.length > 1 ? PL : '#fff' }} />
              </div>
            ))}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', color: '#374151', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Función actual</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {ROLES.map(r => (
                  <button key={r.v} onClick={() => setRole(r.v)}
                    style={{ textAlign: 'left', padding: '12px 16px', borderRadius: 10, border: `1.5px solid ${role === r.v ? P : '#E5E7EB'}`, background: role === r.v ? PL : '#fff', color: role === r.v ? P : '#374151', fontWeight: role === r.v ? 700 : 400, fontSize: 14, cursor: 'pointer' }}>
                    {role === r.v ? '✓ ' : ''}{r.l}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 1 — Uso de IA */}
        {step === 1 && (
          <div>
            <p style={{ color: P, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 8px' }}>02 · Uso actual de IA</p>
            <h2 style={{ color: '#111827', fontSize: 22, fontWeight: 800, margin: '0 0 24px' }}>¿Cómo usas la IA hoy?</h2>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', color: '#374151', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>¿Con qué frecuencia usas herramientas de IA en tu trabajo?</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {FRECUENCIAS.map(f => (
                  <button key={f.v} onClick={() => setFrecuencia(f.v)}
                    style={{ textAlign: 'left', padding: '12px 16px', borderRadius: 10, border: `1.5px solid ${frecuencia === f.v ? P : '#E5E7EB'}`, background: frecuencia === f.v ? PL : '#fff', color: frecuencia === f.v ? P : '#374151', fontWeight: frecuencia === f.v ? 700 : 400, fontSize: 14, cursor: 'pointer' }}>
                    {frecuencia === f.v ? '✓ ' : ''}{f.l}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', color: '#374151', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>¿Qué herramientas has usado? (selecciona todas las que apliquen)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {HERRAMIENTAS.map(h => {
                  const sel = herramientas.includes(h)
                  return (
                    <button key={h} onClick={() => toggleHerramienta(h)}
                      style={{ padding: '8px 16px', borderRadius: 20, border: `1.5px solid ${sel ? P : '#E5E7EB'}`, background: sel ? PL : '#fff', color: sel ? P : '#6B7280', fontWeight: sel ? 700 : 400, fontSize: 13, cursor: 'pointer' }}>
                      {sel ? '✓ ' : ''}{h}
                    </button>
                  )
                })}
              </div>
            </div>
            <div>
              <label style={{ display: 'block', color: '#374151', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                ¿Qué tan seguro/a te sientes usando IA para tareas de tu trabajo? (1 = nada seguro, 5 = muy seguro)
              </label>
              <div style={{ display: 'flex', gap: 10 }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => setConfianza(n)}
                    style={{ flex: 1, aspectRatio: '1', borderRadius: 12, border: `2px solid ${confianza === n ? 'transparent' : '#E5E7EB'}`, background: confianza === n ? PG : confianza >= n ? PL : '#F9FAFB', color: confianza === n ? '#fff' : confianza >= n ? P : '#9CA3AF', fontWeight: 700, fontSize: 18, cursor: 'pointer' }}>
                    {n}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                <span style={{ color: '#9CA3AF', fontSize: 11 }}>Nada seguro</span>
                <span style={{ color: '#9CA3AF', fontSize: 11 }}>Muy seguro</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 2 — Barrera */}
        {step === 2 && (
          <div>
            <p style={{ color: P, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 8px' }}>03 · Tu principal barrera</p>
            <h2 style={{ color: '#111827', fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>¿Qué te frena hoy?</h2>
            <p style={{ color: '#9CA3AF', fontSize: 14, margin: '0 0 24px' }}>Selecciona la barrera más importante para ti en este momento.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {BARRERAS.map(b => (
                <button key={b.v} onClick={() => setBarrera(b.v)}
                  style={{ textAlign: 'left', padding: '14px 16px', borderRadius: 10, border: `1.5px solid ${barrera === b.v ? P : '#E5E7EB'}`, background: barrera === b.v ? PL : '#fff', color: barrera === b.v ? P : '#374151', fontWeight: barrera === b.v ? 700 : 400, fontSize: 14, cursor: 'pointer' }}>
                  {barrera === b.v ? '✓ ' : ''}{b.l}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3 — Tarea frecuente */}
        {step === 3 && (
          <div>
            <p style={{ color: P, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 8px' }}>04 · Tu trabajo real</p>
            <h2 style={{ color: '#111827', fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>Cuéntanos sobre tu día a día</h2>
            <p style={{ color: '#9CA3AF', fontSize: 14, margin: '0 0 20px' }}>Describe una tarea que realizas frecuentemente y que consume tiempo o esfuerzo. No incluyas datos confidenciales.</p>
            <textarea value={tareaFrecuente} onChange={e => setTareaFrecuente(e.target.value)}
              placeholder="Ejemplo: Cada semana elaboro reportes de seguimiento para 3 clientes, lo que me toma 2-3 horas porque debo consolidar datos de varios sistemas y redactar el análisis..."
              rows={5} maxLength={1000}
              style={{ width: '100%', padding: '14px', border: `1.5px solid ${tareaFrecuente.length >= 30 ? PB : '#E5E7EB'}`, borderRadius: 12, fontSize: 14, color: '#374151', resize: 'vertical', outline: 'none', boxSizing: 'border-box', background: tareaFrecuente.length >= 30 ? PL : '#fff', lineHeight: 1.6 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ color: tareaFrecuente.length >= 30 ? P : '#9CA3AF', fontSize: 12 }}>
                {tareaFrecuente.length < 30 ? `Mínimo ${30 - tareaFrecuente.length} caracteres más` : '✓ Suficiente detalle'}
              </span>
              <span style={{ color: '#9CA3AF', fontSize: 12 }}>{tareaFrecuente.length}/1000</span>
            </div>
          </div>
        )}

        {/* Step 4 — Expectativa */}
        {step === 4 && (
          <div>
            <p style={{ color: P, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 8px' }}>05 · Tu expectativa</p>
            <h2 style={{ color: '#111827', fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>¿Qué esperas del curso?</h2>
            <p style={{ color: '#9CA3AF', fontSize: 14, margin: '0 0 20px' }}>¿Qué tendría que pasar en el curso para que consideres que realmente valió la pena?</p>
            <textarea value={expectativa} onChange={e => setExpectativa(e.target.value)}
              placeholder="Ejemplo: Me gustaría salir con al menos 2 herramientas que pueda usar desde el lunes en mis reportes semanales..."
              rows={4} maxLength={750}
              style={{ width: '100%', padding: '14px', border: `1.5px solid ${expectativa.length >= 20 ? PB : '#E5E7EB'}`, borderRadius: 12, fontSize: 14, color: '#374151', resize: 'vertical', outline: 'none', boxSizing: 'border-box', background: expectativa.length >= 20 ? PL : '#fff', lineHeight: 1.6 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ color: expectativa.length >= 20 ? P : '#9CA3AF', fontSize: 12 }}>
                {expectativa.length < 20 ? `Mínimo ${20 - expectativa.length} caracteres más` : '✓'}
              </span>
              <span style={{ color: '#9CA3AF', fontSize: 12 }}>{expectativa.length}/750</span>
            </div>
            {error && <p style={{ color: '#EF4444', fontSize: 13, marginTop: 12 }}>{error}</p>}
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #F3F4F6', padding: '16px 20px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', gap: 12 }}>
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
              style={{ flex: 1, padding: '14px', borderRadius: 12, border: '1.5px solid #E5E7EB', background: '#fff', color: '#6B7280', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              ← Anterior
            </button>
          )}
          {step < TOTAL - 1 ? (
            <button onClick={() => setStep(s => s + 1)} disabled={!canNext}
              style={{ flex: 2, padding: '14px', borderRadius: 12, border: 'none', background: canNext ? PG : '#E5E7EB', color: canNext ? '#fff' : '#9CA3AF', fontSize: 14, fontWeight: 700, cursor: canNext ? 'pointer' : 'not-allowed' }}>
              Continuar →
            </button>
          ) : (
            <button onClick={submit} disabled={!canNext || loading}
              style={{ flex: 2, padding: '14px', borderRadius: 12, border: 'none', background: canNext && !loading ? PG : '#E5E7EB', color: canNext && !loading ? '#fff' : '#9CA3AF', fontSize: 14, fontWeight: 700, cursor: canNext && !loading ? 'pointer' : 'not-allowed' }}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                  Enviando...
                </span>
              ) : 'Enviar diagnóstico ✓'}
            </button>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </main>
  )
}
