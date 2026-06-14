'use client'

import { useState, useRef, useEffect } from 'react'
import { ChatMessage } from '@/lib/types'
import LoadingMantras from '@/components/LoadingMantras'

interface Step2Props {
  onComplete: (messages: ChatMessage[], summary: string) => void
  participant: { name: string; position: string; department: string }
  selectedTopics: string[]
}

const MIN_EXCHANGES = 3

export default function Step2Chat({ onComplete, participant, selectedTopics }: Step2Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [canComplete, setCanComplete] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingContent])

  // Initialize conversation
  useEffect(() => {
    const init = async () => {
      setIsInitializing(true)
      await sendToAPI([])
      setIsInitializing(false)
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sendToAPI = async (currentMessages: ChatMessage[]) => {
    setIsStreaming(true)
    setStreamingContent('')

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: currentMessages,
          participant,
          selectedTopics,
        }),
      })

      if (!response.ok) throw new Error('Error en la respuesta')
      if (!response.body) throw new Error('Sin body en la respuesta')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue
            try {
              const parsed = JSON.parse(data)
              if (parsed.type === 'delta' && parsed.text) {
                fullContent += parsed.text
                setStreamingContent(fullContent)
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: fullContent,
      }

      const newMessages = [...currentMessages, assistantMessage]
      setMessages(newMessages)
      setStreamingContent('')

      // Check if conversation should end (assistant said they have all info)
      const hasEnoughInfo =
        newMessages.filter((m) => m.role === 'user').length >= MIN_EXCHANGES ||
        fullContent.toLowerCase().includes('toda la información') ||
        fullContent.toLowerCase().includes('tengo todo') ||
        fullContent.toLowerCase().includes('gracias')

      if (hasEnoughInfo && newMessages.filter((m) => m.role === 'user').length >= 2) {
        setCanComplete(true)
      }
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Lo siento, hubo un error. Por favor intenta de nuevo.',
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsStreaming(false)
    }
  }

  const handleSend = async () => {
    if (!inputValue.trim() || isStreaming) return

    const userMessage: ChatMessage = { role: 'user', content: inputValue.trim() }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInputValue('')

    await sendToAPI(newMessages)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleComplete = () => {
    const summary = messages
      .filter((m) => m.role === 'user')
      .map((m) => m.content)
      .join('. ')
    onComplete(messages, summary)
  }

  if (isInitializing) {
    return <LoadingMantras message="Iniciando consultor IA..." />
  }

  return (
    <div className="flex flex-col h-[80vh] max-w-2xl mx-auto px-4">
      {/* Header */}
      <div className="py-4 border-b border-white/10 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center">
            <span className="text-gold text-xs font-bold">IA</span>
          </div>
          <div>
            <p className="text-white text-sm font-semibold">Consultor IA</p>
            <p className="text-white/40 text-xs">Human.AiX · En línea</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} chat-bubble-enter`}
          >
            {message.role === 'assistant' && (
              <div className="w-6 h-6 rounded-full bg-gold/20 border border-gold/30 flex-shrink-0 mr-2 mt-1 flex items-center justify-center">
                <span className="text-gold text-[8px] font-bold">IA</span>
              </div>
            )}
            <div
              className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                message.role === 'user'
                  ? 'bg-gold text-black font-medium rounded-tr-sm'
                  : 'bg-white/8 text-white/90 border border-white/10 rounded-tl-sm'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}

        {/* Streaming content */}
        {streamingContent && (
          <div className="flex justify-start chat-bubble-enter">
            <div className="w-6 h-6 rounded-full bg-gold/20 border border-gold/30 flex-shrink-0 mr-2 mt-1 flex items-center justify-center">
              <span className="text-gold text-[8px] font-bold">IA</span>
            </div>
            <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-tl-sm bg-white/8 text-white/90 border border-white/10 text-sm leading-relaxed">
              {streamingContent}
              <span className="inline-block w-0.5 h-4 bg-gold ml-0.5 animate-pulse" />
            </div>
          </div>
        )}

        {/* Thinking indicator */}
        {isStreaming && !streamingContent && (
          <div className="flex justify-start">
            <div className="w-6 h-6 rounded-full bg-gold/20 border border-gold/30 flex-shrink-0 mr-2 mt-1 flex items-center justify-center">
              <span className="text-gold text-[8px] font-bold">IA</span>
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-white/8 border border-white/10">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-gold/60 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Complete button */}
      {canComplete && (
        <div className="py-3 border-t border-white/10">
          <button
            onClick={handleComplete}
            className="w-full py-3 px-6 rounded-xl bg-gold/20 border border-gold/40 text-gold
              font-semibold text-sm hover:bg-gold/30 transition-all duration-200 mb-3"
          >
            Continuar al siguiente paso →
          </button>
        </div>
      )}

      {/* Input area */}
      <div className="py-3 border-t border-white/10">
        <div className="flex gap-3 items-end">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu respuesta..."
            rows={2}
            disabled={isStreaming}
            className="flex-1 px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white
              placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50
              resize-none text-sm disabled:opacity-50 transition-all duration-200"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isStreaming}
            className="flex-shrink-0 w-11 h-11 rounded-xl bg-gold flex items-center justify-center
              disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gold-light
              active:scale-95 transition-all duration-200"
          >
            <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <p className="text-white/25 text-xs mt-2 text-center">Enter para enviar · Shift+Enter para nueva línea</p>
      </div>
    </div>
  )
}
