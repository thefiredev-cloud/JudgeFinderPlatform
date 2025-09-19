import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { createServerClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import { buildRateLimiter, getClientIp } from '@/lib/security/rate-limit'

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  tier: z.string().min(1, 'Pricing tier is required'),
  months: z.coerce
    .number({ invalid_type_error: 'Months must be a number' })
    .int('Months must be a whole number')
    .min(1, 'Months must be at least 1')
    .max(36, 'Maximum supported duration is 36 months')
})

export async function POST(request: NextRequest) {
  const start = Date.now()

  const rateLimiter = buildRateLimiter({ tokens: 10, window: '1 m', prefix: 'api:ads:price' })
  const ipAddress = getClientIp(request)
  const rateLimitKey = `${ipAddress || 'anonymous'}:post`
  const rateLimitResult = await rateLimiter.limit(rateLimitKey)

  if (!rateLimitResult.success) {
    logger.apiResponse('POST', '/api/ads/price', 429, Date.now() - start, {
      error: 'rate_limited'
    })

    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again shortly.' },
      { status: 429 }
    )
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch (error) {
    logger.apiResponse('POST', '/api/ads/price', 400, Date.now() - start, {
      error: 'Invalid JSON payload',
      details: error instanceof Error ? error.message : 'unknown'
    })

    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(payload)
  if (!parsed.success) {
    const message = parsed.error.errors[0]?.message ?? 'Invalid request body'
    logger.apiResponse('POST', '/api/ads/price', 400, Date.now() - start, {
      error: message
    })
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const { tier, months } = parsed.data
  logger.apiRequest('POST', '/api/ads/price', { tier, months })

  try {
    const supabase = await createServerClient()
    const { data, error } = await supabase.rpc('calculate_ad_pricing', {
      p_tier_name: tier,
      p_months: months
    })

    if (error) {
      logger.apiResponse('POST', '/api/ads/price', 400, Date.now() - start, {
        error: error.message
      })
      return NextResponse.json(
        { error: 'Unable to calculate pricing for the requested tier' },
        { status: 400 }
      )
    }

    const pricing = Array.isArray(data) && data.length > 0 ? data[0] : null

    const response = NextResponse.json({
      tier,
      months,
      pricing: pricing ?? {
        total_price: null,
        monthly_rate: null,
        savings: null
      }
    })

    response.headers.set('Cache-Control', 'no-store')

    logger.apiResponse('POST', '/api/ads/price', 200, Date.now() - start, {
      tier,
      months
    })

    return response
  } catch (error) {
    logger.apiResponse('POST', '/api/ads/price', 500, Date.now() - start, {
      error: error instanceof Error ? error.message : 'unknown'
    })

    return NextResponse.json(
      { error: 'Failed to calculate pricing' },
      { status: 500 }
    )
  }
}
