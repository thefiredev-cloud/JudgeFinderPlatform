import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 300 // Cache for 5 minutes

export async function GET(request: Request) {
  try {
    const { buildRateLimiter, getClientIp } = await import('@/lib/security/rate-limit')
    const rl = buildRateLimiter({ tokens: 120, window: '1 m', prefix: 'api:stats:platform' })
    const { success, remaining } = await rl.limit(`${getClientIp(request as any)}:global`)
    if (!success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }
    const supabase = await createServerClient()

    // Get saved preference count to approximate engaged users
    const { count: userCount, error: userError } = await supabase
      .from('user_preferences')
      .select('*', { count: 'exact', head: true })

    if (userError) {
      console.error('Error fetching user count:', userError)
    }

    // Get oldest case date to determine years of historical data
    const { data: oldestCase, error: caseError } = await supabase
      .from('cases')
      .select('date_filed')
      .not('date_filed', 'is', null)
      .order('date_filed', { ascending: true })
      .limit(1)

    if (caseError) {
      console.error('Error fetching oldest case:', caseError)
    }

    // Calculate years of historical data
    let yearsOfData: number | null = null
    if (oldestCase && oldestCase[0]?.date_filed) {
      const oldestDate = new Date(oldestCase[0].date_filed)
      const currentDate = new Date()
      yearsOfData = Math.floor((currentDate.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24 * 365))
      yearsOfData = Math.max(1, Math.min(yearsOfData, 10)) // Cap between 1-10 years
    }

    // Treat preference count as a proxy for total users but do not infer traffic
    const totalUsers = typeof userCount === 'number' ? userCount : null

    // Security metric (explicitly zero if no incidents recorded)
    const dataBreaches = 0

    const stats = {
      monthlySearches: 'Coming Soon',
      monthlySearchesRaw: null,
      yearsOfData,
      yearsOfDataDisplay: yearsOfData ? `${yearsOfData} ${yearsOfData === 1 ? 'Year' : 'Years'} Historical Data` : '—',
      availability: 'Monitoring',
      availabilityPercentage: null,
      uptimeDays: null,
      dataBreaches,
      securityDisplay: 'Zero Data Breaches',
      activeUsers: null,
      totalUsers,
      platformAge: null,
      timestamp: new Date().toISOString()
    }

    return NextResponse.json({ ...stats, rate_limit_remaining: remaining }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60'
      }
    })

  } catch (error) {
    console.error('Platform stats error:', error)
    
    // Return fallback data
    return NextResponse.json({
      monthlySearches: 'Coming Soon',
      monthlySearchesRaw: null,
      yearsOfData: null,
      yearsOfDataDisplay: '—',
      availability: 'Monitoring',
      availabilityPercentage: null,
      uptimeDays: null,
      dataBreaches: 0,
      securityDisplay: 'Zero Data Breaches',
      activeUsers: null,
      totalUsers: null,
      platformAge: null,
      error: 'Using fallback data',
      timestamp: new Date().toISOString()
    })
  }
}
