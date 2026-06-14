'use client'

import { useState } from 'react'
import ProgressBar from '@/components/ProgressBar'
import Step0Registration from '@/components/steps/Step0Registration'
import Step1Checklist from '@/components/steps/Step1Checklist'
import Step2Chat from '@/components/steps/Step2Chat'
import Step3Impact from '@/components/steps/Step3Impact'
import Step4Plan from '@/components/steps/Step4Plan'
import Step5Diagnostic from '@/components/steps/Step5Diagnostic'
import { Participant, ChatMessage, AppStep, StepData } from '@/lib/types'

const TOTAL_STEPS = 6

export default function Home() {
  const [currentStep, setCurrentStep] = useState<AppStep>(0)
  const [isLoading, setIsLoading] = useState(false)
  const [stepData, setStepData] = useState<StepData>({})
  const [participantId, setParticipantId] = useState<string>('')
  const [plan, setPlan] = useState<string>('')
  const [isPlanGenerating, setIsPlanGenerating] = useState(false)
  const [isDiagnosticGenerating, setIsDiagnosticGenerating] = useState(false)
  const [diagnosticSent, setDiagnosticSent] = useState(false)

  // Step 0: Registration
  const handleStep0Complete = async (data: Participant) => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Error al registrar')

      setParticipantId(result.id)
      setStepData((prev) => ({ ...prev, step0: data }))
      setCurrentStep(1)
    } catch (error) {
      console.error('Step 0 error:', error)
      alert('Error al registrar. Por favor intenta de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  // Step 1: Checklist
  const handleStep1Complete = async (selectedTopics: string[]) => {
    setIsLoading(true)
    try {
      await fetch('/api/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participant_id: participantId,
          step: 1,
          data: { selectedTopics },
        }),
      })

      setStepData((prev) => ({ ...prev, step1: { selectedTopics } }))
      setCurrentStep(2)
    } catch (error) {
      console.error('Step 1 error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Step 2: Chat
  const handleStep2Complete = async (messages: ChatMessage[], summary: string) => {
    setIsLoading(true)
    try {
      await fetch('/api/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participant_id: participantId,
          step: 2,
          data: { messages, summary },
        }),
      })

      setStepData((prev) => ({ ...prev, step2: { messages, summary } }))
      setCurrentStep(3)
    } catch (error) {
      console.error('Step 2 error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Step 3: Impact
  const handleStep3Complete = async (impactData: NonNullable<StepData['step3']>) => {
    setIsLoading(true)
    try {
      await fetch('/api/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participant_id: participantId,
          step: 3,
          data: impactData,
        }),
      })

      setStepData((prev) => ({ ...prev, step3: impactData }))

      // Generate 90-day plan
      setCurrentStep(4)
      setIsPlanGenerating(true)

      const planRes = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participant: stepData.step0,
          selectedTopics: stepData.step1?.selectedTopics,
          chatSummary: stepData.step2?.summary,
          impactData,
        }),
      })

      const planResult = await planRes.json()
      if (!planRes.ok) throw new Error(planResult.error || 'Error generando plan')

      setPlan(planResult.plan)
    } catch (error) {
      console.error('Step 3 error:', error)
    } finally {
      setIsLoading(false)
      setIsPlanGenerating(false)
    }
  }

  // Step 4: Confirm or adjust plan
  const handleStep4Confirm = async () => {
    setIsLoading(true)
    setIsDiagnosticGenerating(true)
    setCurrentStep(5)

    try {
      const res = await fetch('/api/diagnostic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participant_id: participantId,
          participant: stepData.step0,
          selectedTopics: stepData.step1?.selectedTopics,
          chatMessages: stepData.step2?.messages,
          impactData: stepData.step3,
          plan,
        }),
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Error generando diagnóstico')

      setStepData((prev) => ({ ...prev, step5: { diagnosticId: result.id, sent: true } }))
      setDiagnosticSent(true)
    } catch (error) {
      console.error('Step 4 confirm error:', error)
    } finally {
      setIsLoading(false)
      setIsDiagnosticGenerating(false)
    }
  }

  const handleStep4Adjust = async (feedback: string) => {
    setIsPlanGenerating(true)
    try {
      const planRes = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participant: stepData.step0,
          selectedTopics: stepData.step1?.selectedTopics,
          chatSummary: stepData.step2?.summary,
          impactData: stepData.step3,
          previousPlan: plan,
          adjustmentFeedback: feedback,
        }),
      })

      const planResult = await planRes.json()
      if (!planRes.ok) throw new Error(planResult.error)
      setPlan(planResult.plan)
    } catch (error) {
      console.error('Plan adjust error:', error)
    } finally {
      setIsPlanGenerating(false)
    }
  }

  const handleRestart = () => {
    setCurrentStep(0)
    setStepData({})
    setParticipantId('')
    setPlan('')
    setDiagnosticSent(false)
    setIsDiagnosticGenerating(false)
  }

  return (
    <main className="min-h-screen bg-black">
      {/* Progress bar - visible on all steps */}
      <ProgressBar currentStep={currentStep} totalSteps={TOTAL_STEPS} />

      {/* Step content */}
      <div className="pb-20">
        {currentStep === 0 && (
          <Step0Registration onComplete={handleStep0Complete} isLoading={isLoading} />
        )}

        {currentStep === 1 && (
          <Step1Checklist
            onComplete={handleStep1Complete}
            isLoading={isLoading}
            participantName={stepData.step0?.name || ''}
          />
        )}

        {currentStep === 2 && (
          <Step2Chat
            onComplete={handleStep2Complete}
            participant={{
              name: stepData.step0?.name || '',
              position: stepData.step0?.position || '',
              department: stepData.step0?.department || '',
            }}
            selectedTopics={stepData.step1?.selectedTopics || []}
          />
        )}

        {currentStep === 3 && (
          <Step3Impact onComplete={handleStep3Complete} isLoading={isLoading} />
        )}

        {currentStep === 4 && (
          <Step4Plan
            plan={plan}
            onConfirm={handleStep4Confirm}
            onAdjust={handleStep4Adjust}
            isLoading={isLoading}
            isGenerating={isPlanGenerating}
          />
        )}

        {currentStep === 5 && (
          <Step5Diagnostic
            isGenerating={isDiagnosticGenerating}
            isSent={diagnosticSent}
            participantEmail={stepData.step0?.email || ''}
            participantName={stepData.step0?.name || ''}
            onRestart={handleRestart}
          />
        )}
      </div>
    </main>
  )
}
