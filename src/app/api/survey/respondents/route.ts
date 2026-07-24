import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

function authorized(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? ''
  const [, b64] = auth.split(' ')
  if (!b64) return false
  const [, password] = Buffer.from(b64, 'base64').toString().split(':')
  return password === process.env.ADMIN_PASSWORD
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const campaignId = searchParams.get('campaign_id')
  if (!campaignId) return NextResponse.json({ error: 'campaign_id requerido' }, { status: 400 })

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('survey_respondents')
    .select('id, email, nombre, token, status, sent_at, completed_at, created_at, survey_responses!survey_responses_respondent_id_fkey(profile_name, profile_score, scores, answers, completion_time_seconds, diagnostic_html, possible_ai_champion, recommended_level)')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ respondents: data ?? [] })
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { campaign_id, respondents } = await req.json()
  if (!campaign_id || !Array.isArray(respondents) || !respondents.length)
    return NextResponse.json({ error: 'campaign_id y respondents requeridos' }, { status: 400 })

  const supabase = createServiceClient()
  const rows = respondents
    .filter((r: { email?: string }) => r.email?.includes('@'))
    .map((r: { email: string; nombre?: string }) => ({
      campaign_id,
      email: r.email.toLowerCase().trim(),
      nombre: r.nombre?.trim() || null,
    }))

  if (!rows.length) return NextResponse.json({ error: 'Ningún email válido' }, { status: 400 })

  const { data, error } = await supabase
    .from('survey_respondents')
    .upsert(rows, { onConflict: 'campaign_id,email', ignoreDuplicates: true })
    .select('id')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ imported: data?.length ?? 0, total: rows.length })
}

// DELETE — remove respondent and all their responses
export async function DELETE(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { respondentId } = await req.json()
  if (!respondentId) return NextResponse.json({ error: 'respondentId requerido' }, { status: 400 })
  const supabase = createServiceClient()
  const { error } = await supabase.from('survey_respondents').delete().eq('id', respondentId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// PATCH — reset respondent: delete response, set status back to pending
export async function PATCH(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { respondentId } = await req.json()
  if (!respondentId) return NextResponse.json({ error: 'respondentId requerido' }, { status: 400 })
  const supabase = createServiceClient()
  await supabase.from('survey_responses').delete().eq('respondent_id', respondentId)
  await supabase.from('survey_notifications').delete().eq('respondent_id', respondentId)
  const { error } = await supabase.from('survey_respondents')
    .update({ status: 'pending', sent_at: null, completed_at: null, invite_count: 0 })
    .eq('id', respondentId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
