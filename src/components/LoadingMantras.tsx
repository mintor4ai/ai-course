'use client'

import { useState, useEffect } from 'react'
import { AI_MANTRAS } from '@/lib/mantras'

interface LoadingMantrasProps {
  message?: string
}

export default function LoadingMantras({ message = 'Procesando...' }: LoadingMantrasProps) {
  const [currentMantraIndex, setCurrentMantraIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false)
      setTimeout(() => {
        setCurrentMantraIndex((prev) => (prev + 1) % AI_MANTRAS.length)
        setIsVisible(true)
      }, 300)
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      {/* Animated ring */}
      <div className="relative w-20 h-20 mb-8">
        <div
          className="absolute inset-0 rounded-full border-2 border-transparent animate-spin"
          style={{
            borderTopColor: '#C9A84C',
            borderRightColor: '#C9A84C40',
            animationDuration: '1.2s',
          }}
        />
        <div
          className="absolute inset-2 rounded-full border border-transparent animate-spin"
          style={{
            borderBottomColor: '#C9A84C',
            borderLeftColor: '#C9A84C40',
            animationDuration: '1.8s',
            animationDirection: 'reverse',
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl">✦</span>
        </div>
      </div>

      {/* Status message */}
      <p className="text-gray-400 text-sm uppercase tracking-widest mb-6">{message}</p>

      {/* Rotating mantra */}
      <div className="max-w-sm">
        <p
          className={`text-lg font-medium transition-all duration-300 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
          style={{ color: '#C9A84C' }}
        >
          &ldquo;{AI_MANTRAS[currentMantraIndex]}&rdquo;
        </p>
      </div>

      {/* Loading dots */}
      <div className="flex gap-1 mt-8 dot-flashing">
        <span className="w-2 h-2 rounded-full bg-gray-600 inline-block" />
        <span className="w-2 h-2 rounded-full bg-gray-600 inline-block" />
        <span className="w-2 h-2 rounded-full bg-gray-600 inline-block" />
      </div>
    </div>
  )
}
