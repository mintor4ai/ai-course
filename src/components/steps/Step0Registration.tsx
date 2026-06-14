'use client'

import { useState } from 'react'
import { Participant } from '@/lib/types'

interface Step0Props {
  onComplete: (participant: Participant, id: string) => void
}

export default function Step0Registration({ onComplete }: Step0Props) {
  const [form, setForm] = useState({
    name: '',
    position: '',
    department: '',
    email: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.name || !form.position || !form.department || !form.email) {
      setError('Por favor completa todos los campos.')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('Por favor ingresa un email válido.')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!response.ok) {
        throw new Error('Error al guardar el registro')
      }

      const data = await response.json()
      onComplete(form as Participant, data.id)
    } catch {
      setError('Hubo un error al procesar tu registro. Intenta de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Hero section */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md animate-slide-up">
          {/* Logo / Brand */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="text-3xl">✦</span>
              <span className="text-sm uppercase tracking-[0.3em] text-gray-400 font-medium">
                Human.AiX
              </span>
            </div>
            <h1 className="text-4xl font-bold mb-3 leading-tight">
              Desbloquea el{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, #C9A84C, #E2C97E)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Chip de IA
              </span>
            </h1>
            <p className="text-gray-400 text-base leading-relaxed">
              Tu diagnóstico personalizado de inteligencia artificial en el trabajo
            </p>
          </div>

          {/* Form */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-xl font-semibold mb-6 text-white">
              Comencemos con tus datos
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Nombre completo
                </label>
                <input
                  type="text"
                  placeholder="Tu nombre"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input-dark"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Puesto / Cargo
                </label>
                <input
                  type="text"
                  placeholder="Ej: Gerente de Operaciones"
                  value={form.position}
                  onChange={(e) => setForm({ ...form, position: e.target.value })}
                  className="input-dark"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Departamento / Área
                </label>
                <input
                  type="text"
                  placeholder="Ej: Recursos Humanos"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  className="input-dark"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  placeholder="tu@empresa.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input-dark"
                  disabled={isLoading}
                />
              </div>

              {error && (
                <div className="bg-red-900/30 border border-red-500/50 rounded-lg px-4 py-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 text-base py-4 font-bold tracking-wide rounded-lg transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#C9A84C', color: '#000' }}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Procesando...
                  </span>
                ) : (
                  'Iniciar mi diagnóstico IA →'
                )}
              </button>
            </form>
          </div>

          {/* Trust indicators */}
          <div className="mt-6 flex items-center justify-center gap-4 text-xs text-gray-600">
            <span>🔒 Datos seguros</span>
            <span>·</span>
            <span>5 minutos</span>
            <span>·</span>
            <span>Plan personalizado gratis</span>
          </div>
        </div>
      </div>
    </div>
  )
}
