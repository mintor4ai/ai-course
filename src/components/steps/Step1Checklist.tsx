'use client'

import { useState } from 'react'
import { AI_TOPICS } from '@/lib/types'

interface Step1Props {
  participantId: string
  onComplete: (selected: string[]) => void
}

export default function Step1Checklist({ participantId, onComplete }: Step1Props) {
  const [selected, setSelected] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const toggleTopic = (topic: string) => {
    if (selected.includes(topic)) {
      setSelected(selected.filter((t) => t !== topic))
    } else if (selected.length < 5) {
      setSelected([...selected, topic])
    }
  }

  const handleContinue = async () => {
    if (selected.length !== 5) return
    setIsLoading(true)
    try {
      await fetch('/api/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participant_id: participantId,
          step: 1,
          data: { selected_topics: selected },
        }),
      })
      onComplete(selected)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-black pb-24">
      <div className="max-w-2xl mx-auto w-full px-4 py-8">
        <div className="mb-8 animate-fade-in">
          <h2 className="text-2xl font-bold mb-2">
            ¿Dónde puede la IA{' '}
            <span style={{ color: '#C9A84C' }}>impactar más tu trabajo?</span>
          </h2>
          <p className="text-gray-400 text-sm">
            Selecciona exactamente{' '}
            <span className="font-bold" style={{ color: '#C9A84C' }}>
              5 temas
            </span>{' '}
            donde la inteligencia artificial podría transformar tu día a día.
          </p>
        </div>

        {/* Counter */}
        <div className="flex items-center gap-3 mb-6 bg-gray-900 border border-gray-800 rounded-xl px-4 py-3">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <div
                key={n}
                className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all duration-200"
                style={
                  n <= selected.length
                    ? { backgroundColor: '#C9A84C', borderColor: '#C9A84C', color: '#000' }
                    : { borderColor: '#374151', color: '#4b5563' }
                }
              >
                {n <= selected.length ? '✓' : n}
              </div>
            ))}
          </div>
          <span className="text-sm text-gray-400">
            {selected.length === 5
              ? '¡Perfecto! Tienes 5 seleccionados'
              : `Selecciona ${5 - selected.length} más`}
          </span>
        </div>

        {/* Topics grid */}
        <div className="grid gap-2.5">
          {AI_TOPICS.map((topic, index) => {
            const isSelected = selected.includes(topic)
            const isDisabled = !isSelected && selected.length === 5

            return (
              <button
                key={topic}
                onClick={() => toggleTopic(topic)}
                disabled={isDisabled}
                className="w-full text-left px-4 py-3.5 rounded-xl border transition-all duration-200 flex items-center gap-3"
                style={
                  isSelected
                    ? { borderColor: '#C9A84C', backgroundColor: 'rgba(201,168,76,0.1)' }
                    : isDisabled
                    ? { borderColor: '#1f2937', backgroundColor: 'rgba(17,24,39,0.5)', opacity: 0.4, cursor: 'not-allowed' }
                    : { borderColor: '#1f2937', backgroundColor: '#111827' }
                }
              >
                <div
                  className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200"
                  style={
                    isSelected
                      ? { borderColor: '#C9A84C', backgroundColor: '#C9A84C' }
                      : { borderColor: '#4b5563' }
                  }
                >
                  {isSelected && (
                    <svg className="w-3 h-3 text-black" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span className="text-sm font-medium">
                  <span className="text-gray-500 mr-2 text-xs">{String(index + 1).padStart(2, '0')}</span>
                  {topic}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Fixed bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur border-t border-gray-800 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={handleContinue}
            disabled={selected.length !== 5 || isLoading}
            className="w-full py-4 rounded-xl font-bold text-base transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99]"
            style={{
              backgroundColor: selected.length === 5 ? '#C9A84C' : '#333',
              color: selected.length === 5 ? '#000' : '#666',
            }}
          >
            {isLoading ? 'Guardando...' : selected.length === 5 ? 'Continuar al diagnóstico →' : `Selecciona ${5 - selected.length} más`}
          </button>
        </div>
      </div>
    </div>
  )
}
