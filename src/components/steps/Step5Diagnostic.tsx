'use client'

import { useState, useEffect } from 'react'
import { Participant, ImpactAnswers, Compromiso } from '@/lib/types'
import LoadingMantras from '@/components/LoadingMantras'

interface Step5Props {
  participant: Participant
  participantId: string
  aprendizajes: string[]
  tareasResumen: string
  impactAnswers: ImpactAnswers
  plan90Dias: Compromiso[]
  onComplete: () => void
}

export default function Step5Diagnostic({ participant, participantId, aprendizajes, tareasResumen, impactAnswers, plan90Dias, onComplete }: Step5Props) {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => { send() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const send = async () => {
    setStatus('loading')
    try {
      const res = await fetch('/api/diagnostic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participant, participantId, aprendizajes, tareasResumen, impactAnswers, plan90Dias }),
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Error') }
      setStatus('success')
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error desconocido')
      setStatus('error')
    }
  }

  if (status === 'loading') return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <LoadingMantras message="Generando y enviando tu diagnóstico ejecutivo…" />
    </div>
  )

  if (status === 'error') return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-4">⚠️</div>
        <h3 className="text-xl font-bold mb-2">Hubo un problema</h3>
        <p className="text-zinc-400 text-sm mb-6">{errorMsg}</p>
        <button onClick={send} className="px-6 py-3 rounded-xl font-semibold" style={{ background: '#C9A84C', color: '#000' }}>
          Intentar de nuevo
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center animate-slide-up">
        {/* Success icon */}
        <div className="relative inline-flex items-center justify-center w-24 h-24 mb-8">
          <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ background: '#C9A84C' }} />
          <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: 'rgba(201,168,76,0.12)', border: '2px solid #C9A84C' }}>
            <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="#C9A84C">
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
        <p className="text-zinc-400 mb-8 leading-relaxed text-sm">
          Enviamos tu reporte personalizado a{' '}
          <span className="text-white font-medium">{participant.email}</span>.
          Incluye tu análisis de impacto y plan de 90 días.
        </p>

        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { v: '5', l: 'Temas seleccionados' },
            { v: String(plan90Dias.length), l: 'Compromisos' },
            { v: impactAnswers.horas_proyectadas ?? '?', l: 'Horas/semana' },
          ].map(({ v, l }) => (
            <div key={l} className="rounded-xl p-4" style={{ background: '#0d0d0d', border: '1px solid #1f1f1f' }}>
              <div className="text-2xl font-bold mb-1" style={{ color: '#C9A84C' }}>{v}</div>
              <div className="text-xs text-zinc-500">{l}</div>
            </div>
          ))}
        </div>

        <div className="rounded-xl p-5 text-left mb-8" style={{ background: '#0d0d0d', border: '1px solid #1f1f1f' }}>
          <h4 className="font-semibold mb-3 text-xs uppercase tracking-wide" style={{ color: '#C9A84C' }}>Próximos pasos</h4>
          <div className="space-y-3">
            {[
              'Revisa tu email con el diagnóstico completo',
              'Comparte el plan con tu equipo y líder',
              'Implementa tu primer quick win esta semana',
              'Nos vemos en 90 días 🚀',
            ].map((step, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5" style={{ background: '#C9A84C', color: '#000' }}>
                  {i + 1}
                </div>
                <p className="text-zinc-300 text-sm">{step}</p>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={onComplete}
          className="w-full py-4 rounded-xl border text-zinc-400 font-medium text-sm transition-colors"
          style={{ borderColor: '#2a2a2a' }}
        >
          Nuevo diagnóstico
        </button>

        <p className="mt-6 text-xs text-zinc-700">
          Human.AiX · Carlos García &amp; Rodolfo Ordorica<br />
          "Tú eres el piloto. La IA es tu copiloto."
        </p>
      </div>
    </div>
  )
}
