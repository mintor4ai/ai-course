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
  html_content: string
  plan_90_days: string
  sent_at?: string
  created_at?: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AppState {
  step: number
  participant: Participant | null
  participantId: string | null
  selectedTopics: string[]
  chatMessages: ChatMessage[]
  impactAnswers: Record<string, string>
  plan90Days: string
  diagnosticHtml: string
}

export interface ImpactQuestion {
  id: string
  question: string
  options: string[]
}

export const IMPACT_QUESTIONS: ImpactQuestion[] = [
  {
    id: 'weekly_hours',
    question: '¿Cuántas horas a la semana dedicas a tareas repetitivas?',
    options: ['1-5 horas', '5-10 horas', '10-20 horas', '+20 horas'],
  },
  {
    id: 'urgency',
    question: '¿Qué tan urgente es resolver esto para ti?',
    options: ['Es crítico ya', 'Importante este trimestre', 'Lo haría si pudiera', 'No es prioridad'],
  },
  {
    id: 'team_size',
    question: '¿Cuántas personas de tu equipo podrían beneficiarse?',
    options: ['Solo yo', '2-5 personas', '6-15 personas', '+15 personas'],
  },
  {
    id: 'ai_usage',
    question: '¿Tu organización ya usa herramientas de IA?',
    options: ['Sí, activamente', 'Algo, pocas personas', 'Casi nada', 'No usamos'],
  },
]

export const AI_TOPICS = [
  'Automatización de correos y comunicaciones',
  'Generación de reportes y análisis de datos',
  'Redacción de documentos y presentaciones',
  'Gestión de agenda y coordinación de reuniones',
  'Investigación y síntesis de información',
  'Atención al cliente y respuestas frecuentes',
  'Creación de contenido para redes sociales',
  'Análisis de contratos y documentos legales',
  'Gestión de proyectos y seguimiento de tareas',
  'Capacitación y onboarding de personal',
  'Análisis de métricas y KPIs',
  'Elaboración de propuestas comerciales',
  'Transcripción y resumen de reuniones',
  'Control de calidad y revisión de procesos',
  'Gestión de inventarios y logística',
  'Análisis de competencia y mercado',
  'Soporte técnico de primer nivel',
  'Gestión documental y archivo',
  'Traducción y adaptación de contenidos',
  'Planificación estratégica y forecasting',
]
