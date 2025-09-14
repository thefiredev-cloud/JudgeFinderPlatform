import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { auth } from '@clerk/nextjs/server'
import type { Judge, SearchResult } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Get auth info
    const { userId } = await auth()

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '20')
    const page = parseInt(searchParams.get('page') || '1')
    const jurisdiction = searchParams.get('jurisdiction')
    const courtType = searchParams.get('court_type')

    if (limit > 500) {
      return NextResponse.json(
        { error: 'Limit cannot exceed 500' },
        { status: 400 }
      )
    }

    const supabase = await createServerClient()
    const offset = (page - 1) * limit

    // Build the query - if no query, show popular judges
    let queryBuilder = supabase
      .from('judges')
      .select('id, name, court_id, court_name, jurisdiction, profile_image_url, total_cases, appointed_date, slug, created_at', { count: 'exact' })
    
    if (query.trim()) {
      // Search by name if query provided
      queryBuilder = queryBuilder.ilike('name', `%${query}%`)
        .order('name')
    } else {
      // Show judges with most cases if no query
      queryBuilder = queryBuilder
        .order('total_cases', { ascending: false, nullsFirst: false })
    }
    
    queryBuilder = queryBuilder.range(offset, offset + limit - 1)

    // Add optional filters
    if (jurisdiction) {
      queryBuilder = queryBuilder.eq('jurisdiction', jurisdiction)
    }

    if (courtType) {
      queryBuilder = queryBuilder.eq('court_type', courtType)
    }

    const { data: judges, error, count } = await queryBuilder

    if (error) {
      console.error('Supabase error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
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

    // Set cache headers
    const response = NextResponse.json(result)
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60')
    
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
    // Get auth info for advanced search
    const { userId } = await auth()

    const body = await request.json()
    const { query, filters = {} } = body

    const supabase = await createServerClient()
    
    // If no query, return popular judges
    if (!query?.trim()) {
      const { data: judges, error } = await supabase
        .from('judges')
        .select('*')
        .order('total_cases', { ascending: false, nullsFirst: false })
        .limit(filters.limit || 20)
        .range(
          ((filters.page || 1) - 1) * (filters.limit || 20),
          (filters.page || 1) * (filters.limit || 20) - 1
        )
      
      if (error) {
        console.error('Database error:', error)
        return NextResponse.json(
          { error: 'Failed to fetch judges' },
          { status: 500 }
        )
      }
      
      return NextResponse.json({
        judges: judges || [],
        total_count: judges?.length || 0,
        page: filters.page || 1,
        per_page: filters.limit || 20,
        has_more: (judges?.length || 0) === (filters.limit || 20)
      })
    }
    
    // Use the PostgreSQL full-text search function for queries
    const { data: judges, error } = await supabase
      .rpc('search_judges', {
        search_query: query,
        limit_count: filters.limit || 20,
        offset_count: ((filters.page || 1) - 1) * (filters.limit || 20)
      })

    if (error) {
      console.error('Search function error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
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

    return response

  } catch (error) {
    console.error('POST search error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}