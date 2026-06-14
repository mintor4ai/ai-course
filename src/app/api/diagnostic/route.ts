import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServiceClient } from '@/lib/supabase'
import { google } from 'googleapis'
import nodemailer from 'nodemailer'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const HOURS_YEAR: Record<string, number> = { '1h': 52, '2h': 104, '3h': 156, '5h': 260, '8h': 416, '+8h': 520 }

export async function POST(req: NextRequest) {
  try {
    const { participant, participantId, aprendizajes, tareasResumen, impactAnswers, plan90Dias } = await req.json()
    const fecha = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })
    const horasAnio = HOURS_YEAR[impactAnswers?.horas_proyectadas] ?? '?'

    const prompt = `Eres un consultor senior de una firma de estrategia de primer nivel (estilo McKinsey).
Genera contenido de texto para un diagnóstico ejecutivo en español para un participante del curso "Desbloquea el Chip de IA" de Human.AiX.

DATOS:
- Nombre: ${participant.nombre}
- Puesto: ${participant.puesto}
- Departamento: ${participant.departamento}
- Top 5 aprendizajes: ${(aprendizajes || []).join('; ')}
- Tareas repetitivas: ${tareasResumen}
- Horas/semana proyectadas a recuperar: ${impactAnswers?.horas_proyectadas ?? 'N/A'}
- Área de mayor impacto: ${impactAnswers?.area_impacto ?? 'N/A'}
- Nivel de listo: ${impactAnswers?.nivel_listo ?? 'N/A'}

Genera SOLO estos bloques (texto plano, sin HTML):

PERFIL:
[3-4 líneas describiendo quién es este profesional y cómo se posiciona ante la IA. Ejecutivo, cálido, inspirador.]

OPORTUNIDADES:
[Para cada tarea identificada: 1 línea describiendo la oportunidad y la herramienta del curso sugerida (Make.com, GPTs, Claude, NotebookLM, Gamma, Excel+Copilot).]

CIERRE:
[2-3 líneas motivacionales con mantras del curso: "La IA amplifica tu talento, no lo reemplaza." "Tú eres el piloto. La IA es tu copiloto."]`

    const aiResp = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    })
    const aiText = aiResp.content[0].type === 'text' ? aiResp.content[0].text : ''
    const perfil = (aiText.match(/PERFIL:\n([\s\S]*?)(?=OPORTUNIDADES:|$)/) || [])[1]?.trim() ?? ''
    const opor   = (aiText.match(/OPORTUNIDADES:\n([\s\S]*?)(?=CIERRE:|$)/) || [])[1]?.trim() ?? ''
    const cierre = (aiText.match(/CIERRE:\n([\s\S]*?)$/) || [])[1]?.trim() ?? ''

    const aprendizajesHtml = (aprendizajes || []).map((a: string, i: number) => `
      <tr>
        <td style="padding:10px 14px;vertical-align:top;width:32px">
          <div style="width:24px;height:24px;border-radius:50%;background:linear-gradient(135deg,#7C3AED,#D946EF);color:#fff;font-size:11px;font-weight:700;text-align:center;line-height:24px">${i + 1}</div>
        </td>
        <td style="padding:10px 14px;color:#374151;font-size:14px;line-height:1.5;border-bottom:1px solid #F3F4F6">${a}</td>
      </tr>`).join('')

    const planHtml = (plan90Dias || []).map((c: { titulo: string; descripcion: string; metrica: string }, i: number) => `
      <div style="background:#fff;border:1px solid #E9D5FF;border-radius:12px;padding:18px;margin-bottom:12px">
        <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:10px">
          <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#7C3AED,#D946EF);color:#fff;font-size:12px;font-weight:700;text-align:center;line-height:28px;flex-shrink:0">${i + 1}</div>
          <strong style="color:#111827;font-size:15px;line-height:1.4">${c.titulo}</strong>
        </div>
        <p style="color:#6B7280;font-size:13px;line-height:1.6;margin:0 0 10px 40px">${c.descripcion}</p>
        <div style="margin-left:40px;background:#F5F3FF;border:1px solid #E9D5FF;border-radius:8px;padding:8px 14px;font-size:12px;color:#7C3AED">
          <strong>📊 Métrica:</strong> ${c.metrica}
        </div>
      </div>`).join('')

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Diagnóstico Ejecutivo IA — ${participant.nombre}</title>
</head>
<body style="margin:0;padding:0;background:#F9FAFB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,sans-serif">
<div style="max-width:620px;margin:0 auto;padding:24px 16px">

  <!-- Header con logo -->
  <div style="background:linear-gradient(135deg,#7C3AED 0%,#D946EF 100%);border-radius:20px 20px 0 0;padding:36px 32px;text-align:center">
    <img src="https://humanaix.mx/assets/logos/LogoHumanAlta.png" alt="Human.AiX" width="160" style="display:block;margin:0 auto 20px;max-width:160px">
    <p style="color:rgba(255,255,255,0.8);font-size:11px;letter-spacing:3px;text-transform:uppercase;margin:0 0 8px">Desbloquea el Chip de IA</p>
    <h1 style="color:#fff;font-size:26px;font-weight:800;margin:0 0 6px;letter-spacing:-0.5px">Diagnóstico Ejecutivo de IA</h1>
    <p style="color:rgba(255,255,255,0.7);font-size:13px;margin:0 0 18px">${fecha}</p>
    <div style="display:inline-block;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.3);border-radius:30px;padding:8px 22px">
      <span style="color:#fff;font-size:13px;font-weight:600">${participant.nombre}</span>
      <span style="color:rgba(255,255,255,0.6);font-size:13px"> · ${participant.puesto} · ${participant.departamento}</span>
    </div>
  </div>

  <!-- Cards wrapper -->
  <div style="background:#fff;border-left:1px solid #E9D5FF;border-right:1px solid #E9D5FF;padding:0">

    <!-- 01 Perfil -->
    <div style="padding:28px 32px;border-bottom:1px solid #F3F4F6">
      <p style="color:#7C3AED;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin:0 0 12px">✦ 01 · Tu Perfil de Adopción IA</p>
      <p style="color:#374151;font-size:15px;line-height:1.8;margin:0">${perfil.replace(/\n/g, '<br>')}</p>
    </div>

    <!-- 02 Aprendizajes -->
    <div style="padding:28px 32px;border-bottom:1px solid #F3F4F6">
      <p style="color:#7C3AED;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin:0 0 16px">✦ 02 · Los 5 Aprendizajes que te Llevas</p>
      <table style="width:100%;border-collapse:collapse;background:#F9FAFB;border-radius:10px;overflow:hidden;border:1px solid #F3F4F6">
        <tbody>${aprendizajesHtml}</tbody>
      </table>
    </div>

    <!-- 03 Oportunidades -->
    <div style="padding:28px 32px;border-bottom:1px solid #F3F4F6">
      <p style="color:#7C3AED;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin:0 0 12px">✦ 03 · Tus Oportunidades de Automatización</p>
      <p style="color:#374151;font-size:14px;line-height:1.9;margin:0">${opor.replace(/\n/g, '<br>')}</p>
    </div>

    <!-- 04 Impacto -->
    <div style="padding:28px 32px;border-bottom:1px solid #F3F4F6;background:#F5F3FF">
      <p style="color:#7C3AED;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin:0 0 20px">✦ 04 · Tu Impacto Proyectado</p>
      <table style="width:100%;border-collapse:collapse;text-align:center">
        <tr>
          <td style="padding:16px">
            <div style="font-size:36px;font-weight:800;color:#7C3AED;line-height:1">${impactAnswers?.horas_proyectadas ?? '?'}</div>
            <div style="font-size:11px;color:#9CA3AF;margin-top:6px;text-transform:uppercase;letter-spacing:1px">por semana</div>
          </td>
          <td style="color:#C4B5FD;font-size:24px;padding:0 8px">×52</td>
          <td style="padding:16px">
            <div style="font-size:36px;font-weight:800;color:#D946EF;line-height:1">${horasAnio}h</div>
            <div style="font-size:11px;color:#9CA3AF;margin-top:6px;text-transform:uppercase;letter-spacing:1px">al año</div>
          </td>
        </tr>
      </table>
      <div style="text-align:center;margin-top:12px">
        <span style="background:#fff;border:1px solid #E9D5FF;border-radius:20px;padding:6px 18px;font-size:13px;color:#7C3AED">
          Mayor impacto en: <strong>${impactAnswers?.area_impacto ?? 'N/A'}</strong>
        </span>
      </div>
    </div>

    <!-- 05 Plan -->
    <div style="padding:28px 32px;border-bottom:1px solid #F3F4F6">
      <p style="color:#7C3AED;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin:0 0 20px">✦ 05 · Tu Plan de Acción — 90 Días</p>
      ${planHtml}
    </div>

    <!-- 06 Cierre -->
    <div style="padding:28px 32px;text-align:center">
      <p style="color:#7C3AED;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin:0 0 16px">✦ 06 · Para Cerrar</p>
      <p style="color:#374151;font-size:15px;line-height:1.9;margin:0 0 24px">${cierre.replace(/\n/g, '<br>')}</p>
    </div>
  </div>

  <!-- Footer -->
  <div style="background:linear-gradient(135deg,#7C3AED,#D946EF);border-radius:0 0 20px 20px;padding:24px 32px;text-align:center">
    <p style="color:rgba(255,255,255,0.9);font-size:13px;font-weight:600;margin:0 0 4px">Carlos García &amp; Rodolfo Ordorica</p>
    <p style="color:rgba(255,255,255,0.6);font-size:12px;margin:0 0 12px">Human.AiX</p>
    <p style="color:rgba(255,255,255,0.5);font-size:11px;font-style:italic;margin:0">"Tú eres el piloto. La IA es tu copiloto."</p>
  </div>

</div>
</body>
</html>`

    // Save to Supabase
    const supabase = createServiceClient()
    const { data: diagData } = await supabase
      .from('diagnostics')
      .insert({ participant_id: participantId, html_content: html })
      .select('id').single()

    // Send email
    let emailStatus = 'failed'
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
        to: participant.email,
        cc: 'mentor@mindset4.ai',
        subject: `Tu Diagnóstico IA — ${participant.nombre} | Desbloquea el Chip de IA`,
        html,
      })
      emailStatus = 'sent'
    } catch (e) { console.error('email:', e) }

    if (diagData?.id) {
      await supabase.from('diagnostics')
        .update({ email_status: emailStatus, sent_at: new Date().toISOString() })
        .eq('id', diagData.id)
    }

    return NextResponse.json({ html, emailStatus })
  } catch (err) {
    console.error('diagnostic:', err)
    return NextResponse.json({ error: 'Error al generar diagnóstico' }, { status: 500 })
  }
}
