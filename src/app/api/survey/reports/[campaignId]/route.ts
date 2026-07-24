import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

function authorized(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? ''
  const [, b64] = auth.split(' ')
  if (!b64) return false
  const [, password] = Buffer.from(b64, 'base64').toString().split(':')
  return password === process.env.ADMIN_PASSWORD
}

export async function GET(
  req: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { campaignId } = params
  const supabase = createServiceClient()

  // 1. Fetch campaign
  const { data: campaign, error: campaignError } = await supabase
    .from('survey_campaigns')
    .select('id, nombre, empresa, tipo, descripcion, status, survey_config, company_context')
    .eq('id', campaignId)
    .single()

  if (campaignError || !campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  }

  // 2. Fetch all respondents
  const { data: respondents, error: respondentsError } = await supabase
    .from('survey_respondents')
    .select('id, email, nombre, status, sent_at, completed_at')
    .eq('campaign_id', campaignId)

  if (respondentsError) {
    return NextResponse.json({ error: 'Error fetching respondents' }, { status: 500 })
  }

  const allRespondents = respondents ?? []
  const completedRespondents = allRespondents.filter(r => r.status === 'completed')
  const completedIds = completedRespondents.map(r => r.id)

  // 3. Fetch survey responses for completed respondents
  let responses: any[] = []
  if (completedIds.length > 0) {
    const { data: responsesData, error: responsesError } = await supabase
      .from('survey_responses')
      .select('respondent_id, profile_name, profile_score, scores, recommended_level, possible_ai_champion, completion_time_seconds, answers')
      .in('respondent_id', completedIds)

    if (responsesError) {
      return NextResponse.json({ error: 'Error fetching responses' }, { status: 500 })
    }
    responses = responsesData ?? []
  }

  // Build a map from respondent_id to response
  const responseMap = new Map<string, any>()
  for (const r of responses) {
    responseMap.set(r.respondent_id, r)
  }

  // Compute stats
  const totalSent = allRespondents.length
  const totalCompleted = completedRespondents.length
  const responseRate = totalSent > 0
    ? Math.round((totalCompleted / totalSent) * 1000) / 10
    : 0

  const profileScores = responses.map(r => r.profile_score).filter(s => s != null)
  const avgScore = profileScores.length > 0
    ? Math.round(profileScores.reduce((a, b) => a + b, 0) / profileScores.length)
    : 0

  const completionTimes = responses
    .map(r => r.completion_time_seconds)
    .filter(t => t != null && t > 0)
  const avgCompletionTimeMin = completionTimes.length > 0
    ? Math.round((completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length / 60) * 10) / 10
    : 0

  const profileDistribution: Record<string, number> = {}
  for (const r of responses) {
    if (r.profile_name) {
      profileDistribution[r.profile_name] = (profileDistribution[r.profile_name] ?? 0) + 1
    }
  }

  // dimensionAverages: average each key in scores across all responses
  const dimensionSums: Record<string, number> = {}
  const dimensionCounts: Record<string, number> = {}
  for (const r of responses) {
    if (r.scores && typeof r.scores === 'object') {
      for (const [key, val] of Object.entries(r.scores)) {
        if (val != null && typeof val === 'number') {
          dimensionSums[key] = (dimensionSums[key] ?? 0) + val
          dimensionCounts[key] = (dimensionCounts[key] ?? 0) + 1
        }
      }
    }
  }
  const dimensionAverages: Record<string, number> = {}
  for (const key of Object.keys(dimensionSums)) {
    dimensionAverages[key] = Math.round((dimensionSums[key] / dimensionCounts[key]) * 10) / 10
  }

  const courseLevelDistribution: Record<string, number> = {}
  for (const r of responses) {
    if (r.recommended_level) {
      courseLevelDistribution[r.recommended_level] = (courseLevelDistribution[r.recommended_level] ?? 0) + 1
    }
  }

  const aiChampionCount = responses.filter(r => r.possible_ai_champion === true).length
  const aiChampionPct = totalCompleted > 0
    ? Math.round((aiChampionCount / totalCompleted) * 1000) / 10
    : 0

  const respondentsList = allRespondents.map(r => {
    const resp = responseMap.get(r.id)
    return {
      id: r.id,
      email: r.email,
      nombre: r.nombre,
      status: r.status,
      completed_at: r.completed_at,
      survey_responses: resp ? [{
        profile_name: resp.profile_name ?? null,
        profile_score: resp.profile_score ?? null,
        recommended_level: resp.recommended_level ?? null,
        possible_ai_champion: resp.possible_ai_champion ?? null,
        completion_time_seconds: resp.completion_time_seconds ?? null,
        scores: resp.scores ?? {},
        answers: resp.answers ?? {},
      }] : [],
    }
  })

  return NextResponse.json({
    campaign,
    totalSent,
    totalCompleted,
    responseRate,
    avgScore,
    avgCompletionTimeMin,
    profileDistribution,
    dimensionAverages,
    courseLevelDistribution,
    aiChampionCount,
    aiChampionPct,
    respondents: respondentsList,
  })
}
