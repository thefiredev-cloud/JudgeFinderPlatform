import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const judgeId = searchParams.get('judgeId')
    const court = searchParams.get('court')
    const jurisdiction = searchParams.get('jurisdiction')
    const limit = parseInt(searchParams.get('limit') || '6')

    if (!judgeId) {
      return NextResponse.json({ error: 'Judge ID required' }, { status: 400 })
    }

    const supabase = await createServerClient()

    // Get related judges based on priority:
    // 1. Same court
    // 2. Same jurisdiction
    // 3. Similar appointed dates
    
    let relatedJudges = []

    // First, try to get judges from the same court
    if (court) {
      const { data: sameCourtJudges, error } = await supabase
        .from('judges')
        .select('id, name, slug, court_name, jurisdiction, appointed_date')
        .eq('court_name', court)
        .neq('id', judgeId)
        .limit(Math.min(limit, 4))

      if (!error && sameCourtJudges) {
        relatedJudges.push(...sameCourtJudges)
      }
    }

    // If we don't have enough, get judges from same jurisdiction
    if (relatedJudges.length < limit && jurisdiction) {
      const remainingLimit = limit - relatedJudges.length
      const existingIds = relatedJudges.map(j => j.id)

      const { data: sameJurisdictionJudges, error } = await supabase
        .from('judges')
        .select('id, name, slug, court_name, jurisdiction, appointed_date')
        .eq('jurisdiction', jurisdiction)
        .not('id', 'in', `(${[judgeId, ...existingIds].join(',')})`)
        .limit(remainingLimit)

      if (!error && sameJurisdictionJudges) {
        relatedJudges.push(...sameJurisdictionJudges)
      }
    }

    // If still not enough, get any judges (shouldn't happen with 1,810 judges)
    if (relatedJudges.length < limit) {
      const remainingLimit = limit - relatedJudges.length
      const existingIds = relatedJudges.map(j => j.id)

      const { data: anyJudges, error } = await supabase
        .from('judges')
        .select('id, name, slug, court_name, jurisdiction, appointed_date')
        .not('id', 'in', `(${[judgeId, ...existingIds].join(',')})`)
        .limit(remainingLimit)

      if (!error && anyJudges) {
        relatedJudges.push(...anyJudges)
      }
    }

    // Sort by relevance (same court first, then by appointment date)
    relatedJudges.sort((a, b) => {
      // Same court judges first
      if (court) {
        const aIssameCourt = a.court_name === court
        const bIsSameCourt = b.court_name === court
        
        if (aIssameCourt && !bIsSameCourt) return -1
        if (!aIssameCourt && bIsSameCourt) return 1
      }
      
      // Then by appointment date (more recent first)
      if (a.appointed_date && b.appointed_date) {
        return new Date(b.appointed_date).getTime() - new Date(a.appointed_date).getTime()
      }
      
      // Finally alphabetical by name
      return a.name.localeCompare(b.name)
    })

    return NextResponse.json({
      judges: relatedJudges.slice(0, limit),
      total: relatedJudges.length,
      court,
      jurisdiction
    })

  } catch (error) {
    console.error('Related judges API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}