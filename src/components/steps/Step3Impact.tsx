'use client'

import { useState } from 'react'

interface Step3Data {
  hoursPerWeek: string
  urgency: string
  teamSize: string
  aiUsage: string
}

interface Step3Props {
  onComplete: (data: Step3Data) => void
  isLoading: boolean
}

const QUESTIONS = [
  {
    id: 'hoursPerWeek' as keyof Step3Data,
    question: '¿Cuántas horas a la semana dedicas a tareas repetitivas?',
    options: ['1-5 horas', '5-10 horas', '10-20 horas', '+20 horas'],
    icons: ['⏱️', '⏰', '🕐', '⚡'],
  },
  {
    id: 'urgency' as keyof Step3Data,
    question: '¿Qué tan urgente es resolver esto para ti?',
    options: ['Es crítico ya', 'Importante este trimestre', 'Lo haría si pudiera', 'No es prioridad'],
    icons: ['🔥', '📅', '💭', '🌙'],
  },
  {
    id: 'teamSize' as keyof Step3Data,
    question: '¿Cuántas personas de tu equipo podrían beneficiarse?',
    options: ['Solo yo', '2-5 personas', '6-15 personas', '+15 personas'],
    icons: ['👤', '👥', '👨‍👩‍👧‍👦', '🏢'],
  },
  {
    id: 'aiUsage' as keyof Step3Data,
    question: '¿Tu organización ya usa herramientas de IA?',
    options: ['Sí, activamente', 'Algo, pocas personas', 'Casi nada', 'No usamos'],
    icons: ['🚀', '🌱', '💤', '❌'],
  },
]

export default function Step3Impact({ onComplete, isLoading }: Step3Props) {
  const [answers, setAnswers] = useState<Partial<Step3Data>>({})
  const [currentQuestion, setCurrentQuestion] = useState(0)

  const handleSelect = (questionId: keyof Step3Data, option: string) => {
    const newAnswers = { ...answers, [questionId]: option }
    setAnswers(newAnswers)

    // Auto-advance after a short delay
    setTimeout(() => {
      if (currentQuestion < QUESTIONS.length - 1) {
        setCurrentQuestion((prev) => prev + 1)
      }
    }, 350)
  }

  const handleSubmit = () => {
    if (Object.keys(answers).length === QUESTIONS.length) {
      onComplete(answers as Step3Data)
    }
  }

  const allAnswered = Object.keys(answers).length === QUESTIONS.length
  const question = QUESTIONS[currentQuestion]

  return (
    <div className="flex flex-col min-h-[80vh] px-4 py-8">
      <div className="w-full max-w-lg mx-auto animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">
            Midamos el <span className="text-gold">impacto potencial</span>
          </h2>
          <p className="text-white/60 text-sm">
            {currentQuestion + 1} de {QUESTIONS.length} preguntas
          </p>
        </div>

        {/* Question progress */}
        <div className="flex gap-2 mb-8">
          {QUESTIONS.map((q, i) => (
            <div
              key={i}
              onClick={() => answers[q.id] && setCurrentQuestion(i)}
              className={`flex-1 h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                answers[q.id]
                  ? 'bg-gold'
                  : i === currentQuestion
                  ? 'bg-white/40'
                  : 'bg-white/10'
              }`}
            />
          ))}
        </div>

        {/* Current question */}
        <div className="mb-8 animate-slide-up" key={currentQuestion}>
          <h3 className="text-lg font-semibold text-white mb-6 leading-snug">
            {question.question}
          </h3>

          <div className="grid grid-cols-2 gap-3">
            {question.options.map((option, optIndex) => {
              const isSelected = answers[question.id] === option
              return (
                <button
                  key={option}
                  onClick={() => handleSelect(question.id, option)}
                  className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border
                    text-center transition-all duration-200 active:scale-[0.96]
                    ${isSelected
                      ? 'bg-gold/20 border-gold text-white gold-glow'
                      : 'bg-white/5 border-white/12 text-white/80 hover:bg-white/8 hover:border-white/25'
                    }`}
                >
                  <span className="text-2xl">{question.icons[optIndex]}</span>
                  <span className="text-sm font-medium leading-tight">{option}</span>
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-gold flex items-center justify-center">
                      <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Previous answers summary */}
        {Object.keys(answers).length > 0 && (
          <div className="mb-6 p-4 bg-white/3 border border-white/8 rounded-xl">
            <p className="text-white/40 text-xs font-semibold uppercase tracking-wide mb-3">Tus respuestas</p>
            <div className="space-y-2">
              {QUESTIONS.filter((q) => answers[q.id]).map((q) => (
                <div key={q.id} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-gold mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-white/40 text-xs">{q.question.substring(0, 40)}...</p>
                    <p className="text-white/80 text-xs font-medium">{answers[q.id]}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit */}
        {allAnswered && (
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full py-4 px-6 rounded-xl font-semibold text-black text-sm tracking-wide
              bg-gold hover:bg-gold-light active:scale-[0.98] transition-all duration-200
              disabled:opacity-50 shadow-lg shadow-gold/20"
          >
            {isLoading ? 'Analizando...' : 'Generar mi Plan de 90 Días →'}
          </button>
        )}
      </div>
    </div>
  )
}
