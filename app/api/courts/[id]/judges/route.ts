import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import { validateParams, validateSearchParams, courtJudgesSearchParamsSchema } from '@/lib/utils/validation'
import { z } from 'zod'
import type { Judge } from '@/types'

export const dynamic = 'force-dynamic'

// Validation schemas
const courtIdParamsSchema = z.object({
  id: z.string().uuid('Invalid court ID format')
})

interface JudgeWithPosition extends Judge {
  position_type: string
  status: string
}

interface CourtJudgesResponse {
  judges: JudgeWithPosition[]
  total_count: number
  page: number
  per_page: number
  has_more: boolean
  court_info: {
    id: string
    name: string
    jurisdiction: string
  } | null
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  
  try {
    const resolvedParams = await params
    // Validate court ID parameter
    const paramsValidation = validateParams(courtIdParamsSchema, resolvedParams, 'courts/[id]/judges')
    if (!paramsValidation.success) {
      return paramsValidation.response
    }

    const { id: courtId } = paramsValidation.data
    const { searchParams } = new URL(request.url)
    
    // Validate query parameters
    const queryValidation = validateSearchParams(courtJudgesSearchParamsSchema, searchParams, 'courts/[id]/judges')
    if (!queryValidation.success) {
      return queryValidation.response
    }

    const { limit = 20, page = 1, status, position_type } = queryValidation.data

    logger.apiRequest('GET', `/api/courts/${courtId}/judges`, {
      limit,
      page,
      status,
      position_type
    })

    const supabase = await createServerClient()
    const from = (page - 1) * limit
    const to = from + limit - 1

    // First, verify the court exists and get court info
    const { data: courtData, error: courtError } = await supabase
      .from('courts')
      .select('id, name, jurisdiction')
      .eq('id', courtId)
      .single()

    if (courtError || !courtData) {
      logger.warn('Court not found', { courtId, error: courtError?.message })
      return NextResponse.json(
        { 
          error: 'Court not found',
          code: 'COURT_NOT_FOUND'
        }, 
        { status: 404 }
      )
    }

    // Build judges query
    let queryBuilder = supabase
      .from('judges')
      .select('*', { count: 'exact' })
      .eq('court_id', courtId)
      .order('name')
      .range(from, to)

    // Apply status filter if not 'all'
    if (status && status !== 'all') {
      // Since we don't have a status field in judges table yet, we'll infer status
      // For now, we'll treat all judges as 'active' unless they have specific indicators
      if (status === 'retired') {
        // Filter for judges that might be retired (this is a placeholder - adjust based on your data)
        queryBuilder = queryBuilder.or('name.ilike.%retired%,name.ilike.%emeritus%')
      } else if (status === 'inactive') {
        // This would need actual status tracking in the database
        // For now, return empty results for inactive status
        queryBuilder = queryBuilder.eq('id', '00000000-0000-0000-0000-000000000000') // Non-existent ID
      }
      // 'active' status doesn't need additional filtering for now
    }

    // Apply position type filter if provided
    if (position_type) {
      // Since we don't have position_type in judges table, we'll use name matching
      // This is a temporary solution until proper position tracking is implemented
      queryBuilder = queryBuilder.ilike('name', `%${position_type}%`)
    }

    // Execute the query
    const { data: judgesData, error: judgesError, count } = await queryBuilder

    if (judgesError) {
      logger.error('Supabase error fetching court judges', { 
        courtId,
        error: judgesError.message 
      })
      
      return NextResponse.json(
        { error: 'Failed to fetch judges for court' }, 
        { status: 500 }
      )
    }

    const judges = (judgesData || []) as Judge[]

    // Transform judges to include position information
    const judgesWithPosition: JudgeWithPosition[] = judges.map(judge => ({
      ...judge,
      position_type: inferPositionType(judge.name),
      status: inferStatus(judge)
    }))

    const totalCount = count || 0
    const hasMore = from + (judges.length || 0) < totalCount

    const result: CourtJudgesResponse = {
      judges: judgesWithPosition,
      total_count: totalCount,
      page: page as number,
      per_page: limit as number,
      has_more: hasMore,
      court_info: {
        id: courtData.id,
        name: courtData.name,
        jurisdiction: courtData.jurisdiction
      }
    }

    // Set cache headers for performance
    const response = NextResponse.json(result)
    
    // Cache for 30 minutes with stale-while-revalidate
    response.headers.set('Cache-Control', 'public, s-maxage=1800, max-age=900, stale-while-revalidate=900')
    response.headers.set('CDN-Cache-Control', 'public, s-maxage=3600')
    response.headers.set('Vary', 'Accept-Encoding')
    
    const duration = Date.now() - startTime
    logger.apiResponse('GET', `/api/courts/${courtId}/judges`, 200, duration, {
      resultsCount: judges.length,
      totalCount,
      courtName: courtData.name
    })
    
    return response

  } catch (error) {
    const duration = Date.now() - startTime
    logger.error('API error in courts/[id]/judges', { 
      courtId: (await params).id,
      duration 
    }, error instanceof Error ? error : undefined)
    
    logger.apiResponse('GET', `/api/courts/${(await params).id}/judges`, 500, duration)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Infer position type from judge name or other available data
 * This is a temporary solution until proper position tracking is implemented
 */
function inferPositionType(judgeName: string): string {
  const name = judgeName.toLowerCase()
  
  if (name.includes('chief')) {
    return 'Chief Judge'
  } else if (name.includes('presiding')) {
    return 'Presiding Judge'
  } else if (name.includes('commissioner')) {
    return 'Commissioner'
  } else if (name.includes('magistrate')) {
    return 'Magistrate Judge'
  } else if (name.includes('retired') || name.includes('emeritus')) {
    return 'Retired Judge'
  } else if (name.includes('acting')) {
    return 'Acting Judge'
  } else if (name.includes('temporary')) {
    return 'Temporary Judge'
  } else {
    return 'Judge'
  }
}

/**
 * Infer status from judge data
 * This is a temporary solution until proper status tracking is implemented
 */
function inferStatus(judge: Judge): string {
  const name = judge.name.toLowerCase()
  
  if (name.includes('retired') || name.includes('emeritus')) {
    return 'retired'
  } else if (name.includes('inactive')) {
    return 'inactive'
  } else {
    return 'active'
  }
}