import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import nodemailer from 'nodemailer'
import { google } from 'googleapis'
import { createServiceClient } from '@/lib/supabase'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

async function generateDiagnosticHtml(
  participant: { name: string; position: string; department: string; email: string },
  selectedTopics: string[],
  chatMessages: { role: string; content: string }[],
  impactAnswers: Record<string, string>,
  plan90Days: string
): Promise<string> {
  const chatSummary = chatMessages
    .filter((m) => m.role === 'user')
    .map((m) => m.content)
    .join(' | ')

  const prompt = `Genera un reporte HTML de diagnóstico de IA ejecutivo y visualmente impresionante para:

Nombre: ${participant.name}
Puesto: ${participant.position}
Departamento: ${participant.department}
Email: ${participant.email}
Fecha: ${new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}

Temas de IA seleccionados: ${selectedTopics.join(', ')}
Tareas repetitivas identificadas: ${chatSummary}
Horas semanales en tareas repetitivas: ${impactAnswers.weekly_hours}
Urgencia: ${impactAnswers.urgency}
Equipo beneficiado: ${impactAnswers.team_size}
Uso actual de IA: ${impactAnswers.ai_usage}

Plan 90 días:
${plan90Days}

Genera HTML completo (con <!DOCTYPE html>) con estilos inline. Usa esta paleta:
- Negro #000000 como fondo principal
- Blanco #FFFFFF para texto
- Dorado #C9A84C para acentos, títulos y elementos destacados
- Gris oscuro #111111 y #1a1a1a para secciones

El reporte debe incluir:
1. Header con logo de Human.AiX (texto estilizado), nombre del curso "Desbloquea el Chip de IA" y fecha
2. Sección de perfil del participante con datos
3. Scorecard visual de impacto (con los 4 indicadores del paso 3)
4. Los 5 temas de IA seleccionados como "áreas de oportunidad" con íconos o viñetas doradas
5. El plan de 90 días formateado beautifully
6. Sección de próximos pasos y call-to-action para el curso
7. Footer con branding Human.AiX

Haz el HTML mobile-responsive y visualmente ejecutivo. Usa fuente Arial/sans-serif. El diseño debe verse como un reporte McKinsey.
Responde SOLO con el HTML completo, sin markdown ni explicaciones.`

  const response = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  })

  return response.content[0].type === 'text' ? response.content[0].text : ''
}

async function sendEmail(to: string, name: string, htmlContent: string): Promise<void> {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
  )

  oauth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN,
  })

  const accessToken = await oauth2Client.getAccessToken()

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: process.env.GMAIL_USER,
      clientId: process.env.GMAIL_CLIENT_ID,
      clientSecret: process.env.GMAIL_CLIENT_SECRET,
      refreshToken: process.env.GMAIL_REFRESH_TOKEN,
      accessToken: accessToken.token || '',
    },
  } as nodemailer.TransportOptions)

  await transporter.sendMail({
    from: `"Human.AiX | Desbloquea el Chip de IA" <${process.env.GMAIL_USER}>`,
    to,
    subject: `${name}, tu Diagnóstico IA Personalizado está aquí ✦`,
    html: htmlContent,
    text: `Hola ${name}, tu diagnóstico de IA personalizado de Human.AiX está listo. Por favor abre este email en un cliente que soporte HTML para verlo correctamente.`,
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      participant,
      participantId,
      selectedTopics,
      chatMessages,
      impactAnswers,
      plan90Days,
    } = body

    if (!participant || !participantId) {
      return NextResponse.json({ error: 'Missing participant data' }, { status: 400 })
    }

    // 1. Generate HTML diagnostic
    const htmlContent = await generateDiagnosticHtml(
      participant,
      selectedTopics,
      chatMessages,
      impactAnswers,
      plan90Days
    )

    // 2. Send email
    let sentAt: string | null = null
    try {
      await sendEmail(participant.email, participant.name, htmlContent)
      sentAt = new Date().toISOString()
    } catch (emailError) {
      console.error('Email error (non-fatal):', emailError)
      // Continue even if email fails - save to DB
    }

    // 3. Save to Supabase
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('diagnostics')
      .insert({
        participant_id: participantId,
        html_content: htmlContent,
        plan_90_days: plan90Days,
        sent_at: sentAt,
      })
      .select('id')
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Database error saving diagnostic' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      diagnosticId: data.id,
      emailSent: !!sentAt,
    })
  } catch (err) {
    console.error('Diagnostic error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
