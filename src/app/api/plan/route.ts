import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { participant, selectedTopics, chatMessages, impactAnswers } = body

    const chatSummary = chatMessages
      .filter((m: { role: string }) => m.role === 'user')
      .map((m: { content: string }) => m.content)
      .join('\n')

    const systemPrompt = `Eres un consultor de IA experto de Human.AiX. Crea planes de implementación de IA ejecutivos, concretos y accionables.`

    const userPrompt = `Crea un plan de implementación de IA de 90 días para:

**Perfil:**
- Nombre: ${participant.name}
- Puesto: ${participant.position}
- Departamento: ${participant.department}

**Áreas de interés en IA:**
${selectedTopics.map((t: string, i: number) => `${i + 1}. ${t}`).join('\n')}

**Tareas repetitivas identificadas:**
${chatSummary || 'Información de conversación previa'}

**Análisis de impacto:**
- Horas semanales en tareas repetitivas: ${impactAnswers.weekly_hours || 'N/A'}
- Urgencia: ${impactAnswers.urgency || 'N/A'}
- Personas en el equipo que se beneficiarían: ${impactAnswers.team_size || 'N/A'}
- Uso actual de IA en la organización: ${impactAnswers.ai_usage || 'N/A'}

Crea el plan con este formato exacto:

## Diagnóstico Ejecutivo

[2-3 oraciones resumiendo la situación y el potencial de impacto]

## Días 1-30: Fundamentos y Quick Wins

### Semana 1-2: Arranque
- [acción específica con herramienta IA concreta]
- [acción específica con herramienta IA concreta]
- [acción específica con herramienta IA concreta]

### Semana 3-4: Primeros resultados
- [acción específica]
- [acción específica]
- [acción específica]

**Resultado esperado:** [métrica concreta de impacto]

## Días 31-60: Expansión

### Automatizaciones clave
- [proceso específico a automatizar]
- [proceso específico a automatizar]
- [proceso específico a automatizar]

### Herramientas recomendadas
- [herramienta]: [uso específico]
- [herramienta]: [uso específico]
- [herramienta]: [uso específico]

**Resultado esperado:** [métrica concreta]

## Días 61-90: Escala y Cultura IA

### Expansión al equipo
- [acción de evangelización]
- [acción de entrenamiento]
- [proceso de medición]

### KPIs a trackear
- [KPI 1 con número objetivo]
- [KPI 2 con número objetivo]
- [KPI 3 con número objetivo]

**Resultado esperado:** [transformación organizacional esperada]

## Tu Quick Win de esta semana

[1 acción muy específica que pueden hacer HOY, con la herramienta exacta y el resultado esperado en horas]

Responde en español, sé muy específico con herramientas y números. Adapta todo al contexto de ${participant.position} en ${participant.department}.`

    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await client.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 2000,
            system: systemPrompt,
            messages: [{ role: 'user', content: userPrompt }],
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
    console.error('Plan error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
