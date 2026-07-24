import { Answers, SURVEY_SECTIONS } from './survey-config'

export interface ScoreResult {
  profileName: string
  profileScore: number
  courseLevel: 'foundational' | 'intermediate' | 'advanced'
  possibleAiChampion: boolean
  dimensions: {
    ai_adoption: number
    tool_exposure: number
    context_engineering: number
    specification_maturity: number
    documentation_maturity: number
    agent_readiness: number
    team_adoption: number
    ai_leadership: number
    change_readiness: number
  }
}

// Normalize a raw score to 0-100
function norm(value: number, max: number): number {
  if (max === 0) return 0
  return Math.round((value / max) * 100)
}

// Score a single_select question using option.score
function scoreSingle(answers: Answers, column: string, maxScore: number): number {
  const val = answers[column] as string | undefined
  if (!val) return 0
  for (const section of SURVEY_SECTIONS) {
    for (const q of section.questions) {
      if (q.column === column && q.options) {
        const opt = q.options.find(o => o.value === val)
        const s = opt?.score
        if (s === null || s === undefined) return 0
        return norm(s, maxScore)
      }
    }
  }
  return 0
}

// Score a scale question (min-max already known)
function scoreScale(answers: Answers, column: string, min: number, max: number): number {
  const val = answers[column] as number | undefined
  if (val === undefined || val === null) return 0
  return norm(val - min, max - min)
}

// Score a multi_select question using highValueOptions count
function scoreMulti(answers: Answers, column: string, highValueOptions: string[], maxCount: number): number {
  const val = answers[column] as string[] | undefined
  if (!val || !Array.isArray(val)) return 0
  const hits = val.filter(v => highValueOptions.includes(v)).length
  return norm(Math.min(hits, maxCount), maxCount)
}

// Score Q06 (tool exposure): count distinct tools, max 5
function scoreToolsUsed(answers: Answers): number {
  const tools = answers['ai_tools_used'] as string[] | undefined
  if (!tools || !Array.isArray(tools)) return 0
  const realTools = tools.filter(t => t !== 'none')
  return norm(Math.min(realTools.length, 5), 5)
}

// Score Q07 (use cases): count use cases, max 6
function scoreUseCases(answers: Answers): number {
  const cases = answers['current_ai_use_cases'] as string[] | undefined
  if (!cases || !Array.isArray(cases)) return 0
  const realCases = cases.filter(t => t !== 'none')
  return norm(Math.min(realCases.length, 6), 6)
}

// Score Q09 context engineering: count high-value options
const Q09_HIGH = [
  'task_objective', 'related_code', 'business_rules', 'system_architecture',
  'team_conventions', 'expected_output_examples', 'technical_restrictions',
  'acceptance_criteria', 'required_tests',
]

// Score Q11 specification elements: count of options selected (max 8)
const Q11_HIGH = [
  'requirement_objective', 'business_context', 'current_flow', 'expected_inputs_outputs',
  'business_rules', 'affected_systems', 'technical_constraints', 'exception_cases',
  'acceptance_criteria', 'required_tests', 'expected_output_examples',
]

// Score Q13 documentation types: count (max 8)
const Q13_HIGH = [
  'architecture_description', 'module_documentation', 'business_rules_documentation',
  'data_dictionary', 'api_documentation', 'development_conventions', 'coding_standards',
  'test_cases', 'deployment_procedures', 'architecture_decision_records',
  'process_or_architecture_diagrams', 'definition_of_done',
]

// Score Q17 team rules (agent readiness): high-value options
const Q17_HIGH = [
  'naming_conventions', 'folder_structure', 'architecture_patterns', 'database_rules',
  'error_handling', 'security_and_data_access', 'required_tests', 'code_review',
  'documentation_guidelines', 'definition_of_done',
]

export function calculateScores(answers: Answers): ScoreResult {
  // ai_adoption: Q05 (0-5) + Q08 (1-5) → avg normalized to 100
  const q05 = scoreSingle(answers, 'ai_usage_frequency', 5)
  const q08 = scoreScale(answers, 'ai_confidence_level', 1, 5)
  const ai_adoption = Math.round((q05 + q08) / 2)

  // tool_exposure: Q06 (tools count) + Q07 (use cases count) → avg
  const q06 = scoreToolsUsed(answers)
  const q07 = scoreUseCases(answers)
  const tool_exposure = Math.round((q06 + q07) / 2)

  // context_engineering: Q09 high-value count (max 9)
  const context_engineering = scoreMulti(answers, 'ai_context_elements_provided', Q09_HIGH, 9)

  // specification_maturity: Q10 (0-4) + Q11 (multi, max 8) → avg
  const q10 = scoreSingle(answers, 'requirements_clarity_level', 4)
  const q11 = scoreMulti(answers, 'required_specification_elements', Q11_HIGH, 8)
  const specification_maturity = Math.round((q10 + q11) / 2)

  // documentation_maturity: Q12(0-5) + Q13(multi) + Q14(0-5) + Q15(1-5) + Q16(0-5) → avg of 5
  const q12 = scoreSingle(answers, 'repository_documentation_maturity', 5)
  const q13 = scoreMulti(answers, 'documentation_types_available', Q13_HIGH, 8)
  const q14 = scoreSingle(answers, 'primary_system_knowledge_source', 5)
  const q15 = scoreScale(answers, 'documentation_comprehensibility_score', 1, 5)
  const q16 = scoreSingle(answers, 'documentation_update_practice', 5)
  const documentation_maturity = Math.round((q12 + q13 + q14 + q15 + q16) / 5)

  // agent_readiness: Q17 high-value count (max 10)
  const agent_readiness = scoreMulti(answers, 'documented_team_rules', Q17_HIGH, 10)

  // team_adoption: Q19 (0-5)
  const team_adoption = scoreSingle(answers, 'team_ai_adoption_level', 5)

  // ai_leadership: Q20 (0-5)
  const ai_leadership = scoreSingle(answers, 'ai_practice_sharing_behavior', 5)

  // change_readiness: Q24 (1-5)
  const change_readiness = scoreScale(answers, 'post_course_experimentation_readiness', 1, 5)

  // Weighted composite
  const profileScore = Math.round(
    ai_adoption * 0.20 +
    tool_exposure * 0.10 +
    context_engineering * 0.15 +
    specification_maturity * 0.15 +
    documentation_maturity * 0.20 +
    Math.round((agent_readiness + team_adoption + ai_leadership) / 3) * 0.15 +
    change_readiness * 0.05
  )

  // Profile name by role
  const role = answers['participant_role'] as string | undefined
  const profileName = getProfileName(profileScore, role)

  // Course level
  const courseLevel: ScoreResult['courseLevel'] =
    profileScore < 35 ? 'foundational' : profileScore < 70 ? 'intermediate' : 'advanced'

  // AI Champion detection
  const possibleAiChampion = detectAiChampion(answers, {
    ai_adoption, context_engineering, documentation_maturity, agent_readiness,
    team_adoption, ai_leadership, change_readiness,
  })

  return {
    profileName, profileScore, courseLevel, possibleAiChampion,
    dimensions: {
      ai_adoption, tool_exposure, context_engineering, specification_maturity,
      documentation_maturity, agent_readiness, team_adoption, ai_leadership, change_readiness,
    },
  }
}

function getProfileName(score: number, role?: string): string {
  const roleSuffix: Record<string, string> = {
    developer: 'Developer',
    architect: 'Architect',
    tech_lead: 'Tech Lead',
    functional: 'Analyst',
    other_tech: 'Professional',
  }

  if (score < 25) return 'AI Explorer'
  if (score < 50) return 'AI Practitioner'
  if (score < 75) {
    return 'AI-Enhanced'
  }
  return 'AI Champion'
}

interface DimScores {
  ai_adoption: number
  context_engineering: number
  documentation_maturity: number
  agent_readiness: number
  team_adoption: number
  ai_leadership: number
  change_readiness: number
}

type GenericQuestion = {
  column: string
  type: string
  scoreDimension?: string
  min?: number
  max?: number
  options?: Array<{ value: string; score?: number | null }>
  highValueOptions?: string[]
}

type GenericSection = {
  questions: GenericQuestion[]
}

export function calculateScoresGeneric(
  answers: Answers,
  sections: GenericSection[]
): ScoreResult {
  // Collect per-dimension score arrays
  const dimBuckets: Record<string, number[]> = {}

  for (const section of sections) {
    for (const q of section.questions) {
      if (!q.scoreDimension) continue

      const dim = q.scoreDimension
      let score: number | null = null

      if (q.type === 'single_select' && q.options && q.options.length > 0) {
        const val = answers[q.column] as string | undefined
        if (val) {
          const scores = q.options
            .map(o => o.score)
            .filter((s): s is number => s !== null && s !== undefined)
          const maxScore = scores.length > 0 ? Math.max(...scores) : 0
          if (maxScore > 0) {
            const opt = q.options.find(o => o.value === val)
            const s = opt?.score
            if (s !== null && s !== undefined) {
              score = Math.round((s / maxScore) * 100)
            }
          }
        }
      } else if (q.type === 'scale') {
        const val = answers[q.column] as number | undefined
        if (val !== undefined && val !== null) {
          const min = q.min ?? 1
          const max = q.max ?? 5
          score = max > min ? Math.round(((val - min) / (max - min)) * 100) : 0
        }
      } else if (q.type === 'multi_select') {
        const val = answers[q.column] as string[] | undefined
        if (val && Array.isArray(val)) {
          if (q.highValueOptions && q.highValueOptions.length > 0) {
            const hits = val.filter(v => q.highValueOptions!.includes(v)).length
            score = Math.round((hits / q.highValueOptions.length) * 100)
          } else if (q.options && q.options.length > 0) {
            const nonNone = val.filter(v => v !== 'none').length
            score = Math.round((nonNone / q.options.length) * 100)
          }
        }
      }

      if (score !== null) {
        if (!dimBuckets[dim]) dimBuckets[dim] = []
        dimBuckets[dim].push(score)
      }
    }
  }

  // Average within each dimension
  const dimScores: Record<string, number> = {}
  for (const [dim, scores] of Object.entries(dimBuckets)) {
    if (scores.length > 0) {
      dimScores[dim] = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    }
  }

  // Profile score: average of all dimension scores
  const dimValues = Object.values(dimScores)
  const profileScore = dimValues.length > 0
    ? Math.round(dimValues.reduce((a, b) => a + b, 0) / dimValues.length)
    : 0

  // Build standard dimensions, defaulting missing ones to 0
  const stdDims: ScoreResult['dimensions'] = {
    ai_adoption: dimScores['ai_adoption'] ?? 0,
    tool_exposure: dimScores['tool_exposure'] ?? 0,
    context_engineering: dimScores['context_engineering'] ?? 0,
    specification_maturity: dimScores['specification_maturity'] ?? 0,
    documentation_maturity: dimScores['documentation_maturity'] ?? 0,
    agent_readiness: dimScores['agent_readiness'] ?? 0,
    team_adoption: dimScores['team_adoption'] ?? 0,
    ai_leadership: dimScores['ai_leadership'] ?? 0,
    change_readiness: dimScores['change_readiness'] ?? 0,
  }

  const role = answers['participant_role'] as string | undefined
  const profileName = getProfileName(profileScore, role)

  const courseLevel: ScoreResult['courseLevel'] =
    profileScore < 35 ? 'foundational' : profileScore < 70 ? 'intermediate' : 'advanced'

  const possibleAiChampion = detectAiChampion(answers, {
    ai_adoption: stdDims.ai_adoption,
    context_engineering: stdDims.context_engineering,
    documentation_maturity: stdDims.documentation_maturity,
    agent_readiness: stdDims.agent_readiness,
    team_adoption: stdDims.team_adoption,
    ai_leadership: stdDims.ai_leadership,
    change_readiness: stdDims.change_readiness,
  })

  return {
    profileName,
    profileScore,
    courseLevel,
    possibleAiChampion,
    dimensions: stdDims,
  }
}

function detectAiChampion(answers: Answers, dims: DimScores): boolean {
  let flags = 0

  // 1. High ai adoption (daily or embedded)
  const freq = answers['ai_usage_frequency'] as string | undefined
  if (freq === 'daily' || freq === 'embedded_in_workflow') flags++

  // 2. High context engineering (≥7 high-value elements)
  const ctxItems = answers['ai_context_elements_provided'] as string[] | undefined
  const ctxHits = (ctxItems ?? []).filter(v => Q09_HIGH.includes(v)).length
  if (ctxHits >= 7) flags++

  // 3. High confidence (4 or 5)
  const conf = answers['ai_confidence_level'] as number | undefined
  if (conf !== undefined && conf >= 4) flags++

  // 4. Uses ≥5 different tools
  const tools = (answers['ai_tools_used'] as string[] | undefined ?? []).filter(t => t !== 'none')
  if (tools.length >= 5) flags++

  // 5. Shares/documents AI practices
  const sharing = answers['ai_practice_sharing_behavior'] as string | undefined
  if (sharing === 'document_example' || sharing === 'present_to_team' ||
      sharing === 'convert_to_reusable_practice' || sharing === 'incorporate_into_team_process') flags++

  // 6. High team adoption
  if (dims.team_adoption >= 75) flags++

  // 7. Agent readiness ≥75 (most team rules documented)
  if (dims.agent_readiness >= 75) flags++

  // 8. High change readiness (5)
  const readiness = answers['post_course_experimentation_readiness'] as number | undefined
  if (readiness === 5) flags++

  return flags >= 3
}
