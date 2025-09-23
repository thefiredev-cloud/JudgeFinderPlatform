import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { buildRateLimiter, getClientIp } = await import('@/lib/security/rate-limit')
    const rl = buildRateLimiter({ tokens: 60, window: '1 m', prefix: 'api:jurisdictions:cities' })
    const { success, remaining } = await rl.limit(`${getClientIp(request)}:global`)
    if (!success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from('courts')
      .select('id, name, address, jurisdiction')
      .limit(20000)

    if (error) {
      return NextResponse.json({ error: 'Failed to load city data' }, { status: 500 })
    }

    const citiesCount: Record<string, { city: string; jurisdiction: string; court_count: number }> = {}

    const deriveCity = (name?: string | null, address?: string | number | null): string | null => {
      if (typeof name === 'string') {
        // 1) Anaheim WCAB
        let m = name.match(/^([A-Za-z .'-]+)\s+WCAB\b/i)
        if (m && m[1]) return m[1].trim()
        // 2) {City} Municipal Court or {City} Justice Court (rare)
        m = name.match(/^([A-Za-z .'-]+)\s+(Municipal|Justice)\s+Court\b/i)
        if (m && m[1]) return m[1].trim()
        // 3) Skip statewide/district entities
        if (/Court of Appeal/i.test(name) || /Superior Court/i.test(name)) {
          // Usually county or district, not city
        }
      }
      if (typeof address === 'string') {
        // Look for ", City, CA" pattern
        const m = address.match(/,\s*([A-Za-z .'-]+)\s*,\s*(?:CA|California|[A-Z]{2})\b/)
        if (m && m[1]) return m[1].trim()
        // Fallback: if address starts with city
        const parts = address.split(',').map(s => s.trim()).filter(Boolean)
        if (parts.length >= 1 && /[A-Za-z]/.test(parts[0])) return parts[0]
      }
      return null
    }

    for (const row of data || []) {
      const city = deriveCity((row as any).name, (row as any).address)
      if (!city) continue
      const key = city
      const jurisdiction = (row as any).jurisdiction || ''
      if (!citiesCount[key]) {
        citiesCount[key] = { city, jurisdiction, court_count: 1 }
      } else {
        citiesCount[key].court_count += 1
      }
    }

    const result = Object.values(citiesCount)
      .sort((a, b) => a.city.localeCompare(b.city))

    const response = NextResponse.json({ cities: result, rate_limit_remaining: remaining })
    response.headers.set('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=300')
    return response
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


