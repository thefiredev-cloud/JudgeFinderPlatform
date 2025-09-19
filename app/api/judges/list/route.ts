import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import { validateSearchParams, judgeSearchParamsSchema, sanitizeSearchQuery } from '@/lib/utils/validation'
import type { Judge, Court } from '@/types'

export const dynamic = 'force-dynamic'

interface YearlyDecisionCount {
  year: number
  count: number
}

interface JudgeDecisionSummary {
  judge_id: string
  yearly_counts: YearlyDecisionCount[]
  total_recent: number
}

interface JudgeWithDecisions extends Judge {
  decision_summary?: JudgeDecisionSummary
  court?: Court
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const { buildRateLimiter, getClientIp } = await import('@/lib/security/rate-limit')
    const rl = buildRateLimiter({ tokens: 60, window: '1 m', prefix: 'api:judges:list' })
    const { success, remaining } = await rl.limit(`${getClientIp(request)}:global`)
    if (!success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }
    const { searchParams } = new URL(request.url)
    
    // Validate input parameters
    const validation = validateSearchParams(judgeSearchParamsSchema, searchParams, 'judges/list')
    if (!validation.success) {
      return validation.response
    }
    
    const { 
      q, 
      limit = 20, 
      page = 1, 
      jurisdiction, 
      court_id,
      only_with_decisions,
      recent_years
    } = validation.data
    const sanitizedQuery = q ? sanitizeSearchQuery(q) : ''
    const includeDecisions = searchParams.get('include_decisions') !== 'false' // Default to true
    const onlyWithDecisions = only_with_decisions ?? false
    const recentYears = recent_years ?? 3
    
    logger.apiRequest('GET', '/api/judges/list', {
      query: sanitizedQuery,
      limit,
      page,
      jurisdiction,
      court_id,
      includeDecisions,
      onlyWithDecisions,
      recentYears
    })

    // Check for required environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      logger.error('Missing Supabase environment variables')
      
      // Return empty data structure instead of error
      return NextResponse.json({
        judges: [],
        total_count: 0,
        page,
        per_page: limit,
        has_more: false,
        error: 'Database configuration pending'
      })
    }

    const supabase = await createServerClient()
    const from = (page - 1) * limit
    const to = from + limit - 1

    let queryBuilder = supabase
      .from('judges')
      .select(`
        id, 
        name, 
        slug,
        court_id,
        court_name, 
        jurisdiction, 
        appointed_date,
        total_cases, 
        profile_image_url,
        courtlistener_id,
        courts:court_id (
          id,
          name,
          type,
          jurisdiction,
          address
        )
      `, { count: 'exact' })
      .order('name')
      .range(from, to)

    // Apply filters
    if (sanitizedQuery.trim()) {
      queryBuilder = queryBuilder.ilike('name', `%${sanitizedQuery}%`)
    }
    
    if (jurisdiction) {
      queryBuilder = queryBuilder.eq('jurisdiction', jurisdiction)
    }
    
    if (court_id) {
      queryBuilder = queryBuilder.eq('court_id', court_id)
    }

    let decisionJudgeIds: string[] | null = null

    if (onlyWithDecisions) {
      try {
        decisionJudgeIds = await fetchJudgeIdsWithRecentDecisions(supabase, recentYears)
      } catch (error) {
        logger.error('Failed to fetch judges with recent decisions', { error })
        return NextResponse.json({
          judges: [],
          total_count: 0,
          page,
          per_page: limit,
          has_more: false,
          error: 'Unable to fetch judges with recent decisions at this time'
        }, { status: 500 })
      }

      if (!decisionJudgeIds || decisionJudgeIds.length === 0) {
        const emptyResult = {
          judges: [],
          total_count: 0,
          page,
          per_page: limit,
          has_more: false,
          rate_limit_remaining: remaining
        }

        return NextResponse.json(emptyResult)
      }

      queryBuilder = queryBuilder.in('id', decisionJudgeIds)
    }

    // Execute judges query
    const { data: judgesData, error: judgesError, count } = await queryBuilder

    if (judgesError) {
      logger.error('Supabase error in judges list', { 
        query: sanitizedQuery,
        jurisdiction,
        court_id,
        error: judgesError.message,
        code: judgesError.code,
        details: judgesError.details
      })
      
      // Return empty result set instead of error for better UX
      return NextResponse.json({
        judges: [],
        total_count: 0,
        page,
        per_page: limit,
        has_more: false,
        error: 'Unable to fetch judges at this time',
        errorDetails: process.env.NODE_ENV === 'development' ? judgesError.message : undefined
      })
    }

    // Transform raw data to include court information
    const judges = (judgesData || []).map((rawJudge: any) => {
      const { courts, ...judgeData } = rawJudge
      const judge: Judge = judgeData as Judge
      
      // Add court information if available
      const court: Court | undefined = courts ? {
        id: courts.id,
        name: courts.name,
        type: courts.type,
        jurisdiction: courts.jurisdiction,
        address: courts.address || '',
        phone: '', // Not selected in query
        website: '', // Not selected in query  
        judge_count: 0, // Not selected in query
        created_at: '', // Not selected in query
        updated_at: '' // Not selected in query
      } : undefined
      
      return { ...judge, court }
    })
    
    let judgesWithDecisions: JudgeWithDecisions[] = judges

    // Fetch decision summaries in parallel if requested
    if (includeDecisions && judges.length > 0) {
      try {
        const decisionSummaries = await fetchDecisionSummaries(supabase, judges.map(j => j.id), recentYears)
        
        // Merge decision summaries with judges
        judgesWithDecisions = judges.map(judge => ({
          ...judge,
          decision_summary: decisionSummaries.get(judge.id)
        }))
      } catch (decisionError) {
        // If decision fetching fails, continue without it
        logger.error('Failed to fetch decision summaries', { error: decisionError })
      }
    }

    const totalCount = count || 0
    const hasMore = from + (judges.length || 0) < totalCount

    const result = {
      judges: judgesWithDecisions,
      total_count: totalCount,
      page,
      per_page: limit,
      has_more: hasMore,
      rate_limit_remaining: remaining,
    }

    // Set cache headers for better performance
    const response = NextResponse.json(result)
    
    // Different caching strategies based on search vs browsing
    if (sanitizedQuery.trim()) {
      // Search results - shorter cache due to personalization
      response.headers.set('Cache-Control', 'public, s-maxage=300, max-age=60, stale-while-revalidate=180')
    } else {
      // Browse results - longer cache for stable data
      response.headers.set('Cache-Control', 'public, s-maxage=1800, max-age=900, stale-while-revalidate=900')
      response.headers.set('CDN-Cache-Control', 'public, s-maxage=3600')
    }
    
    response.headers.set('Vary', 'Accept-Encoding')
    
    const duration = Date.now() - startTime
    logger.apiResponse('GET', '/api/judges/list', 200, duration, {
      resultsCount: judges.length,
      totalCount,
      hasQuery: !!sanitizedQuery.trim(),
      hasCourtFilter: !!court_id,
      includedDecisions: includeDecisions,
      onlyWithDecisions,
      recentYears
    })
    
    return response

  } catch (error) {
    const duration = Date.now() - startTime
    logger.error('API error in judges list', { duration }, error instanceof Error ? error : undefined)
    
    logger.apiResponse('GET', '/api/judges/list', 500, duration)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Fetch judge IDs that have recent decisions within the provided window.
 */
async function fetchJudgeIdsWithRecentDecisions(
  supabase: any,
  yearsBack: number
): Promise<string[]> {
  const years = Math.min(Math.max(yearsBack, 1), 10)
  const currentYear = new Date().getFullYear()
  const startYear = currentYear - years + 1

  const { data, error } = await supabase
    .from('cases')
    .select('judge_id', { distinct: true })
    .not('judge_id', 'is', null)
    .not('decision_date', 'is', null)
    .gte('decision_date', `${startYear}-01-01`)
    .lte('decision_date', `${currentYear}-12-31`)
    .limit(10000)

  if (error) {
    throw new Error(`Failed to fetch judges with decisions: ${error.message}`)
  }

  const uniqueJudgeIds = new Set<string>()
  data?.forEach(record => {
    if (record.judge_id) {
      uniqueJudgeIds.add(record.judge_id)
    }
  })

  return Array.from(uniqueJudgeIds)
}

/**
 * Fetch decision summaries for multiple judges in parallel
 */
async function fetchDecisionSummaries(
  supabase: any, 
  judgeIds: string[], 
  yearsBack: number = 3
): Promise<Map<string, JudgeDecisionSummary>> {
  const currentYear = new Date().getFullYear()
  const startYear = currentYear - yearsBack + 1

  // Query to get decision counts by judge and year
  const { data, error } = await supabase
    .from('cases')
    .select('judge_id, decision_date')
    .in('judge_id', judgeIds)
    .not('decision_date', 'is', null)
    .gte('decision_date', `${startYear}-01-01`)
    .lte('decision_date', `${currentYear}-12-31`)

  if (error) {
    throw new Error(`Failed to fetch decision data: ${error.message}`)
  }

  // Process data to create yearly summaries
  const decisionsByJudge = new Map<string, Map<number, number>>()

  // Initialize maps for all requested judges
  judgeIds.forEach(judgeId => {
    const yearMap = new Map<number, number>()
    for (let year = startYear; year <= currentYear; year++) {
      yearMap.set(year, 0)
    }
    decisionsByJudge.set(judgeId, yearMap)
  })

  // Count decisions by judge and year
  data?.forEach((case_record: any) => {
    if (!case_record.decision_date) return
    
    const year = new Date(case_record.decision_date).getFullYear()
    const judgeMap = decisionsByJudge.get(case_record.judge_id)
    
    if (judgeMap && year >= startYear && year <= currentYear) {
      judgeMap.set(year, (judgeMap.get(year) || 0) + 1)
    }
  })

  // Convert to response format
  const summariesMap = new Map<string, JudgeDecisionSummary>()

  decisionsByJudge.forEach((yearMap, judgeId) => {
    const yearly_counts: YearlyDecisionCount[] = []
    let total_recent = 0

    for (let year = currentYear; year >= startYear; year--) {
      const count = yearMap.get(year) || 0
      yearly_counts.push({ year, count })
      total_recent += count
    }

    summariesMap.set(judgeId, {
      judge_id: judgeId,
      yearly_counts,
      total_recent
    })
  })

  return summariesMap
}
