export interface Participant {
  id?: string
  created_at?: string
  nombre: string
  puesto: string
  departamento: string
  email: string
  curso_fecha?: string
}

export interface TareaRepetitiva {
  tarea: string
  frecuencia: string
  por_que_automatizable: string
}

export interface Compromiso {
  titulo: string
  descripcion: string
  metrica: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ImpactAnswers {
  horas_proyectadas?: string
  area_impacto?: string
  nivel_listo?: string
}

export const TOPICS = [
  { id: '1',  label: 'ROCA — Método de prompting estructurado',                                modulo: 'M3' },
  { id: '2',  label: 'IEI — Implementar, Evaluar, Iterar',                                     modulo: 'Transversal' },
  { id: '3',  label: 'WEF y FOBO — El contexto del mercado laboral',                           modulo: 'M1' },
  { id: '4',  label: 'Curva del Empoderamiento IA (Kübler-Ross)',                               modulo: 'M1' },
  { id: '5',  label: '3 Niveles de Proyectos de IA y La Matriz',                               modulo: 'M1' },
  { id: '6',  label: 'ChatGPT como espejo estratégico / partner de pensamiento',                modulo: 'M2' },
  { id: '7',  label: 'Técnica: Chain of Thought (Pasito a Pasito)',                            modulo: 'M3' },
  { id: '8',  label: 'Técnica: Step-Back Prompting (Pongámonos de Acuerdo)',                   modulo: 'M3' },
  { id: '9',  label: 'Técnica: Tree of Thoughts (Elige tu Propia Aventura)',                   modulo: 'M3' },
  { id: '10', label: 'Las 3 Personas IA: Communicator, Interviewer, Challenger',               modulo: 'M3' },
  { id: '11', label: 'Entorno ChatGPT — GPTs personalizados y Proyectos',                      modulo: 'M4' },
  { id: '12', label: 'Copilot + Excel',                                                         modulo: 'M4' },
  { id: '13', label: 'Context Engineering y Ventana de Contexto / Tokens',                     modulo: 'M4' },
  { id: '14', label: 'Qué es un Agente de IA (Cerebro, Instrucciones, Memoria, Herramientas)',  modulo: 'M4' },
  { id: '15', label: 'NotebookLM — Laboratorio interactivo de documentos',                     modulo: 'M4' },
  { id: '16', label: 'Automatización con Make.com',                                             modulo: 'M6' },
  { id: '17', label: 'Gamma.app — Presentaciones con IA',                                       modulo: 'M6' },
  { id: '18', label: 'Liderazgo para la adopción IA en equipos',                               modulo: 'M5' },
  { id: '19', label: 'SUNO — Creación musical con IA',                                         modulo: 'Herramientas' },
  { id: '20', label: 'Cómo evitar alucinaciones — Context Engineering avanzado',               modulo: 'M3/M4' },
] as const

export const IMPACT_OPTIONS = {
  horas: ['1h', '2h', '3h', '5h', '8h', '+8h'],
  area: [
    'Calidad de mis entregables',
    'Velocidad de ejecución',
    'Toma de decisiones',
    'Liderazgo de mi equipo',
    'Todas las anteriores',
  ],
  nivel: [
    '🔥 Listo, arranco mañana',
    '🤔 Necesito practicar un poco más',
    '😅 Aún me da algo de miedo',
    '💪 Ya lo venía usando, ahora con más estructura',
  ],
} as const
