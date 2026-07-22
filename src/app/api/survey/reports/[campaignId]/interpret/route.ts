import { NextRequest, NextResponse } from 'next/server'

function authorized(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? ''
  const [, b64] = auth.split(' ')
  if (!b64) return false
  const [, password] = Buffer.from(b64, 'base64').toString().split(':')
  return password === process.env.ADMIN_PASSWORD
}

function buildPrompt(stats: any): string {
  const {
    campaign,
    totalSent,
    responseRate,
    profileDistribution,
    dimensionAverages,
    aiChampionPct,
    courseLevelDistribution,
    respondents,
  } = stats

  // Profile distribution as bullet list
  const profileLines = Object.entries(profileDistribution ?? {})
    .map(([name, count]) => `  - ${name}: ${count}`)
    .join('\n')

  // Dimension averages sorted highest to lowest
  const sortedDimensions = Object.entries(dimensionAverages ?? {})
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .map(([key, val]) => `  - ${key}: ${val}`)
    .join('\n')

  // Course level distribution
  const courseLevelLines = Object.entries(courseLevelDistribution ?? {})
    .map(([level, count]) => `  - ${level}: ${count}`)
    .join('\n')

  // Collect open text answers (first 3 non-empty)
  const freqTasks: string[] = []
  const courseExpectations: string[] = []
  for (const r of respondents ?? []) {
    if (freqTasks.length < 3 && r.answers?.frequent_time_consuming_task) {
      freqTasks.push(r.answers.frequent_time_consuming_task)
    }
    if (courseExpectations.length < 3 && r.answers?.course_value_expectation) {
      courseExpectations.push(r.answers.course_value_expectation)
    }
    if (freqTasks.length >= 3 && courseExpectations.length >= 3) break
  }

  const freqTaskLines = freqTasks.length > 0
    ? freqTasks.map((t, i) => `  ${i + 1}. "${t}"`).join('\n')
    : '  (sin respuestas)'

  const expectationLines = courseExpectations.length > 0
    ? courseExpectations.map((t, i) => `  ${i + 1}. "${t}"`).join('\n')
    : '  (sin respuestas)'

  return `Eres consultor senior de transformación digital de Human.AiX. Genera un diagnóstico ejecutivo del cohorte en español. Responde SOLO con el diagnóstico, sin encabezados extra. Estructura: 4 párrafos. Párrafo 1: estado actual del grupo. Párrafo 2: fortalezas colectivas detectadas. Párrafo 3: brechas críticas y riesgos. Párrafo 4: recomendaciones concretas para el diseño del programa. Sé específico, usa los datos. Tono ejecutivo, no académico.

---

DATOS DEL COHORTE:

Campaña: ${campaign?.nombre ?? 'N/A'}
Empresa: ${campaign?.empresa ?? 'N/A'}
Tipo: ${campaign?.tipo ?? 'N/A'}

Participantes enviados: ${totalSent}
Tasa de respuesta: ${responseRate}%

Distribución de perfiles:
${profileLines || '  (sin datos)'}

Promedios por dimensión (de mayor a menor):
${sortedDimensions || '  (sin datos)'}

Porcentaje AI Champions: ${aiChampionPct}%

Distribución por nivel de curso recomendado:
${courseLevelLines || '  (sin datos)'}

Tareas frecuentes que consumen más tiempo (respuestas abiertas):
${freqTaskLines}

Expectativas del programa (respuestas abiertas):
${expectationLines}
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

  const prompt = buildPrompt(stats)

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
        max_tokens: 1800,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!claudeRes.ok) {
      console.error('Claude API error:', claudeRes.status, await claudeRes.text())
      return NextResponse.json({ error: 'Error al generar narrativa' }, { status: 500 })
    }

    const claudeData = await claudeRes.json()
    const narrative: string = claudeData.content?.[0]?.text ?? ''

    return NextResponse.json({ narrative })
  } catch (err) {
    console.error('Error calling Claude API:', err)
    return NextResponse.json({ error: 'Error al generar narrativa' }, { status: 500 })
  }
}
