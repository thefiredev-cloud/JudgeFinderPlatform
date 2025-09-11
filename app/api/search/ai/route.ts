import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { 
  processNaturalLanguageQuery, 
  generateSearchSuggestions,
  rankSearchResults,
  generateNoResultsHelp,
  extractLocation,
  extractCaseType
} from '@/lib/ai/search-intelligence'
import { sanitizeSearchQuery } from '@/lib/utils/validation'
import { logger } from '@/lib/utils/logger'

export const dynamic = 'force-dynamic'

interface AISearchRequest {
  query: string
  context?: {
    previousQueries?: string[]
    userLocation?: string
    searchHistory?: any[]
  }
  includeSuggestions?: boolean
  limit?: number
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const body: AISearchRequest = await request.json()
    const { query, context, includeSuggestions = true, limit = 20 } = body

    if (!query?.trim()) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    const sanitizedQuery = sanitizeSearchQuery(query)

    logger.apiRequest('POST', '/api/search/ai', {
      query: sanitizedQuery,
      hasContext: !!context,
      includeSuggestions
    })

    // Process query with AI
    const enhancedQuery = await processNaturalLanguageQuery(sanitizedQuery, context)

    // Generate suggestions if requested
    const suggestions = includeSuggestions 
      ? await generateSearchSuggestions(sanitizedQuery, context?.previousQueries)
      : []

    // Get Supabase client
    const supabase = await createServerClient()

    // Build search based on AI intent
    let searchResults: any[] = []
    const searchPromises: Promise<any>[] = []

    // Search judges if intent includes judges
    if (enhancedQuery.searchIntent.type === 'judge' || enhancedQuery.searchIntent.type === 'mixed') {
      const judgeQuery = buildJudgeQuery(
        supabase,
        enhancedQuery.processedQuery,
        enhancedQuery.searchIntent.extractedEntities,
        limit
      )
      searchPromises.push(judgeQuery)
    }

    // Search courts if intent includes courts
    if (enhancedQuery.searchIntent.type === 'court' || enhancedQuery.searchIntent.type === 'mixed') {
      const courtQuery = buildCourtQuery(
        supabase,
        enhancedQuery.processedQuery,
        enhancedQuery.searchIntent.extractedEntities,
        limit
      )
      searchPromises.push(courtQuery)
    }

    // Execute searches in parallel
    const results = await Promise.allSettled(searchPromises)
    
    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value?.data) {
        searchResults = [...searchResults, ...result.value.data]
      }
    })

    // Rank results using AI
    const rankedResults = await rankSearchResults(
      searchResults,
      sanitizedQuery,
      enhancedQuery.searchIntent
    )

    // Generate help message if no results
    let noResultsHelp = null
    if (rankedResults.length === 0) {
      noResultsHelp = await generateNoResultsHelp(
        sanitizedQuery,
        enhancedQuery.searchIntent.type
      )
    }

    const response = {
      success: true,
      originalQuery: sanitizedQuery,
      enhancedQuery: enhancedQuery.processedQuery,
      intent: enhancedQuery.searchIntent,
      results: rankedResults.slice(0, limit),
      totalCount: rankedResults.length,
      suggestions,
      expandedTerms: enhancedQuery.expandedTerms,
      conversationalResponse: enhancedQuery.conversationalResponse,
      noResultsHelp,
      processingTime: Date.now() - startTime
    }

    // Set cache headers for AI responses
    const responseObj = NextResponse.json(response)
    responseObj.headers.set('Cache-Control', 'public, s-maxage=60, max-age=30, stale-while-revalidate=30')
    
    const duration = Date.now() - startTime
    logger.apiResponse('POST', '/api/search/ai', 200, duration, {
      resultsCount: rankedResults.length,
      intentType: enhancedQuery.searchIntent.type,
      confidence: enhancedQuery.searchIntent.confidence
    })

    return responseObj

  } catch (error) {
    const duration = Date.now() - startTime
    logger.error('AI search error', { duration }, error instanceof Error ? error : undefined)
    
    return NextResponse.json(
      { 
        error: 'AI search failed',
        fallbackUrl: `/api/search?q=${encodeURIComponent(body?.query || '')}`
      },
      { status: 500 }
    )
  }
}

// GET endpoint for simple AI suggestions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const partial = searchParams.get('q') || ''
    
    if (partial.length < 2) {
      return NextResponse.json({ suggestions: [] })
    }

    const suggestions = await generateSearchSuggestions(partial)
    
    const response = NextResponse.json({ suggestions })
    response.headers.set('Cache-Control', 'public, s-maxage=300, max-age=60')
    
    return response

  } catch (error) {
    console.error('Suggestion generation error:', error)
    return NextResponse.json({ suggestions: [] })
  }
}

/**
 * Build judge search query based on AI-extracted entities
 */
function buildJudgeQuery(
  supabase: any,
  query: string,
  entities: any,
  limit: number
) {
  let queryBuilder = supabase
    .from('judges')
    .select('id, name, court_name, jurisdiction, total_cases, slug, appointed_date')

  // Add name search if names extracted
  if (entities.names?.length > 0) {
    const nameConditions = entities.names
      .map((name: string) => `name.ilike.%${name}%`)
      .join(',')
    queryBuilder = queryBuilder.or(nameConditions)
  } else {
    // Fallback to general text search
    queryBuilder = queryBuilder.ilike('name', `%${query}%`)
  }

  // Add location filter if detected
  if (entities.locations?.length > 0) {
    const locationConditions = entities.locations
      .map((loc: string) => `jurisdiction.ilike.%${loc}%,court_name.ilike.%${loc}%`)
      .join(',')
    queryBuilder = queryBuilder.or(locationConditions)
  }

  return queryBuilder.limit(limit)
}

/**
 * Build court search query based on AI-extracted entities
 */
function buildCourtQuery(
  supabase: any,
  query: string,
  entities: any,
  limit: number
) {
  let queryBuilder = supabase
    .from('courts')
    .select('id, name, type, jurisdiction, address, judge_count')

  // Add location-based search
  if (entities.locations?.length > 0) {
    const locationConditions = entities.locations
      .map((loc: string) => `name.ilike.%${loc}%,jurisdiction.ilike.%${loc}%,address.ilike.%${loc}%`)
      .join(',')
    queryBuilder = queryBuilder.or(locationConditions)
  } else {
    // Fallback to general text search
    queryBuilder = queryBuilder.ilike('name', `%${query}%`)
  }

  return queryBuilder.limit(limit)
}