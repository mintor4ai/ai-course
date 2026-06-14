'use client'

import { useState, useRef, useEffect } from 'react'
import { ChatMessage, Participant } from '@/lib/types'

interface Step2Props {
  participant: Participant
  participantId: string
  aprendizajes: string[]
  onComplete: (messages: ChatMessage[], resumen: string) => void
}

export default function Step2Chat({ participant, participantId, aprendizajes, onComplete }: Step2Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([{
    role: 'assistant',
    content: `Hola ${participant.nombre}, qué gusto conocerte. Veo que eres ${participant.puesto} en ${participant.departamento}.\n\n"La claridad no siempre llega sola. A veces hay que provocarla."\n\n¿Qué tarea de tu semana sientes que haces en "piloto automático" y que te consume más tiempo del que debería?`,
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [canFinish, setCanFinish] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])
  useEffect(() => { if (messages.filter(m => m.role === 'user').length >= 4) setCanFinish(true) }, [messages])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    const updated: ChatMessage[] = [...messages, { role: 'user', content: text }]
    setMessages(updated); setInput(''); setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updated, participant: { nombre: participant.nombre, puesto: participant.puesto, departamento: participant.departamento } }),
      })
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let aiText = ''
      setMessages(prev => [...prev, { role: 'assistant', content: '' }])
      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          aiText += decoder.decode(value)
          setMessages(prev => { const c = [...prev]; c[c.length - 1] = { role: 'assistant', content: aiText }; return c })
        }
      }
      if (updated.filter(m => m.role === 'user').length >= 4) setCanFinish(true)
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Hubo un error. Intenta nuevamente.' }])
    } finally { setLoading(false) }
  }

  const finish = async () => {
    setLoading(true)
    const resumen = messages.filter(m => m.role === 'user').map(m => m.content).join(' | ')
    try {
      await fetch('/api/responses', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId, tareas_repetitivas: resumen, chat_messages: messages }),
      })
    } catch { /* continue */ }
    onComplete(messages, resumen)
  }

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col" style={{ height: 'calc(100vh - 180px)' }}>
      <div className="px-4 pb-3">
        <h2 className="text-xl font-bold mb-1 text-zinc-900">Tareas <span style={{ color: '#7C3AED' }}>Repetitivas</span></h2>
        <p className="text-zinc-400 text-xs">Conversa con tu coach de IA. Responde con naturalidad.</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-2">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mr-2 flex-shrink-0 mt-1"
                style={{ background: 'linear-gradient(135deg,#7C3AED,#D946EF)', color: '#fff' }}>IA</div>
            )}
            <div className="max-w-[82%] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap"
              style={msg.role === 'user'
                ? { background: 'linear-gradient(135deg,#7C3AED,#D946EF)', color: '#fff', borderRadius: '18px 18px 4px 18px' }
                : { backgroundColor: '#F5F3FF', border: '1px solid #E9D5FF', color: '#374151', borderRadius: '18px 18px 18px 4px' }}>
              {msg.content || <span className="flex gap-1 py-1">{[0,150,300].map(d => <span key={d} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: '#7C3AED', animationDelay: `${d}ms` }} />)}</span>}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 pt-3 border-t border-zinc-100">
        {canFinish && (
          <button onClick={finish} disabled={loading}
            className="w-full py-2.5 mb-2 rounded-xl text-sm font-semibold border-2 transition-all"
            style={{ borderColor: '#7C3AED', color: '#7C3AED', background: '#F5F3FF' }}>
            ✓ Listo — continuar al siguiente paso
          </button>
        )}
        <div className="flex gap-2 items-end">
          <textarea value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder="Escribe tu respuesta..." rows={2}
            className="flex-1 bg-white border border-zinc-200 rounded-xl px-3 py-2.5 text-zinc-900 text-sm placeholder-zinc-400 resize-none"
            onFocus={e => (e.target.style.borderColor = '#7C3AED')}
            onBlur={e => (e.target.style.borderColor = '')}
            style={{ outline: 'none' }} />
          <button onClick={send} disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg,#7C3AED,#D946EF)' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M14 8L2 2L5 8L2 14L14 8Z" fill="white" /></svg>
          </button>
        </div>
      </div>
    </div>
  )
}
