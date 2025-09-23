import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { buildRateLimiter, getClientIp } = await import('@/lib/security/rate-limit')
    const rl = buildRateLimiter({ tokens: 60, window: '1 m', prefix: 'api:jurisdictions:counts' })
    const { success, remaining } = await rl.limit(`${getClientIp(request)}:global`)
    if (!success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    const supabase = await createServerClient()

    // Fetch minimal data and derive county from court_name to provide county-level counts
    const { data, error } = await supabase
      .from('judges')
      .select('id, court_name, jurisdiction')
      .limit(20000)

    if (error) {
      return NextResponse.json({ error: 'Failed to load jurisdiction counts' }, { status: 500 })
    }

    const counts: Record<string, number> = {}
    const deriveCounty = (courtName?: string | null): string | null => {
      if (!courtName) return null
      const name = courtName.trim()
      // Patterns:
      // 1) Superior Court of California, County of Orange
      let m = name.match(/County of\s+([A-Za-z\s\-]+)\b/i)
      if (m && m[1]) return `${m[1].trim()} County`
      // 2) Orange County Superior Court
      m = name.match(/\b([A-Za-z\s\-]+)\s+County\b/i)
      if (m && m[1]) return `${m[1].trim()} County`
      // 3) Superior Court of Orange County
      m = name.match(/Superior Court of\s+([A-Za-z\s\-]+)\s+County/i)
      if (m && m[1]) return `${m[1].trim()} County`
      return null
    }

    for (const row of data || []) {
      const county = deriveCounty((row as any).court_name)
      if (!county) continue
      counts[county] = (counts[county] || 0) + 1
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


