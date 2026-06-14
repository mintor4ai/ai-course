export interface Participant {
  id?: string
  name: string
  position: string
  department: string
  email: string
  created_at?: string
}

export interface Response {
  id?: string
  participant_id: string
  step: number
  data: Record<string, unknown>
  created_at?: string
}

export interface Diagnostic {
  id?: string
  participant_id: string
  html_content?: string
  plan_90_days?: string
  sent_at?: string
  created_at?: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ImpactAnswers {
  hoursPerWeek?: string
  urgency?: string
  teamSize?: string
  aiUsage?: string
}

export interface AppState {
  step: number
  participant: Participant | null
  participantId: string | null
  selectedTopics: string[]
  chatMessages: ChatMessage[]
  impactAnswers: ImpactAnswers
  plan90Days: string | null
  diagnosticSent: boolean
}

export type StepAction =
  | { type: 'SET_PARTICIPANT'; payload: { participant: Participant; id: string } }
  | { type: 'SET_TOPICS'; payload: string[] }
  | { type: 'SET_CHAT_MESSAGES'; payload: ChatMessage[] }
  | { type: 'SET_IMPACT_ANSWERS'; payload: ImpactAnswers }
  | { type: 'SET_PLAN'; payload: string }
  | { type: 'SET_DIAGNOSTIC_SENT' }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'RESET' }
