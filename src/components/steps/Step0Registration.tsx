'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Participant } from '@/lib/types'

interface Step0Props {
  eventId?: string
  onComplete: (participant: Participant, id: string) => void
}

export default function Step0Registration({ eventId, onComplete }: Step0Props) {
  const [form, setForm] = useState({ nombre: '', puesto: '', departamento: '', email: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nombre.trim() || !form.puesto.trim() || !form.departamento.trim() || !form.email.trim()) {
      setError('Por favor completa todos los campos.'); return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('Por favor ingresa un correo electrónico válido.'); return
    }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventId ? { ...form, event_id: eventId } : form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al registrar')
      onComplete(form as Participant, data.id)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al registrar. Intenta nuevamente.')
    } finally { setLoading(false) }
  }

  const fields = [
    { name: 'nombre',       label: 'Nombre completo',     placeholder: 'Ej: Ana García',               type: 'text',  ac: 'name' },
    { name: 'puesto',       label: 'Puesto / Cargo',      placeholder: 'Ej: Directora de Operaciones',  type: 'text',  ac: 'organization-title' },
    { name: 'departamento', label: 'Departamento / Área', placeholder: 'Ej: Recursos Humanos',         type: 'text',  ac: 'organization' },
    { name: 'email',        label: 'Correo electrónico',  placeholder: 'tu@empresa.com',                type: 'email', ac: 'email' },
  ] as const

  return (
    <div className="w-full max-w-md mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <div className="flex justify-center mb-6">
          <Image src="https://www.humanaix.mx/assets/logos/LogoHaix.png" alt="Human.AiX" width={160} height={40}
            style={{ objectFit: 'contain' }} unoptimized priority />
        </div>
        <h1 className="text-3xl font-bold mb-2 text-zinc-900">
          Desbloquea el <span style={{ color: '#7C3AED' }}>Chip de IA</span>
        </h1>
        <p className="text-zinc-500 text-sm mt-3 leading-relaxed max-w-xs mx-auto">
          Diagnóstico de IA personalizado + Plan de acción de 90 días para transformar tu trabajo.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 bg-violet-50 border border-violet-100">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-zinc-500">Desbloquea el Chip de IA · <span className="font-semibold text-violet-600">Human.AiX</span></span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map(({ name, label, placeholder, type, ac }) => (
          <div key={name}>
            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">{label}</label>
            <input
              type={type} name={name} value={form[name as keyof typeof form]}
              onChange={handleChange} placeholder={placeholder} autoComplete={ac}
              className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3.5 text-zinc-900 placeholder-zinc-400 text-sm transition-colors"
              onFocus={e => (e.target.style.borderColor = '#7C3AED')}
              onBlur={e => (e.target.style.borderColor = '')}
              style={{ outline: 'none' }}
            />
          </div>
        ))}
        <p className="text-xs text-zinc-400">Te enviaremos tu diagnóstico ejecutivo a tu correo.</p>

        {error && (
          <div className="rounded-xl px-4 py-3 text-sm bg-red-50 border border-red-200 text-red-600">{error}</div>
        )}

        <button type="submit" disabled={loading}
          className="w-full py-4 rounded-xl font-semibold text-white text-sm tracking-wide transition-all duration-200 disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #D946EF 100%)' }}>
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Registrando...
            </span>
          ) : 'Comenzar mi diagnóstico →'}
        </button>
      </form>

      <div className="mt-8 grid grid-cols-3 gap-3 text-center">
        {[{ icon: '🔒', label: 'Datos seguros' }, { icon: '⚡', label: '15-20 min' }, { icon: '🎯', label: 'Personalizado' }].map(b => (
          <div key={b.label} className="flex flex-col items-center gap-1">
            <span className="text-lg">{b.icon}</span>
            <span className="text-xs text-zinc-400">{b.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
