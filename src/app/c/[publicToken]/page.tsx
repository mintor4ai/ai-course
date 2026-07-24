import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase'
import PublicEntryForm from './PublicEntryForm'

export const dynamic = 'force-dynamic'

interface Props {
  params: { publicToken: string }
}

export default async function PublicCampaignPage({ params }: Props) {
  const supabase = createServiceClient()
  const { data: campaign } = await supabase
    .from('survey_campaigns')
    .select('id, nombre, empresa, status, public_token')
    .eq('public_token', params.publicToken)
    .single()

  if (!campaign) notFound()

  return (
    <PublicEntryForm
      publicToken={params.publicToken}
      campaignNombre={campaign.nombre}
      campaignEmpresa={campaign.empresa}
      campaignStatus={campaign.status}
    />
  )
}
