'use client'

import { useState } from 'react'
import { SurveyConfigJSON, SurveySectionJSON } from '@/lib/survey-config-json'

const P = '#7C3AED'
const PL = '#F5F3FF'
const PB = '#E9D5FF'
const PG = 'linear-gradient(135deg,#7C3AED,#D946EF)'

interface Props {
  campaignId: string
  campaignName: string
  currentConfig: unknown
  auth: string
  onClose: () => void
  onSaved: () => void
}

const TYPE_LABELS: Record<string, string> = {
  short_text: 'texto corto', email: 'email', single_select: 'opción única',
  multi_select: 'opción múltiple', scale: 'escala', long_text: 'texto largo',
}

function SectionPreview({ section, idx }: { section: SurveySectionJSON; idx: number }) {
  const [open, setOpen] = useState(idx === 0)
  return (
    <div style={{ border: `1px solid ${PB}`, borderRadius: 12, overflow: 'hidden', marginBottom: 10 }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ width: '100%', padding: '14px 18px', background: open ? PL : '#fff', border: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ color: P, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginRight: 8 }}>Sección {idx + 1}</span>
          <span style={{ color: '#111827', fontSize: 14, fontWeight: 700 }}>{section.title}</span>
          {section.subtitle && <span style={{ color: '#9CA3AF', fontSize: 12, marginLeft: 8 }}>{section.subtitle}</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#9CA3AF', fontSize: 12 }}>{section.questions.length} preguntas</span>
          <span style={{ color: P, fontSize: 16 }}>{open ? '▲' : '▼'}</span>
        </div>
      </button>
      {open && (
        <div style={{ padding: '0 18px 14px' }}>
          {section.questions.map((q, qi) => (
            <div key={q.id} style={{ padding: '12px 0', borderTop: qi === 0 ? 'none' : '1px solid #F3F4F6' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span style={{ color: '#9CA3AF', fontSize: 11, fontWeight: 700, minWidth: 32, paddingTop: 2 }}>{q.id}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ color: '#374151', fontSize: 13, margin: '0 0 6px', lineHeight: 1.5 }}>{q.label}</p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ background: '#F3F4F6', color: '#6B7280', fontSize: 10, padding: '2px 8px', borderRadius: 10 }}>{TYPE_LABELS[q.type] ?? q.type}</span>
                    {q.required && <span style={{ background: '#FEF2F2', color: '#EF4444', fontSize: 10, padding: '2px 8px', borderRadius: 10 }}>requerida</span>}
                    {q.showIfColumn && <span style={{ background: PL, color: P, fontSize: 10, padding: '2px 8px', borderRadius: 10 }}>condicional: {q.showIfColumn} = {q.showIfValue}</span>}
                    {q.type === 'scale' && <span style={{ background: '#F0FDF4', color: '#16A34A', fontSize: 10, padding: '2px 8px', borderRadius: 10 }}>escala {q.min ?? 1}–{q.max ?? 5}</span>}
                  </div>
                  {q.options && q.options.length > 0 && (
                    <div style={{ marginTop: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {q.options.slice(0, 5).map(o => (
                        <span key={o.value} style={{ background: '#F9FAFB', color: '#6B7280', border: '1px solid #E5E7EB', fontSize: 10, padding: '2px 8px', borderRadius: 8 }}>{o.label}</span>
                      ))}
                      {q.options.length > 5 && <span style={{ color: '#9CA3AF', fontSize: 10, padding: '2px 4px' }}>+{q.options.length - 5} más</span>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

type Step = 'prompt' | 'generating' | 'preview'

export default function SurveyDesignerModal({ campaignId, campaignName, currentConfig, auth, onClose, onSaved }: Props) {
  const hasCustom: boolean = !!(currentConfig && typeof currentConfig === 'object' && (currentConfig as Record<string, unknown>).version === 1)

  const [step, setStep] = useState<Step>('prompt')
  const [prompt, setPrompt] = useState<string>(
    hasCustom ? ((currentConfig as SurveyConfigJSON).promptUsed ?? '') : ''
  )
  const [generated, setGenerated] = useState<SurveyConfigJSON | null>(
    hasCustom ? (currentConfig as SurveyConfigJSON) : null
  )
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const totalQuestions = generated?.sections.reduce((acc, s) => acc + s.questions.length, 0) ?? 0

  const generate = async () => {
    if (!prompt.trim()) return
    setStep('generating')
    setError('')
    try {
      const res = await fetch('/api/survey/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: auth },
        body: JSON.stringify({ campaignId, prompt }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al generar')
      setGenerated(data.config)
      setStep('preview')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al generar encuesta')
      setStep('prompt')
    }
  }

  const save = async () => {
    if (!generated) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/survey/campaigns', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: auth },
        body: JSON.stringify({ id: campaignId, survey_config: generated }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al guardar')
      onSaved()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 640, maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(124,58,237,0.25)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ background: PG, padding: '22px 28px', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, margin: '0 0 4px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Diseñar encuesta</p>
              <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 800, margin: 0 }}>{campaignName}</h2>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: 32, height: 32, borderRadius: '50%', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
          </div>

          {/* Step indicator */}
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            {[
              { key: 'prompt', label: '1. Instrucciones' },
              { key: 'preview', label: '2. Revisar' },
            ].map(({ key, label }) => (
              <span key={key} style={{ fontSize: 11, padding: '3px 12px', borderRadius: 20, background: step === key || (step === 'generating' && key === 'prompt') ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)', color: '#fff', fontWeight: step === key ? 700 : 400 }}>
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>

          {/* Step: prompt */}
          {(step === 'prompt' || step === 'generating') && (
            <div>
              {hasCustom && step === 'prompt' && (
                <div style={{ background: PL, border: `1px solid ${PB}`, borderRadius: 10, padding: '10px 14px', marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 16 }}>✨</span>
                  <div>
                    <p style={{ color: P, fontSize: 12, fontWeight: 700, margin: 0 }}>Esta campaña ya tiene una encuesta personalizada</p>
                    <p style={{ color: '#6B7280', fontSize: 11, margin: '2px 0 0' }}>Puedes editarla o regenerarla desde cero.</p>
                  </div>
                </div>
              )}

              <label style={{ display: 'block', color: '#374151', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                ¿Cómo debe ser la encuesta?
              </label>
              <p style={{ color: '#9CA3AF', fontSize: 12, margin: '0 0 12px', lineHeight: 1.6 }}>
                Describe el perfil de los participantes, los temas que quieres medir, el tono y cualquier pregunta específica que quieras incluir. Mientras más contexto des, mejor será la encuesta generada.
              </p>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                rows={8}
                disabled={step === 'generating'}
                placeholder={`Ejemplo:\nLos participantes son líderes de operaciones de una empresa de logística. Quiero medir su nivel actual de uso de IA, qué herramientas conocen, cuáles son sus principales barreras y qué esperan de un taller intensivo de 2 días sobre IA generativa aplicada a operaciones.`}
                style={{ width: '100%', padding: '14px', border: `1.5px solid ${prompt.trim() ? PB : '#E5E7EB'}`, borderRadius: 12, fontSize: 13, color: '#374151', resize: 'vertical', outline: 'none', boxSizing: 'border-box', background: step === 'generating' ? '#F9FAFB' : prompt.trim() ? PL : '#fff', lineHeight: 1.6, fontFamily: 'inherit', opacity: step === 'generating' ? 0.6 : 1 }}
              />

              {step === 'generating' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16, padding: '14px 18px', background: PL, borderRadius: 12, border: `1px solid ${PB}` }}>
                  <span style={{ width: 20, height: 20, border: `2px solid ${PB}`, borderTopColor: P, borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block', flexShrink: 0 }} />
                  <div>
                    <p style={{ color: P, fontSize: 13, fontWeight: 700, margin: 0 }}>Generando encuesta con IA...</p>
                    <p style={{ color: '#9CA3AF', fontSize: 11, margin: '2px 0 0' }}>Esto puede tomar entre 10 y 20 segundos.</p>
                  </div>
                </div>
              )}

              {error && <p style={{ color: '#EF4444', fontSize: 13, marginTop: 12 }}>{error}</p>}
            </div>
          )}

          {/* Step: preview */}
          {step === 'preview' && generated && (
            <div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
                <div style={{ background: PL, border: `1px solid ${PB}`, borderRadius: 10, padding: '8px 16px', textAlign: 'center' }}>
                  <p style={{ color: '#9CA3AF', fontSize: 10, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Secciones</p>
                  <p style={{ color: P, fontSize: 20, fontWeight: 800, margin: 0 }}>{generated.sections.length}</p>
                </div>
                <div style={{ background: PL, border: `1px solid ${PB}`, borderRadius: 10, padding: '8px 16px', textAlign: 'center' }}>
                  <p style={{ color: '#9CA3AF', fontSize: 10, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Preguntas</p>
                  <p style={{ color: P, fontSize: 20, fontWeight: 800, margin: 0 }}>{totalQuestions}</p>
                </div>
                {generated.generatedAt && (
                  <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10, padding: '8px 16px' }}>
                    <p style={{ color: '#9CA3AF', fontSize: 10, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Generado</p>
                    <p style={{ color: '#374151', fontSize: 12, fontWeight: 600, margin: 0 }}>{new Date(generated.generatedAt).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}</p>
                  </div>
                )}
              </div>

              {generated.sections.map((section, i) => (
                <SectionPreview key={section.id} section={section} idx={i} />
              ))}

              {error && <p style={{ color: '#EF4444', fontSize: 13, marginTop: 12 }}>{error}</p>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 28px', borderTop: '1px solid #F3F4F6', flexShrink: 0, display: 'flex', gap: 10 }}>
          {step === 'prompt' && (
            <>
              <button onClick={onClose}
                style={{ flex: 1, padding: '12px', border: '1.5px solid #E5E7EB', borderRadius: 12, background: '#fff', color: '#6B7280', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={generate} disabled={!prompt.trim()}
                style={{ flex: 2, padding: '12px', border: 'none', borderRadius: 12, background: prompt.trim() ? PG : '#E5E7EB', color: prompt.trim() ? '#fff' : '#9CA3AF', fontSize: 14, fontWeight: 700, cursor: prompt.trim() ? 'pointer' : 'not-allowed' }}>
                ✨ Generar encuesta con IA
              </button>
            </>
          )}

          {step === 'generating' && (
            <button disabled
              style={{ flex: 1, padding: '12px', border: 'none', borderRadius: 12, background: '#E5E7EB', color: '#9CA3AF', fontSize: 14, fontWeight: 700, cursor: 'not-allowed' }}>
              Generando...
            </button>
          )}

          {step === 'preview' && (
            <>
              <button onClick={() => setStep('prompt')}
                style={{ flex: 1, padding: '12px', border: '1.5px solid #E5E7EB', borderRadius: 12, background: '#fff', color: '#6B7280', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                ↩ Regenerar
              </button>
              <button onClick={save} disabled={saving}
                style={{ flex: 2, padding: '12px', border: 'none', borderRadius: 12, background: saving ? '#E5E7EB' : PG, color: saving ? '#9CA3AF' : '#fff', fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Guardando...' : '✓ Usar esta encuesta'}
              </button>
            </>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
