'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { SurveyConfigJSON, SurveySectionJSON, SurveyQuestionJSON, SurveyOptionJSON } from '@/lib/survey-config-json'
import { BUILT_IN_TEMPLATES } from '@/lib/survey-templates'

const P = '#7C3AED'
const PL = '#F5F3FF'
const PB = '#E9D5FF'
const PG = 'linear-gradient(135deg,#7C3AED,#D946EF)'

interface Campaign {
  id: string
  nombre: string
  empresa: string
  survey_config?: Record<string, unknown>
  draft_config?: Record<string, unknown>
  config_status?: string
}

interface Props {
  campaignId: string
  campaignName: string
  currentConfig: unknown
  currentDraft: unknown
  configStatus: string
  allCampaigns: Campaign[]
  auth: string
  onClose: () => void
  onSaved: () => void
}

const TYPE_OPTS = [
  { v: 'single_select', l: 'Opción única', icon: '◉' },
  { v: 'multi_select', l: 'Opción múltiple', icon: '☑' },
  { v: 'scale', l: 'Escala numérica', icon: '⟷' },
  { v: 'short_text', l: 'Texto corto', icon: '¶' },
  { v: 'long_text', l: 'Texto largo', icon: '≡' },
  { v: 'email', l: 'Email', icon: '@' },
]
const TYPE_LABELS: Record<string, string> = Object.fromEntries(TYPE_OPTS.map(o => [o.v, o.l]))
const TYPE_ICONS: Record<string, string> = Object.fromEntries(TYPE_OPTS.map(o => [o.v, o.icon]))

const DIMENSION_OPTS = [
  { v: '', l: '— Sin scoring —' },
  { v: 'ai_adoption', l: 'Adopción IA' },
  { v: 'tool_exposure', l: 'Herramientas' },
  { v: 'context_engineering', l: 'Ing. de Contexto' },
  { v: 'specification_maturity', l: 'Madurez Specs' },
  { v: 'documentation_maturity', l: 'Documentación' },
  { v: 'agent_readiness', l: 'Agentes' },
  { v: 'team_adoption', l: 'Adopción Equipo' },
  { v: 'ai_leadership', l: 'Liderazgo IA' },
  { v: 'change_readiness', l: 'Apertura al Cambio' },
]

// ─────────────────────────────────────────────────────────────────────────────
// Status chip
// ─────────────────────────────────────────────────────────────────────────────

type ConfigStatus = 'default' | 'draft' | 'published'
const STATUS_STYLES: Record<ConfigStatus, { bg: string; color: string; label: string }> = {
  default:   { bg: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)', label: '📋 Encuesta base' },
  draft:     { bg: 'rgba(251,191,36,0.25)',  color: '#FEF3C7', label: '✏️ Borrador' },
  published: { bg: 'rgba(52,211,153,0.25)',  color: '#D1FAE5', label: '✅ Publicada' },
}

function StatusChip({ status, saving }: { status: ConfigStatus; saving: boolean }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.default
  return (
    <span style={{ padding: '3px 10px', borderRadius: 99, background: s.bg, color: s.color, fontSize: 11, fontWeight: 600 }}>
      {saving ? '⟳ Guardando…' : s.label}
    </span>
  )
}

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
  const canScore = q.type === 'single_select' || q.type === 'multi_select' || q.type === 'scale'

  const valid = q.label.trim().length > 0 && q.column.trim().length > 0

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 580, maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: PL }}>
          <div>
            <h3 style={{ color: P, fontSize: 15, fontWeight: 800, margin: '0 0 2px' }}>{isNew ? 'Nueva pregunta' : `Editar pregunta ${q.id}`}</h3>
            <p style={{ color: '#9CA3AF', fontSize: 11, margin: 0 }}>{TYPE_ICONS[q.type]} {TYPE_LABELS[q.type] ?? q.type}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, color: '#9CA3AF', cursor: 'pointer' }}>×</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {/* Label */}
          <Field label="Texto de la pregunta *">
            <textarea value={q.label} rows={2} onChange={e => set({ label: e.target.value })}
              style={textareaStyle(q.label.length > 0)} placeholder="¿Cuál es tu pregunta?" />
          </Field>

          {/* Column + Type row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 0 }}>
            <Field label="Identificador (column) *">
              <input value={q.column} onChange={e => set({ column: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })}
                placeholder="nombre_columna"
                style={inputStyle(q.column.length > 0)} />
            </Field>
            <Field label="Tipo de respuesta">
              <select value={q.type} onChange={e => set({ type: e.target.value as SurveyQuestionJSON['type'], options: [] })}
                style={{ ...inputStyle(true), cursor: 'pointer' }}>
                {TYPE_OPTS.map(o => <option key={o.v} value={o.v}>{o.icon} {o.l}</option>)}
              </select>
            </Field>
          </div>

          {/* Required + Scoring dimension row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <button onClick={() => set({ required: !q.required })}
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <span style={{ width: 20, height: 20, borderRadius: 4, border: `2px solid ${q.required ? P : '#D1D5DB'}`, background: q.required ? P : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {q.required && <span style={{ color: '#fff', fontSize: 12, fontWeight: 900 }}>✓</span>}
              </span>
              <span style={{ color: '#374151', fontSize: 13 }}>Requerida</span>
            </button>
          </div>

          {/* Scoring dimension (only for scoreable types) */}
          {canScore && (
            <Field label="Dimensión de scoring">
              <select value={q.scoreDimension ?? ''} onChange={e => set({ scoreDimension: e.target.value || undefined })}
                style={{ ...inputStyle(!!q.scoreDimension), cursor: 'pointer' }}>
                {DIMENSION_OPTS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
              <p style={{ color: '#9CA3AF', fontSize: 11, margin: '4px 0 0' }}>Asigna esta respuesta a una de las 9 dimensiones de adopción IA para incluirla en el diagnóstico.</p>
            </Field>
          )}

          {/* Options */}
          {needsOptions && (
            <Field label="Opciones de respuesta">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(q.options ?? []).map((o, i) => (
                  <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ color: '#C4B5FD', fontSize: 12, minWidth: 18, textAlign: 'right', flexShrink: 0 }}>{i + 1}.</span>
                    <input value={o.label} onChange={e => setOpt(i, { label: e.target.value })}
                      placeholder={`Opción ${i + 1}`}
                      style={{ ...inputStyle(o.label.length > 0), flex: 1 }} />
                    <input value={o.score ?? ''} onChange={e => setOpt(i, { score: e.target.value === '' ? undefined : Number(e.target.value) })}
                      type="number" min={0} max={10} placeholder="pts"
                      style={{ ...inputStyle(false), width: 56, textAlign: 'center', fontSize: 12 }} title="Puntuación (0–10)" />
                    <button onClick={() => setOpt(i, { isNone: !o.isNone })}
                      title="Opción excluyente (Ninguno / No aplica)"
                      style={{ padding: '4px 8px', border: `1px solid ${o.isNone ? '#FCA5A5' : '#E5E7EB'}`, borderRadius: 6, background: o.isNone ? '#FEF2F2' : '#fff', color: o.isNone ? '#EF4444' : '#9CA3AF', fontSize: 10, cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}>
                      ⊘
                    </button>
                    <button onClick={() => removeOpt(i)}
                      style={{ width: 24, height: 24, border: '1px solid #FECACA', borderRadius: '50%', background: '#FEF2F2', color: '#EF4444', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>×</button>
                  </div>
                ))}
                <button onClick={addOpt}
                  style={{ padding: '8px', border: `1.5px dashed ${PB}`, borderRadius: 8, background: 'transparent', color: P, fontSize: 12, cursor: 'pointer', textAlign: 'center', marginTop: 2 }}>
                  + Agregar opción
                </button>
              </div>
              <p style={{ color: '#9CA3AF', fontSize: 11, margin: '6px 0 0' }}>
                <strong>pts</strong>: puntuación para scoring (0–10) &nbsp;|&nbsp; <strong>⊘</strong>: opción excluyente (ej. "Ninguna")
              </p>
            </Field>
          )}

          {/* Scale config */}
          {isScale && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 0 }}>
                <Field label="Valor mínimo">
                  <input type="number" value={q.min ?? 1} onChange={e => set({ min: Number(e.target.value) })} style={inputStyle(true)} />
                </Field>
                <Field label="Valor máximo">
                  <input type="number" value={q.max ?? 5} onChange={e => set({ max: Number(e.target.value) })} style={inputStyle(true)} />
                </Field>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 0 }}>
                <Field label={`Etiqueta extremo (${q.min ?? 1})`}>
                  <input value={q.scaleLabels?.[String(q.min ?? 1)] ?? ''} onChange={e => set({ scaleLabels: { ...(q.scaleLabels ?? {}), [String(q.min ?? 1)]: e.target.value } })} style={inputStyle(false)} placeholder="Ej. Nada" />
                </Field>
                <Field label={`Etiqueta extremo (${q.max ?? 5})`}>
                  <input value={q.scaleLabels?.[String(q.max ?? 5)] ?? ''} onChange={e => set({ scaleLabels: { ...(q.scaleLabels ?? {}), [String(q.max ?? 5)]: e.target.value } })} style={inputStyle(false)} placeholder="Ej. Totalmente" />
                </Field>
              </div>
            </>
          )}

          {/* Text config */}
          {isText && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 0 }}>
                <Field label="Mínimo de caracteres">
                  <input type="number" value={q.minLength ?? ''} onChange={e => set({ minLength: e.target.value ? Number(e.target.value) : undefined })} style={inputStyle(false)} placeholder="opcional" />
                </Field>
                <Field label="Máximo de caracteres">
                  <input type="number" value={q.maxLength ?? ''} onChange={e => set({ maxLength: e.target.value ? Number(e.target.value) : undefined })} style={inputStyle(false)} placeholder="opcional" />
                </Field>
              </div>
              <Field label="Texto de ayuda (helpText)">
                <input value={q.helpText ?? ''} onChange={e => set({ helpText: e.target.value || undefined })} style={inputStyle(false)} placeholder="Instrucción visible bajo la pregunta" />
              </Field>
            </>
          )}

          {/* Branching rule */}
          <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '14px 16px', marginTop: 4 }}>
            <p style={{ color: '#92400E', fontSize: 12, fontWeight: 700, margin: '0 0 6px' }}>🔀 Regla de visibilidad (branch)</p>
            <p style={{ color: '#9CA3AF', fontSize: 11, margin: '0 0 10px' }}>Mostrar esta pregunta solo cuando otra pregunta tenga un valor específico. Deja vacío para mostrarla siempre.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Columna condición">
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

        <div style={{ padding: '14px 24px', borderTop: '1px solid #F3F4F6', display: 'flex', gap: 10, background: '#FAFAFA' }}>
          <button onClick={onClose}
            style={{ flex: 1, padding: '11px', border: '1.5px solid #E5E7EB', borderRadius: 12, background: '#fff', color: '#6B7280', fontSize: 13, cursor: 'pointer' }}>
            Cancelar
          </button>
          <button onClick={() => valid && onSave(q)} disabled={!valid}
            style={{ flex: 2, padding: '11px', border: 'none', borderRadius: 12, background: valid ? PG : '#E5E7EB', color: valid ? '#fff' : '#9CA3AF', fontSize: 14, fontWeight: 700, cursor: valid ? 'pointer' : 'not-allowed' }}>
            {isNew ? '+ Agregar pregunta' : '💾 Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Section title editor (inline)
// ─────────────────────────────────────────────────────────────────────────────

function SectionTitleEditor({ section, onChange }: { section: SurveySectionJSON; onChange: (title: string, subtitle: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(section.title)
  const [subtitle, setSubtitle] = useState(section.subtitle ?? '')

  if (!editing) return (
    <button onClick={() => setEditing(true)} title="Editar nombre de sección"
      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', borderRadius: 4, color: '#C4B5FD', fontSize: 11 }}>✏️</button>
  )

  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flex: 1 }} onClick={e => e.stopPropagation()}>
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Nombre de sección"
        style={{ ...inputStyle(true), padding: '4px 8px', fontSize: 13, flex: 1 }} />
      <input value={subtitle} onChange={e => setSubtitle(e.target.value)} placeholder="Subtítulo (opcional)"
        style={{ ...inputStyle(false), padding: '4px 8px', fontSize: 12, flex: 1 }} />
      <button onClick={() => { onChange(title, subtitle); setEditing(false) }}
        style={{ padding: '4px 10px', border: 'none', borderRadius: 6, background: P, color: '#fff', fontSize: 12, cursor: 'pointer', flexShrink: 0 }}>OK</button>
      <button onClick={() => setEditing(false)}
        style={{ padding: '4px 8px', border: '1px solid #E5E7EB', borderRadius: 6, background: '#fff', color: '#9CA3AF', fontSize: 12, cursor: 'pointer', flexShrink: 0 }}>✕</button>
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
// Section row
// ─────────────────────────────────────────────────────────────────────────────

function SectionRow({
  section, sectionIdx, editMode, allColumns, canDelete,
  onEditQuestion, onDeleteQuestion, onAddQuestion, onMoveQuestion,
  onUpdateSectionTitle, onDeleteSection,
}: {
  section: SurveySectionJSON; sectionIdx: number; editMode: boolean
  allColumns: string[]; canDelete: boolean
  onEditQuestion: (si: number, qi: number) => void
  onDeleteQuestion: (si: number, qi: number) => void
  onAddQuestion: (si: number) => void
  onMoveQuestion: (si: number, qi: number, dir: -1 | 1) => void
  onUpdateSectionTitle: (si: number, title: string, subtitle: string) => void
  onDeleteSection: (si: number) => void
}) {
  const [open, setOpen] = useState(sectionIdx === 0)

  return (
    <div style={{ border: `1.5px solid ${PB}`, borderRadius: 14, overflow: 'hidden', marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', background: open ? PL : '#FAFAFA', borderBottom: open ? `1px solid ${PB}` : 'none' }}>
        <button onClick={() => setOpen(o => !o)} style={{ flex: 1, padding: '13px 18px', background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: P, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', flexShrink: 0 }}>§{sectionIdx + 1}</span>
          <span style={{ color: '#111827', fontSize: 14, fontWeight: 700 }}>{section.title}</span>
          {section.subtitle && <span style={{ color: '#9CA3AF', fontSize: 12 }}>{section.subtitle}</span>}
        </button>

        {editMode && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingRight: 12 }}>
            <SectionTitleEditor section={section} onChange={(t, s) => onUpdateSectionTitle(sectionIdx, t, s)} />
            {canDelete && (
              <button onClick={() => onDeleteSection(sectionIdx)} title="Eliminar sección"
                style={{ width: 22, height: 22, border: '1px solid #FECACA', borderRadius: 4, background: '#FEF2F2', color: '#EF4444', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>×</button>
            )}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingRight: editMode ? 0 : 16 }}>
          <span style={{ color: '#9CA3AF', fontSize: 11 }}>{section.questions.length} preguntas</span>
          <button onClick={() => setOpen(o => !o)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: P, fontSize: 12, padding: '4px' }}>{open ? '▲' : '▼'}</button>
        </div>
      </div>

      {open && (
        <div style={{ padding: '4px 16px 12px' }}>
          {section.questions.length === 0 && (
            <p style={{ color: '#9CA3AF', fontSize: 12, textAlign: 'center', margin: '16px 0 8px', fontStyle: 'italic' }}>Esta sección no tiene preguntas aún.</p>
          )}
          {section.questions.map((q, qi) => (
            <div key={q.id} style={{ padding: '10px 0', borderTop: qi === 0 ? 'none' : '1px solid #F3F4F6', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <span style={{ color: '#C4B5FD', fontSize: 10, fontWeight: 700, minWidth: 28, paddingTop: 3, flexShrink: 0 }}>{q.id}</span>
              <span style={{ color: '#9CA3AF', fontSize: 14, paddingTop: 2, flexShrink: 0 }} title={TYPE_LABELS[q.type]}>{TYPE_ICONS[q.type] ?? '?'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: '#374151', fontSize: 13, margin: '0 0 5px', lineHeight: 1.5 }}>{q.label || <em style={{ color: '#9CA3AF' }}>Sin texto</em>}</p>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  <span style={{ background: '#F3F4F6', color: '#6B7280', fontSize: 10, padding: '2px 7px', borderRadius: 8 }}>{TYPE_LABELS[q.type] ?? q.type}</span>
                  {q.required && <span style={{ background: '#FEF2F2', color: '#EF4444', fontSize: 10, padding: '2px 7px', borderRadius: 8 }}>requerida</span>}
                  {q.scoreDimension && <span style={{ background: '#EDE9FE', color: '#7C3AED', fontSize: 10, padding: '2px 7px', borderRadius: 8 }}>📊 {DIMENSION_OPTS.find(d => d.v === q.scoreDimension)?.l ?? q.scoreDimension}</span>}
                  {q.showIfColumn && (
                    <span style={{ background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A', fontSize: 10, padding: '2px 7px', borderRadius: 8 }}>
                      🔀 si {q.showIfColumn} = {q.showIfValue}
                    </span>
                  )}
                  {q.type === 'scale' && <span style={{ background: '#F0FDF4', color: '#16A34A', fontSize: 10, padding: '2px 7px', borderRadius: 8 }}>⟷ {q.min ?? 1}–{q.max ?? 5}</span>}
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
// Survey preview (read-only walkthrough)
// ─────────────────────────────────────────────────────────────────────────────

function SurveyPreview({ config }: { config: SurveyConfigJSON }) {
  const totalQ = config.sections.reduce((a, s) => a + s.questions.length, 0)
  return (
    <div>
      <div style={{ background: PL, border: `1px solid ${PB}`, borderRadius: 12, padding: '14px 18px', marginBottom: 16 }}>
        <p style={{ color: P, fontSize: 12, fontWeight: 700, margin: '0 0 4px' }}>Vista previa — como lo verá el participante</p>
        <p style={{ color: '#9CA3AF', fontSize: 11, margin: 0 }}>{config.sections.length} secciones · {totalQ} preguntas</p>
      </div>
      {config.sections.map((sec, si) => (
        <div key={sec.id} style={{ marginBottom: 20 }}>
          <div style={{ background: PG, borderRadius: '10px 10px 0 0', padding: '12px 18px' }}>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Sección {si + 1}</p>
            <p style={{ color: '#fff', fontSize: 14, fontWeight: 700, margin: 0 }}>{sec.title}</p>
            {sec.subtitle && <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, margin: '2px 0 0' }}>{sec.subtitle}</p>}
          </div>
          <div style={{ border: `1.5px solid ${PB}`, borderTop: 'none', borderRadius: '0 0 10px 10px', padding: '12px 18px' }}>
            {sec.questions.map((q, qi) => (
              <div key={q.id} style={{ padding: '10px 0', borderTop: qi === 0 ? 'none' : '1px solid #F3F4F6' }}>
                <p style={{ color: '#374151', fontSize: 13, fontWeight: 600, margin: '0 0 4px' }}>
                  <span style={{ color: '#C4B5FD', fontSize: 11, marginRight: 6 }}>{qi + 1}.</span>
                  {q.label}
                  {q.required && <span style={{ color: '#EF4444', marginLeft: 4 }}>*</span>}
                </p>
                {q.helpText && <p style={{ color: '#9CA3AF', fontSize: 11, margin: '0 0 6px' }}>{q.helpText}</p>}
                {q.showIfColumn && <p style={{ color: '#D97706', fontSize: 10, margin: '0 0 4px' }}>🔀 Visible si: {q.showIfColumn} = {q.showIfValue}</p>}
                {(q.type === 'single_select' || q.type === 'multi_select') && q.options && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {q.options.map((o, oi) => (
                      <div key={oi} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', border: '1px solid #E5E7EB', borderRadius: 8, background: '#FAFAFA' }}>
                        <span style={{ width: 14, height: 14, borderRadius: q.type === 'single_select' ? '50%' : 3, border: '1.5px solid #C4B5FD', background: '#fff', flexShrink: 0 }} />
                        <span style={{ color: '#374151', fontSize: 12 }}>{o.label || `Opción ${oi + 1}`}</span>
                        {o.score != null && <span style={{ color: '#C4B5FD', fontSize: 10, marginLeft: 'auto' }}>{o.score}pts</span>}
                        {o.isNone && <span style={{ color: '#9CA3AF', fontSize: 10 }}>⊘</span>}
                      </div>
                    ))}
                  </div>
                )}
                {q.type === 'scale' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: '#9CA3AF', fontSize: 11 }}>{q.scaleLabels?.[String(q.min ?? 1)] || String(q.min ?? 1)}</span>
                    <div style={{ flex: 1, height: 4, background: PB, borderRadius: 99, position: 'relative' }}>
                      <div style={{ width: '50%', height: '100%', background: PG, borderRadius: 99 }} />
                    </div>
                    <span style={{ color: '#9CA3AF', fontSize: 11 }}>{q.scaleLabels?.[String(q.max ?? 5)] || String(q.max ?? 5)}</span>
                  </div>
                )}
                {(q.type === 'short_text' || q.type === 'email') && (
                  <div style={{ height: 32, border: '1px solid #E5E7EB', borderRadius: 8, background: '#FAFAFA' }} />
                )}
                {q.type === 'long_text' && (
                  <div style={{ height: 64, border: '1px solid #E5E7EB', borderRadius: 8, background: '#FAFAFA' }} />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main modal
// ─────────────────────────────────────────────────────────────────────────────

type Step = 'templates' | 'prompt' | 'editor' | 'preview'

export default function SurveyDesignerModal({
  campaignId, campaignName, currentConfig, currentDraft, configStatus,
  allCampaigns, auth, onClose, onSaved,
}: Props) {
  const hasPublished: boolean = !!(currentConfig && typeof currentConfig === 'object' && (currentConfig as Record<string, unknown>).version === 1)
  const hasDraft: boolean = !!(currentDraft && typeof currentDraft === 'object' && (currentDraft as Record<string, unknown>).version === 1)

  // Start on editor if there's already a draft or published config
  const initialStep: Step = hasDraft ? 'editor' : hasPublished ? 'editor' : 'templates'
  const initialConfig: SurveyConfigJSON | null = hasDraft
    ? (currentDraft as SurveyConfigJSON)
    : hasPublished ? (currentConfig as SurveyConfigJSON) : null

  const [step, setStep] = useState<Step>(initialStep)
  const [prompt, setPrompt] = useState<string>(initialConfig?.promptUsed ?? '')
  const [config, setConfig] = useState<SurveyConfigJSON | null>(initialConfig)
  const [generating, setGenerating] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [autoSaving, setAutoSaving] = useState(false)
  const [status, setStatus] = useState<ConfigStatus>((configStatus as ConfigStatus) ?? 'default')
  const [error, setError] = useState('')
  const [publishing, setPublishing] = useState(false)
  const [editTarget, setEditTarget] = useState<{ si: number; qi: number } | null>(null)
  const [addTarget, setAddTarget] = useState<number | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const bodyRef = useRef<HTMLDivElement>(null)
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const templates = allCampaigns.filter(c =>
    c.id !== campaignId &&
    c.survey_config &&
    (c.survey_config as Record<string, unknown>).version === 1
  )

  const totalQuestions = config?.sections.reduce((a, s) => a + s.questions.length, 0) ?? 0
  const allColumns = config?.sections.flatMap(s => s.questions.map(q => q.column)) ?? []

  // ── Auto-save draft ────────────────────────────────────────────────────────

  const saveDraft = useCallback(async (cfg: SurveyConfigJSON) => {
    setAutoSaving(true)
    try {
      await fetch('/api/survey/campaigns', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: auth },
        body: JSON.stringify({ id: campaignId, draft_config: cfg, config_status: 'draft' }),
      })
      setStatus('draft')
      setDirty(false)
    } catch (_) {
      // silent — will retry on next change
    } finally {
      setAutoSaving(false)
    }
  }, [auth, campaignId])

  useEffect(() => {
    if (!dirty || !config) return
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => saveDraft(config), 1500)
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current) }
  }, [config, dirty, saveDraft])

  // ── Mutations ──────────────────────────────────────────────────────────────

  const mutate = (fn: (d: SurveyConfigJSON) => void) => {
    setConfig(prev => {
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

  const updateSectionTitle = (si: number, title: string, subtitle: string) =>
    mutate(d => { d.sections[si].title = title; d.sections[si].subtitle = subtitle || undefined })

  const deleteSection = (si: number) =>
    mutate(d => { d.sections.splice(si, 1) })

  const addSection = () =>
    mutate(d => {
      d.sections.push({ id: `sec_${Date.now()}`, title: 'Nueva sección', questions: [] })
    })

  // ── Load template ──────────────────────────────────────────────────────────

  const loadTemplate = (tmpl: SurveyConfigJSON, sourceName: string) => {
    const copy: SurveyConfigJSON = JSON.parse(JSON.stringify(tmpl))
    copy.generatedAt = new Date().toISOString()
    copy.promptUsed = `Copiado de: ${sourceName}`
    setConfig(copy)
    setDirty(true)
    setStep('editor')
    bodyRef.current?.scrollTo({ top: 0 })
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
      // Auto-save immediately to survey_config (makes it visible even if modal is closed)
      await fetch('/api/survey/campaigns', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: auth },
        body: JSON.stringify({ id: campaignId, survey_config: data.config, draft_config: data.config, config_status: 'draft' }),
      })
      setConfig(data.config)
      setStatus('draft')
      setDirty(false)
      setEditMode(false)
      setStep('editor')
      bodyRef.current?.scrollTo({ top: 0 })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al generar encuesta')
    } finally {
      setGenerating(false)
    }
  }

  // ── Publish ────────────────────────────────────────────────────────────────

  const publish = async () => {
    if (!config) return
    setPublishing(true)
    setError('')
    try {
      await fetch('/api/survey/campaigns', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: auth },
        body: JSON.stringify({ id: campaignId, survey_config: config, draft_config: config, config_status: 'published' }),
      })
      setStatus('published')
      setDirty(false)
      onSaved()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al publicar')
    } finally {
      setPublishing(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const editingQ = editTarget !== null && config
    ? config.sections[editTarget.si]?.questions[editTarget.qi]
    : null

  const addingQ = addTarget !== null && config
    ? newQuestion(config.sections)
    : null

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
        <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 720, maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(124,58,237,0.25)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div style={{ background: PG, padding: '18px 24px 0', flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 10, margin: '0 0 2px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Diseñador de encuesta</p>
                <h2 style={{ color: '#fff', fontSize: 16, fontWeight: 800, margin: 0 }}>{campaignName}</h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <StatusChip status={status} saving={autoSaving} />
                <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: 28, height: 28, borderRadius: '50%', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
              </div>
            </div>

            {/* Tab bar */}
            <div style={{ display: 'flex', gap: 4 }}>
              {[
                { key: 'templates', label: '📋 Plantillas' },
                { key: 'prompt', label: '✨ Generar con IA' },
                { key: 'editor', label: `📝 Editor${config ? ` (${totalQuestions}p)` : ''}`, disabled: !config },
                { key: 'preview', label: '👁 Vista previa', disabled: !config },
              ].map(({ key, label, disabled }) => (
                <button key={key} disabled={!!disabled}
                  onClick={() => { if (!disabled) { setStep(key as Step); setShowPreview(key === 'preview') } }}
                  style={{ fontSize: 11, padding: '6px 14px', borderRadius: '8px 8px 0 0', background: step === key ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.15)', color: disabled ? 'rgba(255,255,255,0.3)' : step === key ? P : '#fff', fontWeight: step === key ? 700 : 400, border: 'none', cursor: disabled ? 'default' : 'pointer', marginBottom: 0 }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Body */}
          <div ref={bodyRef} style={{ flex: 1, overflowY: 'auto', padding: '22px 24px' }}>

            {/* TEMPLATES tab */}
            {step === 'templates' && (
              <div>
                {/* Official templates */}
                <p style={{ color: '#9CA3AF', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 10px' }}>📌 Plantillas oficiales Human.AiX</p>
                {BUILT_IN_TEMPLATES.map(t => {
                  const qCount = t.config.sections.reduce((a, s) => a + s.questions.length, 0)
                  return (
                    <button key={t.id} onClick={() => loadTemplate(t.config, t.name)}
                      style={{ width: '100%', padding: '14px 18px', border: `2px solid ${PB}`, borderRadius: 12, background: PL, textAlign: 'left', cursor: 'pointer', marginBottom: 8, display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                      <span style={{ padding: '4px 8px', borderRadius: 6, background: PG, color: '#fff', fontSize: 10, fontWeight: 800, letterSpacing: '0.05em', flexShrink: 0, marginTop: 2 }}>{t.badge}</span>
                      <div style={{ flex: 1, textAlign: 'left' }}>
                        <p style={{ color: P, fontSize: 13, fontWeight: 700, margin: '0 0 3px', lineHeight: 1.4 }}>{t.name}</p>
                        <p style={{ color: '#9CA3AF', fontSize: 11, margin: 0 }}>{t.description}</p>
                      </div>
                      <span style={{ color: P, fontSize: 18, flexShrink: 0, paddingTop: 2 }}>→</span>
                    </button>
                  )
                })}

                {/* Generate new */}
                <div style={{ margin: '18px 0 10px', borderTop: '1px solid #F3F4F6', paddingTop: 18 }}>
                  <p style={{ color: '#9CA3AF', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 10px' }}>✨ Crear desde cero</p>
                  <button onClick={() => setStep('prompt')}
                    style={{ width: '100%', padding: '12px 18px', border: `1.5px dashed ${PB}`, borderRadius: 12, background: '#fff', textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ color: P, fontSize: 13, fontWeight: 600, margin: '0 0 2px' }}>Generar encuesta personalizada con IA</p>
                      <p style={{ color: '#9CA3AF', fontSize: 12, margin: 0 }}>Claude crea preguntas a medida según tus instrucciones</p>
                    </div>
                    <span style={{ color: P, fontSize: 18, flexShrink: 0 }}>→</span>
                  </button>
                </div>

                {/* From other campaigns */}
                {templates.length > 0 && (
                  <>
                    <p style={{ color: '#9CA3AF', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '18px 0 10px' }}>🗂 Copiar de otra campaña</p>
                    {templates.map(c => {
                      const cfg = c.survey_config as unknown as SurveyConfigJSON
                      const qCount = cfg.sections?.reduce((a: number, s: SurveySectionJSON) => a + s.questions.length, 0) ?? 0
                      return (
                        <button key={c.id} onClick={() => loadTemplate(cfg, c.nombre)}
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
              </div>
            )}

            {/* GENERATE tab */}
            {step === 'prompt' && (
              <div>
                {hasPublished && (
                  <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
                    <p style={{ color: '#92400E', fontSize: 12, margin: 0 }}>⚠️ Generar una nueva encuesta reemplazará el borrador actual. La encuesta publicada no cambia hasta que hagas clic en "Publicar".</p>
                  </div>
                )}
                <label style={{ display: 'block', color: '#374151', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Describe la encuesta que necesitas</label>
                <p style={{ color: '#9CA3AF', fontSize: 12, margin: '0 0 10px', lineHeight: 1.6 }}>
                  Incluye: perfil de los participantes, temas a medir, duración esperada y cualquier requerimiento específico.
                </p>
                <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={10} disabled={generating}
                  placeholder="Ej: Los participantes son gerentes de área con equipos de 5–20 personas. Quiero medir su familiaridad actual con IA, las herramientas que ya usan, y qué barreras enfrentan para adoptar IA en sus procesos. La empresa es de logística y distribución. Necesito ~15 preguntas en 3 secciones."
                  style={{ width: '100%', padding: '13px', border: `1.5px solid ${prompt.trim() ? PB : '#E5E7EB'}`, borderRadius: 12, fontSize: 13, color: '#374151', resize: 'vertical', outline: 'none', boxSizing: 'border-box', background: generating ? '#F9FAFB' : prompt.trim() ? PL : '#fff', lineHeight: 1.6, fontFamily: 'inherit', opacity: generating ? 0.6 : 1 }}
                />
                {generating && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14, padding: '12px 16px', background: PL, borderRadius: 10, border: `1px solid ${PB}` }}>
                    <span style={{ width: 18, height: 18, border: `2px solid ${PB}`, borderTopColor: P, borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block', flexShrink: 0 }} />
                    <div>
                      <p style={{ color: P, fontSize: 13, fontWeight: 700, margin: 0 }}>Generando con IA…</p>
                      <p style={{ color: '#9CA3AF', fontSize: 11, margin: '2px 0 0' }}>10–25 seg. Se guardará como borrador automáticamente.</p>
                    </div>
                  </div>
                )}
                {error && <p style={{ color: '#EF4444', fontSize: 13, marginTop: 10 }}>{error}</p>}
              </div>
            )}

            {/* EDITOR tab */}
            {step === 'editor' && config && !showPreview && (
              <div>
                {/* Stats bar */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                  <div style={{ background: PL, border: `1px solid ${PB}`, borderRadius: 8, padding: '5px 12px', textAlign: 'center' }}>
                    <p style={{ color: '#9CA3AF', fontSize: 9, margin: '0 0 1px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Secciones</p>
                    <p style={{ color: P, fontSize: 16, fontWeight: 800, margin: 0 }}>{config.sections.length}</p>
                  </div>
                  <div style={{ background: PL, border: `1px solid ${PB}`, borderRadius: 8, padding: '5px 12px', textAlign: 'center' }}>
                    <p style={{ color: '#9CA3AF', fontSize: 9, margin: '0 0 1px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Preguntas</p>
                    <p style={{ color: P, fontSize: 16, fontWeight: 800, margin: 0 }}>{totalQuestions}</p>
                  </div>
                  {config.generatedAt && (
                    <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: '5px 12px' }}>
                      <p style={{ color: '#9CA3AF', fontSize: 9, margin: '0 0 1px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Última edición</p>
                      <p style={{ color: '#374151', fontSize: 11, fontWeight: 600, margin: 0 }}>{new Date(config.generatedAt).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}</p>
                    </div>
                  )}
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                    <button onClick={() => { setEditMode(m => !m) }}
                      style={{ padding: '5px 12px', border: `1.5px solid ${editMode ? P : '#E5E7EB'}`, borderRadius: 8, background: editMode ? PL : '#fff', color: editMode ? P : '#6B7280', fontSize: 12, fontWeight: editMode ? 700 : 400, cursor: 'pointer' }}>
                      {editMode ? '✓ Modo edición' : '✏️ Editar'}
                    </button>
                  </div>
                </div>

                {editMode && (
                  <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: '8px 14px', marginBottom: 12, fontSize: 12, color: '#92400E', lineHeight: 1.5 }}>
                    ✏️ para editar · ▲▼ para reordenar · × para eliminar · Los cambios se guardan como borrador automáticamente.
                  </div>
                )}

                {config.sections.map((section, si) => (
                  <SectionRow
                    key={section.id} section={section} sectionIdx={si}
                    editMode={editMode} allColumns={allColumns}
                    canDelete={config.sections.length > 1}
                    onEditQuestion={(s, q) => setEditTarget({ si: s, qi: q })}
                    onDeleteQuestion={deleteQuestion}
                    onAddQuestion={s => setAddTarget(s)}
                    onMoveQuestion={moveQuestion}
                    onUpdateSectionTitle={updateSectionTitle}
                    onDeleteSection={deleteSection}
                  />
                ))}

                {editMode && (
                  <button onClick={addSection}
                    style={{ width: '100%', padding: '10px', border: `2px dashed ${PB}`, borderRadius: 10, background: 'transparent', color: P, fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'center', marginTop: 4 }}>
                    + Agregar sección
                  </button>
                )}

                {error && <p style={{ color: '#EF4444', fontSize: 13, marginTop: 10 }}>{error}</p>}
              </div>
            )}

            {/* PREVIEW tab */}
            {(step === 'preview' || showPreview) && config && (
              <SurveyPreview config={config} />
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: '12px 24px', borderTop: '1px solid #F3F4F6', flexShrink: 0, display: 'flex', gap: 10, background: '#FAFAFA' }}>
            {step === 'templates' && (
              <button onClick={onClose}
                style={{ flex: 1, padding: '10px', border: '1.5px solid #E5E7EB', borderRadius: 12, background: '#fff', color: '#6B7280', fontSize: 13, cursor: 'pointer' }}>
                Cerrar
              </button>
            )}

            {step === 'prompt' && (
              <>
                <button onClick={() => setStep(config ? 'editor' : 'templates')}
                  style={{ flex: 1, padding: '10px', border: '1.5px solid #E5E7EB', borderRadius: 12, background: '#fff', color: '#6B7280', fontSize: 13, cursor: 'pointer' }}>
                  ← Volver
                </button>
                <button onClick={generate} disabled={!prompt.trim() || generating}
                  style={{ flex: 2, padding: '10px', border: 'none', borderRadius: 12, background: prompt.trim() && !generating ? PG : '#E5E7EB', color: prompt.trim() && !generating ? '#fff' : '#9CA3AF', fontSize: 14, fontWeight: 700, cursor: prompt.trim() && !generating ? 'pointer' : 'not-allowed' }}>
                  {generating ? '⟳ Generando…' : '✨ Generar encuesta'}
                </button>
              </>
            )}

            {(step === 'editor' || step === 'preview') && config && (
              <>
                <button onClick={() => setStep('prompt')}
                  style={{ padding: '10px 16px', border: '1.5px solid #E5E7EB', borderRadius: 12, background: '#fff', color: '#6B7280', fontSize: 12, cursor: 'pointer' }}>
                  ↩ Regenerar
                </button>
                <div style={{ flex: 1 }} />
                {dirty && (
                  <span style={{ color: '#9CA3AF', fontSize: 12, alignSelf: 'center' }}>
                    {autoSaving ? '⟳ Guardando borrador…' : '● Cambios sin publicar'}
                  </span>
                )}
                <button onClick={publish} disabled={publishing}
                  style={{ padding: '10px 20px', border: 'none', borderRadius: 12, background: publishing ? '#E5E7EB' : PG, color: publishing ? '#9CA3AF' : '#fff', fontSize: 13, fontWeight: 700, cursor: publishing ? 'not-allowed' : 'pointer' }}>
                  {publishing ? '⟳ Publicando…' : status === 'published' && !dirty ? '✅ Publicada' : '🚀 Publicar encuesta'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Question editor sub-modal */}
      {editTarget !== null && editingQ && (
        <QuestionEditor
          question={editingQ} isNew={false} allColumns={allColumns}
          onSave={q => { updateQuestion(editTarget.si, editTarget.qi, q); setEditTarget(null) }}
          onClose={() => setEditTarget(null)}
        />
      )}

      {addTarget !== null && addingQ && (
        <QuestionEditor
          question={addingQ} isNew={true} allColumns={allColumns}
          onSave={q => { addQuestion(addTarget, q); setAddTarget(null) }}
          onClose={() => setAddTarget(null)}
        />
      )}
    </>
  )
}
