'use client'

import { useState } from 'react'
import { IMPACT_OPTIONS, ImpactAnswers } from '@/lib/types'

interface Step3Props {
  participantId: string
  onComplete: (answers: ImpactAnswers) => void
}

const QUESTIONS = [
  { id: 'horas_proyectadas' as const, label: '¿Cuántas horas semanales crees que podrías recuperar con IA?', options: IMPACT_OPTIONS.horas },
  { id: 'area_impacto' as const,      label: '¿En qué área tendría mayor impacto para ti?',                  options: IMPACT_OPTIONS.area },
  { id: 'nivel_listo' as const,       label: '¿Cómo describes tu nivel de listo para implementar IA hoy?',    options: IMPACT_OPTIONS.nivel },
]

export default function Step3Impact({ participantId, onComplete }: Step3Props) {
  const [answers, setAnswers] = useState<ImpactAnswers>({})
  const [current, setCurrent] = useState(0)
  const [saving, setSaving] = useState(false)

  const handleSelect = (id: keyof ImpactAnswers, value: string) => {
    const next = { ...answers, [id]: value }
    setAnswers(next)
    if (current < QUESTIONS.length - 1) setTimeout(() => setCurrent(c => c + 1), 400)
  }

  const allAnswered = QUESTIONS.every(q => answers[q.id])

  const handleContinue = async () => {
    if (!allAnswered) return
    setSaving(true)
    try {
      await fetch('/api/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId,
          horas_proyectadas: answers.horas_proyectadas,
          area_impacto: answers.area_impacto,
          nivel_listo: answers.nivel_listo,
        }),
      })
      onComplete(answers)
    } catch (err) {
      console.error(err)
      onComplete(answers)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-black pb-32">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="text-xs uppercase tracking-widest mb-3" style={{ color: '#C9A84C' }}>✦ Paso 4 de 6</div>
          <h2 className="text-2xl font-bold mb-2">
            Tu <span style={{ color: '#C9A84C' }}>impacto potencial</span>
          </h2>
          <p className="text-zinc-400 text-sm">3 preguntas para calibrar tu diagnóstico.</p>
        </div>

        <div className="space-y-5">
          {QUESTIONS.map((q, i) => {
            const isActive = i <= current
            const isAnswered = !!answers[q.id]
            return (
              <div
                key={q.id}
                className="transition-all duration-500"
                style={{ opacity: isActive ? 1 : 0.25, pointerEvents: isActive ? 'auto' : 'none' }}
              >
                <div className="rounded-2xl p-5" style={{ background: '#0d0d0d', border: isAnswered ? '1px solid rgba(201,168,76,0.4)' : '1px solid #1f1f1f' }}>
                  <div className="flex gap-3 items-start mb-4">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={isAnswered ? { background: '#C9A84C', color: '#000' } : { background: '#1a1a1a', color: '#666' }}>
                      {isAnswered ? '✓' : i + 1}
                    </div>
                    <p className="text-sm font-medium leading-relaxed">{q.label}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {q.options.map(opt => {
                      const sel = answers[q.id] === opt
                      return (
                        <button
                          key={opt}
                          onClick={() => handleSelect(q.id, opt)}
                          className="px-3 py-3 rounded-xl text-sm font-medium text-left transition-all active:scale-[0.97]"
                          style={sel
                            ? { background: '#C9A84C', color: '#000', border: '1px solid #C9A84C' }
                            : { background: '#111', color: '#ccc', border: '1px solid #2a2a2a' }}
                        >
                          {opt}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 px-4 py-4" style={{ background: 'rgba(0,0,0,0.95)', borderTop: '1px solid #1a1a1a' }}>
        <div className="max-w-2xl mx-auto">
          {allAnswered ? (
            <button
              onClick={handleContinue}
              disabled={saving}
              className="w-full py-4 rounded-xl font-bold text-base transition-all active:scale-[0.99]"
              style={{ background: '#C9A84C', color: '#000', opacity: saving ? 0.7 : 1 }}
            >
              {saving ? 'Guardando...' : 'Generar mi plan de 90 días →'}
            </button>
          ) : (
            <p className="text-center text-zinc-600 text-sm">
              {Object.keys(answers).length} de {QUESTIONS.length} preguntas respondidas
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
