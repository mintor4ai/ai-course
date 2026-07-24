import { createServiceClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import SurveyForm from './SurveyForm'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function SurveyPage({ params }: { params: { token: string } }) {
  // Prevent browser and CDN from caching this page
  headers()
  const supabase = createServiceClient()
  const { data: respondent } = await supabase
    .from('survey_respondents')
    .select('id, email, nombre, status, campaign_id, survey_campaigns(nombre, empresa, tipo, descripcion, survey_config)')
    .eq('token', params.token)
    .single()

  if (!respondent) notFound()

  if (respondent.status === 'completed') {
    return (
      <main style={{ minHeight: '100vh', background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
        <div style={{ maxWidth: 440, width: '100%', textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,rgba(124,58,237,0.1),rgba(217,70,239,0.1))', border: '2px solid #7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#7C3AED"><path d="M20 6L9 17L4 12" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <h1 style={{ color: '#111827', fontSize: 22, fontWeight: 800, margin: '0 0 12px' }}>¡Ya completaste tu diagnóstico!</h1>
          <p style={{ color: '#6B7280', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
            Gracias por tomarte el tiempo. Revisa tu correo — te enviamos tu perfil de adopción de IA con recomendaciones personalizadas.
          </p>
          <p style={{ color: '#C4B5FD', fontSize: 12, marginTop: 32, fontStyle: 'italic' }}>"Tú eres el piloto. La IA es tu copiloto." — Human.AiX</p>
        </div>
      </main>
    )
  }

  const rawC = respondent.survey_campaigns
  const campaignData = (rawC && !Array.isArray(rawC))
    ? (rawC as { nombre: string; empresa: string; tipo: string; descripcion?: string; survey_config?: unknown })
    : null

  const campaign = campaignData
    ? { nombre: campaignData.nombre, empresa: campaignData.empresa, tipo: campaignData.tipo, descripcion: campaignData.descripcion }
    : { nombre: 'Diagnóstico IA', empresa: 'Human.AiX', tipo: 'pre' }

  return (
    <SurveyForm
      respondentId={respondent.id}
      email={respondent.email}
      nombre={respondent.nombre ?? ''}
      campaign={campaign}
      surveyConfig={campaignData?.survey_config}
    />
  )
}
