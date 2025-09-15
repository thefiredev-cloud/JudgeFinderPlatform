import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import { sanitizeSearchQuery, normalizeJudgeSearchQuery } from '@/lib/utils/validation'
import type { 
  SearchResponse, 
  SearchResult, 
  JudgeSearchResult, 
  CourtSearchResult, 
  JurisdictionSearchResult,
  SearchSuggestionsResponse,
  SearchSuggestion
} from '@/types/search'

export const dynamic = 'force-dynamic'

// Predefined jurisdictions for search
const PREDEFINED_JURISDICTIONS: JurisdictionSearchResult[] = [
  {
    id: 'ca',
    type: 'jurisdiction',
    title: 'California',
    subtitle: 'State Courts',
    description: 'State courts across California handling various civil and criminal matters.',
    url: '/jurisdictions/california',
    jurisdictionValue: 'CA',
    displayName: 'California'
  },
  {
    id: 'federal',
    type: 'jurisdiction', 
    title: 'Federal',
    subtitle: 'Federal Courts',
    description: 'Federal courts handling federal matters across California districts.',
    url: '/jurisdictions/federal',
    jurisdictionValue: 'F',
    displayName: 'Federal'
  },
  {
    id: 'los-angeles-county',
    type: 'jurisdiction',
    title: 'Los Angeles County',
    subtitle: 'County Courts',
    description: 'Largest judicial system in California with comprehensive trial and appellate courts.',
    url: '/jurisdictions/los-angeles-county',
    jurisdictionValue: 'CA',
    displayName: 'Los Angeles County'
  },
  {
    id: 'orange-county',
    type: 'jurisdiction',
    title: 'Orange County',
    subtitle: 'County Courts',
    description: 'Major Southern California jurisdiction serving diverse communities and businesses.',
    url: '/jurisdictions/orange-county',
    jurisdictionValue: 'Orange County, CA',
    displayName: 'Orange County'
  },
  {
    id: 'san-diego-county',
    type: 'jurisdiction',
    title: 'San Diego County',
    subtitle: 'County Courts',
    description: 'Southern California coastal jurisdiction with federal and state court systems.',
    url: '/jurisdictions/san-diego-county',
    jurisdictionValue: 'CA',
    displayName: 'San Diego County'
  },
  {
    id: 'san-francisco-county',
    type: 'jurisdiction',
    title: 'San Francisco County',
    subtitle: 'County Courts',
    description: 'Metropolitan jurisdiction with specialized business and technology courts.',
    url: '/jurisdictions/san-francisco-county',
    jurisdictionValue: 'CA',
    displayName: 'San Francisco County'
  },
  {
    id: 'santa-clara-county',
    type: 'jurisdiction',
    title: 'Santa Clara County',
    subtitle: 'County Courts',
    description: 'Silicon Valley jurisdiction handling technology and intellectual property cases.',
    url: '/jurisdictions/santa-clara-county',
    jurisdictionValue: 'CA',
    displayName: 'Santa Clara County'
  },
  {
    id: 'alameda-county',
    type: 'jurisdiction',
    title: 'Alameda County',
    subtitle: 'County Courts',
    description: 'Bay Area jurisdiction with diverse civil and criminal caseloads.',
    url: '/jurisdictions/alameda-county',
    jurisdictionValue: 'CA',
    displayName: 'Alameda County'
  }
]

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''
    const type = searchParams.get('type') as 'judge' | 'court' | 'jurisdiction' | 'all' || 'all'
    const limit = Math.min(parseInt(searchParams.get('limit') || '200'), 2000)  // Increased max to 2000 to handle all judges
    const suggestions = searchParams.get('suggestions') === 'true'
    
    const sanitizedQuery = sanitizeSearchQuery(q).trim()
    
    // If no query, return popular judges and jurisdictions
    if (!sanitizedQuery) {
      const supabase = await createServerClient()
      
      // Get popular judges (those with most cases)
      const { data: popularJudges } = await supabase
        .from('judges')
        .select('id, name, court_name, jurisdiction, total_cases, profile_image_url, slug')
        .order('total_cases', { ascending: false, nullsFirst: false })
        .limit(limit)
      
      const judgeResults: JudgeSearchResult[] = (popularJudges || []).map((judge: any) => {
        const slug = judge.slug || judge.name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-')
        return {
          id: judge.id,
          type: 'judge',
          title: judge.name,
          subtitle: judge.court_name || 'Court information pending',
          description: `${judge.jurisdiction || 'CA'} jurisdiction • ${judge.total_cases || 0} cases`,
          url: `/judges/${slug}`,
          court_name: judge.court_name,
          jurisdiction: judge.jurisdiction || 'CA',
          total_cases: judge.total_cases || 0,
          profile_image_url: judge.profile_image_url
        }
      })
      
      // Add top jurisdictions
      const topJurisdictions = PREDEFINED_JURISDICTIONS.slice(0, 3)
      
      const allResults = [...judgeResults, ...topJurisdictions]
      
      return NextResponse.json({
        results: allResults,
        total_count: allResults.length,
        results_by_type: { 
          judges: judgeResults, 
          courts: [], 
          jurisdictions: topJurisdictions 
        },
        counts_by_type: { 
          judges: judgeResults.length, 
          courts: 0, 
          jurisdictions: topJurisdictions.length 
        },
        query: q,
        took_ms: Date.now() - startTime
      } as SearchResponse)
    }

    logger.apiRequest('GET', '/api/search', {
      query: sanitizedQuery,
      type,
      limit,
      suggestions
    })

    // Handle suggestions endpoint
    if (suggestions) {
      const suggestionsResponse = await generateSearchSuggestions(sanitizedQuery, limit)
      const duration = Date.now() - startTime
      logger.apiResponse('GET', '/api/search/suggestions', 200, duration)
      return NextResponse.json(suggestionsResponse)
    }

    const supabase = await createServerClient()
    
    // Search in parallel for better performance
    const searchPromises: Promise<SearchResult[]>[] = []
    
    if (type === 'all' || type === 'judge') {
      searchPromises.push(searchJudges(supabase, sanitizedQuery, limit))
    }
    
    if (type === 'all' || type === 'court') {
      searchPromises.push(searchCourts(supabase, sanitizedQuery, limit))
    }
    
    if (type === 'all' || type === 'jurisdiction') {
      searchPromises.push(searchJurisdictions(sanitizedQuery, limit))
    }

    const searchResults = await Promise.all(searchPromises)
    const allResults = searchResults.flat()

    // Sort by relevance (could be enhanced with proper scoring)
    const sortedResults = allResults.sort((a, b) => {
      // Prioritize exact matches at the beginning of names
      const aStartsWithQuery = a.title.toLowerCase().startsWith(sanitizedQuery.toLowerCase())
      const bStartsWithQuery = b.title.toLowerCase().startsWith(sanitizedQuery.toLowerCase())
      
      if (aStartsWithQuery && !bStartsWithQuery) return -1
      if (!aStartsWithQuery && bStartsWithQuery) return 1
      
      // Then sort by relevance score if available
      if (a.relevanceScore && b.relevanceScore) {
        return b.relevanceScore - a.relevanceScore
      }
      
      // Finally sort alphabetically
      return a.title.localeCompare(b.title)
    })

    // Categorize results
    const judges = sortedResults.filter(r => r.type === 'judge') as JudgeSearchResult[]
    const courts = sortedResults.filter(r => r.type === 'court') as CourtSearchResult[]
    const jurisdictions = sortedResults.filter(r => r.type === 'jurisdiction') as JurisdictionSearchResult[]

    const response: SearchResponse = {
      results: sortedResults.slice(0, limit),
      total_count: sortedResults.length,
      results_by_type: {
        judges: judges.slice(0, limit),  // Give full limit to each type
        courts: courts.slice(0, limit),  // Give full limit to each type
        jurisdictions: jurisdictions.slice(0, limit)  // Give full limit to each type
      },
      counts_by_type: {
        judges: judges.length,
        courts: courts.length,
        jurisdictions: jurisdictions.length
      },
      query: q,
      took_ms: Date.now() - startTime
    }

    // Set cache headers
    const responseObj = NextResponse.json(response)
    responseObj.headers.set('Cache-Control', 'public, s-maxage=300, max-age=60, stale-while-revalidate=180')
    responseObj.headers.set('Vary', 'Accept-Encoding')
    
    const duration = Date.now() - startTime
    logger.apiResponse('GET', '/api/search', 200, duration, {
      totalResults: sortedResults.length,
      judgeResults: judges.length,
      courtResults: courts.length,
      jurisdictionResults: jurisdictions.length
    })
    
    return responseObj

  } catch (error) {
    const duration = Date.now() - startTime
    logger.error('API error in search', { duration }, error instanceof Error ? error : undefined)
    
    logger.apiResponse('GET', '/api/search', 500, duration)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function searchJudges(supabase: any, query: string, limit: number): Promise<JudgeSearchResult[]> {
  try {
    // Use the increased limit for better results
    const actualLimit = Math.min(limit, 2000)  // Increased cap to 2000 to handle all judges in database
    
    // Improved search to handle partial names and different search patterns
    // Split query into words to search for first/last names separately
    const cleaned = normalizeJudgeSearchQuery(query)
    const queryWords = cleaned.toLowerCase().split(/\s+/).filter(word => word.length > 0)
    
    let searchQuery = supabase
      .from('judges')
      .select('id, name, court_name, jurisdiction, total_cases, profile_image_url, slug')
    
    // If single word, search anywhere in the name
    if (queryWords.length === 1) {
      searchQuery = searchQuery.ilike('name', `%${cleaned}%`)
    } else {
      // For multiple words, search for the full phrase first
      searchQuery = searchQuery.or(`name.ilike.%${cleaned}%,name.ilike.%${queryWords.join('%')}%`)
    }
    
    const { data, error } = await searchQuery
      .range(0, actualLimit - 1)
      .order('name')

    if (error) {
      logger.error('Database error searching judges', { 
        query,
        limit: actualLimit,
        error: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      // Return empty array but don't throw - let other searches continue
      return []
    }

    if (!data || data.length === 0) {
      logger.info('No judges found for query', { query })
      return []
    }

    logger.info(`Judge search successful`, { query: cleaned, resultsFound: data.length, limit: actualLimit })

    return data.map((judge: any): JudgeSearchResult => {
      // Use slug from database if available, otherwise generate it
      const slug = judge.slug || judge.name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-')
      
      return {
        id: judge.id,
        type: 'judge',
        title: judge.name,
        subtitle: judge.court_name || 'Court information pending',
        description: `${judge.jurisdiction || 'CA'} jurisdiction • ${judge.total_cases || 0} cases`,
        url: `/judges/${slug}`,
        court_name: judge.court_name,
        jurisdiction: judge.jurisdiction || 'CA',
        total_cases: judge.total_cases || 0,
        profile_image_url: judge.profile_image_url,
        relevanceScore: calculateRelevanceScore(query, judge.name)
      }
    })
  } catch (error) {
    logger.error('Unexpected error in searchJudges', { 
      query, 
      limit,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    // Return empty array to allow other searches to continue
    return []
  }
}

async function searchCourts(supabase: any, query: string, limit: number): Promise<CourtSearchResult[]> {
  try {
    // Use the increased limit for better results
    const actualLimit = Math.min(limit, 2000)  // Increased cap to 2000 for consistency
    
    const { data, error, count } = await supabase
      .from('courts')
      .select('id, name, type, jurisdiction, address, phone, website, judge_count', { count: 'exact' })
      .ilike('name', `%${query}%`)
      .range(0, actualLimit - 1)
      .order('name')

    if (error) {
      logger.error('Database error searching courts', { 
        query,
        limit: actualLimit,
        error: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      // Return empty array but don't throw - let other searches continue
      return []
    }

    if (!data || data.length === 0) {
      logger.info('No courts found for query', { query })
      return []
    }

    logger.info(`Court search successful`, { 
      query, 
      resultsFound: data.length,
      totalCount: count || 0,
      limit: actualLimit
    })

    return data.map((court: any): CourtSearchResult => {
      const slug = court.name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-')
      
      return {
        id: court.id,
        type: 'court',
        title: court.name,
        subtitle: `${court.type || 'Superior'} Court`,
        description: `${court.jurisdiction || 'CA'} • ${court.judge_count || 0} judges`,
        url: `/courts/${slug}`,
        court_type: court.type || 'Superior',
        jurisdiction: court.jurisdiction || 'CA',
        address: court.address,
        judge_count: court.judge_count || 0,
        phone: court.phone,
        website: court.website,
        relevanceScore: calculateRelevanceScore(query, court.name)
      }
    })
  } catch (error) {
    logger.error('Unexpected error in searchCourts', { 
      query, 
      limit,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    // Return empty array to allow other searches to continue
    return []
  }
}

async function searchJurisdictions(query: string, limit: number): Promise<JurisdictionSearchResult[]> {
  const queryLower = query.toLowerCase()
  
  return PREDEFINED_JURISDICTIONS
    .filter(jurisdiction => 
      jurisdiction.title.toLowerCase().includes(queryLower) ||
      jurisdiction.displayName.toLowerCase().includes(queryLower) ||
      jurisdiction.description.toLowerCase().includes(queryLower)
    )
    .slice(0, limit)
    .map(jurisdiction => ({
      ...jurisdiction,
      relevanceScore: calculateRelevanceScore(query, jurisdiction.title)
    }))
}

async function generateSearchSuggestions(query: string, limit: number): Promise<SearchSuggestionsResponse> {
  const suggestions: SearchSuggestion[] = []

  try {
    // Search for actual judges in the database
    const supabase = await createServerClient()

    const { data: judges, error } = await supabase
      .from('judges')
      .select('id, name, court_name, jurisdiction, total_cases, slug')
      .ilike('name', `%${query}%`)
      .limit(Math.min(limit, 10))  // Limit judge suggestions to 10
      .order('name')

    if (!error && judges && judges.length > 0) {
      const judgeSuggestions = judges.map((judge: any): SearchSuggestion => {
        const slug = judge.slug || judge.name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-')
        return {
          text: judge.name,
          type: 'judge',
          count: judge.total_cases || 0,
          url: `/judges/${slug}`
        }
      })
      suggestions.push(...judgeSuggestions)
    }

    // Add jurisdiction suggestions
    const jurisdictionMatches = PREDEFINED_JURISDICTIONS
      .filter(j => j.title.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 3)
      .map((j): SearchSuggestion => ({
        text: j.title,
        type: 'jurisdiction',
        count: 1,
        url: j.url
      }))

    suggestions.push(...jurisdictionMatches)

    // Add some common search terms if they match
    const commonSearches = [
      { text: 'California Superior Court', type: 'court' as const, count: 150, url: '/search?q=California Superior Court&type=court' },
      { text: 'Federal Court', type: 'court' as const, count: 89, url: '/search?q=Federal Court&type=court' },
      { text: 'Criminal Defense', type: 'judge' as const, count: 234, url: '/search?q=Criminal Defense&type=judge' },
      { text: 'Civil Litigation', type: 'judge' as const, count: 189, url: '/search?q=Civil Litigation&type=judge' }
    ].filter(s => s.text.toLowerCase().includes(query.toLowerCase()))

    suggestions.push(...commonSearches)

  } catch (error) {
    logger.error('Error generating search suggestions', {
      query,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  return {
    suggestions: suggestions.slice(0, limit),
    query
  }
}

function calculateRelevanceScore(query: string, text: string): number {
  const queryLower = query.toLowerCase()
  const textLower = text.toLowerCase()
  
  // Exact match
  if (textLower === queryLower) return 100
  
  // Starts with query
  if (textLower.startsWith(queryLower)) return 80
  
  // Contains query
  if (textLower.includes(queryLower)) return 60
  
  // Word boundary matches
  const words = queryLower.split(' ')
  const textWords = textLower.split(' ')
  
  let wordMatches = 0
  for (const word of words) {
    if (textWords.some(tw => tw.startsWith(word))) {
      wordMatches++
    }
  }
  
  return (wordMatches / words.length) * 40
}
