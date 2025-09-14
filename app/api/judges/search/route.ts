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

    // Transform judges to search results format
    const results = (judges || []).map((judge: any) => ({
      id: judge.id,
      type: 'judge' as const,
      title: judge.name,
      subtitle: judge.court_name || '',
      description: `${judge.jurisdiction || 'California'} • ${judge.total_cases || 0} cases`,
      url: `/judges/${judge.slug || judge.id}`
    }))

    const result = {
      results,
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
    
    // Build query for search
    let queryBuilder = supabase
      .from('judges')
      .select('id, name, court_id, court_name, jurisdiction, profile_image_url, total_cases, appointed_date, slug, created_at', { count: 'exact' })

    if (query?.trim()) {
      // Search by name if query provided
      queryBuilder = queryBuilder.ilike('name', `%${query}%`)
        .order('name')
    } else {
      // Show judges with most cases if no query
      queryBuilder = queryBuilder
        .order('total_cases', { ascending: false, nullsFirst: false })
    }

    // Apply filters
    if (filters.jurisdiction) {
      queryBuilder = queryBuilder.eq('jurisdiction', filters.jurisdiction)
    }
    if (filters.court_type) {
      queryBuilder = queryBuilder.eq('court_type', filters.court_type)
    }

    // Apply pagination
    const limit = filters.limit || 20
    const page = filters.page || 1
    const offset = (page - 1) * limit
    queryBuilder = queryBuilder.range(offset, offset + limit - 1)

    const { data: judges, error, count } = await queryBuilder

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

    // Transform judges to search results format
    const results = (judges || []).map((judge: any) => ({
      id: judge.id,
      type: 'judge' as const,
      title: judge.name,
      subtitle: judge.court_name || '',
      description: `${judge.jurisdiction || 'California'} • ${judge.total_cases || 0} cases`,
      url: `/judges/${judge.slug || judge.id}`
    }))

    const totalCount = count || 0
    const hasMore = offset + limit < totalCount

    const response = NextResponse.json({
      results,
      total_count: totalCount,
      page,
      per_page: limit,
      has_more: hasMore
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