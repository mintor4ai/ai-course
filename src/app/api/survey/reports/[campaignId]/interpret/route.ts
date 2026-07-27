import { NextRequest, NextResponse } from 'next/server'

import { createServiceClient } from '@/lib/supabase'

function authorized(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? ''
  const [, b64] = auth.split(' ')
  if (!b64) return false
  const [, password] = Buffer.from(b64, 'base64').toString().split(':')
  return password === process.env.ADMIN_PASSWORD
}

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

const DIAGNOSTIC_EXECUTIVE_DEFAULT = `Eres consultor senior de transformación digital de Human.AiX. Genera un diagnóstico ejecutivo del cohorte en español usando formato Markdown.

Estructura obligatoria:

## Estado actual del grupo
[Párrafo con contexto general, tasa de respuesta, score promedio y distribución de perfiles]

## Fortalezas colectivas
[Párrafo con las dimensiones más altas y qué significan para el equipo]

## Brechas críticas y riesgos
[Párrafo con las dimensiones más bajas, patrones de riesgo y consecuencias concretas]

## Recomendaciones para el diseño del programa
[Párrafo con acciones concretas diferenciadas por nivel/perfil]

## Resumen ejecutivo
| Indicador | Valor |
|---|---|
[Tabla con los 5-6 indicadores más relevantes]

**Personas clave a considerar:**
[Lista con nombres reales de participantes destacados y por qué]

Usa **negritas** para destacar datos clave. Sé específico con los datos. Tono ejecutivo, no académico. Menciona participantes por nombre cuando sea relevante.`

function buildPrompt(staticInstructions: string, stats: any): string {
  const {
    campaignName, empresa, companyContext,
    totalEnviados, totalCompletados, tasaRespuesta, scorePromedio,
    profileDistribution, dimensionScores, aiChampionCount, aiChampionPct,
    nivelDistribution, respondents,
  } = stats

  // Aggregate stats
  const profileLines = Object.entries(profileDistribution ?? {})
    .map(([name, count]) => `  - ${name}: ${count} persona(s)`)
    .join('\n')

  const sortedDimensions = Object.entries(dimensionScores ?? {})
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .map(([key, val]) => `  - ${key}: ${Math.round(val as number)}%`)
    .join('\n')

  const nivelLines = Object.entries(nivelDistribution ?? {})
    .map(([level, count]) => `  - ${level}: ${count}`)
    .join('\n')

  // Per-respondent full detail
  const completados = (respondents ?? []).filter((r: any) => r.status === 'completed')

  const respondentDetails = completados.map((r: any, i: number) => {
    const answers = r.answers ?? {}
    const scores = r.scores ?? {}

    // Extract all text answers
    const textAnswers = Object.entries(answers)
      .filter(([, v]) => typeof v === 'string' && (v as string).length > 2)
      .map(([k, v]) => `    ${k}: "${v}"`)
      .join('\n')

    const arrayAnswers = Object.entries(answers)
      .filter(([, v]) => Array.isArray(v) && (v as unknown[]).length > 0)
      .map(([k, v]) => `    ${k}: ${(v as unknown[]).join(', ')}`)
      .join('\n')

    const scoreLines = Object.entries(scores)
      .map(([k, v]) => `    ${k}: ${Math.round(v as number)}%`)
      .join('\n')

    return `  Participante ${i + 1}: ${r.nombre ?? r.email}
  Perfil: ${r.perfil ?? '—'} | Score: ${r.score ?? '—'}% | Nivel recomendado: ${r.nivel ?? '—'} | AI Champion: ${r.aiChampion ? 'Sí' : 'No'} | Tiempo: ${r.tiempoMin ?? '—'} min
  Dimensiones individuales:
${scoreLines || '    (sin datos)'}
  Respuestas seleccionadas:
${arrayAnswers || '    (ninguna)'}
  Respuestas abiertas:
${textAnswers || '    (ninguna)'}`
  }).join('\n\n')

  return `${staticInstructions}

---

CONTEXTO DE LA EMPRESA:
${companyContext || '(No proporcionado)'}

---

DATOS COMPLETOS DEL COHORTE:

Campaña: ${campaignName ?? 'N/A'}
Empresa: ${empresa ?? 'N/A'}
Participantes invitados: ${totalEnviados} | Completados: ${totalCompletados} | Tasa de respuesta: ${tasaRespuesta}%
Score promedio del grupo: ${scorePromedio}%
Posibles AI Champions: ${aiChampionCount} (${aiChampionPct}%)

Distribución de perfiles:
${profileLines || '  (sin datos)'}

Promedios por dimensión (mayor a menor):
${sortedDimensions || '  (sin datos)'}

Distribución por nivel de curso recomendado:
${nivelLines || '  (sin datos)'}

---

DETALLE COMPLETO POR PARTICIPANTE (${completados.length} completados):

${respondentDetails || '  (sin participantes completados)'}
`
}

export async function POST(
  req: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { stats: any }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { stats } = body
  if (!stats) {
    return NextResponse.json({ error: 'Missing stats in body' }, { status: 400 })
  }

  const staticInstructions = await getPrompt('diagnostic_executive', DIAGNOSTIC_EXECUTIVE_DEFAULT)
  const prompt = buildPrompt(staticInstructions, stats)

  try {
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY ?? '',
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4500,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!claudeRes.ok) {
      console.error('Claude API error:', claudeRes.status, await claudeRes.text())
      return NextResponse.json({ error: 'Error al generar narrativa' }, { status: 500 })
    }

    const claudeData = await claudeRes.json()
    const narrative: string = claudeData.content?.[0]?.text ?? ''

    // Persist narrative to campaign
    try {
      const supabase = createServiceClient()
      await supabase
        .from('survey_campaigns')
        .update({ executive_narrative: narrative, executive_narrative_updated_at: new Date().toISOString() })
        .eq('id', params.campaignId)
    } catch (e) {
      console.error('Error saving narrative:', e)
    }

    return NextResponse.json({ narrative })
  } catch (err) {
    console.error('Error calling Claude API:', err)
    return NextResponse.json({ error: 'Error al generar narrativa' }, { status: 500 })
  }
}
