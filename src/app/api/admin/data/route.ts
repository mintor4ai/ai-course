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
  const fecha = searchParams.get('fecha')

  let query = supabase
    .from('participants')
    .select(`
      id, created_at, nombre, puesto, departamento, email, curso_fecha,
      responses (
        aprendizajes, tareas_repetitivas, chat_messages,
        horas_proyectadas, area_impacto, nivel_listo, plan_90_dias, updated_at
      ),
      diagnostics (
        email_status, sent_at, created_at
      )
    `)
    .order('created_at', { ascending: false })

  if (fecha) query = query.eq('curso_fecha', fecha)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Distinct course dates for session tabs
  const { data: dates } = await supabase
    .from('participants')
    .select('curso_fecha')
    .order('curso_fecha', { ascending: false })

  const allDates = (dates ?? []).map((r: { curso_fecha: string }) => r.curso_fecha).filter(Boolean)
  const uniqueDates = Array.from(new Set(allDates))

  return NextResponse.json({ participants: data ?? [], dates: uniqueDates })
}
