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
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [participant, setParticipant] = useState<Participant | null>(null)
  const [participantId, setParticipantId] = useState<string>('')
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatSummary, setChatSummary] = useState<string>('')
  const [impactAnswers, setImpactAnswers] = useState<ImpactAnswers>({})
  const [plan90Dias, setPlan90Dias] = useState<Compromiso[]>([])

  // Step 0 → 1: Registration
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
      setParticipant({ ...data, id: result.id })
      setCurrentStep(1)
    } catch (error) {
      console.error('Step 0 error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Step 1 → 2: Topic selection
  const handleStep1Complete = async (topics: string[]) => {
    setIsLoading(true)
    try {
      await fetch('/api/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participant_id: participantId,
          step: 1,
          data: { selectedTopics: topics },
        }),
      })
      setSelectedTopics(topics)
      setCurrentStep(2)
    } catch (error) {
      console.error('Step 1 error:', error)
      setSelectedTopics(topics)
      setCurrentStep(2)
    } finally {
      setIsLoading(false)
    }
  }

  // Step 2 → 3: Chat
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
      setChatMessages(messages)
      setChatSummary(summary)
      setCurrentStep(3)
    } catch (error) {
      console.error('Step 2 error:', error)
      setChatMessages(messages)
      setChatSummary(summary)
      setCurrentStep(3)
    } finally {
      setIsLoading(false)
    }
  }

  // Step 3 → 4: Impact answers
  const handleStep3Complete = async (answers: ImpactAnswers) => {
    setIsLoading(true)
    try {
      await fetch('/api/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participant_id: participantId,
          step: 3,
          data: answers,
        }),
      })
      setImpactAnswers(answers)
      setCurrentStep(4)
    } catch (error) {
      console.error('Step 3 error:', error)
      setImpactAnswers(answers)
      setCurrentStep(4)
    } finally {
      setIsLoading(false)
    }
  }

  // Step 4 → 5: Plan confirmed
  const handleStep4Complete = async (plan: Compromiso[]) => {
    setIsLoading(true)
    try {
      await fetch('/api/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participant_id: participantId,
          step: 4,
          data: { plan },
        }),
      })
      setPlan90Dias(plan)
      setCurrentStep(5)
    } catch (error) {
      console.error('Step 4 error:', error)
      setPlan90Dias(plan)
      setCurrentStep(5)
    } finally {
      setIsLoading(false)
    }
  }

  // Step 5 → restart
  const handleStep5Complete = () => {
    setCurrentStep(0)
    setParticipant(null)
    setParticipantId('')
    setSelectedTopics([])
    setChatMessages([])
    setChatSummary('')
    setImpactAnswers({})
    setPlan90Dias([])
  }

  return (
    <main className="min-h-screen bg-black">
      <ProgressBar currentStep={currentStep} totalSteps={TOTAL_STEPS} />

      <div className="pb-20">
        {currentStep === 0 && (
          <Step0Registration
            onComplete={handleStep0Complete}
            isLoading={isLoading}
          />
        )}

        {currentStep === 1 && (
          <Step1Checklist
            onComplete={handleStep1Complete}
            isLoading={isLoading}
            participantName={participant?.name || ''}
          />
        )}

        {currentStep === 2 && (
          <Step2Chat
            onComplete={handleStep2Complete}
            participant={{
              name: participant?.name || '',
              position: participant?.position || '',
              department: participant?.department || '',
            }}
            selectedTopics={selectedTopics}
          />
        )}

        {currentStep === 3 && (
          <Step3Impact
            participantId={participantId}
            onComplete={handleStep3Complete}
          />
        )}

        {currentStep === 4 && participant && (
          <Step4Plan
            participant={participant}
            participantId={participantId}
            aprendizajes={selectedTopics}
            tareasResumen={chatSummary}
            impactAnswers={impactAnswers}
            onComplete={handleStep4Complete}
          />
        )}

        {currentStep === 5 && participant && (
          <Step5Diagnostic
            participant={participant}
            participantId={participantId}
            aprendizajes={selectedTopics}
            tareasResumen={chatSummary}
            impactAnswers={impactAnswers}
            plan90Dias={plan90Dias}
            onComplete={handleStep5Complete}
          />
        )}
      </div>
    </main>
  )
}
