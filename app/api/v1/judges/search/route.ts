import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { enforceRateLimit, getClientKey } from '@/lib/security/rate-limit'
import { requireApiKeyIfEnabled } from '@/lib/security/api-auth'
import { getQualityTier, shouldHideMetric, MIN_SAMPLE_SIZE } from '@/lib/analytics/config'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const auth = requireApiKeyIfEnabled(request.headers, request.url)
    if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const key = getClientKey(request.headers)
    const rateState = await enforceRateLimit(`v1:search:${key}`)
    if (!rateState.allowed) {
      const r = NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
      if (typeof rateState.remaining === 'number') r.headers.set('RateLimit-Remaining', String(rateState.remaining))
      if (rateState.reset) r.headers.set('RateLimit-Reset', String(rateState.reset))
      return r
    }
    const { searchParams } = new URL(request.url)
    const q = (searchParams.get('q') || '').trim()
    const court = searchParams.get('court') || undefined
    const alias = searchParams.get('alias') || undefined
    const resultLimit = Math.min(20, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)))

    if (!q && !alias) {
      return NextResponse.json({ results: [], total: 0 }, { status: 200 })
    }

    const supabase = await createServerClient()

    // Basic fuzzy search by name + optional court filter
    let builder = supabase
      .from('judges')
      .select('id, name, slug, court_id, court_name, jurisdiction')
      .ilike('name', `%${q}%`)

    if (court) builder = builder.eq('court_name', court)

    const { data: nameMatches, error } = await builder.limit(resultLimit)

    if (error) {
      return NextResponse.json({ error: 'Search failed' }, { status: 500 })
    }

    const judgeIds = (nameMatches || []).map((j: any) => j.id).filter(Boolean)
    const analyticsMap = new Map<string, { analytics: any; created_at: string | null }>()

    if (judgeIds.length > 0) {
      const { data: analyticsRows } = await supabase
        .from('judge_analytics_cache')
        .select('judge_id, analytics, created_at')
        .in('judge_id', judgeIds)

      for (const row of analyticsRows || []) {
        if (row.judge_id) {
          analyticsMap.set(row.judge_id, { analytics: row.analytics, created_at: row.created_at })
        }
      }
    }

    const qualityLabel = (tier: ReturnType<typeof getQualityTier>) => tier.toLowerCase()

    // Simple confidence heuristic: longer match and exact starts increase confidence
    const scored = (nameMatches || []).map((j: any) => {
      const lower = j.name.toLowerCase()
      const query = q.toLowerCase()
      let confidence = 0.5
      if (lower === query) confidence = 0.98
      else if (lower.startsWith(query)) confidence = 0.9
      else if (lower.includes(query)) confidence = 0.75
      if (court && j.court_name === court) confidence += 0.05
      // Boost if alias appears in CourtListener aliases (when available)
      // We avoid a join here for perf; small heuristic if alias param present
      if (alias && alias.length >= 2 && lower.includes(alias.toLowerCase())) confidence += 0.05

      const analyticsEntry = analyticsMap.get(j.id)
      const analytics = analyticsEntry?.analytics || null
      const sampleCivil = analytics?.sample_size_civil ?? null
      const qualityTier = sampleCivil !== null
        ? getQualityTier(sampleCivil, analytics?.confidence_civil ?? null)
        : 'LOW'
      const hideCivil = shouldHideMetric(sampleCivil)

      return {
        judge_id: j.id,
        full_name: j.name,
        court_id: j.court_id,
        court_name: j.court_name,
        canonical_id: j.id,
        confidence: Math.min(0.99, Number(confidence.toFixed(2))),
        analytics: analytics
          ? {
              civil_plaintiff_favor: hideCivil ? null : analytics.civil_plaintiff_favor ?? null,
              sample_size_civil: sampleCivil,
              confidence_civil: analytics.confidence_civil ?? null,
              overall_confidence: analytics.overall_confidence ?? null,
              total_cases_analyzed: analytics.total_cases_analyzed ?? null,
              quality: qualityLabel(qualityTier),
              hidden: hideCivil,
              generated_at: analytics.generated_at ?? analyticsEntry?.created_at ?? null,
              min_sample_size: MIN_SAMPLE_SIZE
            }
          : null
      }
    })

    const res = NextResponse.json({ results: scored, total: scored.length })
    res.headers.set('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=60')
    if (typeof rateState.remaining === 'number') res.headers.set('RateLimit-Remaining', String(rateState.remaining))
    if (rateState.reset) res.headers.set('RateLimit-Reset', String(rateState.reset))
    return res
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
