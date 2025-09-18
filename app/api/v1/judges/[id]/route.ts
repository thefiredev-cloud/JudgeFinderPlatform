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
    const limit = await enforceRateLimit(`v1:judges:${key}`)
    if (!limit.allowed) {
      const res = NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
      if (typeof limit.remaining === 'number') res.headers.set('RateLimit-Remaining', String(limit.remaining))
      if (limit.reset) res.headers.set('RateLimit-Reset', String(limit.reset))
      return res
    }
    const { id } = await params
    const supabase = await createServerClient()

    const { data: judge, error } = await supabase
      .from('judges')
      .select('id, name, slug, court_id, court_name, jurisdiction, appointed_date, courtlistener_id, courtlistener_data, updated_at')
      .eq('id', id)
      .single()

    if (error || !judge) {
      return NextResponse.json({ error: 'Judge not found' }, { status: 404 })
    }

    // Fetch current/primary assignment for role context
    const { data: currentAssignments } = await supabase
      .rpc('get_current_court_assignments', { judge_uuid: id })

    const primary = Array.isArray(currentAssignments)
      ? currentAssignments.find((a: any) => a.assignment_type === 'primary')
      : null

    // Source provenance
    const sources: Array<{ name: string; url?: string; type?: string }> = []
    if (judge.courtlistener_id) {
      sources.push({ name: 'CourtListener', type: 'official', url: `https://www.courtlistener.com/person/${judge.courtlistener_id}` })
    }

    const payload = {
      judge_id: judge.id,
      full_name: judge.name,
      court_id: judge.court_id,
      court_name: judge.court_name,
      jurisdiction: judge.jurisdiction,
      role: primary?.position_title || 'Judge',
      position: primary ? {
        court_id: primary.court_id,
        court_name: primary.court_name,
        start_date: primary.assignment_start_date,
        department: primary.department || null,
        assignment_type: primary.assignment_type
      } : null,
      identifiers: {
        slug: judge.slug || null,
        courtlistener_id: judge.courtlistener_id || null
      },
      sources,
      last_updated: judge.updated_at
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


