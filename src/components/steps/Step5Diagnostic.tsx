'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
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
        method: 'POST', headers: { 'Content-Type': 'application/json' },
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
    <div className="min-h-screen bg-white flex items-center justify-center">
      <LoadingMantras message="Generando y enviando tu diagnóstico ejecutivo…" />
    </div>
  )

  if (status === 'error') return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-4">⚠️</div>
        <h3 className="text-xl font-bold mb-2 text-zinc-900">Hubo un problema</h3>
        <p className="text-zinc-500 text-sm mb-6">{errorMsg}</p>
        <button onClick={send} className="px-6 py-3 rounded-xl font-semibold text-white" style={{ background: 'linear-gradient(135deg,#7C3AED,#D946EF)' }}>
          Intentar de nuevo
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center animate-fade-in">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image src="https://www.humanaix.mx/assets/logos/LogoHaix.png" alt="Human.AiX" width={140} height={35}
            style={{ objectFit: 'contain' }} unoptimized />
        </div>

        {/* Success icon */}
        <div className="relative inline-flex items-center justify-center w-24 h-24 mb-8">
          <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ background: '#7C3AED' }} />
          <div className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.1),rgba(217,70,239,0.1))', border: '2px solid #7C3AED' }}>
            <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="#7C3AED">
              <path d="M20 6L9 17L4 12" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        <div className="mb-3 text-xs uppercase tracking-widest font-semibold" style={{ color: '#7C3AED' }}>
          ✦ Diagnóstico enviado
        </div>
        <h2 className="text-3xl font-bold mb-4 text-zinc-900">
          ¡Tu diagnóstico está{' '}
          <span style={{ color: '#7C3AED' }}>en camino!</span>
        </h2>
        <p className="text-zinc-500 mb-8 leading-relaxed text-sm">
          Enviamos tu reporte personalizado a{' '}
          <span className="text-zinc-800 font-medium">{participant.email}</span>.
          Incluye tu análisis de impacto y plan de 90 días.
        </p>

        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { v: '5', l: 'Temas seleccionados' },
            { v: String(plan90Dias.length), l: 'Compromisos' },
            { v: impactAnswers.horas_proyectadas ?? '?', l: 'Horas/semana' },
          ].map(({ v, l }) => (
            <div key={l} className="rounded-xl p-4" style={{ background: '#F5F3FF', border: '1px solid #E9D5FF' }}>
              <div className="text-2xl font-bold mb-1" style={{ color: '#7C3AED' }}>{v}</div>
              <div className="text-xs text-zinc-500">{l}</div>
            </div>
          ))}
        </div>

        <div className="rounded-xl p-5 text-left mb-8" style={{ background: '#FAFAFA', border: '1px solid #E5E7EB' }}>
          <h4 className="font-semibold mb-3 text-xs uppercase tracking-wide" style={{ color: '#7C3AED' }}>Próximos pasos</h4>
          <div className="space-y-3">
            {['Revisa tu email con el diagnóstico completo', 'Comparte el plan con tu equipo y líder', 'Implementa tu primer quick win esta semana', 'Nos vemos en 90 días 🚀'].map((step, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                  style={{ background: 'linear-gradient(135deg,#7C3AED,#D946EF)', color: '#fff' }}>
                  {i + 1}
                </div>
                <p className="text-zinc-600 text-sm">{step}</p>
              </div>
            ))}
          </div>
        </div>

        <button onClick={onComplete} className="w-full py-4 rounded-xl border border-zinc-200 text-zinc-400 font-medium text-sm transition-colors hover:border-violet-300 hover:text-violet-600">
          Nuevo diagnóstico
        </button>

        <p className="mt-6 text-xs text-zinc-300">
          Human.AiX · Carlos García &amp; Rodolfo Ordorica<br />
          "Tú eres el piloto. La IA es tu copiloto."
        </p>
      </div>
    </div>
  )
}
