'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Participant } from '@/lib/types'

interface Step0Props {
  onComplete: (participant: Participant, id: string) => void
}

export default function Step0Registration({ onComplete }: Step0Props) {
  const [form, setForm] = useState({ nombre: '', puesto: '', departamento: '', email: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nombre.trim() || !form.puesto.trim() || !form.departamento.trim() || !form.email.trim()) {
      setError('Por favor completa todos los campos.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('Por favor ingresa un correo electrónico válido.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al registrar')
      onComplete(form as Participant, data.id)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al registrar. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  const fields = [
    { name: 'nombre',       label: 'Nombre completo',     placeholder: 'Ej: Ana García',               type: 'text',  ac: 'name' },
    { name: 'puesto',       label: 'Puesto / Cargo',      placeholder: 'Ej: Directora de Operaciones',  type: 'text',  ac: 'organization-title' },
    { name: 'departamento', label: 'Departamento / Área', placeholder: 'Ej: Recursos Humanos',         type: 'text',  ac: 'organization' },
    { name: 'email',        label: 'Correo electrónico',  placeholder: 'tu@empresa.com',                type: 'email', ac: 'email' },
  ] as const

  return (
    <div className="step-transition w-full max-w-md mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <div className="flex justify-center mb-6">
          <Image
            src="https://www.humanaix.mx/assets/logos/LogoHumanAltablanco.png"
            alt="Human.AiX"
            width={160}
            height={40}
            style={{ objectFit: 'contain' }}
            unoptimized
            priority
          />
        </div>
        <h1 className="text-3xl font-bold mb-2">
          <span style={{ color: '#C9A84C' }}>Desbloquea</span><br />el Chip de IA
        </h1>
        <p className="text-zinc-400 text-sm mt-3 leading-relaxed max-w-xs mx-auto">
          Diagnóstico de IA personalizado + Plan de acción de 90 días para transformar tu trabajo.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5" style={{ backgroundColor: '#111', border: '1px solid #222' }}>
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-zinc-400">Desbloquea el Chip de IA · <span className="font-medium" style={{ color: '#C9A84C' }}>Human.AiX</span></span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map(({ name, label, placeholder, type, ac }) => (
          <div key={name}>
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5">{label}</label>
            <input
              type={type}
              name={name}
              value={form[name as keyof typeof form]}
              onChange={handleChange}
              placeholder={placeholder}
              autoComplete={ac}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3.5 text-white placeholder-zinc-600 text-sm"
              onFocus={(e) => (e.target.style.borderColor = '#C9A84C')}
              onBlur={(e) => (e.target.style.borderColor = '')}
              style={{ outline: 'none' }}
            />
          </div>
        ))}
        <p className="text-xs text-zinc-600">Te enviaremos tu diagnóstico ejecutivo a tu correo.</p>

        {error && (
          <div className="rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-xl font-semibold text-black text-sm tracking-wide transition-all duration-200 disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, #C9A84C 0%, #D4B96A 50%, #A8872E 100%)' }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              Registrando...
            </span>
          ) : 'Comenzar mi diagnóstico →'}
        </button>
      </form>

      <div className="mt-8 grid grid-cols-3 gap-3 text-center">
        {[{ icon: '🔒', label: 'Datos seguros' }, { icon: '⚡', label: '15-20 min' }, { icon: '🎯', label: 'Personalizado' }].map((b) => (
          <div key={b.label} className="flex flex-col items-center gap-1">
            <span className="text-lg">{b.icon}</span>
            <span className="text-xs text-zinc-500">{b.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
