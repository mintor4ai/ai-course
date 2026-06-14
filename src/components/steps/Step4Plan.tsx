'use client'

import { useState } from 'react'
import LoadingMantras from '@/components/LoadingMantras'

interface Step4Props {
  plan: string
  onConfirm: () => void
  onAdjust: (feedback: string) => void
  isLoading: boolean
  isGenerating: boolean
}

export default function Step4Plan({ plan, onConfirm, onAdjust, isLoading, isGenerating }: Step4Props) {
  const [showAdjustInput, setShowAdjustInput] = useState(false)
  const [adjustmentFeedback, setAdjustmentFeedback] = useState('')

  if (isGenerating) {
    return <LoadingMantras message="Creando tu Plan de 90 Días..." />
  }

  const handleAdjust = () => {
    if (adjustmentFeedback.trim()) {
      onAdjust(adjustmentFeedback.trim())
      setAdjustmentFeedback('')
      setShowAdjustInput(false)
    }
  }

  // Convert markdown-like text to formatted HTML display
  const formatPlan = (text: string) => {
    return text
      .split('\n')
      .map((line, i) => {
        if (line.startsWith('# ')) {
          return <h1 key={i} className="text-2xl font-bold text-gold mt-6 mb-3">{line.slice(2)}</h1>
        }
        if (line.startsWith('## ')) {
          return <h2 key={i} className="text-xl font-bold text-gold mt-5 mb-2">{line.slice(3)}</h2>
        }
        if (line.startsWith('### ')) {
          return <h3 key={i} className="text-base font-semibold text-gold/80 mt-4 mb-2">{line.slice(4)}</h3>
        }
        if (line.startsWith('**') && line.endsWith('**')) {
          return <p key={i} className="font-semibold text-gold/90 my-1">{line.slice(2, -2)}</p>
        }
        if (line.startsWith('- ') || line.startsWith('• ')) {
          return (
            <div key={i} className="flex items-start gap-2 my-1.5">
              <span className="text-gold mt-1 text-xs flex-shrink-0">◆</span>
              <p className="text-white/85 text-sm leading-relaxed">{line.slice(2)}</p>
            </div>
          )
        }
        if (line.match(/^\d+\./)) {
          return (
            <div key={i} className="flex items-start gap-2 my-1.5">
              <span className="text-gold font-bold text-sm flex-shrink-0 w-5">{line.match(/^\d+/)?.[0]}.</span>
              <p className="text-white/85 text-sm leading-relaxed">{line.replace(/^\d+\.\s*/, '')}</p>
            </div>
          )
        }
        if (line.trim() === '') {
          return <div key={i} className="h-2" />
        }
        return <p key={i} className="text-white/80 text-sm leading-relaxed my-1">{line}</p>
      })
  }

  return (
    <div className="flex flex-col min-h-[80vh] px-4 py-8">
      <div className="w-full max-w-2xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block px-3 py-1 bg-gold/10 border border-gold/30 rounded-full text-gold text-xs font-semibold tracking-widest uppercase mb-4">
            Plan Personalizado
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Tu <span className="text-gold">Plan de 90 Días</span>
          </h2>
          <p className="text-white/60 text-sm">
            Basado en tu perfil y conversación, aquí está tu hoja de ruta de IA.
          </p>
        </div>

        {/* Plan content */}
        <div className="bg-white/3 border border-white/10 rounded-2xl p-6 mb-6 prose-gold">
          {formatPlan(plan)}
        </div>

        {/* Action buttons */}
        <div className="space-y-3">
          {!showAdjustInput ? (
            <>
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className="w-full py-4 px-6 rounded-xl font-semibold text-black text-sm tracking-wide
                  bg-gold hover:bg-gold-light active:scale-[0.98] transition-all duration-200
                  disabled:opacity-50 shadow-lg shadow-gold/20"
              >
                {isLoading ? 'Generando diagnóstico...' : '¡Me encanta! Generar mi Diagnóstico Completo →'}
              </button>

              <button
                onClick={() => setShowAdjustInput(true)}
                disabled={isLoading}
                className="w-full py-3 px-6 rounded-xl font-medium text-white/60 text-sm
                  bg-transparent border border-white/15 hover:border-white/30 hover:text-white/80
                  active:scale-[0.98] transition-all duration-200 disabled:opacity-30"
              >
                Solicitar ajustes al plan
              </button>
            </>
          ) : (
            <div className="animate-slide-up">
              <p className="text-white/70 text-sm mb-3">¿Qué te gustaría ajustar en el plan?</p>
              <textarea
                value={adjustmentFeedback}
                onChange={(e) => setAdjustmentFeedback(e.target.value)}
                placeholder="Ej: Me gustaría enfocarme más en automatización de emails y menos en reportes..."
                rows={3}
                className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white
                  placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-gold/50
                  resize-none text-sm mb-3"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAdjustInput(false)}
                  className="flex-1 py-3 px-4 rounded-xl text-white/50 text-sm border border-white/10
                    hover:border-white/20 transition-all duration-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAdjust}
                  disabled={!adjustmentFeedback.trim() || isLoading}
                  className="flex-1 py-3 px-4 rounded-xl bg-gold text-black font-semibold text-sm
                    disabled:opacity-40 hover:bg-gold-light transition-all duration-200"
                >
                  Regenerar plan
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
