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
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= REQUIRED) return prev
      return [...prev, id]
    })
  }

  const handleSubmit = async () => {
    if (selected.length !== REQUIRED || loading) return
    setLoading(true)
    try {
      await fetch('/api/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId, aprendizajes: selected }),
      })
    } catch { /* continue */ }
    onComplete(selected)
  }

  const remaining = REQUIRED - selected.length

  return (
    <div className="step-transition w-full max-w-lg mx-auto px-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-1">
          Hola, <span style={{ color: '#C9A84C' }}>{nombre.split(' ')[0]}</span> 👋
        </h2>
        <p className="text-zinc-400 text-sm mb-3 leading-relaxed">
          Elige exactamente <strong style={{ color: '#C9A84C' }}>5 aprendizajes</strong> que más valor te dieron hoy.
        </p>
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{
            backgroundColor: selected.length === REQUIRED ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${selected.length === REQUIRED ? '#C9A84C' : '#333'}`,
            color: selected.length === REQUIRED ? '#C9A84C' : '#888',
          }}
        >
          {selected.length === REQUIRED ? '✓ ¡Perfecto! 5 de 5' : `Faltan ${remaining} más`}
        </div>
      </div>

      <div className="space-y-2 mb-6">
        {TOPICS.map((topic) => {
          const isSelected = selected.includes(topic.id)
          const isDisabled = !isSelected && selected.length >= REQUIRED
          return (
            <button
              key={topic.id}
              onClick={() => toggle(topic.id)}
              disabled={isDisabled}
              className="w-full text-left flex items-start gap-3 p-3.5 rounded-xl border transition-all active:scale-[0.98]"
              style={{
                backgroundColor: isSelected ? 'rgba(201,168,76,0.1)' : 'rgba(255,255,255,0.02)',
                borderColor: isSelected ? '#C9A84C' : isDisabled ? '#1a1a1a' : '#252525',
                opacity: isDisabled ? 0.38 : 1,
              }}
            >
              <div
                className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ backgroundColor: isSelected ? '#C9A84C' : 'rgba(255,255,255,0.07)', color: isSelected ? '#000' : '#666' }}
              >
                {isSelected ? '✓' : topic.id}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium leading-snug" style={{ color: isSelected ? '#fff' : '#ccc' }}>{topic.label}</p>
                <p className="text-xs mt-0.5" style={{ color: '#555' }}>{topic.modulo}</p>
              </div>
            </button>
          )
        })}
      </div>

      <div className="sticky bottom-4">
        <button
          onClick={handleSubmit}
          disabled={selected.length !== REQUIRED || loading}
          className="w-full py-4 rounded-xl font-semibold text-black text-sm tracking-wide transition-all disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #C9A84C 0%, #D4B96A 50%, #A8872E 100%)' }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              Guardando...
            </span>
          ) : 'Continuar →'}
        </button>
      </div>
    </div>
  )
}
