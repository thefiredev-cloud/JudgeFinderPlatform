import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { isAdmin } from '@/lib/auth/is-admin'
import { createServerClient } from '@/lib/supabase/server'
import { buildRateLimiter, getClientIp } from '@/lib/security/rate-limit'
import { getBaseUrl } from '@/lib/utils/baseUrl'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now()
  try {
    const { userId } = await auth()
    if (!userId || !(await isAdmin())) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const rl = buildRateLimiter({ tokens: 5, window: '1 m', prefix: 'admin:warm-analytics' })
    const ip = getClientIp(request)
    const { success } = await rl.limit(`${ip}:warm`)
    if (!success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    const body = await request.json().catch(() => ({} as any))
    const limit = Math.max(1, Math.min(200, Number(body?.limit ?? 50)))
    const jurisdiction = typeof body?.jurisdiction === 'string' ? body.jurisdiction : 'CA'
    const force = Boolean(body?.force)
    const concurrency = Math.max(1, Math.min(10, Number(body?.concurrency ?? 5)))

    const supabase = await createServerClient()

    // Pick judges by highest total_cases first, fallback to recent activity
    const { data: judges, error } = await supabase
      .from('judges')
      .select('id, name, total_cases')
      .eq('jurisdiction', jurisdiction)
      .order('total_cases', { ascending: false })
      .limit(limit)

    if (error) {
      return NextResponse.json({ error: 'Failed to list judges', details: error.message }, { status: 500 })
    }

    const ids = (judges || []).map(j => j.id)
    const origin = getBaseUrl()

    let warmed = 0
    let regenerated = 0
    let failed: Array<{ id: string; error: string }> = []

    const chunks = chunk(ids, concurrency)
    for (const group of chunks) {
      const results = await Promise.all(group.map(async (id) => {
        try {
          if (force) {
            const res = await fetch(`${origin}/api/judges/${id}/analytics?force=true`, { method: 'POST', cache: 'no-store' })
            if (!res.ok) throw new Error(`${res.status}`)
            regenerated++
            return true
          } else {
            const res = await fetch(`${origin}/api/judges/${id}/analytics`, { cache: 'no-store' })
            if (!res.ok) throw new Error(`${res.status}`)
            return true
          }
        } catch (e: any) {
          failed.push({ id, error: e?.message || 'request_failed' })
          return false
        }
      }))
      warmed += results.filter(Boolean).length
    }

    const tookMs = Date.now() - startedAt
    return NextResponse.json({
      success: true,
      warmed,
      regenerated: force ? regenerated : undefined,
      failed,
      limit,
      jurisdiction,
      took_ms: tookMs,
      timestamp: new Date().toISOString(),
    })
  } catch (e: any) {
    return NextResponse.json({ error: 'Failed to warm analytics', details: e?.message || 'unknown' }, { status: 500 })
  }
}


