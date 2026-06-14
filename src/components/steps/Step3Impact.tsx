'use client'

import { useState } from 'react'
import { IMPACT_QUESTIONS } from '@/lib/types'

interface Step3Props {
  participantId: string
  onComplete: (answers: Record<string, string>) => void
}

export default function Step3Impact({ participantId, onComplete }: Step3Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(0)

  const handleSelect = (questionId: string, option: string) => {
    const newAnswers = { ...answers, [questionId]: option }
    setAnswers(newAnswers)

    // Auto advance to next question
    if (currentQuestion < IMPACT_QUESTIONS.length - 1) {
      setTimeout(() => setCurrentQuestion(currentQuestion + 1), 400)
    }
  }

  const allAnswered = IMPACT_QUESTIONS.every((q) => answers[q.id])

  const handleContinue = async () => {
    if (!allAnswered) return
    setIsLoading(true)
    try {
      await fetch('/api/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participant_id: participantId,
          step: 3,
          data: { impact_answers: answers },
        }),
      })
      onComplete(answers)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black pb-32">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-in">
          <h2 className="text-2xl font-bold mb-2">
            Mide tu{' '}
            <span style={{ color: '#C9A84C' }}>impacto potencial</span>
          </h2>
          <p className="text-gray-400 text-sm">
            Responde estas 4 preguntas para calibrar tu diagnóstico personalizado.
          </p>
        </div>

        <div className="space-y-6">
          {IMPACT_QUESTIONS.map((question, qIndex) => {
            const isActive = qIndex <= currentQuestion
            const isAnswered = !!answers[question.id]

            return (
              <div
                key={question.id}
                className={`transition-all duration-500 ${
                  isActive ? 'opacity-100 translate-y-0' : 'opacity-30 pointer-events-none'
                }`}
              >
                <div
                  className="bg-gray-900 rounded-xl p-5"
                  style={{ border: isAnswered ? '1px solid rgba(201,168,76,0.5)' : '1px solid #1f2937' }}
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={isAnswered
                        ? { backgroundColor: '#C9A84C', color: '#000' }
                        : { backgroundColor: '#1f2937', color: '#9ca3af' }}
                    >
                      {isAnswered ? '✓' : qIndex + 1}
                    </div>
                    <p className="font-medium text-sm leading-relaxed">{question.question}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {question.options.map((option) => {
                      const isSelected = answers[question.id] === option
                      return (
                        <button
                          key={option}
                          onClick={() => handleSelect(question.id, option)}
                          className="px-3 py-3 rounded-xl text-sm font-medium text-left transition-all duration-200 border active:scale-[0.97]"
                          style={isSelected
                            ? { backgroundColor: '#C9A84C', borderColor: '#C9A84C', color: '#000' }
                            : { borderColor: '#374151', backgroundColor: '#1f2937', color: '#d1d5db' }}
                        >
                          {option}
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

      {/* Fixed bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur border-t border-gray-800 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          {allAnswered ? (
            <button
              onClick={handleContinue}
              disabled={isLoading}
              className="w-full py-4 rounded-xl font-bold text-base transition-all duration-200 active:scale-[0.99]"
              style={{ backgroundColor: '#C9A84C', color: '#000' }}
            >
              {isLoading ? 'Analizando...' : 'Generar mi plan de 90 días →'}
            </button>
          ) : (
            <div className="text-center">
              <p className="text-gray-500 text-sm">
                {Object.keys(answers).length} de {IMPACT_QUESTIONS.length} preguntas respondidas
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
