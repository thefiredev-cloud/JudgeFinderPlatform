import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { enforceRateLimit, getClientKey } from '@/lib/security/rate-limit'
import { requireApiKeyIfEnabled } from '@/lib/security/api-auth'

export const dynamic = 'force-dynamic'

function median(values: number[]): number | null {
  if (!values.length) return null
  const sorted = [...values].sort((a,b) => a-b)
  const mid = Math.floor(sorted.length/2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid-1] + sorted[mid]) / 2
}

export async function GET(request: NextRequest) {
  try {
    const auth = requireApiKeyIfEnabled(request.headers, request.url)
    if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const key = getClientKey(request.headers)
    const limit = await enforceRateLimit(`v1:ttr:${key}`)
    if (!limit.allowed) {
      const r = NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
      if (typeof limit.remaining === 'number') r.headers.set('RateLimit-Remaining', String(limit.remaining))
      if (limit.reset) r.headers.set('RateLimit-Reset', String(limit.reset))
      return r
    }
    const { searchParams } = new URL(request.url)
    const judgeId = searchParams.get('judge_id')
    const motion = searchParams.get('motion') || undefined
    const caseType = searchParams.get('case_type') || undefined
    if (!judgeId) return NextResponse.json({ error: 'judge_id is required' }, { status: 400 })

    const supabase = await createServerClient()

    let qb = supabase
      .from('cases')
      .select('filing_date, decision_date, case_type, outcome, summary')
      .eq('judge_id', judgeId)
      .not('decision_date', 'is', null)

    if (caseType) qb = qb.ilike('case_type', `%${caseType}%`)
    if (motion) qb = qb.or(`outcome.ilike.%${motion}%,summary.ilike.%${motion}%`)

    const { data: rows, error } = await qb.limit(5000)
    if (error) return NextResponse.json({ error: 'Query failed' }, { status: 500 })

    const durations: number[] = []
    for (const r of rows || []) {
      const start = r.filing_date ? new Date(r.filing_date).getTime() : null
      const end = r.decision_date ? new Date(r.decision_date).getTime() : null
      if (!start || !end) continue
      const days = Math.max(0, Math.round((end - start) / (1000*60*60*24)))
      durations.push(days)
    }

    durations.sort((a,b)=>a-b)
    const n = durations.length
    const med = median(durations)
    const p10 = n ? durations[Math.floor(n*0.1)] : null
    const p90 = n ? durations[Math.floor(n*0.9)] : null

    // Very thin survival curve: empirical CDF
    const points = [] as Array<{ day: number; probability: number }>
    if (n) {
      for (let i = 0; i < n; i += Math.max(1, Math.floor(n/50))) {
        const day = durations[i]
        const prob = (n - i) / n // survival S(t) ~ P(T>t)
        points.push({ day, probability: Number(prob.toFixed(3)) })
      }
    }

    const payload = {
      judge_id: judgeId,
      data_window: { n, min: durations[0] ?? null, max: durations[n-1] ?? null },
      median_days: med,
      ci80: [p10, p90],
      survival_curve: points,
      last_updated: new Date().toISOString()
    }

    const format = searchParams.get('format')
    if (format === 'csv') {
      const rows = ['day,probability']
      for (const pt of points) rows.push(`${pt.day},${pt.probability}`)
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

    const res = NextResponse.json(payload)
    res.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60')
    if (typeof limit.remaining === 'number') res.headers.set('RateLimit-Remaining', String(limit.remaining))
    if (limit.reset) res.headers.set('RateLimit-Reset', String(limit.reset))
    return res
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


