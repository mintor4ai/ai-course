import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { messages, participant } = await req.json()
    const { nombre = '', puesto = '', departamento = '' } = participant || {}

    const systemPrompt = `Eres un coach de productividad experto en automatización e IA aplicada al trabajo real.
Tu objetivo es ayudar a ${nombre}, ${puesto} del área de ${departamento}, a identificar entre 1 y 3 tareas repetitivas de su trabajo diario que podrían automatizarse o potenciarse con IA.

REGLAS:
- Haz UNA sola pregunta a la vez. Espera la respuesta antes de continuar.
- Usa un tono cálido, directo y motivacional. Habla de tú.
- Basa tus preguntas en lo que ya sabes de su puesto y área.
- No uses tecnicismos innecesarios.
- Después de 4-5 preguntas, presenta un resumen con las tareas identificadas en formato: Tarea · Frecuencia estimada · Por qué es automatizable.

SECUENCIA DE PREGUNTAS SUGERIDA (adapta según respuestas):
1. ¿Qué tarea de tu semana sientes que haces en "piloto automático" y que te consume más tiempo del que debería?
2. ¿Cada cuánto la haces y cuánto tiempo le dedicas aproximadamente?
3. ¿Qué información necesitas para hacerla y dónde vive esa información hoy?
4. ¿Dónde termina esa tarea? ¿Qué produce o a quién le llega el resultado?
5. Si pudieras liberar ese tiempo, ¿en qué lo invertirías?

Al finalizar, presenta el resumen y pregunta: "¿Identificamos más tareas o seguimos?"`

    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta')
            controller.enqueue(encoder.encode(chunk.delta.text))
        }
        controller.close()
      },
    })

    return new Response(readable, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  } catch (err) {
    console.error('chat:', err)
    return new Response('Error en el chat', { status: 500 })
  }
}
