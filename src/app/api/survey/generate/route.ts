import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'
import { SurveyConfigJSON } from '@/lib/survey-config-json'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function authorized(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? ''
  const [, b64] = auth.split(' ')
  if (!b64) return false
  const [, password] = Buffer.from(b64, 'base64').toString().split(':')
  return password === process.env.ADMIN_PASSWORD
}

const SYSTEM_PROMPT = `Eres un experto en diseño de encuestas de diagnóstico para programas de capacitación en inteligencia artificial. Tu tarea es generar una encuesta personalizada en formato JSON.

REGLAS OBLIGATORIAS:
1. Responde ÚNICAMENTE con el objeto JSON — sin markdown, sin bloques de código, sin explicaciones
2. El objeto debe tener exactamente esta estructura:
{
  "version": 1,
  "sections": [ ...array de secciones... ]
}

TIPOS DE PREGUNTAS DISPONIBLES:
- "short_text": texto corto (máx 200 chars). Usa minLength si quieres mínimo de chars.
- "email": dirección de correo electrónico
- "single_select": selección única. Requiere "options".
- "multi_select": selección múltiple. Requiere "options". Usa isNone:true para opción excluyente.
- "scale": escala numérica. Requiere min, max (usualmente 1-5). Usa scaleLabels:{\"1\":\"...\",\"5\":\"...\"}.
- "long_text": texto largo (minLength, maxLength recomendados). Usa helpText para instrucción adicional.

ESTRUCTURA DE SECCIÓN:
{ "id": "seccion_unica", "title": "Título", "subtitle": "Subtítulo opcional", "questions": [...] }

ESTRUCTURA DE PREGUNTA:
{
  "id": "Q01",           // Incremental Q01, Q02, ...
  "column": "nombre_columna",  // snake_case único, descriptivo
  "label": "Texto de la pregunta",
  "type": "...",
  "required": true,
  "options": [{ "value": "valor_unico", "label": "Etiqueta visible", "score": 0 }],  // solo si aplica
  "showIfColumn": "otra_columna",  // opcional: mostrar solo si otra respuesta...
  "showIfValue": "valor_esperado", // ...es igual a este valor
  "helpText": "Instrucción adicional",
  "minLength": 30,
  "maxLength": 500,
  "min": 1, "max": 5,
  "scaleLabels": {"1": "Nada", "5": "Mucho"}
}

LINEAMIENTOS DE DISEÑO:
- Entre 4 y 8 secciones. Entre 2 y 6 preguntas por sección.
- Total de preguntas: 16 a 28.
- Primera sección: perfil básico del participante (nombre, email, rol, antigüedad).
- Última sección: expectativas y disposición al cambio.
- Usa preguntas abiertas (long_text) solo para capturar casos reales o contexto específico.
- Usa scale para auto-evaluaciones de confianza o frecuencia.
- Usa single_select con opciones graduales cuando quieras scoring.
- Incluye "score" en opciones de single_select que quieras ponderar (0 a 5).
- Usa isNone:true para opciones como "Ninguna" o "No aplica" en multi_select.
- Todo el contenido en ESPAÑOL de México.
- Sé específico al contexto de la empresa y el tipo de programa descrito.`

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { campaignId, prompt, save } = await req.json()
  if (!campaignId || !prompt?.trim()) {
    return NextResponse.json({ error: 'campaignId y prompt requeridos' }, { status: 400 })
  }

  // Fetch campaign context
  const supabase = createServiceClient()
  const { data: campaign } = await supabase
    .from('survey_campaigns')
    .select('nombre, empresa, tipo, descripcion')
    .eq('id', campaignId)
    .single()

  const context = campaign
    ? `Campaña: "${campaign.nombre}" | Empresa: ${campaign.empresa} | Tipo: ${campaign.tipo === 'pre' ? 'pre-curso' : 'post-curso'}${campaign.descripcion ? ` | Descripción: ${campaign.descripcion}` : ''}`
    : ''

  const userMessage = [
    context && `CONTEXTO DE LA CAMPAÑA:\n${context}\n`,
    `INSTRUCCIONES DEL ADMINISTRADOR:\n${prompt.trim()}`,
  ].filter(Boolean).join('\n')

  let rawText = ''
  try {
    const resp = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 6000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    })
    rawText = resp.content[0].type === 'text' ? resp.content[0].text : ''
  } catch (e) {
    console.error('Claude generate error:', e)
    return NextResponse.json({ error: 'Error al generar encuesta con IA' }, { status: 500 })
  }

  // Parse JSON (handle accidental markdown fences)
  let config: SurveyConfigJSON
  try {
    const cleaned = rawText.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
    config = JSON.parse(cleaned)
    if (config.version !== 1 || !Array.isArray(config.sections) || config.sections.length === 0) {
      throw new Error('Invalid config structure')
    }
  } catch (e) {
    console.error('JSON parse error:', e, '\nRaw:', rawText.slice(0, 500))
    return NextResponse.json({ error: 'La IA generó una respuesta inválida. Intenta de nuevo.' }, { status: 500 })
  }

  // Attach metadata
  config.generatedAt = new Date().toISOString()
  config.promptUsed = prompt.trim()

  if (save) {
    const { error } = await supabase
      .from('survey_campaigns')
      .update({ survey_config: config, updated_at: new Date().toISOString() })
      .eq('id', campaignId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ config })
}
