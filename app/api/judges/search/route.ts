import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { checkRateLimit, getRateLimitIdentifier } from '@/lib/rate-limit'
import { auth } from '@clerk/nextjs/server'
import type { Judge, SearchResult } from '@/types'

export async function GET(request: NextRequest) {
  try {
    // Check rate limit
    const { userId } = await auth()
    const identifier = getRateLimitIdentifier(request, userId || undefined)
    const rateLimitResult = await checkRateLimit(identifier, 'search')

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `Too many search requests. Limit: ${rateLimitResult.limit} per window. Try again after ${new Date(rateLimitResult.reset).toLocaleTimeString()}.`,
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
        },
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
          },
        }
      )
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '20')
    const page = parseInt(searchParams.get('page') || '1')
    const jurisdiction = searchParams.get('jurisdiction')
    const courtType = searchParams.get('court_type')

    if (!query.trim()) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      )
    }

    if (limit > 100) {
      return NextResponse.json(
        { error: 'Limit cannot exceed 100' },
        { status: 400 }
      )
    }

    const supabase = await createServerClient()
    const offset = (page - 1) * limit

    // Build the query
    let queryBuilder = supabase
      .from('judges')
      .select('id, name, court_id, court_name, jurisdiction, profile_image_url, total_cases, appointed_date, slug, created_at', { count: 'exact' })
      .ilike('name', `%${query}%`)
      .order('name')
      .range(offset, offset + limit - 1)

    // Add optional filters
    if (jurisdiction) {
      queryBuilder = queryBuilder.eq('jurisdiction', jurisdiction)
    }

    if (courtType) {
      queryBuilder = queryBuilder.eq('court_type', courtType)
    }

    const { data: judges, error, count } = await queryBuilder

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to search judges' },
        { status: 500 }
      )
    }

    const totalCount = count || 0
    const hasMore = offset + limit < totalCount

    const result: SearchResult = {
      judges: judges as Judge[],
      total_count: totalCount,
      page,
      per_page: limit,
      has_more: hasMore
    }

    // Set cache headers and rate limit headers
    const response = NextResponse.json(result)
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60')
    
    // Add rate limit headers
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
    
    return response

  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check rate limit for advanced search
    const { userId } = await auth()
    const identifier = getRateLimitIdentifier(request, userId || undefined)
    const rateLimitResult = await checkRateLimit(identifier, 'advancedSearch')

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `Too many advanced search requests. Limit: ${rateLimitResult.limit} per window. Try again after ${new Date(rateLimitResult.reset).toLocaleTimeString()}.`,
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
        },
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
          },
        }
      )
    }

    const body = await request.json()
    const { query, filters = {} } = body

    if (!query?.trim()) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      )
    }

    const supabase = await createServerClient()
    
    // Use the PostgreSQL full-text search function
    const { data: judges, error } = await supabase
      .rpc('search_judges', {
        search_query: query,
        limit_count: filters.limit || 20,
        offset_count: ((filters.page || 1) - 1) * (filters.limit || 20)
      })

    if (error) {
      console.error('Search function error:', error)
      return NextResponse.json(
        { error: 'Failed to search judges' },
        { status: 500 }
      )
    }

    const response = NextResponse.json({
      judges: judges || [],
      total_count: judges?.length || 0,
      page: filters.page || 1,
      per_page: filters.limit || 20,
      has_more: (judges?.length || 0) === (filters.limit || 20)
    })

    // Add rate limit headers
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response

  } catch (error) {
    console.error('POST search error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}