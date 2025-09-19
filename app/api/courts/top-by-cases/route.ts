import { NextRequest, NextResponse } from 'next/server'
import { getTopCourtsByCases } from '@/lib/courts/service'
import { logger } from '@/lib/utils/logger'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const start = Date.now()

  try {
    const { searchParams } = new URL(request.url)
    const jurisdiction = searchParams.get('jurisdiction') ?? 'CA'
    const limitParam = searchParams.get('limit')
    const parsedLimit = limitParam ? Number.parseInt(limitParam, 10) : undefined
    const limit = parsedLimit && !Number.isNaN(parsedLimit) ? parsedLimit : undefined

    logger.apiRequest('GET', '/api/courts/top-by-cases', { jurisdiction, limit })

    const result = await getTopCourtsByCases({ jurisdiction, limit })

    const response = NextResponse.json({
      courts: result.courts,
      data_source: result.source,
      message:
        result.source === 'rpc'
          ? 'Case counts based on actual case data'
          : 'Case counts estimated from judge and filings data'
    })

    response.headers.set('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=300')
    response.headers.set('CDN-Cache-Control', 'public, s-maxage=3600')
    response.headers.set('Vary', 'Accept-Encoding')

    logger.apiResponse('GET', '/api/courts/top-by-cases', 200, Date.now() - start, {
      jurisdiction,
      limit: limit ?? undefined,
      source: result.source,
      count: result.courts.length
    })

    return response
  } catch (error) {
    logger.apiResponse('GET', '/api/courts/top-by-cases', 500, Date.now() - start, {
      error: error instanceof Error ? error.message : 'unknown'
    })

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
