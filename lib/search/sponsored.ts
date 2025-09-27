import { createServerClient } from '@/lib/supabase/server'
import type { SponsoredSearchResult } from '@/types/search'

export interface SponsoredSearchQuery {
  query: string
  limit?: number
}

const DEFAULT_LIMIT = 2

function sanitizeQuery(query: string): string {
  return query.trim().toLowerCase()
}

export async function fetchSponsoredTiles({ query, limit = DEFAULT_LIMIT }: SponsoredSearchQuery): Promise<SponsoredSearchResult[]> {
  if (!query.trim()) {
    return []
  }

  const normalized = sanitizeQuery(query)
  const supabase = await createServerClient()

  const { data, error } = await supabase.rpc('search_sponsored_tiles', {
    p_query: normalized,
    p_limit: Math.min(Math.max(limit, 1), DEFAULT_LIMIT),
  })

  if (error || !Array.isArray(data)) {
    return []
  }

  return data
    .filter((row: any) => Boolean(row?.sponsored_url))
    .map((row: any) => ({
      id: row.id,
      type: 'sponsored',
      title: row.headline ?? row.name ?? 'Sponsored Attorney',
      subtitle: row.badge ?? 'Verified sponsor',
      description: row.description,
      url: row.sponsored_url,
      advertiser_id: row.advertiser_id,
      bar_number: row.bar_number,
      verified: row.verified === true,
      pricing_tier: row.pricing_tier,
      promo_badge: row.badge,
      contact_email: row.contact_email,
      contact_phone: row.contact_phone,
      website: row.website,
    }) as SponsoredSearchResult)
}
