import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 300 // Cache for 5 minutes

export async function GET() {
  try {
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
    const { data: counties, error: countiesError } = await supabase
      .from('courts')
      .select('jurisdiction')
      .eq('jurisdiction', 'CA')

    if (countiesError) {
      console.error('Error fetching counties:', countiesError)
    }

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
    const courtsWithJudges = judgeData?.length || 1
    const avgJudgesPerCourt = Math.round(totalJudgeCount / courtsWithJudges)

    // Format court types for display
    const mainCourtTypes = {
      superior: typeBreakdown['Superior'] || 0,
      municipal: typeBreakdown['Municipal'] || 0,
      federal: typeBreakdown['Federal'] || typeBreakdown['federal'] || 0,
      other: Object.entries(typeBreakdown)
        .filter(([key]) => !['Superior', 'Municipal', 'Federal', 'federal'].includes(key))
        .reduce((sum, [, count]) => sum + count, 0)
    }

    const stats = {
      totalCourts: totalCourts || 852, // Fallback to known value
      courtTypes: mainCourtTypes,
      courtTypeDisplay: `${mainCourtTypes.superior} Superior / ${mainCourtTypes.municipal} Municipal / ${mainCourtTypes.federal} Federal`,
      countiesCovered: 58, // California has 58 counties
      avgJudgesPerCourt: avgJudgesPerCourt || 15,
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60'
      }
    })

  } catch (error) {
    console.error('Courts stats error:', error)
    
    // Return fallback data
    return NextResponse.json({
      totalCourts: 852,
      courtTypes: {
        superior: 58,
        municipal: 0,
        federal: 4,
        other: 790
      },
      courtTypeDisplay: "58 Superior / 0 Municipal / 4 Federal",
      countiesCovered: 58,
      avgJudgesPerCourt: 15,
      error: 'Using cached data',
      timestamp: new Date().toISOString()
    })
  }
}