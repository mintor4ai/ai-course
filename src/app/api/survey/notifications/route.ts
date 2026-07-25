import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

function authorized(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? ''
  const [, b64] = auth.split(' ')
  if (!b64) return false
  const [, password] = Buffer.from(b64, 'base64').toString().split(':')
  return password === process.env.ADMIN_PASSWORD
}

// GET — fetch recent notifications
export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('survey_notifications')
    .select('id, campaign_id, respondent_id, campaign_name, respondent_email, respondent_nombre, profile_name, profile_score, read, created_at')
    .order('created_at', { ascending: false })
    .limit(5)
  return NextResponse.json({ notifications: data ?? [] })
}

// PATCH — mark notifications as read
export async function PATCH(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { ids } = await req.json()
  const supabase = createServiceClient()
  if (ids?.length) {
    await supabase.from('survey_notifications').update({ read: true }).in('id', ids)
  } else {
    await supabase.from('survey_notifications').update({ read: true }).eq('read', false)
  }
  return NextResponse.json({ ok: true })
}
