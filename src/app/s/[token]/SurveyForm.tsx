'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Question, Answers, ROLE_LABELS } from '@/lib/survey-config'
import { resolveSurveyConfig, isCustomConfig } from '@/lib/survey-config-json'

interface Campaign { nombre: string; empresa: string; tipo: string; descripcion?: string }
interface Props { respondentId: string; email: string; nombre: string; campaign: Campaign; surveyConfig?: unknown }

const P = '#7C3AED'
const PG = 'linear-gradient(135deg,#7C3AED,#D946EF)'
const PL = '#F5F3FF'
const PB = '#E9D5FF'

const LS_KEY = (id: string) => `survey_draft_${id}`

// ── Helpers ──────────────────────────────────────────────────────────────────

function visibleQs(section: { id: string; title: string; subtitle?: string; questions: Question[] }, answers: Answers) {
  return section.questions.filter(q => !q.showIf || q.showIf(answers))
}

function isSectionValid(section: { id: string; title: string; subtitle?: string; questions: Question[] }, answers: Answers): boolean {
  return visibleQs(section, answers).every(q => {
    if (!q.required) return true
    const val = answers[q.column]
    if (q.type === 'short_text' || q.type === 'email' || q.type === 'long_text') {
      const s = (val as string | undefined) ?? ''
      if (q.minLength) return s.trim().length >= q.minLength
      return s.trim().length > 0
    }
    if (q.type === 'single_select') return typeof val === 'string' && val !== ''
    if (q.type === 'multi_select') return Array.isArray(val) && (val as string[]).length > 0
    if (q.type === 'scale') return typeof val === 'number' && val > 0
    return false
  })
}

// ── Question renderers ────────────────────────────────────────────────────────

function ShortText({ q, val, set }: { q: Question; val: string; set: (v: string) => void }) {
  const ok = q.minLength ? val.trim().length >= q.minLength : val.trim().length > 0
  return (
    <div style={{ marginBottom: 8 }}>
      <input value={val} onChange={e => set(e.target.value)}
        placeholder={q.helpText ?? ''}
        style={{ width: '100%', padding: '12px 14px', border: `1.5px solid ${ok ? PB : '#E5E7EB'}`, borderRadius: 10, fontSize: 14, color: '#111827', outline: 'none', boxSizing: 'border-box', background: ok ? PL : '#fff' }} />
      {q.minLength && val.length > 0 && !ok && (
        <p style={{ color: '#9CA3AF', fontSize: 12, marginTop: 4 }}>Mínimo {q.minLength - val.trim().length} caracteres más</p>
      )}
    </div>
  )
}

function EmailField({ q, val, set }: { q: Question; val: string; set: (v: string) => void }) {
  const ok = /\S+@\S+\.\S+/.test(val)
  return (
    <div style={{ marginBottom: 8 }}>
      <input type="email" value={val} onChange={e => set(e.target.value)}
        placeholder="correo@empresa.com"
        style={{ width: '100%', padding: '12px 14px', border: `1.5px solid ${ok ? PB : '#E5E7EB'}`, borderRadius: 10, fontSize: 14, color: '#111827', outline: 'none', boxSizing: 'border-box', background: ok ? PL : '#fff' }} />
    </div>
  )
}

function LongText({ q, val, set }: { q: Question; val: string; set: (v: string) => void }) {
  const ok = q.minLength ? val.trim().length >= q.minLength : val.trim().length > 0
  return (
    <div style={{ marginBottom: 8 }}>
      {q.helpText && <p style={{ color: '#9CA3AF', fontSize: 12, margin: '0 0 8px' }}>{q.helpText}</p>}
      <textarea value={val} onChange={e => set(e.target.value)} rows={5} maxLength={q.maxLength ?? 2000}
        style={{ width: '100%', padding: '14px', border: `1.5px solid ${ok ? PB : '#E5E7EB'}`, borderRadius: 12, fontSize: 14, color: '#374151', resize: 'vertical', outline: 'none', boxSizing: 'border-box', background: ok ? PL : '#fff', lineHeight: 1.6 }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <span style={{ color: ok ? P : '#9CA3AF', fontSize: 12 }}>
          {!ok && q.minLength ? `Mínimo ${q.minLength - val.trim().length} caracteres más` : ok ? '✓ Suficiente detalle' : ''}
        </span>
        {q.maxLength && <span style={{ color: '#9CA3AF', fontSize: 12 }}>{val.length}/{q.maxLength}</span>}
      </div>
    </div>
  )
}

function SingleSelect({ q, val, set }: { q: Question; val: string; set: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {(q.options ?? []).map(opt => {
        const sel = val === opt.value
        return (
          <button key={opt.value} onClick={() => set(opt.value)}
            style={{ textAlign: 'left', padding: '13px 16px', borderRadius: 10, border: `2px solid ${sel ? P : '#E5E7EB'}`, background: sel ? PL : '#fff', color: sel ? P : '#374151', fontWeight: sel ? 700 : 400, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${sel ? P : '#D1D5DB'}`, background: sel ? P : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {sel && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', display: 'block' }} />}
            </span>
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

function MultiSelect({ q, val, set }: { q: Question; val: string[]; set: (v: string[]) => void }) {
  const toggle = (v: string) => {
    const opt = q.options?.find(o => o.value === v)
    if (opt?.isNone) { set([v]); return }
    const noneVals = (q.options ?? []).filter(o => o.isNone).map(o => o.value)
    const without = val.filter(x => !noneVals.includes(x))
    set(without.includes(v) ? without.filter(x => x !== v) : [...without, v])
  }
  return (
    <div>
      {q.helpText && <p style={{ color: '#9CA3AF', fontSize: 12, margin: '0 0 8px' }}>{q.helpText}</p>}
      <p style={{ color: '#9CA3AF', fontSize: 12, margin: '0 0 10px' }}>Puedes seleccionar varias opciones</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {(q.options ?? []).map(opt => {
          const sel = val.includes(opt.value)
          return (
            <button key={opt.value} onClick={() => toggle(opt.value)}
              style={{ textAlign: 'left', padding: '12px 16px', borderRadius: 10, border: `2px solid ${sel ? P : '#E5E7EB'}`, background: sel ? PL : '#fff', color: sel ? P : '#374151', fontWeight: sel ? 700 : 400, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${sel ? P : '#D1D5DB'}`, background: sel ? P : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12, color: '#fff', fontWeight: 800 }}>
                {sel ? '✓' : ''}
              </span>
              {opt.label}
            </button>
          )
        })}
      </div>
      {val.length > 0 && (
        <p style={{ color: P, fontSize: 12, marginTop: 8, fontWeight: 600 }}>✓ {val.length} seleccionada{val.length !== 1 ? 's' : ''}</p>
      )}
    </div>
  )
}

function Scale({ q, val, set }: { q: Question; val: number; set: (v: number) => void }) {
  const min = q.min ?? 1
  const max = q.max ?? 5
  const nums = Array.from({ length: max - min + 1 }, (_, i) => i + min)
  return (
    <div>
      {q.scaleLabels && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          {q.scaleLabels[min] && <span style={{ color: '#9CA3AF', fontSize: 11 }}>{q.scaleLabels[min]}</span>}
          {q.scaleLabels[max] && <span style={{ color: '#9CA3AF', fontSize: 11 }}>{q.scaleLabels[max]}</span>}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        {nums.map(n => {
          const sel = val === n
          return (
            <button key={n} onClick={() => set(n)}
              style={{ flex: 1, padding: '14px 0', borderRadius: 12, border: `2px solid ${sel ? 'transparent' : '#E5E7EB'}`, background: sel ? PG : '#F9FAFB', color: sel ? '#fff' : '#9CA3AF', fontWeight: 700, fontSize: 18, cursor: 'pointer', transition: 'all 0.15s' }}>
              {n}
            </button>
          )
        })}
      </div>
      {q.scaleLabels && val > 0 && (
        <p style={{ color: P, fontSize: 12, marginTop: 8, fontWeight: 600 }}>✓ {q.scaleLabels[val] ?? `Nivel ${val}`}</p>
      )}
    </div>
  )
}

function QuestionBlock({ q, answers, onChange }: { q: Question; answers: Answers; onChange: (col: string, v: unknown) => void }) {
  const val = answers[q.column]
  return (
    <div style={{ marginBottom: 28 }}>
      <label style={{ display: 'block', color: '#374151', fontSize: 14, fontWeight: 700, marginBottom: 10, lineHeight: 1.5 }}>{q.label}</label>
      {q.type === 'short_text' && (
        <ShortText q={q} val={(val as string) ?? ''} set={v => onChange(q.column, v)} />
      )}
      {q.type === 'email' && (
        <EmailField q={q} val={(val as string) ?? ''} set={v => onChange(q.column, v)} />
      )}
      {q.type === 'long_text' && (
        <LongText q={q} val={(val as string) ?? ''} set={v => onChange(q.column, v)} />
      )}
      {q.type === 'single_select' && (
        <SingleSelect q={q} val={(val as string) ?? ''} set={v => onChange(q.column, v)} />
      )}
      {q.type === 'multi_select' && (
        <MultiSelect q={q} val={(val as string[]) ?? []} set={v => onChange(q.column, v)} />
      )}
      {q.type === 'scale' && (
        <Scale q={q} val={(val as number) ?? 0} set={v => onChange(q.column, v)} />
      )}
      {q.conditionalOther && (val as string[] | undefined)?.includes('other') && (
        <div style={{ marginTop: 12 }}>
          <input value={(answers[q.conditionalOther] as string) ?? ''} onChange={e => onChange(q.conditionalOther!, e.target.value)}
            placeholder="Especifica cuál..."
            style={{ width: '100%', padding: '10px 14px', border: `1.5px solid ${PB}`, borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box', background: PL }} />
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SurveyForm({ respondentId, email, nombre: initialNombre, campaign, surveyConfig }: Props) {
  const sections = resolveSurveyConfig(surveyConfig)
  const isCustom = isCustomConfig(surveyConfig)
  // -1 = welcome, 0..N-1 = sections, N = done
  const [sectionIdx, setSectionIdx] = useState(-1)
  const [answers, setAnswers] = useState<Answers>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(LS_KEY(respondentId))
        if (saved) return JSON.parse(saved)
      } catch { /* ignore */ }
    }
    return { participant_name: initialNombre, participant_email: email }
  })
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const topRef = useRef<HTMLDivElement>(null)

  // Save draft to localStorage whenever answers change
  useEffect(() => {
    try { localStorage.setItem(LS_KEY(respondentId), JSON.stringify(answers)) } catch { /* ignore */ }
  }, [answers, respondentId])

  const setAnswer = (col: string, val: unknown) => setAnswers(prev => ({ ...prev, [col]: val }))

  const TOTAL = sections.length
  const currentSection = sectionIdx >= 0 && sectionIdx < TOTAL ? sections[sectionIdx] : null
  const canNext = currentSection ? isSectionValid(currentSection, answers) : true
  const pct = sectionIdx < 0 ? 0 : Math.round(((sectionIdx) / TOTAL) * 100)

  const goNext = () => {
    setSectionIdx(s => s + 1)
    topRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  const goPrev = () => {
    setSectionIdx(s => s - 1)
    topRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const submit = async () => {
    setLoading(true); setError('')
    try {
      const { calculateScores } = await import('@/lib/survey-scoring')
      const result = calculateScores(answers)

      const res = await fetch('/api/survey/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          respondentId,
          answers,
          scores: result.dimensions,
          profileName: result.profileName,
          profileScore: result.profileScore,
          courseLevel: result.courseLevel,
          possibleAiChampion: result.possibleAiChampion,
        }),
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Error') }
      try { localStorage.removeItem(LS_KEY(respondentId)) } catch { /* ignore */ }
      setDone(true)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al enviar')
    } finally { setLoading(false) }
  }

  const nombre = (answers.participant_name as string) || initialNombre

  // ── Done screen ──────────────────────────────────────────────────────────────
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

  // ── Welcome screen ───────────────────────────────────────────────────────────
  if (sectionIdx === -1) return (
    <main style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '40px 20px 120px' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <Image src="https://www.humanaix.mx/assets/logos/LogoHaix.png" alt="Human.AiX" width={120} height={32} style={{ objectFit: 'contain', margin: '0 auto 28px', display: 'block' }} unoptimized />
          <p style={{ color: P, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 8px' }}>
            {campaign.empresa} — {campaign.nombre}
          </p>
          <h1 style={{ color: '#111827', fontSize: 26, fontWeight: 800, margin: '0 0 12px', lineHeight: 1.3 }}>
            Diagnóstico de Adopción de IA
          </h1>
          <p style={{ color: '#6B7280', fontSize: 14, lineHeight: 1.8, maxWidth: 420, margin: '0 auto' }}>
            Este diagnóstico nos ayudará a entender tu nivel de uso de IA y personalizar el contenido del curso a tu perfil y contexto real.
          </p>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, border: `1px solid ${PB}`, padding: '24px 28px', marginBottom: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { icon: '⏱', text: 'Tarda entre 8 y 12 minutos' },
              { icon: '🔒', text: 'Tus respuestas son confidenciales' },
              { icon: '🎯', text: 'Recibirás tu perfil de adopción por correo' },
              { icon: '💡', text: 'No hay respuestas correctas o incorrectas' },
            ].map(({ icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>
                <span style={{ color: '#374151', fontSize: 14 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ color: '#9CA3AF', fontSize: 12, textAlign: 'center', margin: '0 0 24px' }}>
          Completando para: <strong style={{ color: P }}>{email}</strong>
        </p>
      </div>

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #F3F4F6', padding: '16px 20px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <button onClick={goNext}
            style={{ width: '100%', padding: '16px', borderRadius: 12, border: 'none', background: PG, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
            Comenzar diagnóstico →
          </button>
        </div>
      </div>
    </main>
  )

  // ── Section screen ───────────────────────────────────────────────────────────
  const isLastSection = sectionIdx === TOTAL - 1
  const section = sections[sectionIdx]
  const qs = visibleQs(section, answers)
  const sectionNum = String(sectionIdx + 1).padStart(2, '0')

  return (
    <main style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      <div ref={topRef} />
      {/* Progress bar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#fff', borderBottom: '1px solid #F3F4F6' }}>
        <div style={{ height: 4, background: '#F3F4F6' }}>
          <div style={{ height: '100%', background: PG, width: `${pct}%`, transition: 'width 0.4s' }} />
        </div>
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Image src="https://www.humanaix.mx/assets/logos/LogoHaix.png" alt="Human.AiX" width={90} height={24} style={{ objectFit: 'contain' }} unoptimized />
          <span style={{ color: '#9CA3AF', fontSize: 12 }}>Sección {sectionIdx + 1} de {TOTAL}</span>
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '32px 20px 120px' }}>
        <p style={{ color: P, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 6px' }}>
          {sectionNum} · {section.title}
        </p>
        {section.subtitle && (
          <p style={{ color: '#9CA3AF', fontSize: 14, margin: '0 0 28px' }}>{section.subtitle}</p>
        )}

        {/* Role-specific section notice (default survey only) */}
        {!isCustom && section.id === 'role_specific' && (
          <div style={{ background: PL, border: `1px solid ${PB}`, borderRadius: 12, padding: '12px 16px', marginBottom: 24 }}>
            <p style={{ color: P, fontSize: 13, margin: 0 }}>
              Mostrando preguntas para: <strong>{ROLE_LABELS[answers.participant_role as string] ?? 'tu función'}</strong>
            </p>
          </div>
        )}

        {qs.map(q => (
          <QuestionBlock key={q.id} q={q} answers={answers} onChange={setAnswer} />
        ))}

        {error && <p style={{ color: '#EF4444', fontSize: 13, marginTop: 8 }}>{error}</p>}
      </div>

      {/* Bottom nav */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #F3F4F6', padding: '16px 20px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', gap: 12 }}>
          <button onClick={goPrev}
            style={{ flex: 1, padding: '14px', borderRadius: 12, border: '1.5px solid #E5E7EB', background: '#fff', color: '#6B7280', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            ← Anterior
          </button>
          {!isLastSection ? (
            <button onClick={goNext} disabled={!canNext}
              style={{ flex: 2, padding: '14px', borderRadius: 12, border: 'none', background: canNext ? PG : '#E5E7EB', color: canNext ? '#fff' : '#9CA3AF', fontSize: 14, fontWeight: 700, cursor: canNext ? 'pointer' : 'not-allowed' }}>
              Continuar →
            </button>
          ) : (
            <button onClick={submit} disabled={!canNext || loading}
              style={{ flex: 2, padding: '14px', borderRadius: 12, border: 'none', background: canNext && !loading ? PG : '#E5E7EB', color: canNext && !loading ? '#fff' : '#9CA3AF', fontSize: 14, fontWeight: 700, cursor: canNext && !loading ? 'pointer' : 'not-allowed' }}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                  Procesando diagnóstico...
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
