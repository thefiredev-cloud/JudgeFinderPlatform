import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1)
    const type = searchParams.get('type') || undefined
    const jurisdiction = searchParams.get('jurisdiction') || undefined

    const supabase = await createServerClient()
    const from = (page - 1) * limit
    const to = from + limit - 1

    let queryBuilder = supabase
      .from('courts')
      .select('id, name, type, jurisdiction, address, phone, website, judge_count', { count: 'exact' })
      .order('name')
      .range(from, to)

    // Apply filters
    if (q.trim()) {
      queryBuilder = queryBuilder.ilike('name', `%${q}%`)
    }
    
    if (type && type !== '') {
      queryBuilder = queryBuilder.eq('type', type)
    }

    if (jurisdiction && jurisdiction !== '') {
      queryBuilder = queryBuilder.eq('jurisdiction', jurisdiction)
    }

    const { data, error, count } = await queryBuilder

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to list courts' }, 
        { status: 500 }
      )
    }

    const totalCount = count || 0
    const hasMore = from + (data?.length || 0) < totalCount

    const result = {
      courts: data || [],
      total_count: totalCount,
      page,
      per_page: limit,
      has_more: hasMore,
    }

    // Set cache headers for better performance
    const response = NextResponse.json(result)
    response.headers.set(
      'Cache-Control', 
      'public, s-maxage=300, stale-while-revalidate=60'
    )
    
    return response

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
