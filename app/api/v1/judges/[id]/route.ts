import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { enforceRateLimit, getClientKey } from '@/lib/security/rate-limit'
import { requireApiKeyIfEnabled } from '@/lib/security/api-auth'
import { getQualityTier, shouldHideMetric, MIN_SAMPLE_SIZE } from '@/lib/analytics/config'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireApiKeyIfEnabled(request.headers, (request as any).url)
    if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const key = getClientKey(request.headers)
    const limit = await enforceRateLimit(`v1:judges:${key}`)
    if (!limit.allowed) {
      const res = NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
      if (typeof limit.remaining === 'number') res.headers.set('RateLimit-Remaining', String(limit.remaining))
      if (limit.reset) res.headers.set('RateLimit-Reset', String(limit.reset))
      return res
    }
    const { id } = await params
    const supabase = await createServerClient()

    const { data: judge, error } = await supabase
      .from('judges')
      .select('id, name, slug, court_id, court_name, jurisdiction, appointed_date, courtlistener_id, courtlistener_data, updated_at')
      .eq('id', id)
      .single()

    if (error || !judge) {
      return NextResponse.json({ error: 'Judge not found' }, { status: 404 })
    }

    // Fetch current/primary assignment for role context
    const { data: currentAssignments } = await supabase
      .rpc('get_current_court_assignments', { judge_uuid: id })

    const primary = Array.isArray(currentAssignments)
      ? currentAssignments.find((a: any) => a.assignment_type === 'primary')
      : null

    // Source provenance
    const sources: Array<{ name: string; url?: string; type?: string }> = []
    if (judge.courtlistener_id) {
      sources.push({ name: 'CourtListener', type: 'official', url: `https://www.courtlistener.com/person/${judge.courtlistener_id}` })
    }

    let analyticsPayload: any = null
    const { data: analyticsCache } = await supabase
      .from('judge_analytics_cache')
      .select('analytics, created_at')
      .eq('judge_id', id)
      .maybeSingle()

    let analytics = analyticsCache?.analytics || null
    let analyticsTimestamp: string | null = analyticsCache?.created_at ?? null

    if (!analytics) {
      const { data: analyticsFallback } = await supabase
        .from('judges')
        .select('case_analytics, updated_at')
        .eq('id', id)
        .maybeSingle()

      if (analyticsFallback?.case_analytics) {
        analytics = analyticsFallback.case_analytics
        analyticsTimestamp = analyticsFallback.updated_at ?? analyticsTimestamp
      }
    }

    const qualityLabel = (tier: ReturnType<typeof getQualityTier>) => tier.toLowerCase()

    if (analytics) {
      const totalsQuality = getQualityTier(analytics.total_cases_analyzed ?? 0, analytics.overall_confidence ?? null)

      const civilHidden = shouldHideMetric(analytics.sample_size_civil)
      const civilQuality = getQualityTier(analytics.sample_size_civil ?? 0, analytics.confidence_civil ?? null)

      const sentencingHidden = shouldHideMetric(analytics.sample_size_sentencing)
      const sentencingQuality = getQualityTier(analytics.sample_size_sentencing ?? 0, analytics.confidence_sentencing ?? null)

      const pleaHidden = shouldHideMetric(analytics.sample_size_plea)
      const pleaQuality = getQualityTier(analytics.sample_size_plea ?? 0, analytics.confidence_plea ?? null)

      analyticsPayload = {
        overall_confidence: analytics.overall_confidence ?? null,
        total_cases_analyzed: analytics.total_cases_analyzed ?? null,
        min_sample_size: MIN_SAMPLE_SIZE,
        quality: qualityLabel(totalsQuality),
        generated_at: analytics.generated_at ?? analyticsTimestamp,
        metrics: {
          civil_plaintiff_favor: {
            value: civilHidden ? null : analytics.civil_plaintiff_favor ?? null,
            sample_size: analytics.sample_size_civil ?? null,
            confidence: analytics.confidence_civil ?? null,
            hidden: civilHidden,
            quality: qualityLabel(civilQuality)
          },
          criminal_sentencing_severity: {
            value: sentencingHidden ? null : analytics.criminal_sentencing_severity ?? null,
            sample_size: analytics.sample_size_sentencing ?? null,
            confidence: analytics.confidence_sentencing ?? null,
            hidden: sentencingHidden,
            quality: qualityLabel(sentencingQuality)
          },
          criminal_plea_acceptance: {
            value: pleaHidden ? null : analytics.criminal_plea_acceptance ?? null,
            sample_size: analytics.sample_size_plea ?? null,
            confidence: analytics.confidence_plea ?? null,
            hidden: pleaHidden,
            quality: qualityLabel(pleaQuality)
          }
        }
      }
    }

    const payload = {
      judge_id: judge.id,
      full_name: judge.name,
      court_id: judge.court_id,
      court_name: judge.court_name,
      jurisdiction: judge.jurisdiction,
      role: primary?.position_title || 'Judge',
      position: primary ? {
        court_id: primary.court_id,
        court_name: primary.court_name,
        start_date: primary.assignment_start_date,
        department: primary.department || null,
        assignment_type: primary.assignment_type
      } : null,
      identifiers: {
        slug: judge.slug || null,
        courtlistener_id: judge.courtlistener_id || null
      },
      sources,
      last_updated: judge.updated_at,
      analytics: analyticsPayload
    }

    const res = NextResponse.json(payload)
    res.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60')
    if (typeof limit.remaining === 'number') res.headers.set('RateLimit-Remaining', String(limit.remaining))
    if (limit.reset) res.headers.set('RateLimit-Reset', String(limit.reset))
    return res
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
