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

    const aprendizajesHtml = (aprendizajes || []).map((a: string) => `<li style="margin-bottom:8px;color:#e5e5e5">${a}</li>`).join('')
    const planHtml = (plan90Dias || []).map((c: { titulo: string; descripcion: string; metrica: string }, i: number) => `
      <tr>
        <td style="padding:12px;border-bottom:1px solid #1a1a1a;color:#C9A84C;font-weight:700;width:24px">${i + 1}</td>
        <td style="padding:12px;border-bottom:1px solid #1a1a1a">
          <strong style="color:#fff">${c.titulo}</strong><br>
          <span style="color:#aaa;font-size:13px">${c.descripcion}</span>
        </td>
        <td style="padding:12px;border-bottom:1px solid #1a1a1a;color:#666;font-size:11px">${c.metrica}</td>
      </tr>`).join('')

    const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Diagnóstico IA — ${participant.nombre}</title></head>
<body style="margin:0;padding:0;background:#000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<div style="max-width:600px;margin:0 auto;background:#0a0a0a;border:1px solid #1f1f1f">
  <div style="background:linear-gradient(135deg,#0a0a0a,#1a1500);padding:40px 32px;border-bottom:2px solid #C9A84C;text-align:center">
    <p style="color:#C9A84C;font-size:11px;letter-spacing:3px;text-transform:uppercase;margin:0 0 16px">Human.AiX · Desbloquea el Chip de IA</p>
    <h1 style="color:#fff;font-size:24px;font-weight:700;margin:0 0 8px">Diagnóstico Ejecutivo de IA</h1>
    <p style="color:#888;font-size:13px;margin:0">${fecha} · ${participant.nombre}</p>
    <div style="display:inline-block;margin-top:16px;padding:6px 20px;border:1px solid #C9A84C;border-radius:20px">
      <span style="color:#C9A84C;font-size:12px">${participant.puesto} · ${participant.departamento}</span>
    </div>
  </div>
  <div style="padding:32px;border-bottom:1px solid #1f1f1f">
    <h2 style="color:#C9A84C;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:0 0 16px">01 · Tu Perfil de Adopción IA</h2>
    <p style="color:#e5e5e5;font-size:15px;line-height:1.8;margin:0">${perfil.replace(/\n/g, '<br>')}</p>
  </div>
  <div style="padding:32px;border-bottom:1px solid #1f1f1f">
    <h2 style="color:#C9A84C;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:0 0 16px">02 · Lo que te Llevas Hoy</h2>
    <ul style="margin:0;padding-left:20px">${aprendizajesHtml}</ul>
  </div>
  <div style="padding:32px;border-bottom:1px solid #1f1f1f">
    <h2 style="color:#C9A84C;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:0 0 16px">03 · Tus Oportunidades de Automatización</h2>
    <p style="color:#e5e5e5;font-size:14px;line-height:1.8;margin:0">${opor.replace(/\n/g, '<br>')}</p>
  </div>
  <div style="padding:32px;border-bottom:1px solid #1f1f1f;background:#0f0f00">
    <h2 style="color:#C9A84C;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:0 0 20px">04 · Tu Impacto Proyectado</h2>
    <table style="width:100%;border-collapse:collapse">
      <tr>
        <td style="text-align:center;padding:16px"><div style="font-size:32px;font-weight:800;color:#C9A84C">${impactAnswers?.horas_proyectadas ?? '?'}</div><div style="font-size:11px;color:#888;margin-top:4px;text-transform:uppercase">por semana</div></td>
        <td style="text-align:center;color:#444;font-size:20px">=</td>
        <td style="text-align:center;padding:16px"><div style="font-size:32px;font-weight:800;color:#C9A84C">${horasAnio}</div><div style="font-size:11px;color:#888;margin-top:4px;text-transform:uppercase">horas al año</div></td>
      </tr>
    </table>
    <p style="color:#aaa;font-size:13px;text-align:center;margin:16px 0 0">Mayor impacto en: <strong style="color:#C9A84C">${impactAnswers?.area_impacto ?? 'N/A'}</strong></p>
  </div>
  <div style="padding:32px;border-bottom:1px solid #1f1f1f">
    <h2 style="color:#C9A84C;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:0 0 16px">05 · Tu Plan de Acción — 90 Días</h2>
    <table style="width:100%;border-collapse:collapse;background:#111"><tbody>${planHtml}</tbody></table>
  </div>
  <div style="padding:32px;text-align:center">
    <h2 style="color:#C9A84C;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:0 0 16px">06 · Mensaje de Cierre</h2>
    <p style="color:#e5e5e5;font-size:15px;line-height:1.9;margin:0 0 24px">${cierre.replace(/\n/g, '<br>')}</p>
    <div style="border-top:1px solid #C9A84C;padding-top:24px">
      <p style="color:#C9A84C;font-size:12px;letter-spacing:1px;margin:0 0 4px">HUMAN.AIX</p>
      <p style="color:#666;font-size:12px;margin:0">Carlos García &amp; Rodolfo Ordorica</p>
    </div>
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
        cc: 'charlie@humanaix.com',
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
