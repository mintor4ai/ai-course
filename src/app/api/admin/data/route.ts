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
  if (!authorized(req))
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const supabase = createServiceClient()
  const { searchParams } = new URL(req.url)
  const eventId = searchParams.get('event_id')

  let query = supabase
    .from('participants')
    .select(`
      id, created_at, nombre, puesto, departamento, email, curso_fecha, event_id,
      responses (
        id, aprendizajes, tareas_repetitivas, chat_messages,
        horas_proyectadas, area_impacto, nivel_listo, plan_90_dias, calificacion, updated_at
      ),
      diagnostics (
        email_status, sent_at, created_at, duracion_minutos
      )
    `)
    .order('created_at', { ascending: false })

  if (eventId) query = query.eq('event_id', eventId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ participants: data ?? [] })
}
