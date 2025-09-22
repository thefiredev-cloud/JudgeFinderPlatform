import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { generateSlug, slugToName, generateNameVariations, isValidSlug } from '@/lib/utils/slug'
import { cache } from '@/lib/cache/simple-cache'
import { logger } from '@/lib/utils/logger'
import { isJudge, isJudgeArray, validateStringLength } from '@/lib/utils/type-guards'
import type { Judge, JudgeLookupResult } from '@/types'

export const dynamic = 'force-dynamic'

/**
 * Enhanced judge lookup API with multiple fallback strategies
 * Provides detailed information about how the judge was found
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')

    if (!slug || !validateStringLength(slug, 1, 200)) {
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

    const result = await lookupJudge(slug)

    if (!result.judge) {
      return NextResponse.json(
        {
          error: 'Judge not found',
          code: 'JUDGE_NOT_FOUND',
          message: `No judge found for slug: ${slug}`,
          searched_slug: slug,
          suggestions: result.alternatives || [],
          found_by: result.found_by
        },
        { status: 404 }
      )
    }

    // Success response with metadata
    const response = NextResponse.json({
      judge: result.judge,
      found_by: result.found_by,
      alternatives: result.alternatives || []
    })

    // Set aggressive cache headers for performance (judge data is stable)
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=3600, max-age=1800, stale-while-revalidate=1800'
    )
    response.headers.set('CDN-Cache-Control', 'public, s-maxage=7200')
    response.headers.set('Vary', 'Accept-Encoding')

    return response

  } catch (error) {
    logger.error('Judge lookup API error', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      path: request.url 
    }, error instanceof Error ? error : undefined)
    
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
 * Optimized judge lookup with performance monitoring and caching
 */
async function lookupJudge(slug: string): Promise<JudgeLookupResult> {
  const cacheKey = `judge_lookup:${slug}`
  
  // Check cache first
  const cachedResult = cache.get<JudgeLookupResult>(cacheKey)
  if (cachedResult) {
    logger.debug('Judge lookup cache hit', { slug })
    await logQueryPerformance('cache_hit', 0, { slug })
    return cachedResult
  }

  const supabase = await createServerClient()
  const startTime = Date.now()

  try {
    // Strategy 1: Direct slug lookup (O(1) with index) - if slug column exists
    let slugJudge = null
    let slugError = null
    
    try {
      const result = await supabase
        .from('judges')
        .select('*')
        .eq('slug', slug)
        .maybeSingle()
      
      slugJudge = result.data
      slugError = result.error
    } catch (error) {
      // Slug column might not exist yet, continue to fallback strategies
      logger.debug('Slug column not available, using fallback lookup', { slug })
      slugError = error
    }

    if (!slugError && slugJudge && isJudge(slugJudge)) {
      const result: JudgeLookupResult = {
        judge: slugJudge,
        found_by: 'slug'
      }
      
      // Cache successful lookup for 30 minutes
      cache.set(cacheKey, result, 1800)
      
      await logQueryPerformance('slug_lookup', Date.now() - startTime, { slug })
      return result
    }

    // Strategy 2: Fuzzy slug matching for similar slugs (if slug column exists)
    let fuzzyMatches = null
    let fuzzyError = null
    
    try {
      const result = await supabase
        .from('judges')
        .select('*')
        .ilike('slug', `%${slug}%`)
        .limit(10)
      
      fuzzyMatches = result.data
      fuzzyError = result.error
    } catch (error) {
      // Slug column doesn't exist, skip this strategy
      fuzzyError = error
    }

    if (!fuzzyError && fuzzyMatches && isJudgeArray(fuzzyMatches) && fuzzyMatches.length > 0) {
      // Find exact substring match first
      const exactMatch = fuzzyMatches.find(judge => judge.slug === slug)
      if (exactMatch && isJudge(exactMatch)) {
        const result: JudgeLookupResult = {
          judge: exactMatch,
          found_by: 'name_exact'
        }
        
        // Cache successful lookup for 30 minutes
        cache.set(cacheKey, result, 1800)
        
        await logQueryPerformance('fuzzy_exact', Date.now() - startTime, { slug })
        return result
      }

      // Return best fuzzy match with alternatives
      const bestMatch = fuzzyMatches[0]
      const alternatives = fuzzyMatches.slice(1, 4).filter(isJudge)
      
      if (isJudge(bestMatch)) {
        const result: JudgeLookupResult = {
          judge: bestMatch,
          found_by: 'name_partial',
          alternatives
        }
        
        // Cache fuzzy match for 15 minutes (shorter since it's less certain)
        cache.set(cacheKey, result, 900)
        
        await logQueryPerformance('fuzzy_match', Date.now() - startTime, { slug, matches: fuzzyMatches.length })
        return result
      }
    }

    // Strategy 3: Name-based lookup using slug conversion (fallback)
    const primaryName = slugToName(slug)
    const nameVariationsBase = generateNameVariations(primaryName)
    // Add common title-prefixed variations for better matching
    const titleVariations = [
      `Hon. ${primaryName}`,
      `Hon ${primaryName}`,
      `Judge ${primaryName}`,
      `Justice ${primaryName}`
    ]
    const nameVariations = [...new Set([...nameVariationsBase, ...titleVariations])].slice(0, 6) // small, effective set

    for (const nameVariation of nameVariations) {
      const { data: exactJudges, error: exactError } = await supabase
        .from('judges')
        .select('*')
        .ilike('name', `%${nameVariation}%`)
        .limit(5)

      if (!exactError && exactJudges && exactJudges.length > 0) {
        // Prefer judge whose generated slug matches
        const bestMatch = exactJudges.find(judge => 
          generateSlug(judge.name) === slug
        ) || exactJudges[0]

        const alternatives = exactJudges.length > 1 
          ? exactJudges.filter(j => j.id !== bestMatch.id).slice(0, 3)
          : []

        const result: JudgeLookupResult = {
          judge: bestMatch as Judge,
          found_by: 'name_exact',
          alternatives: alternatives as Judge[]
        }
        
        // Cache name-based lookup for 30 minutes
        cache.set(cacheKey, result, 1800)

        await logQueryPerformance('name_exact', Date.now() - startTime, { slug, nameVariation })
        return result
      }
    }

    // Strategy 4: Similarity search for suggestions (limited scope)
    const { data: similarJudges, error: similarError } = await supabase
      .from('judges')
      .select('name, slug, id, court_name, jurisdiction')
      .limit(100) // Much smaller subset for performance

    let suggestions: Judge[] = []
    if (!similarError && similarJudges) {
      suggestions = findSimilarSlugs(slug, similarJudges).slice(0, 5)
    }

    await logQueryPerformance('not_found', Date.now() - startTime, { slug, suggestions: suggestions.length })
    
    return {
      judge: null,
      found_by: 'not_found',
      alternatives: suggestions
    }

  } catch (error) {
    logger.error('Error in lookupJudge', { slug }, error instanceof Error ? error : undefined)
    await logQueryPerformance('error', Date.now() - startTime, { slug, error: error instanceof Error ? error.message : 'Unknown error' })
    return {
      judge: null,
      found_by: 'not_found'
    }
  }
}

/**
 * Log query performance for monitoring
 */
async function logQueryPerformance(queryType: string, executionTime: number, params: any) {
  try {
    const supabase = await createServerClient()
    
    // Try to log to performance_metrics table instead of query_performance_log
    await supabase
      .from('performance_metrics')
      .insert({
        metric_name: `judge_lookup_${queryType}`,
        metric_value: executionTime,
        page_url: '/api/judges/by-slug',
        page_type: 'api',
        metric_id: queryType,
        rating: executionTime < 100 ? 'good' : executionTime < 500 ? 'needs-improvement' : 'poor'
      })
  } catch (error) {
    // Silent fail - don't impact user experience
    logger.debug('Query performance logging failed', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
}

/**
 * Find judges with similar slugs for suggestions (optimized)
 */
function findSimilarSlugs(targetSlug: string, judges: any[]): Judge[] {
  const suggestions: Array<{ judge: Judge; similarity: number }> = []
  const maxProcessed = Math.min(judges.length, 100) // Strict limit for performance

  // Quick pre-filter using string length similarity
  const targetLength = targetSlug.length
  const lengthThreshold = Math.floor(targetLength * 0.3) // 30% length difference max

  for (let i = 0; i < maxProcessed; i++) {
    const judge = judges[i]
    const judgeSlug = judge.slug || generateSlug(judge.name)
    
    // Skip if length difference is too large (quick filter)
    if (Math.abs(judgeSlug.length - targetLength) > lengthThreshold) {
      continue
    }
    
    const similarity = calculateStringSimilarity(targetSlug, judgeSlug)
    
    if (similarity > 0.6) { // Higher threshold for better suggestions
      suggestions.push({ judge: judge as Judge, similarity })
    }
  }

  return suggestions
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5)
    .map(s => s.judge)
}

/**
 * Calculate string similarity using Levenshtein distance
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  const maxLength = Math.max(str1.length, str2.length)
  if (maxLength === 0) return 1.0

  const distance = levenshteinDistance(str1, str2)
  return (maxLength - distance) / maxLength
}

/**
 * Calculate Levenshtein distance between two strings
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
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        )
      }
    }
  }

  return matrix[str2.length][str1.length]
}