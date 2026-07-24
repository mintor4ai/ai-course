import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function authorized(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? ''
  const [, b64] = auth.split(' ')
  if (!b64) return false
  const [, password] = Buffer.from(b64, 'base64').toString().split(':')
  return password === process.env.ADMIN_PASSWORD
}

function validate(key: string, output: string): { valid: boolean; validationMessage: string } {
  switch (key) {
    case 'diagnostic_individual':
      if (output.includes('CASO_RAPIDO:') && output.includes('RECOMENDACION:') && output.includes('PROXIMO_PASO:')) {
        return { valid: true, validationMessage: 'Contiene los 3 bloques requeridos: CASO_RAPIDO, RECOMENDACION, PROXIMO_PASO.' }
      }
      return { valid: false, validationMessage: 'Falta al menos uno de los bloques requeridos: CASO_RAPIDO:, RECOMENDACION:, PROXIMO_PASO:' }

    case 'diagnostic_executive':
      if (output.length >= 100) return { valid: true, validationMessage: 'Salida válida (≥100 caracteres).' }
      return { valid: false, validationMessage: 'La salida es demasiado corta (mínimo 100 caracteres).' }

    case 'survey_generator':
      try {
        const cleaned = output.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
        const parsed = JSON.parse(cleaned)
        if (Array.isArray(parsed.sections)) return { valid: true, validationMessage: 'JSON válido con array "sections".' }
        return { valid: false, validationMessage: 'JSON válido pero falta el array "sections".' }
      } catch {
        return { valid: false, validationMessage: 'La salida no es JSON válido.' }
      }

    default:
      if (output.length >= 50) return { valid: true, validationMessage: 'Salida válida (≥50 caracteres).' }
      return { valid: false, validationMessage: 'La salida es demasiado corta (mínimo 50 caracteres).' }
  }
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { key, content, respondentId } = await req.json()
  if (!key || !content) return NextResponse.json({ error: 'key y content requeridos' }, { status: 400 })

  const supabase = createServiceClient()

  // Fetch respondent data if provided
  let respondentData: Record<string, unknown> = {}
  if (respondentId) {
    const { data: respondent } = await supabase
      .from('survey_respondents')
      .select('id, email, nombre, survey_responses!survey_responses_respondent_id_fkey(*)')
      .eq('id', respondentId)
      .single()
    if (respondent) {
      respondentData = respondent as Record<string, unknown>
    }
  }

  // Build message based on prompt key
  let userMessage = ''
  const resp = (Array.isArray(respondentData.survey_responses)
    ? (respondentData.survey_responses as Record<string, unknown>[])[0]
    : respondentData.survey_responses ?? {}) as Record<string, unknown>

  const answers = (resp?.answers ?? {}) as Record<string, unknown>
  const scores = (resp?.scores ?? {}) as Record<string, number>

  switch (key) {
    case 'diagnostic_individual': {
      const dataBlock = `
PERFIL DEL PARTICIPANTE:
- Nombre: ${respondentData.nombre ?? 'Participante de prueba'}
- Email: ${respondentData.email ?? 'test@example.com'}
- Perfil IA: ${resp?.profile_name ?? 'AI Practitioner'} (score ${resp?.profile_score ?? 65}/100)
- Nivel recomendado: ${resp?.recommended_level ?? 'intermediate'}
- Posible AI Champion: ${resp?.possible_ai_champion ? 'Sí' : 'No'}

DIMENSIONES:
${Object.entries(scores).map(([k, v]) => `- ${k}: ${v}`).join('\n') || '- adoption: 60\n- impact: 55\n- strategy: 50'}

RESPUESTAS:
- Tarea frecuente: ${answers.frequent_time_consuming_task ?? 'Redacción de reportes'}
- Expectativa del curso: ${answers.course_value_expectation ?? 'Ahorrar tiempo en tareas repetitivas'}
- Herramientas usadas: ${(answers.ai_tools_used as string[] ?? ['ChatGPT']).join(', ')}
- Principal barrera: ${answers.primary_ai_adoption_barrier ?? 'Falta de tiempo para aprender'}`
      userMessage = `${content}\n\n${dataBlock}`
      break
    }

    case 'diagnostic_executive': {
      const dataBlock = `
DATOS DEL COHORTE (PRUEBA):
Campaña: Campaña de prueba
Empresa: Empresa de prueba
Participantes: 15
Tasa de respuesta: 80%
Distribución de perfiles:
  - AI Explorer: 5
  - AI Practitioner: 7
  - AI Champion: 3
Promedios por dimensión:
  - adoption: 62
  - impact: 58
  - strategy: 45
Porcentaje AI Champions: 20%`
      userMessage = `${content}\n\n${dataBlock}`
      break
    }

    default: {
      const genericBlock = respondentId
        ? `\n\nCONTEXTO DEL PARTICIPANTE:\n- Nombre: ${respondentData.nombre ?? 'Participante'}\n- Email: ${respondentData.email ?? 'test@example.com'}`
        : '\n\nCONTEXTO: Prueba de prompt sin participante específico.'
      userMessage = `${content}${genericBlock}`
    }
  }

  try {
    const aiResp = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{ role: 'user', content: userMessage }],
    })
    const output = aiResp.content[0].type === 'text' ? aiResp.content[0].text : ''
    const { valid, validationMessage } = validate(key, output)
    return NextResponse.json({ output, valid, validationMessage })
  } catch (err) {
    console.error('Claude test error:', err)
    return NextResponse.json({ error: 'Error al llamar a Claude' }, { status: 500 })
  }
}
