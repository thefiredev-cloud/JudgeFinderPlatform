import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type AnalyticsPreview = {
  overall_confidence: number | null
  total_cases_analyzed: number | null
  civil_plaintiff_favor: number | null
  criminal_sentencing_severity: number | null
  generated_at: string | null
}

async function getAnalyticsPreview(supabase: any, judgeIds: string[]): Promise<Map<string, AnalyticsPreview | null>> {
  const idSet = Array.from(new Set(judgeIds.filter(Boolean)))
  const analyticsMap = new Map<string, AnalyticsPreview | null>()

  if (idSet.length === 0) {
    return analyticsMap
  }

  const { data, error } = await supabase
    .from('judge_analytics_cache')
    .select('judge_id, analytics')
    .in('judge_id', idSet)

  if (error) {
    console.error('Failed to load analytics preview:', error)
    return analyticsMap
  }

  data?.forEach((row: any) => {
    if (!row?.judge_id) return
    const analytics = row.analytics || null

    if (!analytics) {
      analyticsMap.set(row.judge_id, null)
      return
    }

    const toNumber = (value: any): number | null => {
      if (typeof value === 'number' && Number.isFinite(value)) {
        return Math.round(value)
      }
      if (value === null || value === undefined) {
        return null
      }
      const parsed = Number(value)
      return Number.isFinite(parsed) ? Math.round(parsed) : null
    }

    analyticsMap.set(row.judge_id, {
      overall_confidence: toNumber(analytics.overall_confidence),
      total_cases_analyzed: typeof analytics.total_cases_analyzed === 'number' && Number.isFinite(analytics.total_cases_analyzed)
        ? Math.round(analytics.total_cases_analyzed)
        : null,
      civil_plaintiff_favor: toNumber(analytics.civil_plaintiff_favor),
      criminal_sentencing_severity: toNumber(analytics.criminal_sentencing_severity),
      generated_at: typeof analytics.generated_at === 'string' ? analytics.generated_at : null
    })
  })

  return analyticsMap
}

export async function GET(request: NextRequest) {
  try {
    const { buildRateLimiter, getClientIp } = await import('@/lib/security/rate-limit')
    const rl = buildRateLimiter({ tokens: 20, window: '1 m', prefix: 'api:judges:chat-search' })
    const { success, remaining } = await rl.limit(`${getClientIp(request)}:global`)
    if (!success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }
    const { searchParams } = new URL(request.url)
    const name = searchParams.get('name')
    const jurisdiction = searchParams.get('jurisdiction')
    
    if (!name) {
      return NextResponse.json(
        { error: 'Name parameter is required' },
        { status: 400 }
      )
    }

    const supabase = await createServerClient()
    
    // Clean the search name
    const cleanName = name
      .replace(/^(judge|justice|the honorable)\s+/i, '')
      .trim()
    
    // Build the query
    let query = supabase
      .from('judges')
      .select('id, name, slug, court_name, jurisdiction, appointed_date, case_count:cases(count)')
    
    // Try exact match first
    const { data: exactMatch } = await query
      .ilike('name', `%${cleanName}%`)
      .limit(1)
      .single()

    if (exactMatch) {
      const analyticsPreview = await getAnalyticsPreview(supabase, [exactMatch.id])
      // Return single judge with limited data for free users
      return NextResponse.json({
        judge: {
          id: exactMatch.id,
          name: exactMatch.name,
          slug: exactMatch.slug,
          court_name: exactMatch.court_name,
          jurisdiction: exactMatch.jurisdiction || 'California',
          appointed_date: exactMatch.appointed_date,
          case_count: exactMatch.case_count?.[0]?.count || 0,
          analytics_preview: analyticsPreview.get(exactMatch.id) ?? null
        },
        rate_limit_remaining: remaining
      })
    }
    
    // If no exact match, try fuzzy search
    const searchTerms = cleanName.split(' ').filter(term => term.length > 2)
    
    let fuzzyQuery = supabase
      .from('judges')
      .select('id, name, slug, court_name, jurisdiction, appointed_date')
    
    // Add search conditions
    if (searchTerms.length > 0) {
      const searchConditions = searchTerms.map(term => `name.ilike.%${term}%`).join(',')
      fuzzyQuery = fuzzyQuery.or(searchConditions)
    }
    
    // Add jurisdiction filter if provided
    if (jurisdiction) {
      fuzzyQuery = fuzzyQuery.eq('jurisdiction', jurisdiction)
    }
    
    const { data: judges, error } = await fuzzyQuery.limit(5)
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to search judges' },
        { status: 500 }
      )
    }
    
    if (!judges || judges.length === 0) {
      // Return helpful message if no judges found
      return NextResponse.json({
        message: 'No judges found matching your search',
        suggestions: [
          'Try searching with just the last name',
          'Check the spelling of the judge\'s name',
          'Browse our statewide directory of California judges'
        ]
      })
    }
    
    const analyticsPreview = await getAnalyticsPreview(
      supabase,
      judges.map(judge => judge.id).filter(Boolean)
    )

    // Return multiple judges with limited data
    return NextResponse.json({
      judges: judges.map(judge => ({
        id: judge.id,
        name: judge.name,
        slug: judge.slug,
        court_name: judge.court_name,
        jurisdiction: judge.jurisdiction || 'California',
        appointed_date: judge.appointed_date,
        analytics_preview: analyticsPreview.get(judge.id) ?? null
      })),
      total: judges.length,
      rate_limit_remaining: remaining
    })
    
  } catch (error) {
    console.error('Chat search error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
