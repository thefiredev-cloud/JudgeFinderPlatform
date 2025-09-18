import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { enforceRateLimit, getClientKey } from '@/lib/security/rate-limit'
import { requireApiKeyIfEnabled } from '@/lib/security/api-auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const auth = requireApiKeyIfEnabled(request.headers, request.url)
    if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const key = getClientKey(request.headers)
    const limitInfo = await enforceRateLimit(`v1:judges_export:${key}`)
    if (!limitInfo.allowed) {
      const r = NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
      if (typeof limitInfo.remaining === 'number') r.headers.set('RateLimit-Remaining', String(limitInfo.remaining))
      if (limitInfo.reset) r.headers.set('RateLimit-Reset', String(limitInfo.reset))
      return r
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const perPage = Math.min(1000, Math.max(1, parseInt(searchParams.get('per_page') || '500', 10)))
    const offset = (page - 1) * perPage

    const supabase = await createServerClient()
    const { data: judges, error } = await supabase
      .from('judges')
      .select('id, name, slug, court_id, court_name, jurisdiction, courtlistener_id, updated_at')
      .range(offset, offset + perPage - 1)

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch judges' }, { status: 500 })
    }

    const format = (searchParams.get('format') || 'csv').toLowerCase()
    if (format === 'json') {
      const res = NextResponse.json({ judges: judges || [], page, per_page: perPage })
      if (typeof limitInfo.remaining === 'number') res.headers.set('RateLimit-Remaining', String(limitInfo.remaining))
      if (limitInfo.reset) res.headers.set('RateLimit-Reset', String(limitInfo.reset))
      return res
    }

    const header = 'judge_id,full_name,court_id,court_name,jurisdiction,slug,courtlistener_id,source,last_updated'
    const rows = [header]
    for (const j of judges || []) {
      const source = j.courtlistener_id ? `CourtListener:https://www.courtlistener.com/person/${j.courtlistener_id}` : ''
      const csvRow = [
        j.id,
        JSON.stringify(j.name),
        j.court_id || '',
        JSON.stringify(j.court_name || ''),
        JSON.stringify(j.jurisdiction || ''),
        JSON.stringify(j.slug || ''),
        j.courtlistener_id || '',
        JSON.stringify(source),
        j.updated_at
      ].join(',')
      rows.push(csvRow)
    }

    const r = new Response(rows.join('\n'), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60'
      }
    })
    if (typeof limitInfo.remaining === 'number') r.headers.set('RateLimit-Remaining', String(limitInfo.remaining))
    if (limitInfo.reset) r.headers.set('RateLimit-Reset', String(limitInfo.reset))
    return r
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


