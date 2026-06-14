'use client'

import { useState } from 'react'
import { TOPICS } from '@/lib/types'

interface Step1Props {
  participantId: string
  nombre: string
  onComplete: (selected: string[]) => void
}

const REQUIRED = 5

export default function Step1Checklist({ participantId, nombre, onComplete }: Step1Props) {
  const [selected, setSelected] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const toggle = (id: string) => {
    setSelected(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id)
      if (prev.length >= REQUIRED) return prev
      return [...prev, id]
    })
  }

  const handleSubmit = async () => {
    if (selected.length !== REQUIRED || loading) return
    setLoading(true)
    try {
      const labels = selected.map(id => TOPICS.find(t => t.id === id)?.label ?? id)
      await fetch('/api/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId, aprendizajes: labels }),
      })
    } catch { /* continue */ }
    const labels = selected.map(id => TOPICS.find(t => t.id === id)?.label ?? id)
    onComplete(labels)
  }

  const remaining = REQUIRED - selected.length

  return (
    <div className="w-full max-w-lg mx-auto px-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-1 text-zinc-900">
          Hola, <span style={{ color: '#7C3AED' }}>{nombre.split(' ')[0]}</span> 👋
        </h2>
        <p className="text-zinc-500 text-sm mb-3 leading-relaxed">
          Elige exactamente <strong style={{ color: '#7C3AED' }}>5 aprendizajes</strong> que más valor te dieron hoy.
        </p>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{
            backgroundColor: selected.length === REQUIRED ? '#F5F3FF' : '#F9FAFB',
            border: `1px solid ${selected.length === REQUIRED ? '#7C3AED' : '#E5E7EB'}`,
            color: selected.length === REQUIRED ? '#7C3AED' : '#9CA3AF',
          }}>
          {selected.length === REQUIRED ? '✓ ¡Perfecto! 5 de 5' : `Faltan ${remaining} más`}
        </div>
      </div>

      <div className="space-y-2 mb-24">
        {TOPICS.map(topic => {
          const isSelected = selected.includes(topic.id)
          const isDisabled = !isSelected && selected.length >= REQUIRED
          return (
            <button key={topic.id} onClick={() => toggle(topic.id)} disabled={isDisabled}
              className="w-full text-left flex items-start gap-3 p-3.5 rounded-xl border transition-all active:scale-[0.98]"
              style={{
                backgroundColor: isSelected ? '#F5F3FF' : '#FAFAFA',
                borderColor: isSelected ? '#7C3AED' : isDisabled ? '#F3F4F6' : '#E5E7EB',
                opacity: isDisabled ? 0.4 : 1,
              }}>
              <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ backgroundColor: isSelected ? '#7C3AED' : '#E5E7EB', color: isSelected ? '#fff' : '#9CA3AF' }}>
                {isSelected ? '✓' : topic.id}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium leading-snug" style={{ color: isSelected ? '#7C3AED' : '#374151' }}>{topic.label}</p>
                <p className="text-xs mt-0.5 text-zinc-400">{topic.modulo}</p>
              </div>
            </button>
          )
        })}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-100 px-4 py-4">
        <div className="max-w-lg mx-auto">
          <button onClick={handleSubmit} disabled={selected.length !== REQUIRED || loading}
            className="w-full py-4 rounded-xl font-semibold text-white text-sm tracking-wide transition-all disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #D946EF 100%)' }}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Guardando...
              </span>
            ) : 'Continuar →'}
          </button>
        </div>
      </div>
    </div>
  )
}
