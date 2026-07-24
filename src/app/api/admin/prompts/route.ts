import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

function authorized(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? ''
  const [, b64] = auth.split(' ')
  if (!b64) return false
  const [, password] = Buffer.from(b64, 'base64').toString().split(':')
  return password === process.env.ADMIN_PASSWORD
}

const ALL_KEYS = ['diagnostic_individual', 'diagnostic_executive', 'survey_generator', 'chat_coach', 'diagnostic_mckinsey', 'plan_adoption']

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('prompt_versions')
    .select('prompt_key, content, id, created_at')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Build map from DB results
  const map: Record<string, { key: string; content: string; id: string | null; created_at: string | null; is_default: boolean }> = {}
  for (const row of data ?? []) {
    if (!map[row.prompt_key]) {
      map[row.prompt_key] = { key: row.prompt_key, content: row.content, id: row.id, created_at: row.created_at, is_default: false }
    }
  }

  // For keys with no DB version, fetch and return the hardcoded default text
  // so the admin UI always shows something meaningful in the textarea
  try {
    const defaultsRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/admin/prompts/defaults`, {
      headers: { Authorization: req.headers.get('authorization') ?? '' },
    })
    if (defaultsRes.ok) {
      const { defaults } = await defaultsRes.json()
      for (const key of ALL_KEYS) {
        if (!map[key] && defaults[key]) {
          map[key] = { key, content: defaults[key], id: null, created_at: null, is_default: true }
        }
      }
    }
  } catch { /* ignore — admin still gets DB versions */ }

  return NextResponse.json({ prompts: Object.values(map) })
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { key, content } = await req.json()
  if (!key || !content) return NextResponse.json({ error: 'key y content requeridos' }, { status: 400 })

  const supabase = createServiceClient()

  // Deactivate all existing versions for this key
  await supabase
    .from('prompt_versions')
    .update({ is_active: false })
    .eq('prompt_key', key)

  // Insert new active version
  const { data, error } = await supabase
    .from('prompt_versions')
    .insert({ prompt_key: key, content, is_active: true })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ prompt: data })
}
