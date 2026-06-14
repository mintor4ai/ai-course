import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      participantId,
      aprendizajes,
      tareas_repetitivas,
      chat_messages,
      horas_proyectadas,
      area_impacto,
      nivel_listo,
      plan_90_dias,
    } = body

    if (!participantId) {
      return NextResponse.json({ error: 'participantId requerido' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Check if a response row already exists for this participant
    const { data: existing } = await supabase
      .from('responses')
      .select('id')
      .eq('participant_id', participantId)
      .maybeSingle()

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (aprendizajes !== undefined)       updates.aprendizajes = aprendizajes
    if (tareas_repetitivas !== undefined) updates.tareas_repetitivas = tareas_repetitivas
    if (chat_messages !== undefined)      updates.chat_messages = chat_messages
    if (horas_proyectadas !== undefined)  updates.horas_proyectadas = horas_proyectadas
    if (area_impacto !== undefined)       updates.area_impacto = area_impacto
    if (nivel_listo !== undefined)        updates.nivel_listo = nivel_listo
    if (plan_90_dias !== undefined)       updates.plan_90_dias = plan_90_dias

    if (existing) {
      const { error } = await supabase
        .from('responses')
        .update(updates)
        .eq('id', existing.id)
      if (error) throw error
      return NextResponse.json({ id: existing.id })
    } else {
      const { data, error } = await supabase
        .from('responses')
        .insert({ participant_id: participantId, ...updates })
        .select('id')
        .single()
      if (error) throw error
      return NextResponse.json({ id: data.id })
    }
  } catch (err: unknown) {
    console.error('responses POST error:', err)
    return NextResponse.json({ error: 'Error al guardar respuesta' }, { status: 500 })
  }
}
