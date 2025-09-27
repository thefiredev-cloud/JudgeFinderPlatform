import 'server-only'

import { createServerClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import type { AdvertiserProfile, AdSpot } from '@/types/advertising'

export interface AdSpotWithRelations extends AdSpot {
  advertiser?: AdvertiserProfile | null
}

export async function getAdvertiserProfileForUser(userId: string): Promise<AdvertiserProfile | null> {
  try {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('advertiser_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle<AdvertiserProfile>()

    if (error) {
      logger.warn('Failed to fetch advertiser profile', { userId, error })
      return null
    }

    return data || null
  } catch (error) {
    logger.error('Unexpected advertiser profile lookup error', { userId, error })
    return null
  }
}

export async function listAvailableAdSpots(limit = 5): Promise<AdSpot[]> {
  try {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('ad_spots')
      .select('*')
      .eq('status', 'available')
      .order('position', { ascending: true })
      .limit(limit)

    if (error) {
      logger.warn('Failed to load available ad spots', { error })
      return []
    }

    return (data || []) as AdSpot[]
  } catch (error) {
    logger.error('Unexpected ad spot lookup error', { error })
    return []
  }
}

const MAX_JUDGE_ROTATIONS = 2

export function getMaxJudgeRotations(): number {
  return MAX_JUDGE_ROTATIONS
}

async function fetchAdSpots(
  entityType: 'court' | 'judge',
  entityId: string
): Promise<AdSpotWithRelations[]> {
  const supabase = await createServerClient()

  let query = supabase
    .from('ad_spots')
    .select(`
      id,
      entity_type,
      entity_id,
      position,
      status,
      base_price_monthly,
      current_advertiser_id,
      impressions_total,
      clicks_total,
      court_level,
      pricing_tier,
      created_at,
      updated_at,
      advertiser:advertiser_profiles!ad_spots_current_advertiser_id_fkey (
        id,
        user_id,
        firm_name,
        firm_type,
        bar_number,
        bar_state,
        contact_email,
        contact_phone,
        billing_email,
        billing_address,
        website,
        logo_url,
        description,
        specializations,
        total_spend,
        account_status,
        verification_status,
        stripe_customer_id,
        created_at,
        updated_at
      )
    `)
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)

  if (entityType === 'judge') {
    query = query.lte('position', MAX_JUDGE_ROTATIONS)
  }

  const { data, error } = await query.order('position', { ascending: true })

  if (error) {
    logger.warn('Failed to load ad spots for entity', {
      entityType,
      entityId,
      error: error.message
    })
    return []
  }

  return (data || []).map((spot: any) => ({
    ...(spot as AdSpot),
    advertiser: spot.advertiser || null
  }))
}

export async function getCourtAdSpots(courtId: string): Promise<AdSpotWithRelations[]> {
  return fetchAdSpots('court', courtId)
}

export async function getJudgeAdSpots(judgeId: string): Promise<AdSpotWithRelations[]> {
  return fetchAdSpots('judge', judgeId)
}
