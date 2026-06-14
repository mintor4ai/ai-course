'use client'

import { useState, useEffect } from 'react'
import { Participant, ChatMessage } from '@/lib/types'
import LoadingMantras from '@/components/LoadingMantras'

interface Step5Props {
  participant: Participant
  participantId: string
  selectedTopics: string[]
  chatMessages: ChatMessage[]
  impactAnswers: Record<string, string>
  plan90Days: string
}

export default function Step5Diagnostic({
  participant,
  participantId,
  selectedTopics,
  chatMessages,
  impactAnswers,
  plan90Days,
}: Step5Props) {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    sendDiagnostic()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sendDiagnostic = async () => {
    setStatus('loading')
    try {
      const response = await fetch('/api/diagnostic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participant,
          participantId,
          selectedTopics,
          chatMessages,
          impactAnswers,
          plan90Days,
        }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Error sending diagnostic')
      }

      setStatus('success')
    } catch (err: unknown) {
      console.error(err)
      setErrorMessage(err instanceof Error ? err.message : 'Error desconocido')
      setStatus('error')
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <LoadingMantras message="Generando y enviando tu diagnóstico..." />
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">⚠️</div>
          <h3 className="text-xl font-bold mb-2">Hubo un problema</h3>
          <p className="text-gray-400 text-sm mb-6">{errorMessage}</p>
          <button
            onClick={sendDiagnostic}
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
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center animate-slide-up">
        {/* Success icon */}
        <div className="relative inline-flex items-center justify-center w-24 h-24 mb-8">
          <div
            className="absolute inset-0 rounded-full animate-ping opacity-20"
            style={{ backgroundColor: '#C9A84C' }}
          />
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(201,168,76,0.15)', border: '2px solid #C9A84C' }}
          >
            <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" style={{ stroke: '#C9A84C' }}>
              <path d="M20 6L9 17L4 12" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        <div className="mb-3 text-xs uppercase tracking-widest" style={{ color: '#C9A84C' }}>
          ✦ Human.AiX · Diagnóstico enviado
        </div>

        <h2 className="text-3xl font-bold mb-4">
          ¡Tu diagnóstico está{' '}
          <span style={{ color: '#C9A84C' }}>en camino!</span>
        </h2>

        <p className="text-gray-400 mb-8 leading-relaxed">
          Hemos enviado tu reporte personalizado a{' '}
          <span className="text-white font-medium">{participant.email}</span>.
          Incluye tu análisis de impacto y plan de 90 días.
        </p>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="text-2xl font-bold mb-1" style={{ color: '#C9A84C' }}>5</div>
            <div className="text-xs text-gray-400">Temas IA seleccionados</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="text-2xl font-bold mb-1" style={{ color: '#C9A84C' }}>90</div>
            <div className="text-xs text-gray-400">Días de plan accionable</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="text-2xl font-bold mb-1" style={{ color: '#C9A84C' }}>✦</div>
            <div className="text-xs text-gray-400">Diagnóstico enviado</div>
          </div>
        </div>

        {/* Next steps */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-left mb-8">
          <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide" style={{ color: '#C9A84C' }}>
            Próximos pasos
          </h4>
          <div className="space-y-3">
            {[
              'Revisa tu email con el diagnóstico completo',
              'Comparte el plan con tu equipo y líder',
              'Únete al curso "Desbloquea el Chip de IA"',
              'Implementa tu primer quick win esta semana',
            ].map((step, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: '#C9A84C', color: '#000' }}
                >
                  {i + 1}
                </div>
                <p className="text-gray-300 text-sm">{step}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={() => window.location.reload()}
          className="w-full py-4 rounded-xl border border-gray-700 text-gray-400 font-medium text-sm hover:border-gray-500 transition-colors"
        >
          Comenzar un nuevo diagnóstico
        </button>

        <p className="mt-6 text-xs text-gray-600">
          Human.AiX · Desbloquea el Chip de IA
          <br />
          Transformando el trabajo con inteligencia artificial
        </p>
      </div>
    </div>
  )
}
