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
  const key = searchParams.get('key')
  if (!key) return NextResponse.json({ error: 'key requerido' }, { status: 400 })

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('prompt_versions')
    .select('id, prompt_key, content, is_active, created_at')
    .eq('prompt_key', key)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ versions: data ?? [] })
}

export async function DELETE(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  const supabase = createServiceClient()

  // Fetch the version to check
  const { data: version } = await supabase
    .from('prompt_versions')
    .select('prompt_key, is_active')
    .eq('id', id)
    .single()

  if (!version) return NextResponse.json({ error: 'Versión no encontrada' }, { status: 404 })

  // Count total versions for this key
  const { count } = await supabase
    .from('prompt_versions')
    .select('id', { count: 'exact', head: true })
    .eq('prompt_key', version.prompt_key)

  if ((count ?? 0) <= 1) {
    return NextResponse.json({ error: 'No se puede eliminar la única versión' }, { status: 400 })
  }

  if (version.is_active) {
    return NextResponse.json({ error: 'No se puede eliminar la versión activa' }, { status: 400 })
  }

  const { error } = await supabase.from('prompt_versions').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function PATCH(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  const supabase = createServiceClient()

  // Get the version to activate
  const { data: version } = await supabase
    .from('prompt_versions')
    .select('prompt_key')
    .eq('id', id)
    .single()

  if (!version) return NextResponse.json({ error: 'Versión no encontrada' }, { status: 404 })

  // Deactivate all for this key
  await supabase
    .from('prompt_versions')
    .update({ is_active: false })
    .eq('prompt_key', version.prompt_key)

  // Activate the selected one
  const { error } = await supabase
    .from('prompt_versions')
    .update({ is_active: true })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
