import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Desbloquea el Chip de IA | Human.AiX',
  description: 'Diagnóstico de IA personalizado y plan de acción de 90 días para transformar tu trabajo.',
  keywords: 'inteligencia artificial, productividad, automatización, curso IA',
  openGraph: {
    title: 'Desbloquea el Chip de IA | Human.AiX',
    description: 'Diagnóstico de IA personalizado y plan de acción de 90 días.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="bg-white text-zinc-900 min-h-screen">
        {children}
      </body>
    </html>
  )
}
