'use client'

import { useState } from 'react'
import { Participant } from '@/lib/types'

interface Step0Props {
  onComplete: (data: Participant) => void
  isLoading: boolean
}

export default function Step0Registration({ onComplete, isLoading }: Step0Props) {
  const [formData, setFormData] = useState<Participant>({
    name: '',
    position: '',
    department: '',
    email: '',
  })
  const [errors, setErrors] = useState<Partial<Participant>>({})

  const validate = (): boolean => {
    const newErrors: Partial<Participant> = {}
    if (!formData.name.trim()) newErrors.name = 'El nombre es requerido'
    if (!formData.position.trim()) newErrors.position = 'El puesto es requerido'
    if (!formData.department.trim()) newErrors.department = 'El departamento es requerido'
    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El email no es válido'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      onComplete(formData)
    }
  }

  const handleChange = (field: keyof Participant) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 py-12">
      <div className="w-full max-w-md animate-fade-in">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-block px-3 py-1 bg-gold/10 border border-gold/30 rounded-full text-gold text-xs font-semibold tracking-widest uppercase mb-4">
            Diagnóstico IA Personalizado
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">
            Bienvenido a tu
            <span className="block text-gold-gradient">Desbloqueo de IA</span>
          </h1>
          <p className="text-white/60 text-sm leading-relaxed">
            En los próximos minutos, descubrirás cómo la IA puede transformar tu trabajo.
            Comencemos conociéndote.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {[
            { field: 'name' as keyof Participant, label: 'Nombre completo', placeholder: 'Ej: Ana García', type: 'text' },
            { field: 'position' as keyof Participant, label: 'Puesto / Cargo', placeholder: 'Ej: Gerente de Operaciones', type: 'text' },
            { field: 'department' as keyof Participant, label: 'Departamento / Área', placeholder: 'Ej: Recursos Humanos', type: 'text' },
            { field: 'email' as keyof Participant, label: 'Email corporativo', placeholder: 'tu@empresa.com', type: 'email' },
          ].map(({ field, label, placeholder, type }) => (
            <div key={field}>
              <label className="block text-white/80 text-sm font-medium mb-2">
                {label}
              </label>
              <input
                type={type}
                value={formData[field]}
                onChange={handleChange(field)}
                placeholder={placeholder}
                className={`w-full px-4 py-3.5 bg-white/5 border rounded-xl text-white placeholder-white/25
                  focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 transition-all duration-200
                  text-sm ${errors[field] ? 'border-red-500/70' : 'border-white/15'}`}
              />
              {errors[field] && (
                <p className="mt-1.5 text-xs text-red-400">{errors[field]}</p>
              )}
            </div>
          ))}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 px-6 rounded-xl font-semibold text-black text-sm tracking-wide
              transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
              bg-gold hover:bg-gold-light active:scale-[0.98] mt-2"
            style={{ background: isLoading ? '#A8892F' : 'linear-gradient(135deg, #C9A84C 0%, #D4B86A 100%)' }}
          >
            {isLoading ? 'Registrando...' : 'Comenzar mi Diagnóstico →'}
          </button>
        </form>

        {/* Footer note */}
        <p className="text-center text-white/30 text-xs mt-6">
          Tu información es confidencial y solo se usa para personalizar tu diagnóstico.
        </p>
      </div>
    </div>
  )
}
