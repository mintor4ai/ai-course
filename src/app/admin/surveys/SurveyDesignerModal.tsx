'use client'

import { useState, useRef } from 'react'
import { SurveyConfigJSON, SurveySectionJSON, SurveyQuestionJSON, SurveyOptionJSON } from '@/lib/survey-config-json'

const P = '#7C3AED'
const PL = '#F5F3FF'
const PB = '#E9D5FF'
const PG = 'linear-gradient(135deg,#7C3AED,#D946EF)'

interface Campaign { id: string; nombre: string; empresa: string; survey_config?: Record<string, unknown> }

interface Props {
  campaignId: string
  campaignName: string
  currentConfig: unknown
  allCampaigns: Campaign[]
  auth: string
  onClose: () => void
  onSaved: () => void
}

const TYPE_OPTS = [
  { v: 'single_select', l: 'Opción única' },
  { v: 'multi_select', l: 'Opción múltiple' },
  { v: 'scale', l: 'Escala numérica' },
  { v: 'short_text', l: 'Texto corto' },
  { v: 'long_text', l: 'Texto largo' },
  { v: 'email', l: 'Email' },
]
const TYPE_LABELS: Record<string, string> = Object.fromEntries(TYPE_OPTS.map(o => [o.v, o.l]))

// ─────────────────────────────────────────────────────────────────────────────
// Question editor modal
// ─────────────────────────────────────────────────────────────────────────────

function QuestionEditor({
  question, isNew, allColumns, onSave, onClose,
}: {
  question: SurveyQuestionJSON
  isNew: boolean
  allColumns: string[]
  onSave: (q: SurveyQuestionJSON) => void
  onClose: () => void
}) {
  const [q, setQ] = useState<SurveyQuestionJSON>(() => JSON.parse(JSON.stringify(question)))

  const set = (patch: Partial<SurveyQuestionJSON>) => setQ(prev => ({ ...prev, ...patch }))

  const setOpt = (i: number, patch: Partial<SurveyOptionJSON>) =>
    setQ(prev => {
      const opts = [...(prev.options ?? [])]
      opts[i] = { ...opts[i], ...patch }
      return { ...prev, options: opts }
    })

  const addOpt = () =>
    setQ(prev => ({
      ...prev,
      options: [...(prev.options ?? []), { value: `opt_${Date.now()}`, label: '' }],
    }))

  const removeOpt = (i: number) =>
    setQ(prev => ({ ...prev, options: (prev.options ?? []).filter((_, idx) => idx !== i) }))

  const needsOptions = q.type === 'single_select' || q.type === 'multi_select'
  const isScale = q.type === 'scale'
  const isText = q.type === 'short_text' || q.type === 'long_text'

  const valid = q.label.trim().length > 0 && q.column.trim().length > 0

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 560, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: PL }}>
          <h3 style={{ color: P, fontSize: 15, fontWeight: 800, margin: 0 }}>{isNew ? 'Nueva pregunta' : `Editar ${q.id}`}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, color: '#9CA3AF', cursor: 'pointer' }}>×</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {/* Label */}
          <Field label="Texto de la pregunta">
            <textarea value={q.label} rows={2} onChange={e => set({ label: e.target.value })}
              style={textareaStyle(q.label.length > 0)} />
          </Field>

          {/* Column + Type row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <Field label="Identificador (column)">
              <input value={q.column} onChange={e => set({ column: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                placeholder="nombre_columna"
                style={inputStyle(q.column.length > 0)} />
            </Field>
            <Field label="Tipo de respuesta">
              <select value={q.type} onChange={e => set({ type: e.target.value as SurveyQuestionJSON['type'], options: [] })}
                style={{ ...inputStyle(true), cursor: 'pointer' }}>
                {TYPE_OPTS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            </Field>
          </div>

          {/* Required */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <button onClick={() => set({ required: !q.required })}
              style={{ width: 20, height: 20, borderRadius: 4, border: `2px solid ${q.required ? P : '#D1D5DB'}`, background: q.required ? P : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {q.required && <span style={{ color: '#fff', fontSize: 12, fontWeight: 900 }}>✓</span>}
            </button>
            <span style={{ color: '#374151', fontSize: 13 }}>Pregunta requerida</span>
          </div>

          {/* Options */}
          {needsOptions && (
            <Field label="Opciones de respuesta">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(q.options ?? []).map((o, i) => (
                  <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <input value={o.label} onChange={e => setOpt(i, { label: e.target.value })}
                      placeholder={`Opción ${i + 1}`}
                      style={{ ...inputStyle(o.label.length > 0), flex: 1 }} />
                    <input value={o.score ?? ''} onChange={e => setOpt(i, { score: e.target.value === '' ? undefined : Number(e.target.value) })}
                      type="number" min={0} max={5} placeholder="pts"
                      style={{ ...inputStyle(false), width: 52, textAlign: 'center' }} title="Puntuación (0-5)" />
                    <button onClick={() => setOpt(i, { isNone: !o.isNone })}
                      title="Marcar como opción exclusiva (Ninguna / No aplica)"
                      style={{ padding: '4px 8px', border: `1px solid ${o.isNone ? '#FCA5A5' : '#E5E7EB'}`, borderRadius: 6, background: o.isNone ? '#FEF2F2' : '#fff', color: o.isNone ? '#EF4444' : '#9CA3AF', fontSize: 11, cursor: 'pointer', flexShrink: 0 }}>
                      Exc
                    </button>
                    <button onClick={() => removeOpt(i)}
                      style={{ width: 24, height: 24, border: '1px solid #FECACA', borderRadius: '50%', background: '#FEF2F2', color: '#EF4444', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>×</button>
                  </div>
                ))}
                <button onClick={addOpt}
                  style={{ padding: '8px', border: `1.5px dashed ${PB}`, borderRadius: 8, background: 'transparent', color: P, fontSize: 12, cursor: 'pointer', textAlign: 'center' }}>
                  + Agregar opción
                </button>
              </div>
              <p style={{ color: '#9CA3AF', fontSize: 11, margin: '6px 0 0' }}>
                <strong>pts</strong>: puntuación para scoring | <strong>Exc</strong>: opción excluyente (ej. "Ninguna")
              </p>
            </Field>
          )}

          {/* Scale config */}
          {isScale && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <Field label="Valor mínimo">
                  <input type="number" value={q.min ?? 1} onChange={e => set({ min: Number(e.target.value) })} style={inputStyle(true)} />
                </Field>
                <Field label="Valor máximo">
                  <input type="number" value={q.max ?? 5} onChange={e => set({ max: Number(e.target.value) })} style={inputStyle(true)} />
                </Field>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <Field label={`Etiqueta ${q.min ?? 1} (mínimo)`}>
                  <input value={q.scaleLabels?.[String(q.min ?? 1)] ?? ''} onChange={e => set({ scaleLabels: { ...(q.scaleLabels ?? {}), [String(q.min ?? 1)]: e.target.value } })} style={inputStyle(false)} placeholder="Ej. Nada" />
                </Field>
                <Field label={`Etiqueta ${q.max ?? 5} (máximo)`}>
                  <input value={q.scaleLabels?.[String(q.max ?? 5)] ?? ''} onChange={e => set({ scaleLabels: { ...(q.scaleLabels ?? {}), [String(q.max ?? 5)]: e.target.value } })} style={inputStyle(false)} placeholder="Ej. Mucho" />
                </Field>
              </div>
            </>
          )}

          {/* Text config */}
          {isText && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <Field label="Mínimo de caracteres">
                  <input type="number" value={q.minLength ?? ''} onChange={e => set({ minLength: e.target.value ? Number(e.target.value) : undefined })} style={inputStyle(false)} placeholder="opcional" />
                </Field>
                <Field label="Máximo de caracteres">
                  <input type="number" value={q.maxLength ?? ''} onChange={e => set({ maxLength: e.target.value ? Number(e.target.value) : undefined })} style={inputStyle(false)} placeholder="opcional" />
                </Field>
              </div>
              <Field label="Instrucción adicional (helpText)">
                <input value={q.helpText ?? ''} onChange={e => set({ helpText: e.target.value || undefined })} style={inputStyle(false)} placeholder="Texto de ayuda visible bajo la pregunta" />
              </Field>
            </>
          )}

          {/* Branching */}
          <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '14px 16px', marginTop: 4 }}>
            <p style={{ color: '#92400E', fontSize: 12, fontWeight: 700, margin: '0 0 10px' }}>Regla de visibilidad (branch)</p>
            <p style={{ color: '#9CA3AF', fontSize: 11, margin: '0 0 10px' }}>Mostrar esta pregunta solo cuando otra respuesta tenga un valor específico. Deja vacío para mostrar siempre.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Columna de la condición">
                <select value={q.showIfColumn ?? ''} onChange={e => set({ showIfColumn: e.target.value || undefined, showIfValue: e.target.value ? q.showIfValue : undefined })}
                  style={{ ...inputStyle(!!q.showIfColumn), cursor: 'pointer' }}>
                  <option value="">— siempre visible —</option>
                  {allColumns.filter(c => c !== q.column).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Valor esperado">
                <input value={q.showIfValue ?? ''} onChange={e => set({ showIfValue: e.target.value || undefined })}
                  disabled={!q.showIfColumn}
                  placeholder={q.showIfColumn ? 'Ej. developer' : '—'}
                  style={{ ...inputStyle(!!q.showIfValue), opacity: q.showIfColumn ? 1 : 0.4 }} />
              </Field>
            </div>
          </div>
        </div>

        <div style={{ padding: '14px 24px', borderTop: '1px solid #F3F4F6', display: 'flex', gap: 10 }}>
          <button onClick={onClose}
            style={{ flex: 1, padding: '11px', border: '1.5px solid #E5E7EB', borderRadius: 12, background: '#fff', color: '#6B7280', fontSize: 13, cursor: 'pointer' }}>
            Cancelar
          </button>
          <button onClick={() => valid && onSave(q)} disabled={!valid}
            style={{ flex: 2, padding: '11px', border: 'none', borderRadius: 12, background: valid ? PG : '#E5E7EB', color: valid ? '#fff' : '#9CA3AF', fontSize: 14, fontWeight: 700, cursor: valid ? 'pointer' : 'not-allowed' }}>
            {isNew ? 'Agregar pregunta' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', color: '#374151', fontSize: 12, fontWeight: 600, marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  )
}

const inputStyle = (active: boolean): React.CSSProperties => ({
  width: '100%', padding: '9px 12px', border: `1.5px solid ${active ? PB : '#E5E7EB'}`, borderRadius: 8,
  fontSize: 13, color: '#111827', outline: 'none', boxSizing: 'border-box',
  background: active ? PL : '#fff', fontFamily: 'inherit',
})
const textareaStyle = (active: boolean): React.CSSProperties => ({
  ...inputStyle(active), resize: 'vertical', lineHeight: 1.5,
})

function newQuestion(sections: SurveySectionJSON[]): SurveyQuestionJSON {
  const total = sections.reduce((a, s) => a + s.questions.length, 0)
  const id = `Q${String(total + 1).padStart(2, '0')}`
  return { id, column: `pregunta_${total + 1}`, label: '', type: 'single_select', required: true, options: [] }
}

// ─────────────────────────────────────────────────────────────────────────────
// Section row with edit capabilities
// ─────────────────────────────────────────────────────────────────────────────

function SectionRow({
  section, sectionIdx, editMode, allColumns,
  onEditQuestion, onDeleteQuestion, onAddQuestion, onMoveQuestion,
}: {
  section: SurveySectionJSON; sectionIdx: number; editMode: boolean
  allColumns: string[]
  onEditQuestion: (si: number, qi: number) => void
  onDeleteQuestion: (si: number, qi: number) => void
  onAddQuestion: (si: number) => void
  onMoveQuestion: (si: number, qi: number, dir: -1 | 1) => void
}) {
  const [open, setOpen] = useState(sectionIdx === 0)

  return (
    <div style={{ border: `1px solid ${PB}`, borderRadius: 12, overflow: 'hidden', marginBottom: 10 }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ width: '100%', padding: '13px 18px', background: open ? PL : '#fff', border: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ color: P, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginRight: 8 }}>§{sectionIdx + 1}</span>
          <span style={{ color: '#111827', fontSize: 14, fontWeight: 700 }}>{section.title}</span>
          {section.subtitle && <span style={{ color: '#9CA3AF', fontSize: 12, marginLeft: 8 }}>{section.subtitle}</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#9CA3AF', fontSize: 12 }}>{section.questions.length} preguntas</span>
          <span style={{ color: P, fontSize: 14 }}>{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && (
        <div style={{ padding: '0 16px 12px' }}>
          {section.questions.map((q, qi) => (
            <div key={q.id} style={{ padding: '10px 0', borderTop: qi === 0 ? 'none' : '1px solid #F3F4F6', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <span style={{ color: '#C4B5FD', fontSize: 10, fontWeight: 700, minWidth: 28, paddingTop: 3, flexShrink: 0 }}>{q.id}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: '#374151', fontSize: 13, margin: '0 0 5px', lineHeight: 1.5 }}>{q.label}</p>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  <span style={{ background: '#F3F4F6', color: '#6B7280', fontSize: 10, padding: '2px 7px', borderRadius: 8 }}>{TYPE_LABELS[q.type] ?? q.type}</span>
                  {q.required && <span style={{ background: '#FEF2F2', color: '#EF4444', fontSize: 10, padding: '2px 7px', borderRadius: 8 }}>requerida</span>}
                  {q.showIfColumn && (
                    <span style={{ background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A', fontSize: 10, padding: '2px 7px', borderRadius: 8 }}>
                      si {q.showIfColumn} = {q.showIfValue}
                    </span>
                  )}
                  {q.type === 'scale' && <span style={{ background: '#F0FDF4', color: '#16A34A', fontSize: 10, padding: '2px 7px', borderRadius: 8 }}>{q.min ?? 1}–{q.max ?? 5}</span>}
                  {q.options && q.options.length > 0 && <span style={{ color: '#9CA3AF', fontSize: 10, padding: '2px 4px' }}>{q.options.length} opciones</span>}
                </div>
              </div>

              {editMode && (
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  <button onClick={() => onMoveQuestion(sectionIdx, qi, -1)} disabled={qi === 0}
                    style={{ width: 22, height: 22, border: '1px solid #E5E7EB', borderRadius: 4, background: '#fff', color: '#9CA3AF', fontSize: 11, cursor: qi === 0 ? 'default' : 'pointer', opacity: qi === 0 ? 0.3 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▲</button>
                  <button onClick={() => onMoveQuestion(sectionIdx, qi, 1)} disabled={qi === section.questions.length - 1}
                    style={{ width: 22, height: 22, border: '1px solid #E5E7EB', borderRadius: 4, background: '#fff', color: '#9CA3AF', fontSize: 11, cursor: qi === section.questions.length - 1 ? 'default' : 'pointer', opacity: qi === section.questions.length - 1 ? 0.3 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▼</button>
                  <button onClick={() => onEditQuestion(sectionIdx, qi)}
                    style={{ padding: '3px 8px', border: `1px solid ${PB}`, borderRadius: 6, background: PL, color: P, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                    ✏️
                  </button>
                  <button onClick={() => onDeleteQuestion(sectionIdx, qi)}
                    style={{ width: 22, height: 22, border: '1px solid #FECACA', borderRadius: 4, background: '#FEF2F2', color: '#EF4444', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                </div>
              )}
            </div>
          ))}

          {editMode && (
            <button onClick={() => onAddQuestion(sectionIdx)}
              style={{ width: '100%', marginTop: 8, padding: '8px', border: `1.5px dashed ${PB}`, borderRadius: 8, background: 'transparent', color: P, fontSize: 12, cursor: 'pointer', textAlign: 'center' }}>
              + Agregar pregunta en esta sección
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main modal
// ─────────────────────────────────────────────────────────────────────────────

type Step = 'templates' | 'prompt' | 'preview'

export default function SurveyDesignerModal({ campaignId, campaignName, currentConfig, allCampaigns, auth, onClose, onSaved }: Props) {
  const hasCustom: boolean = !!(currentConfig && typeof currentConfig === 'object' && (currentConfig as Record<string, unknown>).version === 1)

  const [step, setStep] = useState<Step>(hasCustom ? 'preview' : 'templates')
  const [prompt, setPrompt] = useState<string>(hasCustom ? ((currentConfig as SurveyConfigJSON).promptUsed ?? '') : '')
  const [generated, setGenerated] = useState<SurveyConfigJSON | null>(hasCustom ? (currentConfig as SurveyConfigJSON) : null)
  const [generating, setGenerating] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [editTarget, setEditTarget] = useState<{ si: number; qi: number } | null>(null)
  const [addTarget, setAddTarget] = useState<number | null>(null)
  const bodyRef = useRef<HTMLDivElement>(null)

  // Templates from other campaigns
  const templates = allCampaigns.filter(c =>
    c.id !== campaignId &&
    c.survey_config &&
    (c.survey_config as Record<string, unknown>).version === 1
  )

  const totalQuestions = generated?.sections.reduce((a, s) => a + s.questions.length, 0) ?? 0
  const allColumns = generated?.sections.flatMap(s => s.questions.map(q => q.column)) ?? []

  // ── Mutations ──────────────────────────────────────────────────────────────

  const mutate = (fn: (d: SurveyConfigJSON) => void) => {
    setGenerated(prev => {
      if (!prev) return prev
      const next: SurveyConfigJSON = JSON.parse(JSON.stringify(prev))
      fn(next)
      return next
    })
    setDirty(true)
  }

  const updateQuestion = (si: number, qi: number, q: SurveyQuestionJSON) =>
    mutate(d => { d.sections[si].questions[qi] = q })

  const deleteQuestion = (si: number, qi: number) =>
    mutate(d => { d.sections[si].questions.splice(qi, 1) })

  const addQuestion = (si: number, q: SurveyQuestionJSON) =>
    mutate(d => { d.sections[si].questions.push(q) })

  const moveQuestion = (si: number, qi: number, dir: -1 | 1) =>
    mutate(d => {
      const qs = d.sections[si].questions
      const target = qi + dir
      if (target < 0 || target >= qs.length) return
      ;[qs[qi], qs[target]] = [qs[target], qs[qi]]
    })

  // Load a template
  const loadTemplate = (config: SurveyConfigJSON) => {
    const copy: SurveyConfigJSON = JSON.parse(JSON.stringify(config))
    copy.generatedAt = new Date().toISOString()
    copy.promptUsed = `Copiado de plantilla: ${allCampaigns.find(c => (c.survey_config as unknown) === (config as unknown))?.nombre ?? '?'}`
    setGenerated(copy)
    setDirty(true)
    setStep('preview')
  }

  // ── Generate ───────────────────────────────────────────────────────────────

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
      // Auto-save so survey persists even if modal is closed
      await saveToDB(data.config)
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

  // ── Save ──────────────────────────────────────────────────────────────────

  const saveToDB = async (config: SurveyConfigJSON) => {
    const res = await fetch('/api/survey/campaigns', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: auth },
      body: JSON.stringify({ id: campaignId, survey_config: config }),
    })
    if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Error al guardar') }
  }

  const save = async () => {
    if (!generated) return
    setSaving(true)
    setError('')
    try {
      await saveToDB(generated)
      setDirty(false)
      onSaved()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const editingQ = editTarget !== null && generated
    ? generated.sections[editTarget.si]?.questions[editTarget.qi]
    : null

  const addingQ = addTarget !== null && generated
    ? newQuestion(generated.sections)
    : null

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
        <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 680, maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(124,58,237,0.25)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div style={{ background: PG, padding: '20px 28px', flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, margin: '0 0 3px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Encuesta de campaña</p>
                <h2 style={{ color: '#fff', fontSize: 17, fontWeight: 800, margin: 0 }}>{campaignName}</h2>
              </div>
              <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: 30, height: 30, borderRadius: '50%', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            </div>

            {/* Tab bar */}
            <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
              {[
                { key: 'templates', label: '📋 Plantillas' },
                { key: 'prompt', label: '✨ Generar' },
                { key: 'preview', label: `📝 Encuesta${generated ? ` (${totalQuestions}p)` : ''}`, disabled: !generated },
              ].map(({ key, label, disabled }) => (
                <button key={key} disabled={!!disabled} onClick={() => !disabled && setStep(key as Step)}
                  style={{ fontSize: 11, padding: '4px 14px', borderRadius: 20, background: step === key ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)', color: disabled ? 'rgba(255,255,255,0.35)' : '#fff', fontWeight: step === key ? 700 : 400, border: 'none', cursor: disabled ? 'default' : 'pointer' }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Body */}
          <div ref={bodyRef} style={{ flex: 1, overflowY: 'auto', padding: '22px 28px' }}>

            {/* TEMPLATES tab */}
            {step === 'templates' && (
              <div>
                <p style={{ color: '#374151', fontSize: 13, fontWeight: 700, margin: '0 0 14px' }}>Elige desde dónde empezar:</p>

                {/* Default survey */}
                <button onClick={() => setStep('prompt')}
                  style={{ width: '100%', padding: '14px 18px', border: `1.5px solid ${PB}`, borderRadius: 12, background: PL, textAlign: 'left', cursor: 'pointer', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ color: P, fontSize: 13, fontWeight: 700, margin: '0 0 3px' }}>✨ Generar nueva encuesta con IA</p>
                    <p style={{ color: '#9CA3AF', fontSize: 12, margin: 0 }}>Claude crea preguntas personalizadas según las instrucciones que le des</p>
                  </div>
                  <span style={{ color: P, fontSize: 18, flexShrink: 0 }}>→</span>
                </button>

                {templates.length > 0 && (
                  <>
                    <p style={{ color: '#9CA3AF', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '16px 0 10px' }}>Copiar desde otra campaña</p>
                    {templates.map(c => {
                      const cfg = c.survey_config as unknown as SurveyConfigJSON
                      const qCount = cfg.sections?.reduce((a: number, s: SurveySectionJSON) => a + s.questions.length, 0) ?? 0
                      return (
                        <button key={c.id} onClick={() => loadTemplate(cfg)}
                          style={{ width: '100%', padding: '12px 16px', border: '1.5px solid #E5E7EB', borderRadius: 10, background: '#fff', textAlign: 'left', cursor: 'pointer', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <p style={{ color: '#111827', fontSize: 13, fontWeight: 600, margin: '0 0 2px' }}>{c.nombre}</p>
                            <p style={{ color: '#9CA3AF', fontSize: 11, margin: 0 }}>{c.empresa} · {cfg.sections?.length ?? 0} secciones · {qCount} preguntas</p>
                          </div>
                          <span style={{ color: '#9CA3AF', fontSize: 16 }}>→</span>
                        </button>
                      )
                    })}
                  </>
                )}

                {templates.length === 0 && (
                  <p style={{ color: '#9CA3AF', fontSize: 12, margin: '8px 0 0', textAlign: 'center' }}>No hay otras campañas con encuesta personalizada todavía.</p>
                )}
              </div>
            )}

            {/* GENERATE tab */}
            {step === 'prompt' && (
              <div>
                {hasCustom && (
                  <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
                    <p style={{ color: '#92400E', fontSize: 12, margin: 0 }}>⚠️ Regenerar reemplazará la encuesta guardada con una nueva generada por IA.</p>
                  </div>
                )}
                <label style={{ display: 'block', color: '#374151', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>¿Cómo debe ser la encuesta?</label>
                <p style={{ color: '#9CA3AF', fontSize: 12, margin: '0 0 10px', lineHeight: 1.6 }}>
                  Describe el perfil de los participantes, los temas a medir y cualquier pregunta específica.
                </p>
                <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={9} disabled={generating}
                  placeholder={'Ej: Los participantes son gerentes de finanzas. Quiero medir su confianza usando IA para análisis, qué herramientas ya conocen y qué esperan de un taller de 4 horas.'}
                  style={{ width: '100%', padding: '13px', border: `1.5px solid ${prompt.trim() ? PB : '#E5E7EB'}`, borderRadius: 12, fontSize: 13, color: '#374151', resize: 'vertical', outline: 'none', boxSizing: 'border-box', background: generating ? '#F9FAFB' : prompt.trim() ? PL : '#fff', lineHeight: 1.6, fontFamily: 'inherit', opacity: generating ? 0.6 : 1 }}
                />
                {generating && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14, padding: '12px 16px', background: PL, borderRadius: 10, border: `1px solid ${PB}` }}>
                    <span style={{ width: 18, height: 18, border: `2px solid ${PB}`, borderTopColor: P, borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block', flexShrink: 0 }} />
                    <div>
                      <p style={{ color: P, fontSize: 13, fontWeight: 700, margin: 0 }}>Generando encuesta con IA...</p>
                      <p style={{ color: '#9CA3AF', fontSize: 11, margin: '2px 0 0' }}>10–20 segundos. Se guardará automáticamente.</p>
                    </div>
                  </div>
                )}
                {error && <p style={{ color: '#EF4444', fontSize: 13, marginTop: 10 }}>{error}</p>}
              </div>
            )}

            {/* PREVIEW/EDIT tab */}
            {step === 'preview' && generated && (
              <div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                  <div style={{ background: PL, border: `1px solid ${PB}`, borderRadius: 8, padding: '6px 12px', textAlign: 'center' }}>
                    <p style={{ color: '#9CA3AF', fontSize: 9, margin: '0 0 1px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Secciones</p>
                    <p style={{ color: P, fontSize: 16, fontWeight: 800, margin: 0 }}>{generated.sections.length}</p>
                  </div>
                  <div style={{ background: PL, border: `1px solid ${PB}`, borderRadius: 8, padding: '6px 12px', textAlign: 'center' }}>
                    <p style={{ color: '#9CA3AF', fontSize: 9, margin: '0 0 1px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Preguntas</p>
                    <p style={{ color: P, fontSize: 16, fontWeight: 800, margin: 0 }}>{totalQuestions}</p>
                  </div>
                  {generated.generatedAt && (
                    <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: '6px 12px' }}>
                      <p style={{ color: '#9CA3AF', fontSize: 9, margin: '0 0 1px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Guardado</p>
                      <p style={{ color: '#374151', fontSize: 11, fontWeight: 600, margin: 0 }}>{new Date(generated.generatedAt).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}</p>
                    </div>
                  )}
                  <div style={{ marginLeft: 'auto' }}>
                    <button onClick={() => { setEditMode(m => !m) }}
                      style={{ padding: '6px 14px', border: `1.5px solid ${editMode ? P : '#E5E7EB'}`, borderRadius: 8, background: editMode ? PL : '#fff', color: editMode ? P : '#6B7280', fontSize: 12, fontWeight: editMode ? 700 : 400, cursor: 'pointer' }}>
                      {editMode ? '✓ Editando' : '✏️ Editar'}
                    </button>
                  </div>
                </div>

                {editMode && (
                  <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: '8px 14px', marginBottom: 12 }}>
                    <p style={{ color: '#92400E', fontSize: 12, margin: 0 }}>
                      Usa ✏️ para editar una pregunta completa (texto, opciones, branches), ▲▼ para reordenar, × para eliminar.
                    </p>
                  </div>
                )}

                {generated.sections.map((section, si) => (
                  <SectionRow
                    key={section.id} section={section} sectionIdx={si}
                    editMode={editMode} allColumns={allColumns}
                    onEditQuestion={(si, qi) => setEditTarget({ si, qi })}
                    onDeleteQuestion={deleteQuestion}
                    onAddQuestion={si => setAddTarget(si)}
                    onMoveQuestion={moveQuestion}
                  />
                ))}

                {error && <p style={{ color: '#EF4444', fontSize: 13, marginTop: 10 }}>{error}</p>}
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: '13px 28px', borderTop: '1px solid #F3F4F6', flexShrink: 0, display: 'flex', gap: 10 }}>
            {step === 'templates' && (
              <button onClick={onClose}
                style={{ flex: 1, padding: '11px', border: '1.5px solid #E5E7EB', borderRadius: 12, background: '#fff', color: '#6B7280', fontSize: 13, cursor: 'pointer' }}>
                Cerrar
              </button>
            )}

            {step === 'prompt' && (
              <>
                <button onClick={() => setStep(generated ? 'preview' : 'templates')}
                  style={{ flex: 1, padding: '11px', border: '1.5px solid #E5E7EB', borderRadius: 12, background: '#fff', color: '#6B7280', fontSize: 13, cursor: 'pointer' }}>
                  ← Volver
                </button>
                <button onClick={generate} disabled={!prompt.trim() || generating}
                  style={{ flex: 2, padding: '11px', border: 'none', borderRadius: 12, background: prompt.trim() && !generating ? PG : '#E5E7EB', color: prompt.trim() && !generating ? '#fff' : '#9CA3AF', fontSize: 14, fontWeight: 700, cursor: prompt.trim() && !generating ? 'pointer' : 'not-allowed' }}>
                  {generating ? 'Generando...' : '✨ Generar encuesta'}
                </button>
              </>
            )}

            {step === 'preview' && (
              <>
                <button onClick={() => setStep('prompt')}
                  style={{ flex: 1, padding: '11px', border: '1.5px solid #E5E7EB', borderRadius: 12, background: '#fff', color: '#6B7280', fontSize: 13, cursor: 'pointer' }}>
                  ↩ Regenerar
                </button>
                {dirty && (
                  <button onClick={save} disabled={saving}
                    style={{ flex: 2, padding: '11px', border: 'none', borderRadius: 12, background: saving ? '#E5E7EB' : PG, color: saving ? '#9CA3AF' : '#fff', fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
                    {saving ? 'Guardando...' : '💾 Guardar cambios'}
                  </button>
                )}
                {!dirty && (
                  <button onClick={onClose}
                    style={{ flex: 2, padding: '11px', border: 'none', borderRadius: 12, background: PG, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                    ✓ Listo
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Question editor sub-modal */}
      {editTarget !== null && editingQ && (
        <QuestionEditor
          question={editingQ}
          isNew={false}
          allColumns={allColumns}
          onSave={q => { updateQuestion(editTarget.si, editTarget.qi, q); setEditTarget(null) }}
          onClose={() => setEditTarget(null)}
        />
      )}

      {addTarget !== null && addingQ && (
        <QuestionEditor
          question={addingQ}
          isNew={true}
          allColumns={allColumns}
          onSave={q => { addQuestion(addTarget, q); setAddTarget(null) }}
          onClose={() => setAddTarget(null)}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </>
  )
}
