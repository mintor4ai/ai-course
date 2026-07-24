import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { google } from 'googleapis'
import nodemailer from 'nodemailer'

function authorized(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? ''
  const [, b64] = auth.split(' ')
  if (!b64) return false
  const [, password] = Buffer.from(b64, 'base64').toString().split(':')
  return password === process.env.ADMIN_PASSWORD
}

async function getTransport() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID, process.env.GMAIL_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
  )
  oauth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN })
  const { token } = await oauth2Client.getAccessToken()
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { type: 'OAuth2', user: process.env.GMAIL_USER,
      clientId: process.env.GMAIL_CLIENT_ID, clientSecret: process.env.GMAIL_CLIENT_SECRET,
      refreshToken: process.env.GMAIL_REFRESH_TOKEN, accessToken: token as string },
  } as Parameters<typeof nodemailer.createTransport>[0])
}

// Escalating reminder tone based on how many times they've been invited (0 = first time)
function getReminderTone(inviteCount: number, firstName: string, campaignName: string, url: string): {
  subject: string; headline: string; body: string; cta: string
} {
  const name = firstName || 'equipo'

  if (inviteCount === 0) {
    // First invite — warm & welcoming
    return {
      subject: `Tu diagnóstico de IA — ${campaignName}`,
      headline: 'Tu diagnóstico de Adopción IA está listo',
      body: `Te invitamos a completar el <strong style="color:#7C3AED">diagnóstico de adopción de IA</strong> correspondiente a <strong>${campaignName}</strong>. Son solo 7-9 minutos y obtendrás un perfil personalizado de tu nivel de adopción.`,
      cta: 'Comenzar diagnóstico →',
    }
  }

  if (inviteCount === 1) {
    // Opción A — suave recordatorio, beneficio personal
    return {
      subject: `¿Aún no has completado tu diagnóstico de IA? Solo toma 8 minutos`,
      headline: '¿Todavía no lo has completado?',
      body: `${firstName ? `${firstName}, t` : 'T'}odavía está a tiempo de completar su <strong style="color:#7C3AED">diagnóstico de adopción IA</strong> para <strong>${campaignName}</strong>. En solo 8 minutos obtendrás un perfil personalizado que te ayudará a aprovechar mejor las herramientas de IA en tu trabajo diario.`,
      cta: 'Completar mi diagnóstico →',
    }
  }

  if (inviteCount === 2) {
    // Opción B — curiosidad, ¿qué perfil tendrás?
    return {
      subject: `Tu perfil de adopción IA está esperando — ¿qué tan lejos llegaste?`,
      headline: '¿Cuál es tu perfil de adopción IA?',
      body: `¿Eres un <em>AI Explorer</em>, un <em>AI Practitioner</em> o ya estás en un nivel más avanzado? Tu diagnóstico para <strong>${campaignName}</strong> está listo, y la única forma de descubrirlo es completándolo. Solo faltan unos minutos.`,
      cta: 'Descubrir mi perfil →',
    }
  }

  // Opción C y siguientes — directo, ejecutivo, sin rodeos
  return {
    subject: `Último aviso: tu diagnóstico de IA sigue disponible`,
    headline: 'Último recordatorio',
    body: `Este es el último recordatorio para completar el diagnóstico de adopción IA de <strong>${campaignName}</strong>. Tu enlace personal sigue activo. Son menos de 10 minutos.`,
    cta: 'Abrir diagnóstico →',
  }
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { campaign_id, respondent_ids } = await req.json()
  if (!campaign_id) return NextResponse.json({ error: 'campaign_id requerido' }, { status: 400 })

  const supabase = createServiceClient()
  const { data: campaign } = await supabase
    .from('survey_campaigns')
    .select('nombre, empresa, tipo, descripcion')
    .eq('id', campaign_id).single()

  if (!campaign) return NextResponse.json({ error: 'Campaña no encontrada' }, { status: 404 })

  let query = supabase
    .from('survey_respondents')
    .select('id, email, nombre, token, invite_count')
    .eq('campaign_id', campaign_id)
    .in('status', ['pending', 'sent'])

  if (respondent_ids?.length) query = query.in('id', respondent_ids)
  const { data: respondents } = await query
  if (!respondents?.length) return NextResponse.json({ sent: 0, message: 'Sin pendientes' })

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://ai-course-ten-alpha.vercel.app'
  const transport = await getTransport()
  let sent = 0

  for (const r of respondents) {
    const url = `${baseUrl}/s/${r.token}`
    const firstName = r.nombre ? r.nombre.split(' ')[0] : ''
    const inviteCount: number = r.invite_count ?? 0
    const tone = getReminderTone(inviteCount, firstName, campaign.nombre, url)

    const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${tone.headline}</title></head>
<body style="margin:0;padding:0;background:#F9FAFB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif">
<div style="max-width:560px;margin:0 auto;padding:24px 16px">
  <!-- Header — solid color fallback for Outlook -->
  <div style="background:#7C3AED;border-radius:16px 16px 0 0;padding:36px 32px;text-align:center">
    <img src="https://humanaix.mx/assets/logos/LogoHumanAlta.png" alt="Human.AiX" width="140" style="display:block;margin:0 auto 20px;max-width:140px">
    <p style="color:#E9D5FF;font-size:11px;font-weight:700;letter-spacing:4px;text-transform:uppercase;margin:0 0 8px">${campaign.empresa}</p>
    <h1 style="color:#ffffff;font-size:22px;font-weight:800;margin:0;line-height:1.3">${campaign.nombre}</h1>
  </div>
  <!-- Body -->
  <div style="background:#ffffff;border-left:1px solid #E9D5FF;border-right:1px solid #E9D5FF;padding:32px">
    ${firstName ? `<p style="color:#111827;font-size:16px;font-weight:600;line-height:1.7;margin:0 0 12px">Hola, ${firstName}</p>` : ''}
    <p style="color:#374151;font-size:15px;line-height:1.8;margin:0 0 16px">${tone.body}</p>
    ${campaign.descripcion && inviteCount === 0 ? `<p style="color:#4B5563;font-size:14px;line-height:1.7;margin:0 0 16px">${campaign.descripcion}</p>` : ''}
    <p style="color:#6B7280;font-size:13px;margin:0 0 28px">&#8987; Tiempo estimado: 7&ndash;9 minutos. &nbsp; &#128274; Tus respuestas son confidenciales.</p>
    <!-- Button — table-based for maximum compatibility -->
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 28px">
      <tr>
        <td style="border-radius:12px;background:#7C3AED">
          <a href="${url}" target="_blank"
            style="display:inline-block;padding:16px 48px;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;border-radius:12px;font-family:Arial,sans-serif;letter-spacing:0.3px">
            ${tone.cta}
          </a>
        </td>
      </tr>
    </table>
    <p style="color:#6B7280;font-size:12px;text-align:center;word-break:break-all;margin:0">
      O copia este enlace en tu navegador:<br>
      <a href="${url}" style="color:#7C3AED;text-decoration:none">${url}</a>
    </p>
  </div>
  <!-- Footer -->
  <div style="background:#6D28D9;border-radius:0 0 16px 16px;padding:28px 32px;text-align:center">
    <p style="color:#C4B5FD;font-size:13px;letter-spacing:4px;text-transform:uppercase;margin:0 0 12px">✦ &nbsp; ✦ &nbsp; ✦</p>
    <p style="color:#ffffff;font-size:15px;font-style:italic;font-weight:600;margin:0;line-height:1.6">&ldquo;T&uacute; eres el piloto.<br>La IA es tu copiloto.&rdquo;</p>
    <p style="color:#C4B5FD;font-size:11px;letter-spacing:3px;text-transform:uppercase;margin:14px 0 0">Human.AiX</p>
  </div>
</div>
</body></html>`

    try {
      await transport.sendMail({
        from: `"Human.AiX" <${process.env.GMAIL_USER}>`,
        to: r.email,
        subject: tone.subject,
        html,
      })
      await supabase.from('survey_respondents')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          invite_count: inviteCount + 1,
        })
        .eq('id', r.id)
      sent++
    } catch (e) { console.error('invite error:', r.email, e) }
  }

  return NextResponse.json({ sent, total: respondents.length })
}
