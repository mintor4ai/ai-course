import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'
import { google } from 'googleapis'
import nodemailer from 'nodemailer'
import { ROLE_LABELS } from '@/lib/survey-config'

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

const DIAGNOSTIC_INDIVIDUAL_DEFAULT = `Eres consultor senior de transformación digital de Human.AiX. Genera recomendaciones ejecutivas personalizadas en español.

Genera SOLO estos 3 bloques (texto plano, sin HTML, en español):

CASO_RAPIDO:
[Un caso de uso concreto que puede ejecutar HOY, en menos de 30 min, relacionado directamente con su tarea frecuente y función. Incluye: qué herramienta usar, qué pedirle exactamente, qué resultado obtendrá.]

RECOMENDACION:
[2-3 oraciones ejecutivas sobre su momento actual con la IA y qué debería priorizar los próximos 30 días. Específico para su función y nivel.]

PROXIMO_PASO:
[Una acción concreta que puede hacer esta semana para avanzar hacia el siguiente perfil de adopción.]`

const PROFILE_DESCRIPTIONS: Record<string, { desc: string; fortaleza: string; desarrollo: string; mensaje: string }> = {
  'AI Explorer': {
    desc: 'Estás iniciando tu relación con la inteligencia artificial. La curiosidad y apertura que traes son el punto de partida más valioso.',
    fortaleza: 'Mentalidad abierta y disposición para aprender sin sesgos previos.',
    desarrollo: 'Construir confianza práctica usando IA en tareas concretas del día a día.',
    mensaje: 'El curso está diseñado para este momento. Saldrás con casos de uso reales y concretos.',
  },
  'AI Practitioner': {
    desc: 'Ya usas IA de forma regular y tienes experiencia práctica. El siguiente paso es hacer tu uso más sistemático y de mayor impacto.',
    fortaleza: 'Experiencia práctica y criterio para saber cuándo la IA ayuda y cuándo no.',
    desarrollo: 'Estructurar mejor tus instrucciones y construir flujos repetibles que ahorren tiempo consistentemente.',
    mensaje: 'El curso te dará el método y las herramientas para pasar de usuario frecuente a usuario experto.',
  },
  'AI-Enhanced Developer': {
    desc: 'Integras IA en tu flujo de desarrollo con resultados reales. Tu oportunidad está en elevar la calidad y velocidad de lo que ya produces.',
    fortaleza: 'Capacidad técnica para aplicar IA en tareas de desarrollo con resultados medibles.',
    desarrollo: 'Diseñar flujos de agentes, crear instrucciones de repositorio y elevar la calidad del código generado.',
    mensaje: 'El curso te llevará del uso individual al diseño de flujos técnicos que multiplican tu productividad.',
  },
  'AI-Enhanced Architect': {
    desc: 'Aplicas IA al análisis y diseño de sistemas con madurez técnica. Tu oportunidad está en escalar ese criterio a estándares de equipo.',
    fortaleza: 'Visión sistémica para aplicar IA en decisiones de arquitectura y diseño técnico.',
    desarrollo: 'Definir estándares, instrucciones de repositorio y flujos de agentes a escala de equipo.',
    mensaje: 'El curso te ayudará a convertir tu experiencia individual en estrategia técnica compartida.',
  },
  'AI-Enhanced Tech Lead': {
    desc: 'Usas IA con criterio técnico y empiezas a impactar a tu equipo. Tu oportunidad está en convertir ese uso en práctica colectiva.',
    fortaleza: 'Capacidad de integrar IA en procesos técnicos y de liderazgo con resultados medibles.',
    desarrollo: 'Estandarizar el uso de IA en el equipo, crear skills reutilizables y desarrollar AI Champions.',
    mensaje: 'El curso te dará marcos para pasar de adopción individual a transformación de equipo.',
  },
  'AI-Enhanced Analyst': {
    desc: 'Integras IA en tu trabajo funcional y produces mejor documentación y especificaciones. Tu oportunidad está en sistematizar ese proceso.',
    fortaleza: 'Capacidad de usar IA para estructurar requerimientos, historias y criterios con mayor calidad.',
    desarrollo: 'Crear plantillas y flujos reutilizables para convertir conversaciones en especificaciones listas para desarrollo.',
    mensaje: 'El curso te ayudará a pasar de uso ocasional a un proceso sistemático de análisis asistido por IA.',
  },
  'AI-Enhanced Professional': {
    desc: 'Integras IA en tu función con resultados concretos. Tu oportunidad está en sistematizar ese uso y ampliar su impacto.',
    fortaleza: 'Capacidad práctica de aplicar IA en actividades de tu área con resultados medibles.',
    desarrollo: 'Construir flujos y prácticas reutilizables que conviertan tu uso en un proceso repetible.',
    mensaje: 'El curso te dará la estructura para pasar de experimentación a adopción sistemática.',
  },
  'AI Champion': {
    desc: 'Eres un referente en adopción de IA en tu entorno. Usas múltiples herramientas con criterio y ya generas impacto más allá de tu trabajo individual.',
    fortaleza: 'Visión estratégica y capacidad de identificar, documentar y escalar casos de alto valor.',
    desarrollo: 'Diseñar gobernanza, estándares y estrategia de adopción a escala de equipo u organización.',
    mensaje: 'El curso potenciará tu rol como agente de transformación y te conectará con casos de mayor alcance.',
  },
}

const COURSE_LEVEL_LABELS: Record<string, string> = {
  foundational: 'Fundamentos de IA',
  intermediate: 'Uso avanzado y flujos',
  advanced: 'Estrategia y agentes IA',
}

type Answers = Record<string, unknown>

async function generateDiagnosticHtml(data: {
  nombre: string
  role: string
  experienceRange: string
  answers: Answers
  profileName: string
  profileScore: number
  courseLevel: string
  possibleAiChampion: boolean
  dimensions: Record<string, number>
  campaign: { nombre: string; empresa: string }
}): Promise<string> {
  const pDesc = PROFILE_DESCRIPTIONS[data.profileName] ?? PROFILE_DESCRIPTIONS['AI Explorer']
  const rolLabel = ROLE_LABELS[data.role] ?? data.role
  const levelLabel = COURSE_LEVEL_LABELS[data.courseLevel] ?? data.courseLevel

  const frequentTask = (data.answers['frequent_time_consuming_task'] as string | undefined) ?? ''
  const expectation = (data.answers['course_value_expectation'] as string | undefined) ?? ''
  const tools = (data.answers['ai_tools_used'] as string[] | undefined ?? []).filter(t => t !== 'none').join(', ')
  const barrier = data.answers['primary_ai_adoption_barrier'] as string | undefined

  const staticInstructions = await getPrompt('diagnostic_individual', DIAGNOSTIC_INDIVIDUAL_DEFAULT)

  const dataBlock = `
PERFIL DEL PARTICIPANTE:
- Nombre: ${data.nombre}
- Función: ${rolLabel}
- Experiencia en tecnología: ${data.experienceRange}
- Perfil IA: ${data.profileName} (score ${data.profileScore}/100)
- Nivel de curso recomendado: ${levelLabel}
- Posible AI Champion: ${data.possibleAiChampion ? 'Sí' : 'No'}
- Herramientas usadas: ${tools || 'ninguna todavía'}
- Principal barrera: ${barrier ?? 'no especificada'}
- Tarea frecuente: ${frequentTask}
- Expectativa del curso: ${expectation}

DIMENSIONES (0-100):
${Object.entries(data.dimensions).map(([k, v]) => `- ${k}: ${v}`).join('\n')}`

  const prompt = `${staticInstructions}\n${dataBlock}`

  const resp = await client.messages.create({
    model: 'claude-sonnet-4-6', max_tokens: 900,
    messages: [{ role: 'user', content: prompt }],
  })
  const txt = resp.content[0].type === 'text' ? resp.content[0].text : ''
  const casoRapido = (txt.match(/CASO_RAPIDO:\n([\s\S]*?)(?=RECOMENDACION:|$)/) || [])[1]?.trim() ?? ''
  const recomendacion = (txt.match(/RECOMENDACION:\n([\s\S]*?)(?=PROXIMO_PASO:|$)/) || [])[1]?.trim() ?? ''
  const proximoPaso = (txt.match(/PROXIMO_PASO:\n([\s\S]*?)$/) || [])[1]?.trim() ?? ''

  const profiles = ['AI Explorer', 'AI Practitioner', `AI-Enhanced ${rolLabel}`, 'AI Champion']

  const scoreWidth = Math.max(4, Math.min(100, data.profileScore))

  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Tu Perfil de Adopcion IA - ${data.nombre}</title></head>
<body style="margin:0;padding:0;background-color:#F9FAFB;font-family:Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F9FAFB">
<tr><td align="center" style="padding:24px 16px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">

  <!-- HEADER -->
  <tr><td bgcolor="#7C3AED" style="background-color:#7C3AED;border-radius:20px 20px 0 0;padding:36px 32px;text-align:center">
    <img src="https://humanaix.mx/assets/logos/LogoHumanAlta.png" alt="Human.AiX" width="140" style="display:block;margin:0 auto 20px">
    <p style="color:#E9D5FF;font-size:11px;letter-spacing:3px;text-transform:uppercase;margin:0 0 6px;font-family:Arial,sans-serif">${data.campaign.empresa} &mdash; ${data.campaign.nombre}</p>
    <p style="color:#ffffff;font-size:24px;font-weight:bold;margin:0 0 6px;font-family:Arial,sans-serif">Tu Perfil de Adopcion IA</p>
    <p style="color:#E9D5FF;font-size:13px;margin:0;font-family:Arial,sans-serif">${data.nombre} &middot; ${rolLabel}</p>
  </td></tr>

  <!-- PERFIL ACTUAL -->
  <tr><td bgcolor="#ffffff" style="background-color:#ffffff;border-left:1px solid #E9D5FF;border-right:1px solid #E9D5FF;padding:28px 32px;border-bottom:1px solid #F3F4F6;text-align:center">
    <p style="color:#7C3AED;font-size:10px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;margin:0 0 14px;font-family:Arial,sans-serif">&#9733; TU PERFIL ACTUAL</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 14px">
      <tr><td bgcolor="#7C3AED" style="background-color:#7C3AED;border-radius:30px;padding:10px 28px;text-align:center">
        <span style="color:#ffffff;font-size:18px;font-weight:bold;font-family:Arial,sans-serif">${data.profileName}</span>
      </td></tr>
    </table>
    ${data.possibleAiChampion ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 14px"><tr><td style="background-color:#FFF7ED;border:1px solid #FED7AA;border-radius:20px;padding:4px 14px;text-align:center"><span style="color:#EA580C;font-size:11px;font-weight:bold;font-family:Arial,sans-serif">&#9889; Posible AI Champion</span></td></tr></table>` : ''}
    <p style="color:#374151;font-size:15px;line-height:1.8;margin:0 0 18px;font-family:Arial,sans-serif">${pDesc.desc}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td width="48%" bgcolor="#F5F3FF" style="background-color:#F5F3FF;padding:12px;text-align:center;border-radius:10px">
          <p style="color:#6B7280;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin:0 0 6px;font-family:Arial,sans-serif">TU FORTALEZA</p>
          <p style="color:#7C3AED;font-size:13px;font-weight:bold;margin:0;font-family:Arial,sans-serif">${pDesc.fortaleza}</p>
        </td>
        <td width="4%">&nbsp;</td>
        <td width="48%" bgcolor="#FDF4FF" style="background-color:#FDF4FF;padding:12px;text-align:center;border-radius:10px">
          <p style="color:#6B7280;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin:0 0 6px;font-family:Arial,sans-serif">AREA DE DESARROLLO</p>
          <p style="color:#9333EA;font-size:13px;font-weight:bold;margin:0;font-family:Arial,sans-serif">${pDesc.desarrollo}</p>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- SCORE -->
  <tr><td bgcolor="#F5F3FF" style="background-color:#F5F3FF;border-left:1px solid #E9D5FF;border-right:1px solid #E9D5FF;padding:24px 32px;border-bottom:1px solid #E9D5FF">
    <p style="color:#7C3AED;font-size:10px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;margin:0 0 14px;font-family:Arial,sans-serif">&#9733; TU NIVEL DE ADOPCION IA</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px">
      <tr>
        <td style="padding-right:12px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td bgcolor="#E9D5FF" style="background-color:#E9D5FF;border-radius:10px;height:12px;line-height:12px;font-size:1px">
                <table role="presentation" cellpadding="0" cellspacing="0" width="${scoreWidth}%">
                  <tr><td bgcolor="#7C3AED" style="background-color:#7C3AED;border-radius:10px;height:12px;line-height:12px;font-size:1px">&nbsp;</td></tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
        <td style="white-space:nowrap;width:1%">
          <span style="color:#7C3AED;font-weight:bold;font-size:20px;font-family:Arial,sans-serif">${data.profileScore}%</span>
        </td>
      </tr>
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px">
      <tr>
        ${profiles.map(p => `<td style="text-align:center;padding:0 2px"><span style="font-size:9px;color:${p===data.profileName?'#7C3AED':'#9CA3AF'};font-weight:${p===data.profileName?'bold':'normal'};font-family:Arial,sans-serif">${p}</span></td>`).join('')}
      </tr>
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td bgcolor="#ffffff" style="background-color:#ffffff;border:1px solid #E9D5FF;border-radius:10px;padding:12px 16px">
        <p style="color:#9CA3AF;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px;font-family:Arial,sans-serif">NIVEL DE CURSO RECOMENDADO</p>
        <p style="color:#7C3AED;font-size:14px;font-weight:bold;margin:0;font-family:Arial,sans-serif">${levelLabel}</p>
      </td></tr>
    </table>
  </td></tr>

  <!-- CASO RAPIDO -->
  <tr><td bgcolor="#ffffff" style="background-color:#ffffff;border-left:1px solid #E9D5FF;border-right:1px solid #E9D5FF;padding:28px 32px;border-bottom:1px solid #F3F4F6">
    <p style="color:#7C3AED;font-size:10px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;margin:0 0 12px;font-family:Arial,sans-serif">&#9733; CASO PRACTICO PARA HOY</p>
    <p style="color:#374151;font-size:14px;line-height:1.8;margin:0;font-family:Arial,sans-serif">${casoRapido.replace(/\n/g, '<br>')}</p>
  </td></tr>

  <!-- RECOMENDACION -->
  <tr><td bgcolor="#ffffff" style="background-color:#ffffff;border-left:1px solid #E9D5FF;border-right:1px solid #E9D5FF;padding:28px 32px;border-bottom:1px solid #F3F4F6">
    <p style="color:#7C3AED;font-size:10px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;margin:0 0 12px;font-family:Arial,sans-serif">&#9733; RECOMENDACION PERSONALIZADA</p>
    <p style="color:#374151;font-size:14px;line-height:1.8;margin:0;font-family:Arial,sans-serif">${recomendacion.replace(/\n/g, '<br>')}</p>
  </td></tr>

  <!-- PROXIMO PASO -->
  <tr><td bgcolor="#ffffff" style="background-color:#ffffff;border-left:1px solid #E9D5FF;border-right:1px solid #E9D5FF;padding:28px 32px">
    <p style="color:#7C3AED;font-size:10px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;margin:0 0 12px;font-family:Arial,sans-serif">&#9733; TU PROXIMO PASO ESTA SEMANA</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px">
      <tr><td bgcolor="#F5F3FF" style="background-color:#F5F3FF;border:1px solid #E9D5FF;border-radius:12px;padding:18px">
        <p style="color:#374151;font-size:14px;line-height:1.8;margin:0;font-family:Arial,sans-serif">${proximoPaso.replace(/\n/g, '<br>')}</p>
      </td></tr>
    </table>
    <p style="color:#6B7280;font-size:12px;margin:0;line-height:1.6;font-family:Arial,sans-serif">${pDesc.mensaje}</p>
  </td></tr>

  <!-- FOOTER -->
  <tr><td bgcolor="#6D28D9" style="background-color:#6D28D9;border-radius:0 0 20px 20px;padding:24px 32px;text-align:center">
    <p style="color:#ffffff;font-size:13px;font-weight:bold;margin:0 0 4px;font-family:Arial,sans-serif">Carlos Garcia &amp; Rodolfo Ordorica</p>
    <p style="color:#C4B5FD;font-size:12px;margin:0 0 12px;font-family:Arial,sans-serif">Human.AiX</p>
    <p style="color:#E9D5FF;font-size:11px;font-style:italic;margin:0;font-family:Arial,sans-serif">&ldquo;Tu eres el piloto. La IA es tu copiloto.&rdquo;</p>
  </td></tr>

</table>
</td></tr>
</table>
</body></html>`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { respondentId, answers, scores, profileName, profileScore, courseLevel, possibleAiChampion, completionTimeSec: clientTimeSec } = body
    if (!respondentId) return NextResponse.json({ error: 'respondentId requerido' }, { status: 400 })

    const supabase = createServiceClient()

    const { data: respondent } = await supabase
      .from('survey_respondents')
      .select('id, email, campaign_id, survey_campaigns(nombre, empresa)')
      .eq('id', respondentId).single()

    if (!respondent) return NextResponse.json({ error: 'Respondente no encontrado' }, { status: 404 })

    const rawCampaign = respondent.survey_campaigns
    const campaign: { nombre: string; empresa: string } = (rawCampaign && !Array.isArray(rawCampaign))
      ? (rawCampaign as { nombre: string; empresa: string })
      : { nombre: 'Diagnóstico IA', empresa: 'Human.AiX' }

    const nombre = (answers?.participant_name as string | undefined) ?? ''
    const role = (answers?.participant_role as string | undefined) ?? ''
    const experienceRange = (answers?.technology_experience_range as string | undefined) ?? ''
    const diagnosticHtml = await generateDiagnosticHtml({
      nombre, role, experienceRange, answers: answers as Answers,
      profileName, profileScore, courseLevel, possibleAiChampion,
      dimensions: scores ?? {},
      campaign,
    })

    const completedAt = new Date()
    // Prefer client-measured time (accurate); fall back to server time only as safety net
    const completionTimeSec = (clientTimeSec && clientTimeSec > 0)
      ? clientTimeSec
      : null

    const { error: upsertError } = await supabase.from('survey_responses').upsert({
      respondent_id: respondentId,
      campaign_id: respondent.campaign_id,
      answers,
      scores,
      profile_name: profileName,
      profile_score: profileScore,
      possible_ai_champion: possibleAiChampion ?? false,
      recommended_level: courseLevel,
      diagnostic_html: diagnosticHtml,
      response_status: 'completed',
      completed_at: completedAt.toISOString(),
      completion_time_seconds: completionTimeSec,
      updated_at: completedAt.toISOString(),
    }, { onConflict: 'respondent_id' })

    if (upsertError) throw new Error(`survey_responses upsert: ${upsertError.message}`)

    await supabase.from('survey_respondents')
      .update({ status: 'completed', completed_at: completedAt.toISOString(), nombre })
      .eq('id', respondentId)

    // Insert admin notification
    await supabase.from('survey_notifications').insert({
      campaign_id: respondent.campaign_id,
      respondent_id: respondentId,
      campaign_name: campaign?.nombre ?? '',
      respondent_email: respondent.email,
      respondent_nombre: nombre || respondent.email,
      profile_name: profileName,
      profile_score: profileScore,
    })

    // Send result email
    try {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GMAIL_CLIENT_ID, process.env.GMAIL_CLIENT_SECRET,
        'https://developers.google.com/oauthplayground'
      )
      oauth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN })
      const { token } = await oauth2Client.getAccessToken()
      const transport = nodemailer.createTransport({
        service: 'gmail',
        auth: { type: 'OAuth2', user: process.env.GMAIL_USER,
          clientId: process.env.GMAIL_CLIENT_ID, clientSecret: process.env.GMAIL_CLIENT_SECRET,
          refreshToken: process.env.GMAIL_REFRESH_TOKEN, accessToken: token as string },
      } as Parameters<typeof nodemailer.createTransport>[0])

      await transport.sendMail({
        from: `"Human.AiX" <${process.env.GMAIL_USER}>`,
        to: respondent.email,
        cc: process.env.GMAIL_USER,
        subject: `Tu Perfil de Adopción IA — ${profileName} | ${campaign.nombre}`,
        html: diagnosticHtml,
      })
    } catch (e) { console.error('result email error:', e) }

    return NextResponse.json({ ok: true, profileName, profileScore })
  } catch (err) {
    console.error('survey submit:', err)
    return NextResponse.json({ error: 'Error al procesar diagnóstico' }, { status: 500 })
  }
}
