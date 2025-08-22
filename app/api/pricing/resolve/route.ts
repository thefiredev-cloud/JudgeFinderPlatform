import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const { searchParams } = new URL(request.url)
    const judgeId = searchParams.get('judgeId')
    
    if (!judgeId) {
      return NextResponse.json(
        { error: 'Judge ID is required' },
        { status: 400 }
      )
    }

    logger.apiRequest('GET', '/api/pricing/resolve', { judgeId })

    const supabase = await createServerClient()
    
    // Get judge information to determine pricing tier
    const { data: judge, error: judgeError } = await supabase
      .from('judges')
      .select('id, name, jurisdiction, total_cases, court_name')
      .eq('id', judgeId)
      .single()

    if (judgeError || !judge) {
      logger.error('Judge not found for pricing', { judgeId, error: judgeError?.message })
      return NextResponse.json(
        { error: 'Judge not found' },
        { status: 404 }
      )
    }

    // Determine pricing tier based on judge profile
    // Since platform is free, return standard free tier information
    const pricingData = {
      judgeId: judge.id,
      judgeName: judge.name,
      jurisdiction: judge.jurisdiction,
      courtName: judge.court_name,
      tier: 'free',
      features: {
        basicProfile: true,
        caseHistory: true,
        analytics: true,
        biasDetection: true,
        recentDecisions: true,
        courtSchedule: false, // Premium feature (not activated)
        attorneyRecommendations: false, // Premium feature (not activated)
        prioritySupport: false // Premium feature (not activated)
      },
      pricing: {
        current: 0,
        currency: 'USD',
        period: 'lifetime',
        description: 'Free judicial transparency platform'
      },
      availableUpgrades: [], // No upgrades - platform is fully free
      message: 'Complete judge information available at no cost'
    }

    const duration = Date.now() - startTime
    logger.apiResponse('GET', '/api/pricing/resolve', 200, duration, {
      judgeId: judge.id,
      tier: pricingData.tier
    })

    // Cache response for 1 hour since pricing is static
    const response = NextResponse.json(pricingData)
    response.headers.set('Cache-Control', 'public, s-maxage=3600, max-age=1800')
    
    return response

  } catch (error) {
    const duration = Date.now() - startTime
    logger.error('API error in pricing resolve', { duration }, error instanceof Error ? error : undefined)
    
    logger.apiResponse('GET', '/api/pricing/resolve', 500, duration)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}