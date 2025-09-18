import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { enforceRateLimit, getClientKey } from '@/lib/security/rate-limit'
import { requireApiKeyIfEnabled } from '@/lib/security/api-auth'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireApiKeyIfEnabled(request.headers, (request as any).url)
    if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const key = getClientKey(request.headers)
    const limit = await enforceRateLimit(`v1:aliases:${key}`)
    if (!limit.allowed) {
      const r = NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
      if (typeof limit.remaining === 'number') r.headers.set('RateLimit-Remaining', String(limit.remaining))
      if (limit.reset) r.headers.set('RateLimit-Reset', String(limit.reset))
      return r
    }
    const { id } = await params
    const supabase = await createServerClient()

    // 1) Name variants from judges table and any historical names table if present
    const { data: judge } = await supabase
      .from('judges')
      .select('name, courtlistener_data')
      .eq('id', id)
      .single()

    const aliases: string[] = []
    if (judge?.name) aliases.push(judge.name)

    const cl = (judge?.courtlistener_data || {}) as any
    if (cl?.aliases && Array.isArray(cl.aliases)) {
      for (const a of cl.aliases) {
        if (typeof a === 'string' && a.trim() && !aliases.includes(a)) aliases.push(a)
      }
    }

    // 2) Position history as auxiliary identity evidence
    const { data: history } = await supabase
      .rpc('get_judge_assignment_history', { judge_uuid: id, years_back: 20 })

    const positions = (history || []).map((h: any) => ({
      court_id: h.court_id,
      court_name: h.court_name,
      role: h.position_title || h.assignment_type,
      start_end: [h.assignment_start_date, h.assignment_end_date || null]
    }))

    const r = NextResponse.json({
      aliases,
      positions,
      sources: ['judges.courtlistener_data', 'court_assignments'],
      last_updated: new Date().toISOString()
    })
    if (typeof limit.remaining === 'number') r.headers.set('RateLimit-Remaining', String(limit.remaining))
    if (limit.reset) r.headers.set('RateLimit-Reset', String(limit.reset))
    return r
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


