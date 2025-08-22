import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import { sanitizeSearchQuery } from '@/lib/utils/validation'
import type { Judge } from '@/types'

export const dynamic = 'force-dynamic'

interface AdvancedJudgeFilters {
  case_types?: string[]
  min_experience?: number
  max_experience?: number
  case_value_range?: string
  efficiency_level?: string
  settlement_rate_min?: number
  settlement_rate_max?: number
  specialization?: string
  court_types?: string[]
}

interface JudgeSearchResult extends Judge {
  match_score: number
  experience_years: number
  efficiency_score: number
  settlement_rate: number
  primary_specialization: string
}

interface AdvancedJudgeSearchResponse {
  judges: JudgeSearchResult[]
  total_count: number
  page: number
  per_page: number
  has_more: boolean
  applied_filters: AdvancedJudgeFilters
  search_took_ms: number
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse search parameters
    const query = sanitizeSearchQuery(searchParams.get('q') || '')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    
    // Parse advanced filters
    const filters: AdvancedJudgeFilters = {
      case_types: searchParams.get('case_types')?.split(',').filter(Boolean) || [],
      min_experience: searchParams.get('min_experience') ? parseInt(searchParams.get('min_experience')!) : undefined,
      max_experience: searchParams.get('max_experience') ? parseInt(searchParams.get('max_experience')!) : undefined,
      case_value_range: searchParams.get('case_value_range') || undefined,
      efficiency_level: searchParams.get('efficiency_level') || undefined,
      settlement_rate_min: searchParams.get('settlement_rate_min') ? parseInt(searchParams.get('settlement_rate_min')!) : undefined,
      settlement_rate_max: searchParams.get('settlement_rate_max') ? parseInt(searchParams.get('settlement_rate_max')!) : undefined,
      specialization: searchParams.get('specialization') || undefined,
      court_types: searchParams.get('court_types')?.split(',').filter(Boolean) || []
    }

    logger.apiRequest('GET', '/api/judges/advanced-search', { query, filters, page, limit })

    const supabase = await createServerClient()
    const from = (page - 1) * limit
    const to = from + limit - 1

    // Build the search query with joins to get case statistics
    let queryBuilder = supabase
      .from('judges')
      .select(`
        *,
        courts:court_id (
          id,
          name,
          type,
          jurisdiction
        )
      `, { count: 'exact' })
      .order('name')
      .range(from, to)

    // Apply text search if provided
    if (query.trim()) {
      queryBuilder = queryBuilder.or(`name.ilike.%${query}%,court_name.ilike.%${query}%`)
    }

    // Apply experience filters
    if (filters.min_experience !== undefined) {
      const minDate = new Date()
      minDate.setFullYear(minDate.getFullYear() - filters.min_experience)
      queryBuilder = queryBuilder.lte('appointed_date', minDate.toISOString().split('T')[0])
    }

    if (filters.max_experience !== undefined && filters.max_experience < 50) {
      const maxDate = new Date()
      maxDate.setFullYear(maxDate.getFullYear() - filters.max_experience)
      queryBuilder = queryBuilder.gte('appointed_date', maxDate.toISOString().split('T')[0])
    }

    // Apply court type filters
    if (filters.court_types && filters.court_types.length > 0) {
      // This would need to join with courts table for court type filtering
      // For now, we'll filter by court names that contain type keywords
      const courtTypeConditions = filters.court_types.map(type => 
        `court_name.ilike.%${type}%`
      ).join(',')
      queryBuilder = queryBuilder.or(courtTypeConditions)
    }

    // Execute the query
    const { data: judges, error, count } = await queryBuilder

    if (error) {
      logger.error('Advanced judge search error', { query, filters, error: error.message })
      return NextResponse.json(
        { error: 'Failed to search judges' },
        { status: 500 }
      )
    }

    // Enhance results with calculated metrics
    const enhancedJudges = await enhanceJudgeResults(supabase, judges || [], filters)

    const result: AdvancedJudgeSearchResponse = {
      judges: enhancedJudges,
      total_count: count || 0,
      page,
      per_page: limit,
      has_more: (from + enhancedJudges.length) < (count || 0),
      applied_filters: filters,
      search_took_ms: Date.now() - startTime
    }

    // Set cache headers
    const response = NextResponse.json(result)
    if (query.trim()) {
      response.headers.set('Cache-Control', 'public, s-maxage=300, max-age=60, stale-while-revalidate=180')
    } else {
      response.headers.set('Cache-Control', 'public, s-maxage=1800, max-age=900, stale-while-revalidate=900')
    }

    logger.apiResponse('GET', '/api/judges/advanced-search', 200, Date.now() - startTime, {
      resultsCount: enhancedJudges.length,
      totalCount: count,
      hasFilters: Object.values(filters).some(v => v !== undefined && v !== '' && (!Array.isArray(v) || v.length > 0))
    })

    return response

  } catch (error) {
    const duration = Date.now() - startTime
    logger.error('Advanced judge search API error', { duration }, error instanceof Error ? error : undefined)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function enhanceJudgeResults(
  supabase: any, 
  judges: any[], 
  filters: AdvancedJudgeFilters
): Promise<JudgeSearchResult[]> {
  if (judges.length === 0) return []

  const judgeIds = judges.map(j => j.id)
  
  // Get case statistics for filtering - we'll get a sample of cases for each judge
  const { data: caseSamples } = await supabase
    .from('cases')
    .select('judge_id, case_type, outcome, status, filing_date, decision_date, case_value')
    .in('judge_id', judgeIds)
    .limit(1000) // Limit to prevent massive queries

  // Group cases by judge
  const casesByJudge = caseSamples?.reduce((groups: any, case_: any) => {
    if (!groups[case_.judge_id]) {
      groups[case_.judge_id] = []
    }
    groups[case_.judge_id].push(case_)
    return groups
  }, {}) || {}

  // Calculate basic metrics from available data
  const enhancedResults = judges.map((judge): JudgeSearchResult => {
    // Calculate experience years
    const experienceYears = judge.appointed_date 
      ? new Date().getFullYear() - new Date(judge.appointed_date).getFullYear()
      : 0

    // Get cases for this judge
    const judgeCases = casesByJudge[judge.id] || []
    
    // Calculate efficiency score (cases per month estimate)
    const efficiencyScore = judgeCases.length > 0 
      ? judgeCases.length / 12 
      : (judge.total_cases || 0) / 12

    // Calculate settlement rate
    const settledCases = judgeCases.filter((c: any) => 
      (c.outcome || c.status || '').toLowerCase().includes('settl')
    ).length
    const settlementRate = judgeCases.length > 0 ? settledCases / judgeCases.length : 0.4

    // Determine primary specialization
    const caseTypes = judgeCases.reduce((types: any, case_: any) => {
      const type = case_.case_type || 'General'
      types[type] = (types[type] || 0) + 1
      return types
    }, {})
    
    const primarySpecialization = Object.keys(caseTypes).length > 0 
      ? Object.entries(caseTypes).sort(([,a], [,b]) => (b as number) - (a as number))[0][0]
      : 'General Practice'

    // Calculate match score based on filters
    let matchScore = 1.0
    
    // Apply case type filter
    if (filters.case_types && filters.case_types.length > 0) {
      const hasMatchingCaseType = filters.case_types.some(filterType =>
        judgeCases.some((c: any) => 
          (c.case_type || '').toLowerCase().includes(filterType.toLowerCase())
        )
      )
      if (!hasMatchingCaseType) {
        matchScore *= 0.3
      }
    }
    
    // Apply settlement rate filter
    if (filters.settlement_rate_min !== undefined && settlementRate < filters.settlement_rate_min / 100) {
      matchScore *= 0.5
    }
    if (filters.settlement_rate_max !== undefined && settlementRate > filters.settlement_rate_max / 100) {
      matchScore *= 0.5
    }
    
    // Apply efficiency filter
    if (filters.efficiency_level) {
      const isHighEfficiency = filters.efficiency_level.includes('High') && efficiencyScore >= 15
      const isAverageEfficiency = filters.efficiency_level.includes('Average') && efficiencyScore >= 5 && efficiencyScore < 15
      const isLowEfficiency = filters.efficiency_level.includes('Low') && efficiencyScore < 5
      
      if (!(isHighEfficiency || isAverageEfficiency || isLowEfficiency)) {
        matchScore *= 0.3
      }
    }
    
    // Apply specialization filter
    if (filters.specialization && !primarySpecialization.toLowerCase().includes(filters.specialization.toLowerCase())) {
      matchScore *= 0.6
    }

    // Apply case value filter
    if (filters.case_value_range) {
      const hasMatchingCaseValue = judgeCases.some((c: any) => {
        if (!c.case_value) return false
        
        const value = c.case_value
        switch (filters.case_value_range) {
          case 'Under $50k':
            return value < 50000
          case '$50k - $250k':
            return value >= 50000 && value < 250000
          case '$250k - $1M':
            return value >= 250000 && value < 1000000
          case '$1M - $5M':
            return value >= 1000000 && value < 5000000
          case '$5M+':
            return value >= 5000000
          default:
            return true
        }
      })
      
      if (!hasMatchingCaseValue && judgeCases.some((c: any) => c.case_value)) {
        matchScore *= 0.4
      }
    }

    return {
      ...judge,
      match_score: matchScore,
      experience_years: experienceYears,
      efficiency_score: efficiencyScore,
      settlement_rate: settlementRate,
      primary_specialization: primarySpecialization
    }
  })

  // Filter out results with very low match scores and sort by match score
  return enhancedResults
    .filter(judge => judge.match_score > 0.2) // Remove very poor matches
    .sort((a, b) => b.match_score - a.match_score)
}