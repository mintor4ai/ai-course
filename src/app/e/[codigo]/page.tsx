import { redirect, notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase'

interface Props {
  params: Promise<{ codigo: string }>
}

export default async function EventEntryPage({ params }: Props) {
  const { codigo } = await params
  const supabase = createServiceClient()

  const { data: event } = await supabase
    .from('events')
    .select('id, nombre, empresa, fecha_evento, mensaje_bienvenida, expires_at')
    .eq('codigo', codigo)
    .maybeSingle()

  if (!event) notFound()

  if (event.expires_at && new Date(event.expires_at) < new Date()) {
    return (
      <main style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <div style={{ textAlign: 'center', maxWidth: 360, padding: '0 24px' }}>
          <div style={{ fontSize: 48, marginBottom: 24 }}>🔒</div>
          <h1 style={{ color: '#C9A84C', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Sesión cerrada</h1>
          <p style={{ color: '#666', fontSize: 14 }}>
            Este evento ya no está disponible. Si crees que es un error, contacta a tu facilitador.
          </p>
        </div>
      </main>
    )
  }

  // Redirect to main app with event context in query string
  redirect(`/?event=${event.id}&codigo=${codigo}`)
}
