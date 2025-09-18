import 'server-only'

import { createServerClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import type { AdvertiserProfile, AdSpot } from '@/types/advertising'

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
