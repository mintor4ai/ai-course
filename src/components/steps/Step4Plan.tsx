'use client'

import { useState, useEffect } from 'react'
import { Participant, ImpactAnswers, Compromiso } from '@/lib/types'
import LoadingMantras from '@/components/LoadingMantras'

interface Step4Props {
  participant: Participant
  participantId: string
  aprendizajes: string[]
  tareasResumen: string
  impactAnswers: ImpactAnswers
  onComplete: (plan: Compromiso[]) => void
}

export default function Step4Plan({ participant, participantId, aprendizajes, tareasResumen, impactAnswers, onComplete }: Step4Props) {
  const [plan, setPlan] = useState<Compromiso[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => { generate() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const generate = async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/plan', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participant, aprendizajes, tareasResumen, impactAnswers }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPlan(data.plan ?? [])
      await fetch('/api/responses', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId, plan_90_dias: data.plan }),
      })
    } catch { setError('Error generando el plan. Por favor intenta de nuevo.') }
    finally { setLoading(false) }
  }

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center"><LoadingMantras message="Generando tu plan de 90 días…" /></div>

  if (error) return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <p className="text-red-500 mb-4 text-sm">{error}</p>
        <button onClick={generate} className="px-6 py-3 rounded-xl font-semibold text-white" style={{ background: 'linear-gradient(135deg,#7C3AED,#D946EF)' }}>
          Intentar de nuevo
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-white pb-32">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="text-xs uppercase tracking-widest mb-3 font-semibold" style={{ color: '#7C3AED' }}>✦ Paso 5 de 6</div>
          <h2 className="text-2xl font-bold mb-1 text-zinc-900">Tu plan de acción <span style={{ color: '#7C3AED' }}>90 días</span></h2>
          <p className="text-zinc-400 text-sm">Generado para {participant.nombre} · {participant.puesto}</p>
        </div>

        <div className="space-y-4 mb-8">
          {plan.map((c, i) => (
            <div key={i} className="rounded-2xl p-5" style={{ background: '#FAFAFA', border: '1px solid #E5E7EB' }}>
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#7C3AED,#D946EF)', color: '#fff' }}>
                  {i + 1}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-zinc-900 mb-1">{c.titulo}</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed mb-3">{c.descripcion}</p>
                  <div className="rounded-lg px-3 py-2 text-xs" style={{ background: '#F5F3FF', border: '1px solid #E9D5FF', color: '#6D28D9' }}>
                    <span className="font-semibold">📊 Métrica: </span>{c.metrica}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {!confirmed && (
          <div className="fixed bottom-0 left-0 right-0 px-4 py-4 bg-white border-t border-zinc-100">
            <div className="max-w-2xl mx-auto grid grid-cols-2 gap-3">
              <button onClick={generate} className="py-3 rounded-xl text-sm font-medium border border-zinc-200 text-zinc-500 bg-white">
                🔄 Regenerar
              </button>
              <button onClick={() => { setConfirmed(true); setTimeout(() => onComplete(plan), 300) }}
                className="py-3 rounded-xl font-bold text-sm text-white"
                style={{ background: 'linear-gradient(135deg,#7C3AED,#D946EF)' }}>
                ✓ Me gusta, continuar
              </button>
            </div>
          </div>
        )}

        {confirmed && (
          <div className="text-center py-4">
            <p style={{ color: '#7C3AED' }} className="text-sm font-medium">✓ Plan confirmado. Generando diagnóstico…</p>
          </div>
        )}
      </div>
    </div>
  )
}
