import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 300 // Cache for 5 minutes

export async function GET(request: Request) {
  try {
    const { buildRateLimiter, getClientIp } = await import('@/lib/security/rate-limit')
    const rl = buildRateLimiter({ tokens: 120, window: '1 m', prefix: 'api:stats:courts' })
    const { success, remaining } = await rl.limit(`${getClientIp(request as any)}:global`)
    if (!success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }
    const supabase = await createServerClient()

    // Get total courts count
    const { count: totalCourts, error: totalError } = await supabase
      .from('courts')
      .select('*', { count: 'exact', head: true })
      .eq('jurisdiction', 'CA')

    if (totalError) {
      console.error('Error fetching total courts:', totalError)
    }

    // Get court type breakdown
    const { data: courtTypes, error: typesError } = await supabase
      .from('courts')
      .select('type')
      .eq('jurisdiction', 'CA')

    if (typesError) {
      console.error('Error fetching court types:', typesError)
    }

    // Calculate court type counts
    const typeBreakdown = courtTypes?.reduce((acc: Record<string, number>, court) => {
      const type = court.type || 'Other'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {}) || {}

    // Get counties covered (unique jurisdictions)
    // Get average judges per court
    const { data: judgeData, error: judgeError } = await supabase
      .from('courts')
      .select('judge_count')
      .eq('jurisdiction', 'CA')
      .not('judge_count', 'is', null)

    if (judgeError) {
      console.error('Error fetching judge counts:', judgeError)
    }

    const totalJudgeCount = judgeData?.reduce((sum, court) => sum + (court.judge_count || 0), 0) || 0
    const courtsWithJudges = judgeData?.filter(court => typeof court.judge_count === 'number' && court.judge_count > 0).length || 0
    const avgJudgesPerCourt = courtsWithJudges > 0 ? Math.round(totalJudgeCount / courtsWithJudges) : null

    // Format court types for display
    const mainCourtTypes = {
      state: (typeBreakdown['state'] || 0) + (typeBreakdown['State'] || 0),
      local: (typeBreakdown['local'] || 0) + (typeBreakdown['Local'] || 0) + (typeBreakdown['municipal'] || 0) + (typeBreakdown['Municipal'] || 0),
      federal: (typeBreakdown['federal'] || 0) + (typeBreakdown['Federal'] || 0),
      other: Object.entries(typeBreakdown)
        .filter(([key]) => !['state', 'State', 'local', 'Local', 'municipal', 'Municipal', 'federal', 'Federal'].includes(key))
        .reduce((sum, [, count]) => sum + count, 0)
    }

    const stats = {
      totalCourts: typeof totalCourts === 'number' ? totalCourts : null,
      courtTypes: mainCourtTypes,
      courtTypeDisplay: `${mainCourtTypes.state} State / ${mainCourtTypes.local} Local / ${mainCourtTypes.federal} Federal`,
      countiesCovered: null,
      countiesDisplay: 'County coverage in progress',
      avgJudgesPerCourt: avgJudgesPerCourt,
      timestamp: new Date().toISOString()
    }

    return NextResponse.json({ ...stats, rate_limit_remaining: remaining }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60'
      }
    })

  } catch (error) {
    console.error('Courts stats error:', error)
    
    // Return fallback data
    return NextResponse.json({
      totalCourts: null,
      courtTypes: {
        state: 0,
        local: 0,
        federal: 0,
        other: 0
      },
      courtTypeDisplay: 'Data unavailable',
      countiesCovered: null,
      countiesDisplay: 'County coverage unavailable',
      avgJudgesPerCourt: null,
      error: 'Unable to load court stats',
      timestamp: new Date().toISOString()
    })
  }
}
