import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { getJudgeAdSpots } from '@/lib/ads/service'
import { logger } from '@/lib/utils/logger'

export const dynamic = 'force-dynamic'

const paramsSchema = z.object({
  id: z.string().uuid('Invalid judge ID format')
})

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const start = Date.now()
  const resolvedParams = await params
  const validation = paramsSchema.safeParse(resolvedParams)

  if (!validation.success) {
    const message = validation.error.errors[0]?.message ?? 'Invalid request parameters'
    logger.apiResponse('GET', `/api/judges/${resolvedParams?.id ?? 'unknown'}/advertising-slots`, 400, Date.now() - start, {
      error: message
    })

    return NextResponse.json({ error: message }, { status: 400 })
  }

  const judgeId = validation.data.id
  logger.apiRequest('GET', `/api/judges/${judgeId}/advertising-slots`)

  try {
    const spots = await getJudgeAdSpots(judgeId)

    const serialized = spots.map((spot) => ({
      id: spot.id,
      position: spot.position,
      status: spot.status,
      base_price_monthly: spot.base_price_monthly,
      pricing_tier: spot.pricing_tier,
      court_level: spot.court_level,
      impressions_total: spot.impressions_total,
      clicks_total: spot.clicks_total,
      advertiser: spot.advertiser
        ? {
            id: spot.advertiser.id,
            firm_name: spot.advertiser.firm_name,
            description: spot.advertiser.description,
            website: spot.advertiser.website,
            phone: spot.advertiser.contact_phone,
            email: spot.advertiser.contact_email,
            logo_url: spot.advertiser.logo_url,
            specializations: spot.advertiser.specializations,
            badge: spot.advertiser.verification_status === 'verified' ? 'Verified' : undefined,
            bar_number: spot.advertiser.bar_number
          }
        : null
    }))

    const response = NextResponse.json({
      slots: serialized,
      count: serialized.length
    })

    response.headers.set('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=300')
    response.headers.set('Vary', 'Accept-Encoding')

    logger.apiResponse('GET', `/api/judges/${judgeId}/advertising-slots`, 200, Date.now() - start, {
      count: serialized.length
    })

    return response
  } catch (error) {
    logger.apiResponse('GET', `/api/judges/${judgeId}/advertising-slots`, 500, Date.now() - start, {
      error: error instanceof Error ? error.message : 'unknown'
    })

    return NextResponse.json(
      { error: 'Failed to load advertising slots' },
      { status: 500 }
    )
  }
}
