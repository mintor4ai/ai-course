import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Desbloquea el Chip de IA | Human.AiX',
  description: 'Descubre cómo la inteligencia artificial puede transformar tu trabajo y amplificar tu talento profesional.',
  keywords: 'inteligencia artificial, productividad, automatización, curso IA',
  openGraph: {
    title: 'Desbloquea el Chip de IA | Human.AiX',
    description: 'Descubre cómo la inteligencia artificial puede transformar tu trabajo.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="bg-black text-white min-h-screen">
        {children}
      </body>
    </html>
  )
}
