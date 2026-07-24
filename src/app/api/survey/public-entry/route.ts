import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { public_token, nombre, email } = await req.json()

  if (!public_token || !nombre || !email) {
    return NextResponse.json({ error: 'Campos requeridos: public_token, nombre, email' }, { status: 400 })
  }

  if (!email.includes('@')) {
    return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Find campaign by public_token
  const { data: campaign, error: campaignError } = await supabase
    .from('survey_campaigns')
    .select('id, status')
    .eq('public_token', public_token)
    .single()

  if (campaignError || !campaign) {
    return NextResponse.json({ error: 'Campaña no encontrada' }, { status: 404 })
  }

  if (campaign.status === 'closed') {
    return NextResponse.json({ error: 'Campaña cerrada' }, { status: 400 })
  }

  const cleanEmail = email.toLowerCase().trim()

  // Check for existing respondent
  const { data: existing } = await supabase
    .from('survey_respondents')
    .select('token, status')
    .eq('campaign_id', campaign.id)
    .eq('email', cleanEmail)
    .single()

  if (existing) {
    if (existing.status === 'completed') {
      return NextResponse.json({ already_completed: true, token: existing.token })
    }
    return NextResponse.json({ token: existing.token })
  }

  // Insert new respondent
  const { data: inserted, error: insertError } = await supabase
    .from('survey_respondents')
    .insert({
      campaign_id: campaign.id,
      email: cleanEmail,
      nombre: nombre.trim(),
      source: 'public_link',
      status: 'pending',
    })
    .select('token')
    .single()

  if (insertError || !inserted) {
    return NextResponse.json({ error: insertError?.message ?? 'Error al registrar' }, { status: 500 })
  }

  return NextResponse.json({ token: inserted.token })
}
