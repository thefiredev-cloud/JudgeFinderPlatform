import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { enforceRateLimit, getClientKey } from '@/lib/security/rate-limit'
import { requireApiKeyIfEnabled } from '@/lib/security/api-auth'

export const dynamic = 'force-dynamic'

function proportionCI(successes: number, n: number) {
  if (n === 0) return { p: 0.5, n, ci80: [0.4, 0.6] }
  const p = successes / n
  // Wilson score 80% (z≈1.2816)
  const z = 1.2816
  const denom = 1 + (z * z) / n
  const centre = p + (z * z) / (2 * n)
  const pm = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))
  const lo = Math.max(0, (centre - pm) / denom)
  const hi = Math.min(1, (centre + pm) / denom)
  return { p, n, ci80: [Number((lo).toFixed(3)), Number((hi).toFixed(3))] }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireApiKeyIfEnabled(request.headers, request.url)
    if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const key = getClientKey(request.headers)
    const limit = await enforceRateLimit(`v1:motions:${key}`)
    if (!limit.allowed) {
      const r429 = NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
      if (typeof limit.remaining === 'number') r429.headers.set('RateLimit-Remaining', String(limit.remaining))
      if (limit.reset) r429.headers.set('RateLimit-Reset', String(limit.reset))
      return r429
    }
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || undefined
    const caseType = searchParams.get('case_type') || undefined
    const since = searchParams.get('since') || undefined

    const supabase = await createServerClient()

    let qb = supabase
      .from('cases')
      .select('case_type, outcome, filing_date, decision_date, status, summary')
      .eq('judge_id', id)

    if (caseType) qb = qb.ilike('case_type', `%${caseType}%`)
    if (since) qb = qb.gte('filing_date', since)

    const { data: rows, error } = await qb.limit(2000)
    if (error) return NextResponse.json({ error: 'Query failed' }, { status: 500 })

    // Naive motion extraction from outcome/summary strings
    const normalized = (rows || []).map(r => ({
      case_type: (r.case_type || '').toLowerCase(),
      outcome: (r.outcome || '').toLowerCase(),
      summary: (r.summary || '').toLowerCase(),
    }))

    const motionBuckets: Record<string, { granted: number; total: number }> = {}
    const decideIfMotion = (s: string) => s.includes('motion') || s.includes('mtn')

    for (const r of normalized) {
      const text = `${r.outcome} ${r.summary}`
      if (!decideIfMotion(text)) continue
      const bucket = type || (text.includes('summary judgment') ? 'summary_judgment' : text.includes('dismiss') ? 'dismiss' : 'general')
      if (!motionBuckets[bucket]) motionBuckets[bucket] = { granted: 0, total: 0 }
      motionBuckets[bucket].total++
      if (text.includes('granted') || text.includes('grant in part')) motionBuckets[bucket].granted++
    }

    const result = Object.entries(motionBuckets).map(([bucket, stats]) => {
      const { p, n, ci80 } = proportionCI(stats.granted, stats.total)
      return {
        motion_type: bucket,
        grant_rate: Number((p * 100).toFixed(1)),
        n,
        ci80: [Number((ci80[0] * 100).toFixed(1)), Number((ci80[1] * 100).toFixed(1))],
        denominator_note: 'Counts derived from case summaries/outcomes; requires ongoing curation.'
      }
    })

    // CSV export if requested
    const format = searchParams.get('format')
    if (format === 'csv') {
      const rows = ['motion_type,grant_rate,n,ci80_lo,ci80_hi']
      for (const r of result) {
        rows.push(`${r.motion_type},${r.grant_rate},${r.n},${r.ci80[0]},${r.ci80[1]}`)
      }
      const r = new Response(rows.join('\n'), {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60'
        }
      })
      if (typeof limit.remaining === 'number') r.headers.set('RateLimit-Remaining', String(limit.remaining))
      if (limit.reset) r.headers.set('RateLimit-Reset', String(limit.reset))
      return r
    }

    const res = NextResponse.json({ motions: result, last_updated: new Date().toISOString() })
    res.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60')
    if (typeof limit.remaining === 'number') res.headers.set('RateLimit-Remaining', String(limit.remaining))
    if (limit.reset) res.headers.set('RateLimit-Reset', String(limit.reset))
    return res
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


