import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { Compromiso } from '@/lib/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { participant, aprendizajes, tareasResumen, impactAnswers } = await req.json()

    const prompt = `Eres un consultor senior de adopción de IA con mentalidad de liderazgo organizacional.
Basándote en toda la información recopilada del participante:

DATOS DISPONIBLES:
- Nombre: ${participant.nombre}
- Puesto: ${participant.puesto}
- Departamento: ${participant.departamento}
- Top 5 aprendizajes seleccionados: ${aprendizajes.join(', ')}
- Tareas repetitivas identificadas: ${tareasResumen}
- Horas semanales que espera recuperar: ${impactAnswers.horas_proyectadas}
- Área de mayor impacto: ${impactAnswers.area_impacto}
- Nivel de listo para implementar: ${impactAnswers.nivel_listo}

GENERA entre 3 y 4 compromisos de acción para los próximos 90 días.

REGLAS:
- Decide el mix (herramientas vs liderazgo) basándote en el puesto y perfil.
  Un director debe tener al menos 1 compromiso de liderazgo de equipo.
  Un gerente operativo puede tener más foco en herramientas.
- Cada compromiso debe tener: título corto · descripción de 2 líneas · métrica de éxito.
- Conecta los compromisos con los aprendizajes que él mismo seleccionó.
- Usa las herramientas del curso cuando sea relevante: Make.com, GPTs personalizados, Claude, NotebookLM, Gamma, Excel+Copilot.
- Incluye al menos 1 compromiso relacionado con liderazgo si el puesto lo amerita.
- Tono: motivacional, ejecutivo, directo. Sin relleno.
- Incorpora sutilmente mantras del curso donde encajen: "Tú eres el piloto, la IA es tu copiloto", "No vendas la herramienta. Comparte la experiencia.", "Strategy first, technology second.", "La IA amplifica tu talento, no lo reemplaza."

Responde ÚNICAMENTE con un JSON array con esta estructura exacta (sin markdown, sin explicación):
[
  {
    "titulo": "Título corto del compromiso",
    "descripcion": "Descripción de 2 líneas máximo explicando qué hará y cómo.",
    "metrica": "Métrica de éxito medible y concreta"
  }
]`

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    let plan: Compromiso[] = []

    if (jsonMatch) {
      try {
        plan = JSON.parse(jsonMatch[0])
      } catch {
        plan = [{ titulo: 'Error al parsear', descripcion: text, metrica: '' }]
      }
    } else {
      plan = [{ titulo: 'Plan generado', descripcion: text, metrica: '' }]
    }

    return NextResponse.json({ plan })
  } catch (err: unknown) {
    console.error('plan error:', err)
    return NextResponse.json({ error: 'Error al generar el plan' }, { status: 500 })
  }
}
