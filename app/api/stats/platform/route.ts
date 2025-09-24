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

    const monthAgoIso = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const [{ count: userCount, error: userError }, { data: monthActivity, error: activityError }, { data: oldestCase, error: caseError }] = await Promise.all([
      supabase
        .from('user_preferences')
        .select('*', { count: 'exact', head: true }),
      supabase
        .from('user_activity')
        .select('id, created_at, activity_type')
        .gte('created_at', monthAgoIso),
      supabase
        .from('cases')
        .select('date_filed')
        .not('date_filed', 'is', null)
        .order('date_filed', { ascending: true })
        .limit(1)
    ])

    if (userError) console.error('Error fetching user count:', userError)
    if (activityError) console.error('Error fetching monthly activity:', activityError)
    if (caseError) console.error('Error fetching oldest case:', caseError)

    const totalUsers = typeof userCount === 'number' ? userCount : null

    const searchesLast30 = (monthActivity || []).filter(item => item.activity_type === 'search').length
    const monthlySearches = searchesLast30 > 0 ? searchesLast30.toLocaleString() : '—'

    let yearsOfData: number | null = null
    if (oldestCase && oldestCase[0]?.date_filed) {
      const oldestDate = new Date(oldestCase[0].date_filed)
      const currentDate = new Date()
      const diffYears = Math.floor((currentDate.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24 * 365))
      yearsOfData = Math.max(1, Math.min(diffYears, 10))
    }

    const stats = {
      monthlySearches,
      monthlySearchesRaw: searchesLast30 > 0 ? searchesLast30 : null,
      yearsOfData,
      yearsOfDataDisplay: yearsOfData ? `${yearsOfData} ${yearsOfData === 1 ? 'Year' : 'Years'} Historical Data` : '—',
      availability: 'Monitoring',
      availabilityPercentage: null,
      uptimeDays: null,
      dataBreaches: 0,
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

    return NextResponse.json({
      monthlySearches: '—',
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
    }, { status: 500 })
  }
}
