import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 300 // Cache for 5 minutes

export async function GET(request: Request) {
  try {
    const { buildRateLimiter, getClientIp } = await import('@/lib/security/rate-limit')
    const rl = buildRateLimiter({ tokens: 120, window: '1 m', prefix: 'api:stats:judges' })
    const { success, remaining } = await rl.limit(`${getClientIp(request as any)}:global`)
    if (!success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }
    const supabase = await createServerClient()

    // Get total judges count
    const { count: totalJudges, error: totalError } = await supabase
      .from('judges')
      .select('*', { count: 'exact', head: true })
      .eq('jurisdiction', 'CA')

    if (totalError) {
      console.error('Error fetching total judges:', totalError)
    }

    // Get judges with bias analytics
    const { count: judgesWithAnalytics, error: analyticsError } = await supabase
      .from('judge_analytics')
      .select('*', { count: 'exact', head: true })
      .not('bias_score', 'is', null)

    if (analyticsError) {
      console.error('Error fetching analytics count:', analyticsError)
    }

    // Calculate analytics coverage percentage
    const analyticsCoverage = totalJudges && judgesWithAnalytics
      ? Math.round((judgesWithAnalytics / totalJudges) * 100)
      : null

    // Get appointment dates to calculate average experience
    const { data: appointmentData, error: appointmentError } = await supabase
      .from('judges')
      .select('appointed_date')
      .eq('jurisdiction', 'CA')
      .not('appointed_date', 'is', null)
      .limit(500) // Sample for performance

    if (appointmentError) {
      console.error('Error fetching appointment dates:', appointmentError)
    }

    // Calculate average years of experience
    let avgExperience: number | null = null
    if (appointmentData && appointmentData.length > 0) {
      const currentYear = new Date().getFullYear()
      const experiences = appointmentData.map(judge => {
        const appointmentYear = new Date(judge.appointed_date).getFullYear()
        return currentYear - appointmentYear
      }).filter(years => years > 0 && years < 50) // Filter outliers

      if (experiences.length > 0) {
        avgExperience = Math.round(
          experiences.reduce((sum, years) => sum + years, 0) / experiences.length
        )
      }
    }

    // Get recent sync information from latest updated_at value
    const { data: lastUpdated, error: lastUpdatedError } = await supabase
      .from('judges')
      .select('updated_at')
      .eq('jurisdiction', 'CA')
      .not('updated_at', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(1)

    if (lastUpdatedError) {
      console.error('Error fetching last updated timestamp:', lastUpdatedError)
    }

    const lastUpdateIso = lastUpdated && lastUpdated[0]?.updated_at ? new Date(lastUpdated[0].updated_at).toISOString() : null
    let daysSinceUpdate: number | null = null
    let updateFrequency: string | null = null

    if (lastUpdateIso) {
      const lastUpdateDate = new Date(lastUpdateIso)
      const diffMs = Date.now() - lastUpdateDate.getTime()
      daysSinceUpdate = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
      if (daysSinceUpdate <= 7) updateFrequency = 'Updated Weekly'
      else if (daysSinceUpdate <= 31) updateFrequency = 'Updated Monthly'
      else updateFrequency = 'Updated Quarterly'
    }

    const stats = {
      totalJudges: typeof totalJudges === 'number' ? totalJudges : null,
      judgesWithAnalytics: typeof judgesWithAnalytics === 'number' ? judgesWithAnalytics : null,
      analyticsCoverage: analyticsCoverage !== null ? `${analyticsCoverage}%` : '—',
      avgExperience,
      avgExperienceDisplay: typeof avgExperience === 'number' ? `${avgExperience} Years Experience` : '—',
      updateFrequency: updateFrequency || 'Not yet tracked',
      lastUpdate: lastUpdateIso,
      daysSinceUpdate,
      timestamp: new Date().toISOString()
    }

    return NextResponse.json({ ...stats, rate_limit_remaining: remaining }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60'
      }
    })

  } catch (error) {
    console.error('Judges stats error:', error)
    
    // Return fallback data
    return NextResponse.json({
      totalJudges: null,
      judgesWithAnalytics: null,
      analyticsCoverage: '—',
      avgExperience: null,
      avgExperienceDisplay: '—',
      updateFrequency: 'Unavailable',
      lastUpdate: null,
      daysSinceUpdate: null,
      error: 'Unable to load judge stats',
      timestamp: new Date().toISOString()
    })
  }
}
