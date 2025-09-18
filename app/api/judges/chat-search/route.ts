import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { buildRateLimiter, getClientIp } = await import('@/lib/security/rate-limit')
    const rl = buildRateLimiter({ tokens: 20, window: '1 m', prefix: 'api:judges:chat-search' })
    const { success, remaining } = await rl.limit(`${getClientIp(request)}:global`)
    if (!success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }
    const { searchParams } = new URL(request.url)
    const name = searchParams.get('name')
    const jurisdiction = searchParams.get('jurisdiction')
    
    if (!name) {
      return NextResponse.json(
        { error: 'Name parameter is required' },
        { status: 400 }
      )
    }

    const supabase = await createServerClient()
    
    // Clean the search name
    const cleanName = name
      .replace(/^(judge|justice|the honorable)\s+/i, '')
      .trim()
    
    // Build the query
    let query = supabase
      .from('judges')
      .select('id, name, slug, court_name, jurisdiction, appointed_date, case_count:cases(count)')
    
    // Try exact match first
    const { data: exactMatch } = await query
      .ilike('name', `%${cleanName}%`)
      .limit(1)
      .single()
    
    if (exactMatch) {
      // Return single judge with limited data for free users
      return NextResponse.json({
        judge: {
          id: exactMatch.id,
          name: exactMatch.name,
          slug: exactMatch.slug,
          court_name: exactMatch.court_name,
          jurisdiction: exactMatch.jurisdiction || 'California',
          appointed_date: exactMatch.appointed_date,
          case_count: exactMatch.case_count?.[0]?.count || 0,
          // Limited bias score preview for free users
          bias_score: 4.2 // This would normally come from analytics
        },
        rate_limit_remaining: remaining
      })
    }
    
    // If no exact match, try fuzzy search
    const searchTerms = cleanName.split(' ').filter(term => term.length > 2)
    
    let fuzzyQuery = supabase
      .from('judges')
      .select('id, name, slug, court_name, jurisdiction, appointed_date')
    
    // Add search conditions
    if (searchTerms.length > 0) {
      const searchConditions = searchTerms.map(term => `name.ilike.%${term}%`).join(',')
      fuzzyQuery = fuzzyQuery.or(searchConditions)
    }
    
    // Add jurisdiction filter if provided
    if (jurisdiction) {
      fuzzyQuery = fuzzyQuery.eq('jurisdiction', jurisdiction)
    }
    
    const { data: judges, error } = await fuzzyQuery.limit(5)
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to search judges' },
        { status: 500 }
      )
    }
    
    if (!judges || judges.length === 0) {
      // Return helpful message if no judges found
      return NextResponse.json({
        message: 'No judges found matching your search',
        suggestions: [
          'Try searching with just the last name',
          'Check the spelling of the judge\'s name',
          'Browse our full directory of 1,810 California judges'
        ]
      })
    }
    
    // Return multiple judges with limited data
    return NextResponse.json({
      judges: judges.map(judge => ({
        id: judge.id,
        name: judge.name,
        slug: judge.slug,
        court_name: judge.court_name,
        jurisdiction: judge.jurisdiction || 'California',
        appointed_date: judge.appointed_date,
        // Limited data for free users
        bias_score: Math.floor(Math.random() * 2) + 3 // Placeholder score 3-5
      })),
      total: judges.length,
      rate_limit_remaining: remaining
    })
    
  } catch (error) {
    console.error('Chat search error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}