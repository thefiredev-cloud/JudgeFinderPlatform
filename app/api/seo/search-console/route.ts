import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const judge = searchParams.get('judge')

  if (!judge) {
    return NextResponse.json(
      { error: 'Judge parameter is required' },
      { status: 400 }
    )
  }

  const { buildRateLimiter, getClientIp } = await import('@/lib/security/rate-limit')
  const rl = buildRateLimiter({ tokens: 30, window: '1 m', prefix: 'api:seo:search-console' })
  const { success, remaining } = await rl.limit(`${getClientIp(request)}:global`)
  if (!success) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  // Mock response for development - replace with actual Google Search Console API integration
  const mockData = {
    judge: judge,
    searchMetrics: {
      impressions: Math.floor(Math.random() * 1000) + 100,
      clicks: Math.floor(Math.random() * 50) + 10,
      ctr: Math.random() * 0.1 + 0.05,
      position: Math.floor(Math.random() * 10) + 5,
    },
    lastUpdated: new Date().toISOString(),
    status: 'development_mock',
    rate_limit_remaining: remaining
  }

  return NextResponse.json(mockData)
}