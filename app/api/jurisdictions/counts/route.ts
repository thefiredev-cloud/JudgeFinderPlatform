import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { buildRateLimiter, getClientIp } = await import('@/lib/security/rate-limit')
    const rl = buildRateLimiter({ tokens: 60, window: '1 m', prefix: 'api:jurisdictions:counts' })
    const { success, remaining } = await rl.limit(`${getClientIp(request)}:global`)
    if (!success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    const supabase = await createServerClient()

    // Group judges by jurisdiction and count
    const { data, error } = await supabase
      .from('judges')
      .select('jurisdiction, id', { count: 'exact', head: false })

    if (error) {
      return NextResponse.json({ error: 'Failed to load jurisdiction counts' }, { status: 500 })
    }

    const counts: Record<string, number> = {}
    for (const row of data || []) {
      const jurisdiction = (row as any).jurisdiction as string | null
      if (!jurisdiction) continue
      counts[jurisdiction] = (counts[jurisdiction] || 0) + 1
    }

    const result = Object.entries(counts)
      .map(([jurisdiction, judge_count]) => ({ jurisdiction, judge_count }))
      .sort((a, b) => a.jurisdiction.localeCompare(b.jurisdiction))

    const response = NextResponse.json({ counts: result, rate_limit_remaining: remaining })
    response.headers.set('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=300')
    return response
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


