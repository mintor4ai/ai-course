import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { nombre, puesto, departamento, email } = await req.json()
    if (!nombre || !puesto || !departamento || !email)
      return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 })
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('participants')
      .insert({ nombre, puesto, departamento, email })
      .select('id')
      .single()
    if (error) throw error
    return NextResponse.json({ id: data.id })
  } catch (err) {
    console.error('participants POST:', err)
    return NextResponse.json({ error: 'Error al registrar participante' }, { status: 500 })
  }
}
