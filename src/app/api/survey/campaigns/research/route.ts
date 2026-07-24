import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'

function authorized(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? ''
  const [, b64] = auth.split(' ')
  if (!b64) return false
  const [, password] = Buffer.from(b64, 'base64').toString().split(':')
  return password === process.env.ADMIN_PASSWORD
}

const anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

async function tavilySearch(query: string): Promise<string> {
  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query,
        max_results: 5,
        search_depth: 'advanced',
      }),
    })
    if (!res.ok) return ''
    const data = await res.json()
    const results: Array<{ title: string; url: string; content: string; score: number }> = data.results ?? []
    return results
      .slice(0, 5)
      .map(r => `[${r.title}](${r.url})\n${r.content}`)
      .join('\n\n')
  } catch {
    return ''
  }
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { campaign_id, empresa, descripcion, company_url, company_linkedin } = await req.json()
  if (!campaign_id || !empresa) {
    return NextResponse.json({ error: 'campaign_id y empresa requeridos' }, { status: 400 })
  }

  // Run 2-3 Tavily searches
  const [r1, r2] = await Promise.all([
    tavilySearch(`"${empresa}" empresa industria cultura organizacional`),
    tavilySearch(`"${empresa}" inteligencia artificial tecnología transformación digital`),
  ])
  const searchResults = [r1, r2].filter(Boolean).join('\n\n---\n\n')

  const prompt = `Eres un analista de negocios de Human.AiX. Con base en la información recopilada, genera un perfil estructurado de la empresa en español para contextualizar un programa de capacitación en IA.

EMPRESA: ${empresa}
URL: ${company_url || 'No proporcionada'}
LinkedIn: ${company_linkedin || 'No proporcionado'}
Descripción proporcionada: ${descripcion || 'No proporcionada'}

INFORMACIÓN RECOPILADA:
${searchResults || '(Sin resultados de búsqueda)'}

Genera un perfil con estas secciones (texto plano, conciso):

INDUSTRIA Y GIRO:
[1-2 líneas sobre industria, sector y actividad principal]

TAMAÑO Y PRESENCIA:
[Empleados aproximados, presencia geográfica, mercados]

CULTURA Y VALORES:
[Valores declarados, cultura organizacional, estilo de liderazgo]

MADUREZ TECNOLÓGICA:
[Nivel de adopción tecnológica, herramientas conocidas, iniciativas digitales]

CONTEXTO PARA IA:
[Por qué la IA es relevante para esta empresa, áreas de mayor oportunidad, posibles resistencias o aceleradores]

RECOMENDACIONES PARA EL PROGRAMA:
[2-3 puntos sobre cómo personalizar el programa de capacitación IA para esta empresa específica]`

  const resp = await anthropicClient.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1200,
    messages: [{ role: 'user', content: prompt }],
  })

  const generatedProfile = resp.content[0].type === 'text' ? resp.content[0].text : ''

  // Save to campaign
  const supabase = createServiceClient()
  await supabase
    .from('survey_campaigns')
    .update({ company_context: generatedProfile, updated_at: new Date().toISOString() })
    .eq('id', campaign_id)

  return NextResponse.json({ company_context: generatedProfile })
}
