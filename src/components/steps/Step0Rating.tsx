'use client'

import { useState } from 'react'

interface Step0RatingProps {
  participantId: string
  nombre: string
  onComplete: (rating: number) => void
}

export default function Step0Rating({ participantId, nombre, onComplete }: Step0RatingProps) {
  const [selected, setSelected] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!selected || loading) return
    setLoading(true)
    try {
      await fetch('/api/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId, calificacion: selected }),
      })
    } catch { /* continue */ }
    onComplete(selected)
  }

  const labels: Record<number, string> = {
    1: 'Muy bajo', 2: 'Bajo', 3: 'Regular', 4: 'Aceptable', 5: 'Bien',
    6: 'Bastante bien', 7: 'Bueno', 8: 'Muy bueno', 9: 'Excelente', 10: '¡Perfecto!',
  }

  return (
    <div className="w-full max-w-lg mx-auto px-4 pt-6">
      <div className="mb-8 text-center">
        <p className="text-xs uppercase tracking-widest font-semibold mb-2" style={{ color: '#7C3AED' }}>
          Antes de comenzar
        </p>
        <h2 className="text-2xl font-bold text-zinc-900 mb-2">
          ¿Cómo calificarías el curso de hoy,{' '}
          <span style={{ color: '#7C3AED' }}>{nombre.split(' ')[0]}</span>?
        </h2>
        <p className="text-zinc-400 text-sm">Del 1 al 10, ¿qué tan valioso fue para ti?</p>
      </div>

      <div className="grid grid-cols-5 gap-3 mb-6">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => {
          const isSelected = selected === n
          return (
            <button
              key={n}
              onClick={() => setSelected(n)}
              className="aspect-square rounded-2xl text-2xl font-bold transition-all active:scale-95"
              style={{
                background: isSelected
                  ? 'linear-gradient(135deg,#7C3AED,#D946EF)'
                  : n <= (selected ?? 0) ? '#F5F3FF' : '#F9FAFB',
                color: isSelected ? '#fff' : n <= (selected ?? 0) ? '#7C3AED' : '#9CA3AF',
                border: `2px solid ${isSelected ? 'transparent' : n <= (selected ?? 0) ? '#C4B5FD' : '#E5E7EB'}`,
                boxShadow: isSelected ? '0 4px 14px rgba(124,58,237,0.35)' : 'none',
              }}
            >
              {n}
            </button>
          )
        })}
      </div>

      {selected && (
        <div className="text-center mb-8 h-6">
          <span className="text-sm font-medium" style={{ color: '#7C3AED' }}>
            {selected}/10 — {labels[selected]}
          </span>
        </div>
      )}
      {!selected && <div className="h-14" />}

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-100 px-4 py-4">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleSubmit}
            disabled={!selected || loading}
            className="w-full py-4 rounded-xl font-semibold text-white text-sm tracking-wide transition-all disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg,#7C3AED,#D946EF)' }}
          >
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
