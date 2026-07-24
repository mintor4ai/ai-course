'use client'

import { useState } from 'react'

const P = '#7C3AED'
const PG = 'linear-gradient(135deg,#7C3AED,#D946EF)'
const PL = '#F5F3FF'
const PB = '#E9D5FF'

interface Props {
  publicToken: string
  campaignNombre: string
  campaignEmpresa: string
  campaignStatus: string
}

export default function PublicEntryForm({ publicToken, campaignNombre, campaignEmpresa, campaignStatus }: Props) {
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [puesto, setPuesto] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [alreadyCompleted, setAlreadyCompleted] = useState(false)

  const isClosed = campaignStatus === 'closed'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!nombre.trim()) { setError('Por favor ingresa tu nombre completo.'); return }
    if (!email.trim() || !email.includes('@')) { setError('Por favor ingresa un correo electrónico válido.'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/survey/public-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ public_token: publicToken, nombre, email, role: puesto || undefined }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Ocurrió un error. Intenta de nuevo.')
        setLoading(false)
        return
      }
      if (data.already_completed) {
        setAlreadyCompleted(true)
        setLoading(false)
        return
      }
      window.location.href = '/s/' + data.token
    } catch {
      setError('Error de conexión. Por favor intenta de nuevo.')
      setLoading(false)
    }
  }

  if (alreadyCompleted) {
    return (
      <main style={{ minHeight: '100vh', background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
        <div style={{ background: '#fff', borderRadius: 20, maxWidth: 480, width: '100%', overflow: 'hidden', boxShadow: '0 8px 40px rgba(124,58,237,0.12)', border: `1px solid ${PB}` }}>
          <div style={{ background: PG, padding: '32px 28px', textAlign: 'center' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://humanaix.mx/assets/logos/LogoHumanAlta.png" alt="Human.AiX" style={{ height: 36, objectFit: 'contain', marginBottom: 16 }} />
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 6px' }}>{campaignEmpresa.toUpperCase()}</p>
            <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 800, margin: 0 }}>{campaignNombre}</h1>
          </div>
          <div style={{ padding: '40px 28px', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h2 style={{ color: '#111827', fontSize: 20, fontWeight: 800, margin: '0 0 12px' }}>¡Ya completaste esta encuesta!</h2>
            <p style={{ color: '#6B7280', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
              Ya completaste esta encuesta. Revisa tu correo con tu diagnóstico.
            </p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100vh', background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      <div style={{ background: '#fff', borderRadius: 20, maxWidth: 480, width: '100%', overflow: 'hidden', boxShadow: '0 8px 40px rgba(124,58,237,0.12)', border: `1px solid ${PB}` }}>
        {/* Header */}
        <div style={{ background: PG, padding: '32px 28px', textAlign: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://humanaix.mx/assets/logos/LogoHumanAlta.png" alt="Human.AiX" style={{ height: 36, objectFit: 'contain', marginBottom: 16 }} />
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 6px' }}>{campaignEmpresa.toUpperCase()}</p>
          <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 800, margin: 0 }}>{campaignNombre}</h1>
        </div>

        {/* Form */}
        <div style={{ padding: '32px 28px' }}>
          {isClosed ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: '#6B7280' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
              <h2 style={{ color: '#111827', fontSize: 18, fontWeight: 800, margin: '0 0 8px' }}>Encuesta cerrada</h2>
              <p style={{ margin: 0, fontSize: 14 }}>Esta campaña ya no está disponible.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <p style={{ color: '#6B7280', fontSize: 14, margin: '0 0 24px', lineHeight: 1.6 }}>
                Completa tus datos para iniciar tu diagnóstico de adopción de IA.
              </p>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', color: '#374151', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                  Nombre completo <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  placeholder="Ej. María García López"
                  required
                  style={{ width: '100%', padding: '12px 14px', border: `1.5px solid ${nombre ? PB : '#E5E7EB'}`, borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box', background: nombre ? PL : '#fff', color: '#111827' }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', color: '#374151', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                  Correo electrónico <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="tu@empresa.com"
                  required
                  style={{ width: '100%', padding: '12px 14px', border: `1.5px solid ${email ? PB : '#E5E7EB'}`, borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box', background: email ? PL : '#fff', color: '#111827' }}
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', color: '#374151', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                  Puesto / Función <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(opcional)</span>
                </label>
                <input
                  type="text"
                  value={puesto}
                  onChange={e => setPuesto(e.target.value)}
                  placeholder="Ej. Gerente de Proyectos"
                  style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box', color: '#111827' }}
                />
              </div>

              {error && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', marginBottom: 16, color: '#DC2626', fontSize: 13 }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{ width: '100%', padding: '14px', border: 'none', borderRadius: 12, background: loading ? '#E5E7EB' : PG, color: loading ? '#9CA3AF' : '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', transition: 'opacity 0.2s' }}>
                {loading ? 'Iniciando...' : 'Comenzar diagnóstico →'}
              </button>

              <p style={{ color: '#9CA3AF', fontSize: 11, textAlign: 'center', margin: '16px 0 0', lineHeight: 1.5 }}>
                Tus respuestas son confidenciales y se usarán únicamente para personalizar tu diagnóstico.
              </p>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
