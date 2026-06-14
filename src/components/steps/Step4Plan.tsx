'use client'

import { useState, useEffect } from 'react'
import { Participant, ChatMessage } from '@/lib/types'
import LoadingMantras from '@/components/LoadingMantras'

interface Step4Props {
  participant: Participant
  participantId: string
  selectedTopics: string[]
  chatMessages: ChatMessage[]
  impactAnswers: Record<string, string>
  onComplete: (plan: string) => void
}

export default function Step4Plan({
  participant,
  participantId,
  selectedTopics,
  chatMessages,
  impactAnswers,
  onComplete,
}: Step4Props) {
  const [plan, setPlan] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isConfirmed, setIsConfirmed] = useState(false)

  useEffect(() => {
    generatePlan()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const generatePlan = async () => {
    setIsLoading(true)
    setError('')
    try {
      const response = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participant,
          selectedTopics,
          chatMessages,
          impactAnswers,
        }),
      })

      if (!response.ok) throw new Error('Error generating plan')
      if (!response.body) throw new Error('No body')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullPlan = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.text) {
                fullPlan += data.text
                setPlan(fullPlan)
              }
            } catch {
              // ignore
            }
          }
        }
      }

      setIsLoading(false)

      // Save to responses
      await fetch('/api/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participant_id: participantId,
          step: 4,
          data: { plan_90_days: fullPlan },
        }),
      })
    } catch {
      setError('Error generando el plan. Por favor intenta de nuevo.')
      setIsLoading(false)
    }
  }

  const formatPlan = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('## ')) {
        return (
          <h3 key={i} className="text-xl font-bold mt-6 mb-3" style={{ color: '#C9A84C' }}>
            {line.replace('## ', '')}
          </h3>
        )
      }
      if (line.startsWith('### ')) {
        return (
          <h4 key={i} className="text-base font-semibold mt-4 mb-2 text-white">
            {line.replace('### ', '')}
          </h4>
        )
      }
      if (line.startsWith('**') && line.endsWith('**')) {
        return (
          <p key={i} className="font-semibold text-white mt-3 mb-1">
            {line.replace(/\*\*/g, '')}
          </p>
        )
      }
      if (line.startsWith('- ') || line.startsWith('• ')) {
        return (
          <div key={i} className="flex gap-2 mt-1.5">
            <span style={{ color: '#C9A84C' }}>▸</span>
            <span className="text-gray-300 text-sm">{line.slice(2)}</span>
          </div>
        )
      }
      if (line.trim() === '') {
        return <div key={i} className="h-2" />
      }
      return (
        <p key={i} className="text-gray-300 text-sm leading-relaxed mt-1">
          {line}
        </p>
      )
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <LoadingMantras message="Generando tu plan de 90 días..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={generatePlan}
            className="px-6 py-3 rounded-xl font-semibold"
            style={{ backgroundColor: '#C9A84C', color: '#000' }}
          >
            Intentar de nuevo
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black pb-32">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6 animate-fade-in">
          <div className="inline-flex items-center gap-2 mb-3 text-xs uppercase tracking-widest" style={{ color: '#C9A84C' }}>
            <span>✦</span>
            <span>Tu plan personalizado</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">
            Plan de Implementación{' '}
            <span style={{ color: '#C9A84C' }}>90 Días</span>
          </h2>
          <p className="text-gray-400 text-sm">
            Basado en tu perfil como {participant.position} en {participant.department}
          </p>
        </div>

        {/* Plan content */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6 animate-slide-up">
          <div className="prose prose-invert max-w-none">
            {formatPlan(plan)}
          </div>
        </div>

        {/* Action buttons */}
        {!isConfirmed && (
          <div className="grid grid-cols-2 gap-3 animate-fade-in">
            <button
              onClick={generatePlan}
              className="py-3 rounded-xl border border-gray-700 text-gray-300 text-sm font-medium hover:border-gray-500 transition-colors"
            >
              🔄 Regenerar plan
            </button>
            <button
              onClick={() => {
                setIsConfirmed(true)
                setTimeout(() => onComplete(plan), 300)
              }}
              className="py-3 rounded-xl font-semibold text-sm"
              style={{ backgroundColor: '#C9A84C', color: '#000' }}
            >
              ✓ Me gusta, continuar
            </button>
          </div>
        )}

        {isConfirmed && (
          <div className="text-center py-4 animate-fade-in">
            <p style={{ color: '#C9A84C' }}>✓ Plan confirmado. Generando diagnóstico completo...</p>
          </div>
        )}
      </div>
    </div>
  )
}
