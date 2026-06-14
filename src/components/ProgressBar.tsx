interface ProgressBarProps {
  currentStep: number
  totalSteps: number
}

const STEP_LABELS = [
  'Registro',
  'Temas IA',
  'Diagnóstico',
  'Impacto',
  'Plan 90 días',
  'Reporte',
]

export default function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  const progress = (currentStep / totalSteps) * 100

  return (
    <div className="w-full px-4 py-4 bg-black border-b border-gray-800">
      <div className="max-w-2xl mx-auto">
        {/* Step label */}
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-gray-400 uppercase tracking-widest font-medium">
            Paso {currentStep + 1} de {totalSteps + 1}
          </span>
          <span className="text-xs font-semibold" style={{ color: '#C9A84C' }}>
            {STEP_LABELS[currentStep]}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #C9A84C, #E2C97E)',
            }}
          />
        </div>

        {/* Step dots */}
        <div className="flex justify-between mt-2">
          {STEP_LABELS.map((label, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index <= currentStep
                  ? 'bg-gold scale-110'
                  : 'bg-gray-700'
              }`}
              style={index <= currentStep ? { backgroundColor: '#C9A84C' } : {}}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
