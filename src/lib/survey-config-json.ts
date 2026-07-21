import { Section, Question, Answers, SURVEY_SECTIONS } from './survey-config'

// ── JSON-serializable types for survey_config stored in Supabase ─────────────

export interface SurveyOptionJSON {
  value: string
  label: string
  score?: number | null
  isNone?: boolean
}

export interface SurveyQuestionJSON {
  id: string
  column: string
  label: string
  type: 'short_text' | 'email' | 'single_select' | 'multi_select' | 'scale' | 'long_text'
  required: boolean
  options?: SurveyOptionJSON[]
  conditionalOther?: string
  showIfColumn?: string
  showIfValue?: string
  scoreDimension?: string
  min?: number
  max?: number
  minLength?: number
  maxLength?: number
  helpText?: string
  scaleLabels?: Record<string, string>
  highValueOptions?: string[]
}

export interface SurveySectionJSON {
  id: string
  title: string
  subtitle?: string
  questions: SurveyQuestionJSON[]
}

export interface SurveyConfigJSON {
  version: 1
  sections: SurveySectionJSON[]
  generatedAt?: string
  promptUsed?: string
}

// ── Convert a stored JSON config to the runtime Section[] format ─────────────

function questionFromJSON(q: SurveyQuestionJSON): Question {
  const showIf = q.showIfColumn && q.showIfValue
    ? (a: Answers) => a[q.showIfColumn!] === q.showIfValue
    : undefined

  const scaleLabels = q.scaleLabels
    ? Object.fromEntries(Object.entries(q.scaleLabels).map(([k, v]) => [Number(k), v])) as Record<number, string>
    : undefined

  return {
    id: q.id,
    column: q.column,
    label: q.label,
    type: q.type,
    required: q.required,
    ...(q.options ? { options: q.options } : {}),
    ...(q.conditionalOther ? { conditionalOther: q.conditionalOther } : {}),
    ...(showIf ? { showIf } : {}),
    ...(q.scoreDimension ? { scoreDimension: q.scoreDimension } : {}),
    ...(q.min !== undefined ? { min: q.min } : {}),
    ...(q.max !== undefined ? { max: q.max } : {}),
    ...(q.minLength !== undefined ? { minLength: q.minLength } : {}),
    ...(q.maxLength !== undefined ? { maxLength: q.maxLength } : {}),
    ...(q.helpText ? { helpText: q.helpText } : {}),
    ...(scaleLabels ? { scaleLabels } : {}),
    ...(q.highValueOptions ? { highValueOptions: q.highValueOptions } : {}),
  }
}

export function resolveSurveyConfig(config: unknown): Section[] {
  if (!config || typeof config !== 'object') return SURVEY_SECTIONS
  const c = config as Record<string, unknown>
  if (!c.version || !Array.isArray(c.sections) || c.sections.length === 0) return SURVEY_SECTIONS

  return (c.sections as SurveySectionJSON[]).map(s => ({
    id: s.id,
    title: s.title,
    ...(s.subtitle ? { subtitle: s.subtitle } : {}),
    questions: s.questions.map(questionFromJSON),
  }))
}

export function isCustomConfig(config: unknown): config is SurveyConfigJSON {
  if (!config || typeof config !== 'object') return false
  const c = config as Record<string, unknown>
  return c.version === 1 && Array.isArray(c.sections) && (c.sections as unknown[]).length > 0
}
