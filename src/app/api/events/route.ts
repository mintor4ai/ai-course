import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

function authorized(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? ''
  const [, b64] = auth.split(' ')
  if (!b64) return false
  const [, password] = Buffer.from(b64, 'base64').toString().split(':')
  return password === process.env.ADMIN_PASSWORD
}

function generateCodigo(nombre: string, empresa: string): string {
  const slug = `${empresa}-${nombre}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 24)
  const rand = Math.random().toString(36).slice(2, 6)
  return `${slug}-${rand}`
}

export async function GET(req: NextRequest) {
  if (!authorized(req))
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('events')
    .select('*, participants(count)')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ events: data ?? [] })
}

export async function POST(req: NextRequest) {
  if (!authorized(req))
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { nombre, empresa, fecha_evento, mensaje_bienvenida, expires_at } = await req.json()
  if (!nombre || !empresa || !fecha_evento)
    return NextResponse.json({ error: 'nombre, empresa y fecha_evento son requeridos' }, { status: 400 })
  const supabase = createServiceClient()
  const codigo = generateCodigo(nombre, empresa)
  const { data, error } = await supabase
    .from('events')
    .insert({ codigo, nombre, empresa, fecha_evento, mensaje_bienvenida: mensaje_bienvenida || null, expires_at: expires_at || null })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ event: data })
}
