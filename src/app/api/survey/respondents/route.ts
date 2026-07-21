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
    .select('id, email, nombre, token, status, sent_at, completed_at, created_at, survey_responses(profile_name, profile_score, profile_score)')
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
