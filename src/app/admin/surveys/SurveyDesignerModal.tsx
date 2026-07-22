'use client'

import { useState, useRef } from 'react'
import { SurveyConfigJSON, SurveySectionJSON, SurveyQuestionJSON } from '@/lib/survey-config-json'

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

// ── Inline editable text ────────────────────────────────────────────────────

function EditableText({ value, onChange, multiline, style }: {
  value: string; onChange: (v: string) => void; multiline?: boolean
  style?: React.CSSProperties
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  const commit = () => { onChange(draft.trim() || value); setEditing(false) }

  if (editing) {
    const shared: React.CSSProperties = {
      width: '100%', padding: '4px 8px', border: `1.5px solid ${P}`, borderRadius: 6,
      fontSize: 'inherit', fontFamily: 'inherit', color: '#111827', outline: 'none',
      background: PL, boxSizing: 'border-box', lineHeight: 1.5, ...style,
    }
    return multiline
      ? <textarea autoFocus value={draft} rows={2} onChange={e => setDraft(e.target.value)} onBlur={commit} onKeyDown={e => e.key === 'Escape' && setEditing(false)} style={{ ...shared, resize: 'none' }} />
      : <input autoFocus value={draft} onChange={e => setDraft(e.target.value)} onBlur={commit} onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }} style={shared} />
  }
  return (
    <span onClick={() => { setDraft(value); setEditing(true) }} title="Clic para editar"
      style={{ cursor: 'text', borderBottom: '1px dashed #D1D5DB', paddingBottom: 1, ...style }}>
      {value}
    </span>
  )
}

// ── Section with editable questions ─────────────────────────────────────────

function SectionEditor({
  section, sectionIdx, editMode, onUpdateQuestion, onDeleteQuestion, onUpdateOption,
}: {
  section: SurveySectionJSON
  sectionIdx: number
  editMode: boolean
  onUpdateQuestion: (si: number, qi: number, field: 'label' | 'required', value: string | boolean) => void
  onDeleteQuestion: (si: number, qi: number) => void
  onUpdateOption: (si: number, qi: number, oi: number, label: string) => void
}) {
  const [open, setOpen] = useState(sectionIdx === 0)

  return (
    <div style={{ border: `1px solid ${PB}`, borderRadius: 12, overflow: 'hidden', marginBottom: 10 }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ width: '100%', padding: '14px 18px', background: open ? PL : '#fff', border: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ color: P, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginRight: 8 }}>Sección {sectionIdx + 1}</span>
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
            <div key={q.id} style={{ padding: '14px 0', borderTop: qi === 0 ? 'none' : '1px solid #F3F4F6' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span style={{ color: '#9CA3AF', fontSize: 11, fontWeight: 700, minWidth: 32, paddingTop: 3 }}>{q.id}</span>

                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Label */}
                  {editMode ? (
                    <EditableText
                      value={q.label}
                      onChange={v => onUpdateQuestion(sectionIdx, qi, 'label', v)}
                      multiline
                      style={{ fontSize: 13, marginBottom: 8, display: 'block', width: '100%' }}
                    />
                  ) : (
                    <p style={{ color: '#374151', fontSize: 13, margin: '0 0 8px', lineHeight: 1.5 }}>{q.label}</p>
                  )}

                  {/* Type tags */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ background: '#F3F4F6', color: '#6B7280', fontSize: 10, padding: '2px 8px', borderRadius: 10 }}>{TYPE_LABELS[q.type] ?? q.type}</span>
                    {editMode ? (
                      <button onClick={() => onUpdateQuestion(sectionIdx, qi, 'required', !q.required)}
                        style={{ background: q.required ? '#FEF2F2' : '#F3F4F6', color: q.required ? '#EF4444' : '#9CA3AF', border: 'none', fontSize: 10, padding: '2px 8px', borderRadius: 10, cursor: 'pointer' }}>
                        {q.required ? '✕ requerida' : '+ hacer requerida'}
                      </button>
                    ) : (
                      q.required && <span style={{ background: '#FEF2F2', color: '#EF4444', fontSize: 10, padding: '2px 8px', borderRadius: 10 }}>requerida</span>
                    )}
                    {q.showIfColumn && <span style={{ background: PL, color: P, fontSize: 10, padding: '2px 8px', borderRadius: 10 }}>condicional: {q.showIfColumn} = {q.showIfValue}</span>}
                    {q.type === 'scale' && <span style={{ background: '#F0FDF4', color: '#16A34A', fontSize: 10, padding: '2px 8px', borderRadius: 10 }}>escala {q.min ?? 1}–{q.max ?? 5}</span>}
                  </div>

                  {/* Options */}
                  {q.options && q.options.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      {editMode ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {q.options.map((o, oi) => (
                            <div key={o.value} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ color: '#9CA3AF', fontSize: 10, minWidth: 16 }}>·</span>
                              <EditableText
                                value={o.label}
                                onChange={v => onUpdateOption(sectionIdx, qi, oi, v)}
                                style={{ fontSize: 12, flex: 1 }}
                              />
                              {o.score !== undefined && o.score !== null && (
                                <span style={{ color: '#C4B5FD', fontSize: 10, flexShrink: 0 }}>pts:{o.score}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {q.options.slice(0, 6).map(o => (
                            <span key={o.value} style={{ background: '#F9FAFB', color: '#6B7280', border: '1px solid #E5E7EB', fontSize: 10, padding: '2px 8px', borderRadius: 8 }}>{o.label}</span>
                          ))}
                          {q.options.length > 6 && <span style={{ color: '#9CA3AF', fontSize: 10, padding: '2px 4px' }}>+{q.options.length - 6} más</span>}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Delete button */}
                {editMode && (
                  <button onClick={() => onDeleteQuestion(sectionIdx, qi)}
                    title="Eliminar pregunta"
                    style={{ flexShrink: 0, width: 26, height: 26, borderRadius: '50%', border: '1px solid #FECACA', background: '#FEF2F2', color: '#EF4444', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
                    ×
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main modal ───────────────────────────────────────────────────────────────

type Step = 'prompt' | 'preview'

export default function SurveyDesignerModal({ campaignId, campaignName, currentConfig, auth, onClose, onSaved }: Props) {
  const hasCustom: boolean = !!(currentConfig && typeof currentConfig === 'object' && (currentConfig as Record<string, unknown>).version === 1)

  // Open in preview directly if campaign already has a custom survey
  const [step, setStep] = useState<Step>(hasCustom ? 'preview' : 'prompt')
  const [prompt, setPrompt] = useState<string>(hasCustom ? ((currentConfig as SurveyConfigJSON).promptUsed ?? '') : '')
  const [generated, setGenerated] = useState<SurveyConfigJSON | null>(hasCustom ? (currentConfig as SurveyConfigJSON) : null)
  const [generating, setGenerating] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const bodyRef = useRef<HTMLDivElement>(null)

  const totalQuestions = generated?.sections.reduce((acc, s) => acc + s.questions.length, 0) ?? 0

  // ── Mutation helpers ────────────────────────────────────────────────────────

  const mutate = (fn: (draft: SurveyConfigJSON) => void) => {
    setGenerated(prev => {
      if (!prev) return prev
      const next: SurveyConfigJSON = JSON.parse(JSON.stringify(prev))
      fn(next)
      return next
    })
    setDirty(true)
  }

  const updateQuestionLabel = (si: number, qi: number, field: 'label' | 'required', value: string | boolean) => {
    mutate(draft => { (draft.sections[si].questions[qi] as unknown as Record<string, unknown>)[field] = value })
  }

  const deleteQuestion = (si: number, qi: number) => {
    mutate(draft => { draft.sections[si].questions.splice(qi, 1) })
  }

  const updateOption = (si: number, qi: number, oi: number, label: string) => {
    mutate(draft => { draft.sections[si].questions[qi].options![oi].label = label })
  }

  // ── Generate ────────────────────────────────────────────────────────────────

  const generate = async () => {
    if (!prompt.trim()) return
    setGenerating(true)
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
      setDirty(false)
      setEditMode(false)
      setStep('preview')
      bodyRef.current?.scrollTo({ top: 0 })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al generar encuesta')
    } finally {
      setGenerating(false)
    }
  }

  // ── Save ─────────────────────────────────────────────────────────────────────

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
      setDirty(false)
      onSaved()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  const stepLabel = step === 'preview' ? (editMode ? '2. Editar' : '2. Vista previa') : '1. Instrucciones'

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 660, maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(124,58,237,0.25)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ background: PG, padding: '22px 28px', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, margin: '0 0 4px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Diseñar encuesta</p>
              <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 800, margin: 0 }}>{campaignName}</h2>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: 32, height: 32, borderRadius: '50%', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 14, alignItems: 'center' }}>
            <button onClick={() => step === 'preview' && setStep('prompt')}
              style={{ fontSize: 11, padding: '3px 12px', borderRadius: 20, background: step === 'prompt' || generating ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)', color: '#fff', fontWeight: step === 'prompt' ? 700 : 400, border: 'none', cursor: step === 'preview' ? 'pointer' : 'default' }}>
              1. Instrucciones
            </button>
            {generated && (
              <button onClick={() => step === 'prompt' && !generating && setStep('preview')}
                style={{ fontSize: 11, padding: '3px 12px', borderRadius: 20, background: step === 'preview' && !generating ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)', color: '#fff', fontWeight: step === 'preview' ? 700 : 400, border: 'none', cursor: step === 'prompt' && !generating ? 'pointer' : 'default' }}>
                {stepLabel}
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div ref={bodyRef} style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>

          {/* Prompt step */}
          {step === 'prompt' && (
            <div>
              {hasCustom && (
                <div style={{ background: PL, border: `1px solid ${PB}`, borderRadius: 10, padding: '10px 14px', marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 16 }}>✨</span>
                  <p style={{ color: P, fontSize: 12, fontWeight: 600, margin: 0 }}>Esta campaña ya tiene una encuesta personalizada. Regenerar creará una nueva desde cero.</p>
                </div>
              )}
              <label style={{ display: 'block', color: '#374151', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                ¿Cómo debe ser la encuesta?
              </label>
              <p style={{ color: '#9CA3AF', fontSize: 12, margin: '0 0 12px', lineHeight: 1.6 }}>
                Describe el perfil de los participantes, los temas que quieres medir y cualquier pregunta específica que necesites incluir.
              </p>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                rows={9}
                disabled={generating}
                placeholder={`Ejemplo:\nLos participantes son líderes de operaciones de una empresa de logística. Quiero medir su nivel actual de uso de IA, qué herramientas conocen, cuáles son sus principales barreras y qué esperan de un taller intensivo de 2 días sobre IA generativa aplicada a operaciones.`}
                style={{ width: '100%', padding: '14px', border: `1.5px solid ${prompt.trim() ? PB : '#E5E7EB'}`, borderRadius: 12, fontSize: 13, color: '#374151', resize: 'vertical', outline: 'none', boxSizing: 'border-box', background: generating ? '#F9FAFB' : prompt.trim() ? PL : '#fff', lineHeight: 1.6, fontFamily: 'inherit', opacity: generating ? 0.6 : 1 }}
              />
              {generating && (
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

          {/* Preview / Edit step */}
          {step === 'preview' && generated && (
            <div>
              {/* Stats + edit toggle */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ background: PL, border: `1px solid ${PB}`, borderRadius: 10, padding: '7px 14px', textAlign: 'center' }}>
                  <p style={{ color: '#9CA3AF', fontSize: 9, margin: '0 0 1px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Secciones</p>
                  <p style={{ color: P, fontSize: 18, fontWeight: 800, margin: 0 }}>{generated.sections.length}</p>
                </div>
                <div style={{ background: PL, border: `1px solid ${PB}`, borderRadius: 10, padding: '7px 14px', textAlign: 'center' }}>
                  <p style={{ color: '#9CA3AF', fontSize: 9, margin: '0 0 1px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Preguntas</p>
                  <p style={{ color: P, fontSize: 18, fontWeight: 800, margin: 0 }}>{totalQuestions}</p>
                </div>
                {generated.generatedAt && (
                  <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10, padding: '7px 14px' }}>
                    <p style={{ color: '#9CA3AF', fontSize: 9, margin: '0 0 1px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Generado</p>
                    <p style={{ color: '#374151', fontSize: 11, fontWeight: 600, margin: 0 }}>{new Date(generated.generatedAt).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}</p>
                  </div>
                )}
                <div style={{ marginLeft: 'auto' }}>
                  <button onClick={() => setEditMode(m => !m)}
                    style={{ padding: '7px 16px', border: `1.5px solid ${editMode ? P : '#E5E7EB'}`, borderRadius: 10, background: editMode ? PL : '#fff', color: editMode ? P : '#6B7280', fontSize: 12, fontWeight: editMode ? 700 : 400, cursor: 'pointer' }}>
                    {editMode ? '✓ Editando' : '✏️ Editar'}
                  </button>
                </div>
              </div>

              {editMode && (
                <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
                  <p style={{ color: '#92400E', fontSize: 12, margin: 0 }}>
                    <strong>Modo edición:</strong> haz clic en cualquier texto subrayado para editarlo. Usa × para eliminar una pregunta.
                  </p>
                </div>
              )}

              {generated.sections.map((section, i) => (
                <SectionEditor
                  key={section.id}
                  section={section}
                  sectionIdx={i}
                  editMode={editMode}
                  onUpdateQuestion={updateQuestionLabel}
                  onDeleteQuestion={deleteQuestion}
                  onUpdateOption={updateOption}
                />
              ))}

              {error && <p style={{ color: '#EF4444', fontSize: 13, marginTop: 12 }}>{error}</p>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 28px', borderTop: '1px solid #F3F4F6', flexShrink: 0, display: 'flex', gap: 10 }}>
          {step === 'prompt' && (
            <>
              {generated && (
                <button onClick={() => setStep('preview')}
                  style={{ flex: 1, padding: '12px', border: `1.5px solid ${PB}`, borderRadius: 12, background: PL, color: P, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  ← Ver encuesta
                </button>
              )}
              <button onClick={onClose}
                style={{ flex: 1, padding: '12px', border: '1.5px solid #E5E7EB', borderRadius: 12, background: '#fff', color: '#6B7280', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={generate} disabled={!prompt.trim() || generating}
                style={{ flex: 2, padding: '12px', border: 'none', borderRadius: 12, background: prompt.trim() && !generating ? PG : '#E5E7EB', color: prompt.trim() && !generating ? '#fff' : '#9CA3AF', fontSize: 14, fontWeight: 700, cursor: prompt.trim() && !generating ? 'pointer' : 'not-allowed' }}>
                {generating ? 'Generando...' : '✨ Generar encuesta con IA'}
              </button>
            </>
          )}

          {step === 'preview' && (
            <>
              <button onClick={() => setStep('prompt')}
                style={{ flex: 1, padding: '12px', border: '1.5px solid #E5E7EB', borderRadius: 12, background: '#fff', color: '#6B7280', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                ↩ Regenerar
              </button>
              <button onClick={save} disabled={saving}
                style={{ flex: 2, padding: '12px', border: 'none', borderRadius: 12, background: saving ? '#E5E7EB' : PG, color: saving ? '#9CA3AF' : '#fff', fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Guardando...' : dirty ? '💾 Guardar cambios' : '✓ Usar esta encuesta'}
              </button>
            </>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
