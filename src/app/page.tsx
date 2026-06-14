'use client'

import { useState } from 'react'
import ProgressBar from '@/components/ProgressBar'
import Step0Registration from '@/components/steps/Step0Registration'
import Step1Checklist from '@/components/steps/Step1Checklist'
import Step2Chat from '@/components/steps/Step2Chat'
import Step3Impact from '@/components/steps/Step3Impact'
import Step4Plan from '@/components/steps/Step4Plan'
import Step5Diagnostic from '@/components/steps/Step5Diagnostic'
import { Participant, ChatMessage, ImpactAnswers, Compromiso } from '@/lib/types'

const TOTAL_STEPS = 6

export default function Home() {
  const [step, setStep] = useState(0)
  const [participant, setParticipant] = useState<Participant | null>(null)
  const [participantId, setParticipantId] = useState('')
  const [aprendizajes, setAprendizajes] = useState<string[]>([])
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [tareasResumen, setTareasResumen] = useState('')
  const [impactAnswers, setImpactAnswers] = useState<ImpactAnswers>({})
  const [plan90Dias, setPlan90Dias] = useState<Compromiso[]>([])

  if (step === 6) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="text-center max-w-xs">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6" style={{ background: 'rgba(201,168,76,0.08)', border: '2px solid #C9A84C' }}>
            <span className="text-3xl">🎉</span>
          </div>
          <h1 className="text-2xl font-bold mb-3" style={{ color: '#C9A84C' }}>¡Completado!</h1>
          <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
            Tu diagnóstico ejecutivo de IA fue generado y enviado. Nos vemos en 90 días.
          </p>
          <p className="text-zinc-600 text-xs italic">"Tú eres el piloto. La IA es tu copiloto."</p>
          <p className="text-zinc-700 text-xs mt-2">— Human.AiX · Carlos García & Rodolfo Ordorica</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black">
      <ProgressBar currentStep={step} totalSteps={TOTAL_STEPS} />
      <div className="pb-24 pt-2">
        {step === 0 && <Step0Registration onComplete={(p, id) => { setParticipant(p); setParticipantId(id); setStep(1) }} />}
        {step === 1 && participant && (
          <Step1Checklist
            participantId={participantId}
            nombre={participant.nombre}
            onComplete={(s) => { setAprendizajes(s); setStep(2) }}
          />
        )}
        {step === 2 && participant && (
          <Step2Chat
            participant={participant}
            participantId={participantId}
            aprendizajes={aprendizajes}
            onComplete={(msgs, res) => { setChatMessages(msgs); setTareasResumen(res); setStep(3) }}
          />
        )}
        {step === 3 && (
          <Step3Impact
            participantId={participantId}
            onComplete={(ans) => { setImpactAnswers(ans); setStep(4) }}
          />
        )}
        {step === 4 && participant && (
          <Step4Plan
            participant={participant}
            participantId={participantId}
            aprendizajes={aprendizajes}
            tareasResumen={tareasResumen}
            impactAnswers={impactAnswers}
            onComplete={(plan) => { setPlan90Dias(plan); setStep(5) }}
          />
        )}
        {step === 5 && participant && (
          <Step5Diagnostic
            participant={participant}
            participantId={participantId}
            aprendizajes={aprendizajes}
            tareasResumen={tareasResumen}
            impactAnswers={impactAnswers}
            plan90Dias={plan90Dias}
            onComplete={() => setStep(6)}
          />
        )}
      </div>
    </main>
  )
}
