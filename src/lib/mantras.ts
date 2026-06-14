export const AI_MANTRAS = [
  'La IA no reemplaza tu talento, lo amplifica...',
  'Tu mejor versión profesional está a un prompt de distancia...',
  'Desbloquea el Chip de IA dentro de ti...',
  'El futuro pertenece a quienes colaboran con la IA...',
  'Transformando tus horas repetitivas en impacto estratégico...',
  'Cada tarea automatizada es tiempo que recuperas para lo que importa...',
  'La productividad del futuro empieza con una sola decisión...',
]

export function getRandomMantra(): string {
  return AI_MANTRAS[Math.floor(Math.random() * AI_MANTRAS.length)]
}
