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
  { id: '1',  label: 'ROCA \u2014 M\u00e9todo de prompting estructurado',                                modulo: 'M3' },
  { id: '2',  label: 'IEI \u2014 Implementar, Evaluar, Iterar',                                     modulo: 'Transversal' },
  { id: '3',  label: 'WEF y FOBO \u2014 El contexto del mercado laboral',                           modulo: 'M1' },
  { id: '4',  label: 'Curva del Empoderamiento IA (K\u00fcbler-Ross)',                               modulo: 'M1' },
  { id: '5',  label: '3 Niveles de Proyectos de IA y La Matriz',                                     modulo: 'M1' },
  { id: '6',  label: 'ChatGPT como espejo estrat\u00e9gico / partner de pensamiento',                modulo: 'M2' },
  { id: '7',  label: 'T\u00e9cnica: Chain of Thought (Pasito a Pasito)',                            modulo: 'M3' },
  { id: '8',  label: 'T\u00e9cnica: Step-Back Prompting (Pong\u00e1monos de Acuerdo)',             modulo: 'M3' },
  { id: '9',  label: 'T\u00e9cnica: Tree of Thoughts (Elige tu Propia Aventura)',                   modulo: 'M3' },
  { id: '10', label: 'Las 3 Personas IA: Communicator, Interviewer, Challenger',                     modulo: 'M3' },
  { id: '11', label: 'Entorno ChatGPT \u2014 GPTs personalizados y Proyectos',                      modulo: 'M4' },
  { id: '12', label: 'Copilot + Excel',                                                               modulo: 'M4' },
  { id: '13', label: 'Context Engineering y Ventana de Contexto / Tokens',                           modulo: 'M4' },
  { id: '14', label: 'Qu\u00e9 es un Agente de IA (Cerebro, Instrucciones, Memoria, Herramientas)', modulo: 'M4' },
  { id: '15', label: 'NotebookLM \u2014 Laboratorio interactivo de documentos',                     modulo: 'M4' },
  { id: '16', label: 'Automatizaci\u00f3n con Make.com',                                             modulo: 'M6' },
  { id: '17', label: 'Gamma.app \u2014 Presentaciones con IA',                                       modulo: 'M6' },
  { id: '18', label: 'Liderazgo para la adopci\u00f3n IA en equipos',                               modulo: 'M5' },
  { id: '19', label: 'SUNO \u2014 Creaci\u00f3n musical con IA',                                   modulo: 'Herramientas' },
  { id: '20', label: 'C\u00f3mo evitar alucinaciones \u2014 Context Engineering avanzado',         modulo: 'M3/M4' },
] as const

export const IMPACT_OPTIONS = {
  horas: ['1h', '2h', '3h', '5h', '8h', '+8h'],
  area: [
    'Calidad de mis entregables',
    'Velocidad de ejecuci\u00f3n',
    'Toma de decisiones',
    'Liderazgo de mi equipo',
    'Todas las anteriores',
  ],
  nivel: [
    '\ud83d\udd25 Listo, arranco ma\u00f1ana',
    '\ud83e\udd14 Necesito practicar un poco m\u00e1s',
    '\ud83d\ude05 A\u00fan me da algo de miedo',
    '\ud83d\udcaa Ya lo ven\u00eda usando, ahora con m\u00e1s estructura',
  ],
} as const
