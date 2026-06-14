import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import nodemailer from 'nodemailer'
import { google } from 'googleapis'
import { createServiceClient } from '@/lib/supabase'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

async function createGmailTransport() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
  )

  oauth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN,
  })

  const { token } = await oauth2Client.getAccessToken()

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: process.env.GMAIL_USER,
      clientId: process.env.GMAIL_CLIENT_ID,
      clientSecret: process.env.GMAIL_CLIENT_SECRET,
      refreshToken: process.env.GMAIL_REFRESH_TOKEN,
      accessToken: token as string,
    },
  })
}

export async function POST(req: NextRequest) {
  try {
    const {
      participant,
      participantId,
      aprendizajes,
      tareasResumen,
      impactAnswers,
      plan90Dias,
    } = await req.json()

    // Generate HTML diagnostic report
    const prompt = `Eres un consultor senior de McKinsey especializado en transformación digital e IA.
Genera un Diagnóstico Ejecutivo de IA completo en HTML para este participante del curso "Desbloquea el Chip de IA" de Human.AiX.

PERFIL DEL PARTICIPANTE:
- Nombre: ${participant.name}
- Puesto: ${participant.position}
- Departamento: ${participant.department}
- Email: ${participant.email}

DATOS DEL DIAGNÓSTICO:
- Top 5 aprendizajes seleccionados: ${JSON.stringify(aprendizajes)}
- Tareas repetitivas identificadas: ${tareasResumen}
- Horas semanales a recuperar: ${impactAnswers.horas_proyectadas || impactAnswers.hoursPerWeek || 'No especificado'}
- Área de mayor impacto: ${impactAnswers.area_impacto || impactAnswers.urgency || 'No especificado'}
- Nivel de listo: ${impactAnswers.nivel_listo || impactAnswers.aiUsage || 'No especificado'}
- Plan 90 días: ${JSON.stringify(plan90Dias)}

Genera un email HTML completo, ejecutivo y profesional con:
1. Encabezado Human.AiX con colores negro (#000) y dorado (#C9A84C)
2. Saludo personalizado con nombre del participante
3. Resumen ejecutivo de su perfil de adopción IA
4. Análisis de sus 3 principales oportunidades de automatización
5. Estimación de impacto: horas recuperadas al año y valor aproximado
6. Su Plan de 90 días resumido (máx 3-4 compromisos clave)
7. Quick wins: 2 acciones concretas para esta semana
8. Herramientas recomendadas con casos de uso específicos
9. CTA para el programa completo Human.AiX
10. Cierre con firma y mantra del curso

ESTILO: Ejecutivo, directo, cálido. Tono McKinsey pero humano.
FORMATO: HTML completo con estilos inline para email clients.
COLORES: Fondo negro (#000000), texto blanco (#FFFFFF), acentos dorado (#C9A84C).

Responde ÚNICAMENTE con el HTML completo, sin markdown ni explicaciones.`

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    })

    const htmlContent = response.content[0].type === 'text' ? response.content[0].text : ''

    // Save to Supabase
    const supabase = createServiceClient()
    const { data: diagnostic, error: dbError } = await supabase
      .from('diagnostics')
      .insert({
        participant_id: participantId,
        html_content: htmlContent,
        plan_90_days: JSON.stringify(plan90Dias),
      })
      .select()
      .single()

    if (dbError) {
      console.error('Supabase diagnostic error:', dbError)
    }

    // Attempt to send email via Gmail OAuth2
    let emailStatus: 'sent' | 'failed' = 'failed'
    try {
      const transport = await createGmailTransport()
      await transport.sendMail({
        from: `"Human.AiX — Desbloquea el Chip de IA" <${process.env.GMAIL_USER}>`,
        to: participant.email,
        subject: `🚀 Tu Diagnóstico Ejecutivo de IA, ${participant.name.split(' ')[0]}`,
        html: htmlContent,
      })

      // Update sent_at timestamp
      if (diagnostic?.id) {
        await supabase
          .from('diagnostics')
          .update({ sent_at: new Date().toISOString() })
          .eq('id', diagnostic.id)
      }

      emailStatus = 'sent'
    } catch (emailErr) {
      console.error('Email send error:', emailErr)
      // Don't fail the whole request if email fails
    }

    return NextResponse.json({
      success: true,
      emailStatus,
      html: htmlContent,
      diagnosticId: diagnostic?.id,
    })
  } catch (err: unknown) {
    console.error('diagnostic error:', err)
    return NextResponse.json({ error: 'Error al generar el diagnóstico' }, { status: 500 })
  }
}
