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
    .select('id, email, nombre, token')
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
    const greeting = firstName ? `Hola, ${firstName}` : 'Hola'
    const tipoCurso = campaign.tipo === 'pre' ? 'previo al curso' : 'de seguimiento'

    const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Tu diagnóstico IA</title></head>
<body style="margin:0;padding:0;background:#F9FAFB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<div style="max-width:560px;margin:0 auto;padding:24px 16px">
  <div style="background:linear-gradient(135deg,#7C3AED,#D946EF);border-radius:16px 16px 0 0;padding:32px;text-align:center">
    <img src="https://humanaix.mx/assets/logos/LogoHumanAlta.png" alt="Human.AiX" width="140" style="display:block;margin:0 auto 16px;max-width:140px">
    <p style="color:rgba(255,255,255,0.8);font-size:11px;letter-spacing:3px;text-transform:uppercase;margin:0 0 6px">${campaign.empresa}</p>
    <h1 style="color:#fff;font-size:20px;font-weight:800;margin:0">${campaign.nombre}</h1>
  </div>
  <div style="background:#fff;border-left:1px solid #E9D5FF;border-right:1px solid #E9D5FF;padding:32px">
    <p style="color:#374151;font-size:16px;line-height:1.7;margin:0 0 16px">${greeting},</p>
    <p style="color:#374151;font-size:15px;line-height:1.8;margin:0 0 16px">
      Te invitamos a completar el <strong style="color:#7C3AED">diagn&oacute;stico de adopci&oacute;n de IA</strong> ${tipoCurso}
      <strong>${campaign.nombre}</strong>.
    </p>
    ${campaign.descripcion ? `<p style="color:#6B7280;font-size:14px;line-height:1.7;margin:0 0 16px">${campaign.descripcion}</p>` : ''}
    <p style="color:#6B7280;font-size:13px;margin:0 0 28px">&#8987; Tiempo estimado: 7&ndash;9 minutos. &nbsp;&#128274; Tus respuestas son confidenciales.</p>
    <div style="text-align:center;margin-bottom:28px">
      <a href="${url}" style="display:inline-block;background-color:#7C3AED;color:#fff;font-weight:700;font-size:16px;padding:16px 44px;border-radius:12px;text-decoration:none;letter-spacing:0.3px">
        Comenzar diagn&oacute;stico &rarr;
      </a>
    </div>
    <div style="text-align:center;margin-bottom:8px">
      <a href="${url}" style="display:inline-block;background-color:#D946EF;color:#fff;font-weight:700;font-size:13px;padding:10px 28px;border-radius:8px;text-decoration:none">
        Abrir encuesta
      </a>
    </div>
    <p style="color:#9CA3AF;font-size:11px;text-align:center;word-break:break-all;margin:0">
      O copia este enlace personal: <span style="color:#7C3AED">${url}</span>
    </p>
  </div>
  <div style="background:linear-gradient(135deg,#7C3AED,#D946EF);border-radius:0 0 16px 16px;padding:20px;text-align:center">
    <p style="color:rgba(255,255,255,0.8);font-size:12px;margin:0 0 4px">Carlos Garc&iacute;a &amp; Rodolfo Ordorica &mdash; Human.AiX</p>
    <p style="color:rgba(255,255,255,0.5);font-size:11px;font-style:italic;margin:0">&ldquo;T&uacute; eres el piloto. La IA es tu copiloto.&rdquo;</p>
  </div>
</div>
</body></html>`

    try {
      await transport.sendMail({
        from: `"Human.AiX" <${process.env.GMAIL_USER}>`,
        to: r.email,
        subject: `Tu diagnóstico de IA — ${campaign.nombre}`,
        html,
      })
      await supabase.from('survey_respondents')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', r.id)
      sent++
    } catch (e) { console.error('invite error:', r.email, e) }
  }

  return NextResponse.json({ sent, total: respondents.length })
}
