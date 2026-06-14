'use client'

import LoadingMantras from '@/components/LoadingMantras'

interface Step5Props {
  isGenerating: boolean
  isSent: boolean
  participantEmail: string
  participantName: string
  onRestart?: () => void
}

export default function Step5Diagnostic({
  isGenerating,
  isSent,
  participantEmail,
  participantName,
  onRestart,
}: Step5Props) {
  if (isGenerating) {
    return <LoadingMantras message="Preparando tu diagnóstico completo..." />
  }

  if (isSent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 py-12 text-center animate-fade-in">
        <div className="w-full max-w-md">
          {/* Success icon */}
          <div className="relative w-20 h-20 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full bg-gold/20 animate-ping" style={{ animationDuration: '2s' }} />
            <div className="relative w-20 h-20 rounded-full bg-gold/15 border-2 border-gold flex items-center justify-center">
              <svg className="w-10 h-10 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          {/* Success message */}
          <h2 className="text-3xl font-bold text-white mb-3">
            ¡Listo, <span className="text-gold">{participantName.split(' ')[0]}</span>!
          </h2>
          <p className="text-white/70 text-sm leading-relaxed mb-2">
            Tu diagnóstico completo de IA ha sido enviado a:
          </p>
          <p className="text-gold font-semibold text-base mb-8">{participantEmail}</p>

          {/* What's in the email */}
          <div className="bg-white/3 border border-white/10 rounded-2xl p-6 mb-8 text-left">
            <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-4">Tu diagnóstico incluye:</p>
            <div className="space-y-3">
              {[
                { icon: '🎯', text: 'Análisis de tus 5 áreas de mayor impacto con IA' },
                { icon: '🗺️', text: 'Plan detallado de 90 días con acciones concretas' },
                { icon: '⚡', text: 'Estimación de horas recuperadas por automatización' },
                { icon: '🛠️', text: 'Herramientas de IA recomendadas para tu perfil' },
                { icon: '📈', text: 'ROI potencial para tu organización' },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-start gap-3">
                  <span className="text-lg flex-shrink-0">{icon}</span>
                  <p className="text-white/75 text-sm leading-snug">{text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="space-y-3">
            <div className="p-4 bg-gold/10 border border-gold/30 rounded-xl">
              <p className="text-gold font-semibold text-sm mb-1">¿Listo para desbloquear tu Chip de IA?</p>
              <p className="text-white/60 text-xs leading-relaxed">
                Únete al programa &ldquo;Desbloquea el Chip de IA&rdquo; y transforma tu manera de trabajar en 90 días.
              </p>
            </div>

            <a
              href="https://human-aix.com"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-4 px-6 rounded-xl font-semibold text-black text-sm tracking-wide
                bg-gold hover:bg-gold-light active:scale-[0.98] transition-all duration-200
                text-center shadow-lg shadow-gold/20"
            >
              Conocer el Programa Completo →
            </a>

            {onRestart && (
              <button
                onClick={onRestart}
                className="w-full py-3 px-6 rounded-xl font-medium text-white/40 text-sm
                  border border-white/10 hover:border-white/20 hover:text-white/60
                  transition-all duration-200"
              >
                Hacer otro diagnóstico
              </button>
            )}
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-white/25 text-xs">
              Human.AiX · Desbloquea el Chip de IA
            </p>
            <p className="text-white/15 text-xs mt-1">
              Transformando profesionales en líderes de IA
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center mb-6">
        <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <h3 className="text-xl font-bold text-white mb-2">Algo salió mal</h3>
      <p className="text-white/60 text-sm mb-6">
        Hubo un problema al enviar tu diagnóstico. Por favor intenta de nuevo.
      </p>
      {onRestart && (
        <button
          onClick={onRestart}
          className="py-3 px-6 rounded-xl bg-gold text-black font-semibold text-sm
            hover:bg-gold-light transition-all duration-200"
        >
          Intentar de nuevo
        </button>
      )}
    </div>
  )
}
