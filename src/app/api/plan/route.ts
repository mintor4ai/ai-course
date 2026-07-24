import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { Compromiso } from '@/lib/types'
import { createServiceClient } from '@/lib/supabase'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

async function getPrompt(key: string, fallback: string): Promise<string> {
  try {
    const supabase = createServiceClient()
    const { data } = await supabase
      .from('prompt_versions')
      .select('content')
      .eq('prompt_key', key)
      .eq('is_active', true)
      .single()
    return data?.content ?? fallback
  } catch { return fallback }
}

const PLAN_ADOPTION_DEFAULT = `Eres un consultor senior de adopción de IA con mentalidad de liderazgo organizacional.
Basándote en toda la información recopilada del participante:

DATOS DISPONIBLES:
- Nombre: {nombre}
- Puesto: {puesto}
- Departamento: {departamento}
- Top 5 aprendizajes seleccionados: {aprendizajes}
- Tareas repetitivas identificadas: {tareasResumen}
- Horas semanales que espera recuperar: {horas_proyectadas}
- Área de mayor impacto: {area_impacto}
- Nivel de listo para implementar: {nivel_listo}

GENERA entre 3 y 4 compromisos de acción para los próximos 90 días.

REGLAS:
- Un director/gerente debe tener al menos 1 compromiso de liderazgo de equipo.
- Cada compromiso: título corto · descripción de 2 líneas · métrica de éxito.
- Conecta con los aprendizajes que seleccionó.
- Usa herramientas del curso: Make.com, GPTs, Claude, NotebookLM, Gamma, Excel+Copilot.
- Tono: motivacional, ejecutivo, directo.
- Usa mantras del curso cuando encajen: "Tú eres el piloto, la IA es tu copiloto", "Strategy first, technology second.", "La IA amplifica tu talento, no lo reemplaza."

Responde ÚNICAMENTE con un JSON array (sin markdown):
[
  { "titulo": "...", "descripcion": "...", "metrica": "..." }
]`

export async function POST(req: NextRequest) {
  try {
    const { participant, aprendizajes, tareasResumen, impactAnswers } = await req.json()

    const promptTemplate = await getPrompt('plan_adoption', PLAN_ADOPTION_DEFAULT)
    const prompt = promptTemplate
      .replace('{nombre}', participant.nombre ?? '')
      .replace('{puesto}', participant.puesto ?? '')
      .replace('{departamento}', participant.departamento ?? '')
      .replace('{aprendizajes}', (aprendizajes || []).join(', '))
      .replace('{tareasResumen}', tareasResumen ?? '')
      .replace('{horas_proyectadas}', impactAnswers?.horas_proyectadas ?? 'N/A')
      .replace('{area_impacto}', impactAnswers?.area_impacto ?? 'N/A')
      .replace('{nivel_listo}', impactAnswers?.nivel_listo ?? 'N/A')

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    let plan: Compromiso[] = []
    if (jsonMatch) {
      try { plan = JSON.parse(jsonMatch[0]) }
      catch { plan = [{ titulo: 'Plan generado', descripcion: text.slice(0, 200), metrica: '' }] }
    }

    return NextResponse.json({ plan })
  } catch (err) {
    console.error('plan:', err)
    return NextResponse.json({ error: 'Error al generar el plan' }, { status: 500 })
  }
}
