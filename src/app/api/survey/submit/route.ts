import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'
import { google } from 'googleapis'
import nodemailer from 'nodemailer'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const PROFILE_DESCRIPTIONS: Record<string, { desc: string; fortaleza: string; desarrollo: string; mensaje: string }> = {
  'AI Explorer': {
    desc: 'Estás en las primeras etapas de tu relación con la IA. Tienes curiosidad y apertura — eso es el punto de partida más valioso.',
    fortaleza: 'Mentalidad abierta y disposición para aprender sin sesgos previos.',
    desarrollo: 'Construir confianza práctica usando IA en tareas concretas de tu día a día.',
    mensaje: 'El curso está diseñado exactamente para este momento. Saldrás con casos de uso reales y concretos para empezar desde el lunes.',
  },
  'AI Practitioner': {
    desc: 'Ya usas IA de forma regular y tienes experiencia práctica. El siguiente paso es hacer tu uso más sistemático y de mayor impacto.',
    fortaleza: 'Experiencia práctica y criterio para saber cuándo la IA ayuda y cuándo no.',
    desarrollo: 'Estructurar mejor tus prompts y construir flujos repetibles que ahorren tiempo consistentemente.',
    mensaje: 'El curso te dará el método y las herramientas para pasar de usuario frecuente a usuario experto.',
  },
  'AI Strategist': {
    desc: 'Tienes un uso maduro de la IA y la integras a procesos reales. Tu oportunidad está en ampliar el impacto a tu equipo y área.',
    fortaleza: 'Capacidad de integrar IA en flujos de trabajo reales con resultados medibles.',
    desarrollo: 'Liderar la adopción en tu equipo y diseñar procesos donde la IA multiplique el trabajo colectivo.',
    mensaje: 'El curso te dará marcos para escalar tu uso individual en estrategia de equipo y área.',
  },
  'AI Catalyst Leader': {
    desc: 'Eres un referente en adopción de IA. Usas múltiples herramientas con criterio y ya generas impacto en tu entorno.',
    fortaleza: 'Visión estratégica y capacidad de identificar y evangelizar casos de alto valor.',
    desarrollo: 'Diseñar gobernanza, estándares y estrategia de adopción a escala organizacional.',
    mensaje: 'El curso potenciará tu rol como agente de transformación y te conectará con casos de mayor alcance.',
  },
}

async function generateDiagnosticHtml(data: {
  nombre: string; puesto: string; departamento: string; role: string
  answers: { frecuencia: string; herramientas: string[]; barrera: string; tareaFrecuente: string; expectativa: string; confianza: number }
  profileName: string; profileScore: number
  campaign: { nombre: string; empresa: string }
}): Promise<string> {
  const pDesc = PROFILE_DESCRIPTIONS[data.profileName] ?? PROFILE_DESCRIPTIONS['AI Explorer']

  const prompt = `Eres consultor senior de transformación digital de Human.AiX. Genera recomendaciones ejecutivas personalizadas para este participante.

DATOS:
- Nombre: ${data.nombre}
- Puesto: ${data.puesto} | Departamento: ${data.departamento}
- Perfil IA: ${data.profileName} (score ${data.profileScore}/100)
- Frecuencia de uso: ${data.answers.frecuencia}
- Herramientas usadas: ${data.answers.herramientas.join(', ')}
- Confianza (1-5): ${data.answers.confianza}
- Principal barrera: ${data.answers.barrera}
- Tarea frecuente: ${data.answers.tareaFrecuente}
- Expectativa del curso: ${data.answers.expectativa}

Genera SOLO estos 3 bloques (texto plano, sin HTML):

CASO_RAPIDO:
[Un caso de uso concreto que puede ejecutar HOY, en menos de 30 min, sin instalar nada. Basado directamente en su tarea frecuente. Incluye: qué herramienta usar, qué pedirle exactamente, qué resultado obtendrá.]

RECOMENDACION:
[2-3 oraciones ejecutivas sobre su momento actual con la IA y qué debería priorizar en los próximos 30 días. Específico para su puesto y área.]

PROXIMO_PASO:
[Una acción concreta que puede hacer esta semana para avanzar hacia el siguiente perfil de adopción.]`

  const resp = await client.messages.create({
    model: 'claude-sonnet-4-6', max_tokens: 800,
    messages: [{ role: 'user', content: prompt }],
  })
  const txt = resp.content[0].type === 'text' ? resp.content[0].text : ''
  const casoRapido = (txt.match(/CASO_RAPIDO:\n([\s\S]*?)(?=RECOMENDACION:|$)/) || [])[1]?.trim() ?? ''
  const recomendacion = (txt.match(/RECOMENDACION:\n([\s\S]*?)(?=PROXIMO_PASO:|$)/) || [])[1]?.trim() ?? ''
  const proximoPaso = (txt.match(/PROXIMO_PASO:\n([\s\S]*?)$/) || [])[1]?.trim() ?? ''

  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Tu Perfil de Adopción IA — ${data.nombre}</title></head>
<body style="margin:0;padding:0;background:#F9FAFB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<div style="max-width:600px;margin:0 auto;padding:24px 16px">
  <div style="background:linear-gradient(135deg,#7C3AED,#D946EF);border-radius:20px 20px 0 0;padding:36px 32px;text-align:center">
    <img src="https://humanaix.mx/assets/logos/LogoHumanAlta.png" alt="Human.AiX" width="140" style="display:block;margin:0 auto 20px;max-width:140px">
    <p style="color:rgba(255,255,255,0.8);font-size:11px;letter-spacing:3px;text-transform:uppercase;margin:0 0 6px">${data.campaign.empresa} &mdash; ${data.campaign.nombre}</p>
    <h1 style="color:#fff;font-size:24px;font-weight:800;margin:0 0 6px">Tu Perfil de Adopci&oacute;n IA</h1>
    <p style="color:rgba(255,255,255,0.7);font-size:13px;margin:0">${data.nombre} &middot; ${data.puesto}</p>
  </div>
  <div style="background:#fff;border-left:1px solid #E9D5FF;border-right:1px solid #E9D5FF">
    <!-- Perfil -->
    <div style="padding:28px 32px;border-bottom:1px solid #F3F4F6;text-align:center">
      <p style="color:#7C3AED;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin:0 0 12px">&starf; Tu perfil actual</p>
      <div style="display:inline-block;background:linear-gradient(135deg,#7C3AED,#D946EF);border-radius:30px;padding:10px 28px;margin-bottom:16px">
        <span style="color:#fff;font-size:18px;font-weight:800">${data.profileName}</span>
      </div>
      <p style="color:#374151;font-size:15px;line-height:1.8;margin:0 0 16px">${pDesc.desc}</p>
      <table style="width:100%;border-collapse:collapse">
        <tr>
          <td style="padding:12px;background:#F5F3FF;border-radius:10px;text-align:center;width:48%">
            <div style="color:#9CA3AF;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Tu fortaleza</div>
            <div style="color:#7C3AED;font-size:13px;font-weight:600">${pDesc.fortaleza}</div>
          </td>
          <td style="width:4%"></td>
          <td style="padding:12px;background:#FDF4FF;border-radius:10px;text-align:center;width:48%">
            <div style="color:#9CA3AF;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">&Aacute;rea de desarrollo</div>
            <div style="color:#D946EF;font-size:13px;font-weight:600">${pDesc.desarrollo}</div>
          </td>
        </tr>
      </table>
    </div>
    <!-- Score visual -->
    <div style="padding:24px 32px;border-bottom:1px solid #F3F4F6;background:#F5F3FF">
      <p style="color:#7C3AED;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin:0 0 12px">&starf; Tu nivel de adopci&oacute;n</p>
      <div style="display:flex;gap:8px;align-items:center">
        <div style="flex:1;height:10px;background:#E9D5FF;border-radius:10px;overflow:hidden">
          <div style="height:100%;background:linear-gradient(90deg,#7C3AED,#D946EF);border-radius:10px;width:${data.profileScore}%;transition:width 0.5s"></div>
        </div>
        <span style="color:#7C3AED;font-weight:800;font-size:18px;flex-shrink:0">${data.profileScore}%</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:8px">
        ${['AI Explorer','AI Practitioner','AI Strategist','AI Catalyst Leader'].map((p,i) => `<span style="font-size:10px;color:${p===data.profileName?'#7C3AED':'#9CA3AF'};font-weight:${p===data.profileName?700:400}">${p}</span>`).join('')}
      </div>
    </div>
    <!-- Caso rápido -->
    <div style="padding:28px 32px;border-bottom:1px solid #F3F4F6">
      <p style="color:#7C3AED;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin:0 0 12px">&starf; Caso pr&aacute;ctico para HOY</p>
      <p style="color:#374151;font-size:14px;line-height:1.8;margin:0">${casoRapido.replace(/\n/g,'<br>')}</p>
    </div>
    <!-- Recomendación -->
    <div style="padding:28px 32px;border-bottom:1px solid #F3F4F6">
      <p style="color:#7C3AED;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin:0 0 12px">&starf; Recomendaci&oacute;n personalizada</p>
      <p style="color:#374151;font-size:14px;line-height:1.8;margin:0">${recomendacion.replace(/\n/g,'<br>')}</p>
    </div>
    <!-- Próximo paso -->
    <div style="padding:28px 32px">
      <p style="color:#7C3AED;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin:0 0 12px">&starf; Tu pr&oacute;ximo paso esta semana</p>
      <div style="background:#F5F3FF;border:1px solid #E9D5FF;border-radius:12px;padding:18px">
        <p style="color:#374151;font-size:14px;line-height:1.8;margin:0">${proximoPaso.replace(/\n/g,'<br>')}</p>
      </div>
      <p style="color:#9CA3AF;font-size:12px;margin:16px 0 0;line-height:1.6">${pDesc.mensaje}</p>
    </div>
  </div>
  <div style="background:linear-gradient(135deg,#7C3AED,#D946EF);border-radius:0 0 20px 20px;padding:24px 32px;text-align:center">
    <p style="color:rgba(255,255,255,0.9);font-size:13px;font-weight:600;margin:0 0 4px">Carlos Garc&iacute;a &amp; Rodolfo Ordorica</p>
    <p style="color:rgba(255,255,255,0.6);font-size:12px;margin:0 0 10px">Human.AiX</p>
    <p style="color:rgba(255,255,255,0.5);font-size:11px;font-style:italic;margin:0">&ldquo;T&uacute; eres el piloto. La IA es tu copiloto.&rdquo;</p>
  </div>
</div></body></html>`
}

export async function POST(req: NextRequest) {
  try {
    const { respondentId, nombre, puesto, departamento, role, answers, scores, profileName, profileScore } = await req.json()
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
    const startedAt = new Date()

    const diagnosticHtml = await generateDiagnosticHtml({
      nombre, puesto, departamento, role, answers, profileName, profileScore, campaign,
    })

    const completedAt = new Date()
    const completionTimeSec = Math.round((completedAt.getTime() - startedAt.getTime()) / 1000)

    const { error: upsertError } = await supabase.from('survey_responses').upsert({
      respondent_id: respondentId,
      campaign_id: respondent.campaign_id,
      answers: { ...answers, nombre, puesto, departamento, role },
      scores,
      profile_name: profileName,
      profile_score: profileScore,
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
