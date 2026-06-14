'use client'

import { useState } from 'react'
import { AI_TOPICS } from '@/lib/types'

interface Step1Props {
  onComplete: (selectedTopics: string[]) => void
  isLoading: boolean
  participantName: string
}

const MAX_SELECTIONS = 5

export default function Step1Checklist({ onComplete, isLoading, participantName }: Step1Props) {
  const [selected, setSelected] = useState<string[]>([])

  const toggleTopic = (topic: string) => {
    setSelected((prev) => {
      if (prev.includes(topic)) {
        return prev.filter((t) => t !== topic)
      }
      if (prev.length >= MAX_SELECTIONS) return prev
      return [...prev, topic]
    })
  }

  const handleSubmit = () => {
    if (selected.length === MAX_SELECTIONS) {
      onComplete(selected)
    }
  }

  const remainingSelections = MAX_SELECTIONS - selected.length

  return (
    <div className="flex flex-col min-h-[80vh] px-4 py-8">
      <div className="w-full max-w-2xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">
            Hola, <span className="text-gold">{participantName.split(' ')[0]}</span> 👋
          </h2>
          <p className="text-white/70 text-sm leading-relaxed mb-4">
            Selecciona exactamente <span className="text-gold font-semibold">5 áreas</span> donde
            la IA podría tener mayor impacto en tu trabajo.
          </p>

          {/* Counter */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold
            transition-all duration-300 ${
              selected.length === MAX_SELECTIONS
                ? 'bg-gold/20 border border-gold/50 text-gold'
                : 'bg-white/5 border border-white/15 text-white/60'
            }`}>
            <div className={`w-2 h-2 rounded-full ${
              selected.length === MAX_SELECTIONS ? 'bg-gold' : 'bg-white/30'
            }`} />
            {selected.length === MAX_SELECTIONS
              ? '¡Perfecto! 5 de 5 seleccionadas'
              : `Selecciona ${remainingSelections} más`}
          </div>
        </div>

        {/* Topic grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          {AI_TOPICS.map((topic, index) => {
            const isSelected = selected.includes(topic)
            const isDisabled = !isSelected && selected.length >= MAX_SELECTIONS

            return (
              <button
                key={topic}
                onClick={() => toggleTopic(topic)}
                disabled={isDisabled}
                className={`relative flex items-start gap-3 p-4 rounded-xl border text-left
                  transition-all duration-200 active:scale-[0.98]
                  ${isSelected
                    ? 'bg-gold/15 border-gold/60 text-white gold-glow'
                    : isDisabled
                    ? 'bg-white/3 border-white/8 text-white/25 cursor-not-allowed'
                    : 'bg-white/5 border-white/12 text-white/80 hover:bg-white/8 hover:border-white/25'
                  }`}
              >
                {/* Number */}
                <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                  transition-all duration-200 ${
                    isSelected ? 'bg-gold text-black' : 'bg-white/10 text-white/40'
                  }`}>
                  {isSelected ? '✓' : index + 1}
                </span>

                {/* Topic text */}
                <span className="text-sm leading-snug font-medium">{topic}</span>
              </button>
            )
          })}
        </div>

        {/* Submit button */}
        <div className="sticky bottom-4">
          <button
            onClick={handleSubmit}
            disabled={selected.length !== MAX_SELECTIONS || isLoading}
            className={`w-full py-4 px-6 rounded-xl font-semibold text-sm tracking-wide
              transition-all duration-300 ${
                selected.length === MAX_SELECTIONS && !isLoading
                  ? 'bg-gold text-black hover:bg-gold-light active:scale-[0.98] shadow-lg shadow-gold/20'
                  : 'bg-white/10 text-white/30 cursor-not-allowed'
              }`}
          >
            {isLoading ? 'Guardando...' : 'Continuar con mi diagnóstico →'}
          </button>
        </div>
      </div>
    </div>
  )
}
