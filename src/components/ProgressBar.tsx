interface ProgressBarProps {
  currentStep: number
  totalSteps: number
}

const STEP_LABELS = ['Registro', 'Temas IA', 'Diagnóstico', 'Impacto', 'Plan 90 días', 'Reporte']

export default function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  const progress = (currentStep / totalSteps) * 100
  return (
    <div className="w-full px-4 py-3 bg-white border-b border-zinc-100 sticky top-0 z-10">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-zinc-400 uppercase tracking-widest font-medium">
            Paso {currentStep + 1} de {totalSteps + 1}
          </span>
          <span className="text-xs font-semibold text-violet-600">
            {STEP_LABELS[currentStep]}
          </span>
        </div>
        <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #7C3AED, #D946EF)' }}
          />
        </div>
        <div className="flex justify-between mt-2">
          {STEP_LABELS.map((_, index) => (
            <div key={index} className="w-2 h-2 rounded-full transition-all duration-300"
              style={{ backgroundColor: index <= currentStep ? '#7C3AED' : '#E5E7EB', transform: index <= currentStep ? 'scale(1.2)' : 'scale(1)' }} />
          ))}
        </div>
      </div>
    </div>
  )
}
