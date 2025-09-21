import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 300

export async function GET(request: Request) {
  try {
    const { buildRateLimiter, getClientIp } = await import('@/lib/security/rate-limit')
    const rl = buildRateLimiter({ tokens: 120, window: '1 m', prefix: 'api:stats:cases' })
    const { success, remaining } = await rl.limit(`${getClientIp(request as any)}:global`)
    if (!success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }
    const supabase = await createServerClient()

    const { count: totalCases, error } = await supabase
      .from('cases')
      .select('*', { count: 'exact', head: true })
      .eq('jurisdiction', 'CA')

    if (error) {
      console.error('Error fetching total cases:', error)
    }

    // Use decision documents table to infer freshness if present
    const { data: latestDecision, error: latestErr } = await supabase
      .from('decisions')
      .select('date_filed')
      .not('date_filed', 'is', null)
      .order('date_filed', { ascending: false })
      .limit(1)

    if (latestErr) {
      console.error('Error fetching latest decision date:', latestErr)
    }

    const lastUpdate = latestDecision?.[0]?.date_filed || new Date().toISOString()

    return NextResponse.json({
      totalCases: typeof totalCases === 'number' ? totalCases : null,
      lastUpdate,
      rate_limit_remaining: remaining
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60'
      }
    })
  } catch (e) {
    console.error('Cases stats error:', e)
    return NextResponse.json({ totalCases: null, lastUpdate: new Date().toISOString(), error: 'Unable to load case stats' })
  }
}

