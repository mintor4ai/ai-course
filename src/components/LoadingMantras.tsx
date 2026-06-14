'use client'

import { useState, useEffect } from 'react'
import { MANTRAS } from '@/lib/mantras'

interface LoadingMantrasProps {
  message?: string
}

export default function LoadingMantras({ message = 'Procesando...' }: LoadingMantrasProps) {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setInterval(() => {
      setVisible(false)
      setTimeout(() => { setIndex((p) => (p + 1) % MANTRAS.length); setVisible(true) }, 400)
    }, 3500)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="relative mb-8">
        <div className="w-16 h-16 rounded-full border-4 animate-spin"
          style={{ borderColor: 'rgba(201,168,76,0.2)', borderTopColor: '#C9A84C', animationDuration: '0.8s' }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: '#C9A84C' }} />
        </div>
      </div>
      <p className="text-xs text-zinc-500 uppercase tracking-widest mb-6 font-medium">{message}</p>
      <div className="max-w-xs">
        <p className="text-base font-light italic leading-relaxed transition-opacity duration-400"
          style={{ opacity: visible ? 1 : 0, color: '#C9A84C' }}>
          {MANTRAS[index]}
        </p>
      </div>
      <div className="flex gap-2 mt-8">
        {MANTRAS.map((_, i) => (
          <div key={i} className="w-1.5 h-1.5 rounded-full transition-all duration-300"
            style={{ backgroundColor: i === index ? '#C9A84C' : '#333' }} />
        ))}
      </div>
    </div>
  )
}
