import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import type { AdSpotWithDetails } from '@/types/advertising'
import { logger } from '@/lib/utils/logger'

export const dynamic = 'force-dynamic'

const querySchema = z.object({
  entity_type: z.enum(['', 'judge', 'court']).default(''),
  court_level: z.enum(['', 'federal', 'state']).default(''),
  price_range: z.enum(['all', 'budget', 'standard', 'premium']).default('all'),
  jurisdiction: z.string().optional().default(''),
  status: z.enum(['available', 'reserved', 'booked', 'maintenance', '']).default('available'),
})

export async function GET(request: NextRequest) {
  const startedAt = Date.now()
  try {
    const { searchParams } = new URL(request.url)
    const parsed = querySchema.safeParse({
      entity_type: searchParams.get('entity_type') ?? '',
      court_level: searchParams.get('court_level') ?? '',
      price_range: (searchParams.get('price_range') as any) ?? 'all',
      jurisdiction: searchParams.get('jurisdiction') ?? '',
      status: (searchParams.get('status') as any) ?? 'available',
    })

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 })
    }

    const { entity_type, court_level, price_range, jurisdiction, status } = parsed.data
    const supabase = await createServerClient()

    let query = supabase
      .from('ad_spots')
      .select('*')
      .order('position', { ascending: true })

    if (status) query = query.eq('status', status)
    if (entity_type) query = query.eq('entity_type', entity_type)
    if (court_level) query = query.eq('court_level', court_level)

    // Coarse price filters aligned with AdSpotsExplorer hints
    if (price_range === 'budget') query = query.lte('base_price_monthly', 200)
    if (price_range === 'standard') query = query.gte('base_price_monthly', 201).lte('base_price_monthly', 500)
    if (price_range === 'premium') query = query.gte('base_price_monthly', 501)

    const { data: spots, error } = await query

    if (error) {
      logger.error('Failed to list available ad spots', { error: error.message })
      return NextResponse.json({ error: 'Failed to load spots' }, { status: 500 })
    }

    // Partition ids for entity enrichment
    const judgeIds = (spots || []).filter(s => s.entity_type === 'judge').map(s => s.entity_id)
    const courtIds = (spots || []).filter(s => s.entity_type === 'court').map(s => s.entity_id)

    const [judgesRes, courtsRes] = await Promise.all([
      judgeIds.length
        ? supabase
            .from('judges')
            .select('id, name, jurisdiction, court_name')
            .in('id', Array.from(new Set(judgeIds)))
        : Promise.resolve({ data: [], error: null } as any),
      courtIds.length
        ? supabase
            .from('courts')
            .select('id, name, jurisdiction')
            .in('id', Array.from(new Set(courtIds)))
        : Promise.resolve({ data: [], error: null } as any),
    ])

    const judgeById = Object.fromEntries((judgesRes.data || []).map((j: any) => [j.id, j]))
    const courtById = Object.fromEntries((courtsRes.data || []).map((c: any) => [c.id, c]))

    let results: AdSpotWithDetails[] = (spots || []).map((s: any) => {
      if (s.entity_type === 'judge') {
        const j = judgeById[s.entity_id] || {}
        return {
          id: s.id,
          entity_type: 'judge',
          entity_id: s.entity_id,
          position: s.position,
          status: s.status,
          base_price_monthly: s.base_price_monthly,
          current_advertiser_id: s.current_advertiser_id,
          impressions_total: s.impressions_total || 0,
          clicks_total: s.clicks_total || 0,
          court_level: s.court_level,
          pricing_tier: s.pricing_tier,
          created_at: s.created_at,
          updated_at: s.updated_at,
          entity_name: j.name || 'Judge',
          entity_details: {
            jurisdiction: j.jurisdiction,
            court_name: j.court_name,
            court_level: s.court_level,
          },
        }
      } else {
        const c = courtById[s.entity_id] || {}
        return {
          id: s.id,
          entity_type: 'court',
          entity_id: s.entity_id,
          position: s.position,
          status: s.status,
          base_price_monthly: s.base_price_monthly,
          current_advertiser_id: s.current_advertiser_id,
          impressions_total: s.impressions_total || 0,
          clicks_total: s.clicks_total || 0,
          court_level: s.court_level,
          pricing_tier: s.pricing_tier,
          created_at: s.created_at,
          updated_at: s.updated_at,
          entity_name: c.name || 'Court',
          entity_details: {
            jurisdiction: c.jurisdiction,
            court_level: s.court_level,
          },
        }
      }
    })

    if (jurisdiction) {
      const q = jurisdiction.toLowerCase()
      results = results.filter(r => (r.entity_details.jurisdiction || '').toLowerCase().includes(q))
    }

    const res = NextResponse.json({ spots: results })
    res.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=120')
    return res
  } catch (e: any) {
    logger.error('available ad spots error', { error: e?.message })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    logger.apiResponse('GET', '/api/advertising/spots/available', 200, Date.now() - startedAt)
  }
}


