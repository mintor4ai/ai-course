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
  const supabase = createServiceClient()
  const { searchParams } = new URL(req.url)
  const tipo = searchParams.get('tipo')

  let query = supabase
    .from('survey_campaigns')
    .select('id, nombre, empresa, tipo, descripcion, survey_version, status, created_at, survey_config, draft_config, config_status')
    .order('created_at', { ascending: false })

  if (tipo) query = query.eq('tipo', tipo)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ campaigns: data ?? [] })
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { nombre, empresa, tipo = 'pre', descripcion } = await req.json()
  if (!nombre || !empresa) return NextResponse.json({ error: 'nombre y empresa requeridos' }, { status: 400 })

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('survey_campaigns')
    .insert({ nombre, empresa, tipo, descripcion, status: 'active' })
    .select('id').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id })
}

export async function PATCH(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { id, ...updates } = await req.json()
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('survey_campaigns')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
