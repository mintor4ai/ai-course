import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, participant, selectedTopics, isInitial } = body

    const systemPrompt = `Eres un consultor de IA experto y empático de Human.AiX.
Pregunta al usuario sobre sus 3 tareas más repetitivas en su trabajo (puesto: ${participant.position}, departamento: ${participant.department}).
Sé amable, ejecutivo y directo. Usa un tono profesional pero cercano.
Los temas de IA que le interesan son: ${selectedTopics.join(', ')}.
Después de recopilar las 3 tareas repetitivas, agradece al usuario y di que ya tienes toda la información necesaria para crear su diagnóstico personalizado.
Responde siempre en español. Sé conciso (máximo 3-4 oraciones por respuesta).
NO uses markdown, escribe en texto plano conversacional.`

    const anthropicMessages = isInitial
      ? []
      : messages.map((m: { role: string; content: string }) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }))

    const initialMessage = isInitial
      ? `Hola ${participant.name}! Soy tu consultor de IA de Human.AiX. Me da gusto que estés aquí. Para crear tu diagnóstico personalizado, necesito conocer mejor tu trabajo diario. ¿Cuáles son las 3 tareas más repetitivas que realizas como ${participant.position}? (Las que más tiempo te consumen cada semana)`
      : undefined

    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        try {
          if (isInitial) {
            // Stream the initial greeting
            const words = initialMessage!.split(' ')
            for (const word of words) {
              const data = JSON.stringify({ text: word + ' ' })
              controller.enqueue(encoder.encode(`data: ${data}\n\n`))
              await new Promise((r) => setTimeout(r, 30))
            }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`))
            controller.close()
            return
          }

          const response = await client.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 500,
            system: systemPrompt,
            messages: anthropicMessages,
            stream: true,
          })

          for await (const event of response) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              const data = JSON.stringify({ text: event.delta.text })
              controller.enqueue(encoder.encode(`data: ${data}\n\n`))
            }
            if (event.type === 'message_stop') {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`))
            }
          }

          controller.close()
        } catch (err) {
          controller.error(err)
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (err) {
    console.error('Chat error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
