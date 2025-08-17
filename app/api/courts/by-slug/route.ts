import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { generateSlug, isValidSlug } from '@/lib/utils/slug'
import { cache } from '@/lib/cache/simple-cache'
import type { Court } from '@/types'

interface CourtLookupResult {
  court: Court | null
  found_by: string
  alternatives?: Court[]
}

/**
 * Enhanced court lookup API with multiple fallback strategies
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')

    if (!slug || typeof slug !== 'string') {
      return NextResponse.json(
        { error: 'Invalid or missing slug parameter' },
        { status: 400 }
      )
    }

    // Validate slug format
    if (!isValidSlug(slug)) {
      return NextResponse.json(
        { 
          error: 'Invalid slug format',
          code: 'INVALID_SLUG',
          message: `Slug "${slug}" contains invalid characters`
        },
        { status: 400 }
      )
    }

    const result = await lookupCourt(slug)

    if (!result.court) {
      return NextResponse.json(
        {
          error: 'Court not found',
          code: 'COURT_NOT_FOUND',
          message: `No court found for slug: ${slug}`,
          searched_slug: slug,
          suggestions: result.alternatives || [],
          found_by: result.found_by
        },
        { status: 404 }
      )
    }

    // Success response with metadata
    const response = NextResponse.json({
      court: result.court,
      found_by: result.found_by,
      alternatives: result.alternatives || []
    })

    // Set cache headers for performance (court data is stable)
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=3600, max-age=1800, stale-while-revalidate=1800'
    )
    response.headers.set('CDN-Cache-Control', 'public, s-maxage=7200')
    response.headers.set('Vary', 'Accept-Encoding')

    return response

  } catch (error) {
    console.error('Error in court lookup API:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}

/**
 * Comprehensive court lookup with multiple strategies and caching
 */
async function lookupCourt(slug: string): Promise<CourtLookupResult> {
  const cacheKey = `court_lookup:${slug}`
  
  // Check cache first
  const cachedResult = cache.get<CourtLookupResult>(cacheKey)
  if (cachedResult) {
    await logQueryPerformance('court_cache_hit', 0, { slug })
    return cachedResult
  }

  const supabase = await createServerClient()
  const startTime = Date.now()

  try {
    // Strategy 1: Direct slug lookup (O(1) with index) - if slug column exists
    let slugCourt = null
    let slugError = null
    
    try {
      const result = await supabase
        .from('courts')
        .select('*')
        .eq('slug', slug)
        .maybeSingle()
      
      slugCourt = result.data
      slugError = result.error
    } catch (error) {
      // Slug column might not exist yet, continue to fallback strategies
      console.log('Court slug column not available, using fallback lookup')
      slugError = error
    }

    if (!slugError && slugCourt) {
      const result = {
        court: slugCourt as Court,
        found_by: 'slug'
      }
      
      // Cache successful lookup for 30 minutes
      cache.set(cacheKey, result, 1800)
      
      await logQueryPerformance('court_slug_lookup', Date.now() - startTime, { slug })
      return result
    }

    // Strategy 2: Name-based lookup using slug conversion (optimized)
    const slugToName = slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')

    // Try exact name match first
    const { data: exactMatch, error: exactError } = await supabase
      .from('courts')
      .select('*')
      .ilike('name', slugToName)
      .limit(5)

    if (!exactError && exactMatch && exactMatch.length > 0) {
      // Find best match by comparing generated slugs
      const bestMatch = exactMatch.find(court => 
        generateSlug(court.name) === slug
      ) || exactMatch[0]

      const alternatives = exactMatch.length > 1 
        ? exactMatch.filter(c => c.id !== bestMatch.id).slice(0, 3)
        : []

      const result = {
        court: bestMatch as Court,
        found_by: 'name_exact',
        alternatives: alternatives as Court[]
      }
      
      // Cache name-based lookup for 30 minutes
      cache.set(cacheKey, result, 1800)

      await logQueryPerformance('court_name_exact', Date.now() - startTime, { slug })
      return result
    }

    // Strategy 3: Fuzzy name matching
    const { data: fuzzyMatches, error: fuzzyError } = await supabase
      .from('courts')
      .select('*')
      .ilike('name', `%${slugToName}%`)
      .limit(10)

    if (!fuzzyError && fuzzyMatches && fuzzyMatches.length > 0) {
      const result = {
        court: fuzzyMatches[0] as Court,
        found_by: 'fuzzy_name',
        alternatives: fuzzyMatches.slice(1, 4) as Court[]
      }
      
      // Cache fuzzy match for 15 minutes (shorter since it's less certain)
      cache.set(cacheKey, result, 900)
      
      await logQueryPerformance('court_fuzzy_match', Date.now() - startTime, { slug, matches: fuzzyMatches.length })
      return result
    }

    // Strategy 4: Limited similarity search for suggestions
    const { data: limitedCourts, error: limitedError } = await supabase
      .from('courts')
      .select('id, name, jurisdiction, type')
      .limit(100) // Much smaller subset for performance

    let suggestions: Court[] = []
    if (!limitedError && limitedCourts) {
      suggestions = findSimilarCourtSlugs(slug, limitedCourts).slice(0, 5)
    }

    await logQueryPerformance('court_not_found', Date.now() - startTime, { slug, suggestions: suggestions.length })
    
    return {
      court: null,
      found_by: 'not_found',
      alternatives: suggestions
    }

  } catch (error) {
    console.error('Error in lookupCourt:', error)
    await logQueryPerformance('court_error', Date.now() - startTime, { slug, error: error.message })
    return {
      court: null,
      found_by: 'not_found'
    }
  }
}

/**
 * Find courts with similar slugs for suggestions
 */
function findSimilarCourtSlugs(targetSlug: string, courts: any[]): Court[] {
  const suggestions: Array<{ court: Court; similarity: number }> = []
  const maxProcessed = Math.min(courts.length, 100)

  for (let i = 0; i < maxProcessed; i++) {
    const court = courts[i]
    const courtSlug = court.slug || generateSlug(court.name)
    const similarity = calculateStringSimilarity(targetSlug, courtSlug)
    
    if (similarity > 0.5) {
      suggestions.push({ court: court as Court, similarity })
    }
  }

  return suggestions
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5)
    .map(s => s.court)
}

/**
 * Calculate string similarity (simplified version)
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  const maxLength = Math.max(str1.length, str2.length)
  if (maxLength === 0) return 1.0

  const distance = levenshteinDistance(str1, str2)
  return (maxLength - distance) / maxLength
}

/**
 * Calculate Levenshtein distance
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = []

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }

  return matrix[str2.length][str1.length]
}

/**
 * Log query performance for monitoring
 */
async function logQueryPerformance(queryType: string, executionTime: number, params: any) {
  try {
    const supabase = await createServerClient()
    
    // Try to log to performance_metrics table
    await supabase
      .from('performance_metrics')
      .insert({
        metric_name: `court_lookup_${queryType}`,
        metric_value: executionTime,
        page_url: '/api/courts/by-slug',
        page_type: 'api',
        metric_id: queryType,
        rating: executionTime < 100 ? 'good' : executionTime < 500 ? 'needs-improvement' : 'poor'
      })
  } catch (error) {
    // Silent fail - don't impact user experience
    console.log('Query performance logging failed:', error.message)
  }
}