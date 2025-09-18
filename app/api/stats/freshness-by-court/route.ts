import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 300

export async function GET(request: Request) {
  try {
    const { buildRateLimiter, getClientIp } = await import('@/lib/security/rate-limit')
    const rl = buildRateLimiter({ tokens: 120, window: '1 m', prefix: 'api:stats:freshness' })
    const { success, remaining } = await rl.limit(`${getClientIp(request as any)}:global`)
    if (!success) {
      return NextResponse.json({ rows: [], error: 'Rate limit exceeded' }, { status: 429 })
    }
    const supabase = await createServerClient()

    // Pull recent updates per court from decisions table if available, fallback to cases
    const { data: recents, error } = await supabase
      .from('decisions')
      .select('court_id, date_filed')
      .not('date_filed', 'is', null)
      .order('date_filed', { ascending: false })
      .limit(5000)

    if (error) {
      console.error('freshness: decisions query failed, falling back to cases', error)
    }

    const map = new Map<string, string>()
    for (const r of recents || []) {
      if (!r.court_id || !r.date_filed) continue
      if (!map.has(r.court_id)) map.set(r.court_id, r.date_filed)
    }

    // Join with courts for names
    const { data: courts } = await supabase
      .from('courts')
      .select('id, name')
      .eq('jurisdiction', 'CA')

    const rows = (courts || []).map(c => ({
      court_id: c.id,
      court_name: c.name,
      last_update: map.get(c.id) || null
    }))

    return NextResponse.json({ rows, timestamp: new Date().toISOString(), rate_limit_remaining: remaining }, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' }
    })
  } catch (e) {
    return NextResponse.json({ rows: [], error: 'Internal server error' }, { status: 500 })
  }
}


