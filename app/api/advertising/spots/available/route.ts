import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import type { AdSpotWithDetails } from '@/types/advertising'

export const dynamic = 'force-dynamic'


export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { searchParams } = new URL(request.url)
    
    const entityType = searchParams.get('entity_type') || ''
    const priceRange = searchParams.get('price_range') || 'all'
    const jurisdiction = searchParams.get('jurisdiction') || ''
    const status = searchParams.get('status') || 'available'
    const courtLevel = searchParams.get('court_level') || ''

    // Build the query
    let query = supabase
      .from('ad_spots')
      .select(`
        *,
        judges!ad_spots_entity_id_fkey (
          id,
          name,
          jurisdiction,
          court_name,
          total_cases,
          reversal_rate
        ),
        courts!ad_spots_entity_id_fkey (
          id,
          name,
          jurisdiction,
          judge_count
        )
      `)
      .eq('status', status)

    // Apply entity type filter
    if (entityType) {
      query = query.eq('entity_type', entityType)
    }

    // Apply court level filter
    if (courtLevel) {
      query = query.eq('court_level', courtLevel)
    }

    // Apply price range filter
    if (priceRange !== 'all') {
      switch (priceRange) {
        case 'budget':
          query = query.lte('base_price_monthly', 500)
          break
        case 'standard':
          query = query.gt('base_price_monthly', 500).lte('base_price_monthly', 1500)
          break
        case 'premium':
          query = query.gt('base_price_monthly', 1500)
          break
      }
    }

    const { data: spots, error } = await query

    if (error) {
      console.error('Error fetching ad spots:', error)
      // Return mock data on error for demo purposes
      const mockSpots = await createMockSpots(courtLevel, entityType, jurisdiction)
      return NextResponse.json({ 
        spots: mockSpots,
        total: mockSpots.length,
        demo: true 
      })
    }

    // If no spots found, return mock data for demo
    if (!spots || spots.length === 0) {
      const mockSpots = await createMockSpots(courtLevel, entityType, jurisdiction)
      return NextResponse.json({ 
        spots: mockSpots,
        total: mockSpots.length,
        demo: true 
      })
    }

    // Transform the data to match AdSpotWithDetails type
    const transformedSpots: AdSpotWithDetails[] = spots.map(spot => {
      const entity = spot.entity_type === 'judge' ? spot.judges : spot.courts
      
      return {
        ...spot,
        entity_name: entity?.name || 'Unknown',
        entity_details: {
          jurisdiction: entity?.jurisdiction,
          court_name: spot.entity_type === 'judge' ? entity?.court_name : undefined,
          case_volume: spot.entity_type === 'judge' ? entity?.total_cases : entity?.judge_count,
          reversal_rate: spot.entity_type === 'judge' ? entity?.reversal_rate : undefined
        }
      }
    }).filter(spot => {
      // Apply jurisdiction filter if provided
      if (jurisdiction && spot.entity_details.jurisdiction) {
        return spot.entity_details.jurisdiction.toLowerCase().includes(jurisdiction.toLowerCase())
      }
      return true
    })

    return NextResponse.json({ 
      spots: transformedSpots,
      total: transformedSpots.length 
    })
  } catch (error) {
    console.error('Error in ad spots API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Create mock data for demo purposes
async function createMockSpots(courtLevel?: string, entityType?: string, jurisdiction?: string) {
  const allMockSpots: AdSpotWithDetails[] = [
    {
      id: '1',
      entity_type: 'judge',
      entity_id: '1',
      position: 1,
      status: 'available',
      base_price_monthly: 500,
      court_level: 'federal',
      current_advertiser_id: undefined,
      impressions_total: 15000,
      clicks_total: 450,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      entity_name: 'Judge Sarah Mitchell',
      entity_details: {
        jurisdiction: 'Central District of California',
        court_name: 'U.S. District Court',
        case_volume: 1250,
        reversal_rate: 0.12
      }
    },
    {
      id: '2',
      entity_type: 'judge',
      entity_id: '2',
      position: 2,
      status: 'available',
      base_price_monthly: 200,
      court_level: 'state',
      current_advertiser_id: undefined,
      impressions_total: 12000,
      clicks_total: 380,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      entity_name: 'Judge Robert Chen',
      entity_details: {
        jurisdiction: 'Los Angeles County',
        court_name: 'Superior Court of California',
        case_volume: 980,
        reversal_rate: 0.15
      }
    },
    {
      id: '3',
      entity_type: 'judge',
      entity_id: '3',
      position: 1,
      status: 'available',
      base_price_monthly: 500,
      court_level: 'federal',
      current_advertiser_id: undefined,
      impressions_total: 18000,
      clicks_total: 620,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      entity_name: 'Judge Michael Thompson',
      entity_details: {
        jurisdiction: 'Northern District of California',
        court_name: 'U.S. District Court',
        case_volume: 1100,
        reversal_rate: 0.10
      }
    },
    {
      id: '4',
      entity_type: 'judge',
      entity_id: '4',
      position: 3,
      status: 'available',
      base_price_monthly: 200,
      court_level: 'state',
      current_advertiser_id: undefined,
      impressions_total: 8000,
      clicks_total: 240,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      entity_name: 'Judge Maria Rodriguez',
      entity_details: {
        jurisdiction: 'San Diego County',
        court_name: 'Superior Court of California',
        case_volume: 650,
        reversal_rate: 0.08
      }
    },
    {
      id: '5',
      entity_type: 'judge',
      entity_id: '5',
      position: 2,
      status: 'available',
      base_price_monthly: 500,
      court_level: 'federal',
      current_advertiser_id: undefined,
      impressions_total: 20000,
      clicks_total: 600,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      entity_name: 'Judge Jennifer Davis',
      entity_details: {
        jurisdiction: 'Eastern District of California',
        court_name: 'U.S. District Court',
        case_volume: 1450,
        reversal_rate: 0.09
      }
    },
    {
      id: '6',
      entity_type: 'judge',
      entity_id: '6',
      position: 1,
      status: 'available',
      base_price_monthly: 200,
      court_level: 'state',
      current_advertiser_id: undefined,
      impressions_total: 9500,
      clicks_total: 280,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      entity_name: 'Judge David Wilson',
      entity_details: {
        jurisdiction: 'Orange County',
        court_name: 'Superior Court of California',
        case_volume: 720,
        reversal_rate: 0.11
      }
    },
    {
      id: '7',
      entity_type: 'judge',
      entity_id: '7',
      position: 2,
      status: 'available',
      base_price_monthly: 500,
      court_level: 'federal',
      current_advertiser_id: undefined,
      impressions_total: 16000,
      clicks_total: 520,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      entity_name: 'Judge Patricia Anderson',
      entity_details: {
        jurisdiction: 'Southern District of California',
        court_name: 'U.S. District Court',
        case_volume: 1320,
        reversal_rate: 0.13
      }
    },
    {
      id: '8',
      entity_type: 'judge',
      entity_id: '8',
      position: 3,
      status: 'available',
      base_price_monthly: 200,
      court_level: 'state',
      current_advertiser_id: undefined,
      impressions_total: 7200,
      clicks_total: 195,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      entity_name: 'Judge Thomas Brown',
      entity_details: {
        jurisdiction: 'Sacramento County',
        court_name: 'Superior Court of California',
        case_volume: 550,
        reversal_rate: 0.14
      }
    }
  ]

  // Apply filters to mock data
  let filteredSpots = allMockSpots

  // Filter by court level
  if (courtLevel && courtLevel !== 'all') {
    filteredSpots = filteredSpots.filter(spot => spot.court_level === courtLevel)
  }

  // Filter by entity type
  if (entityType && entityType !== 'all') {
    filteredSpots = filteredSpots.filter(spot => spot.entity_type === entityType)
  }

  // Filter by jurisdiction
  if (jurisdiction && jurisdiction !== 'all') {
    filteredSpots = filteredSpots.filter(spot => 
      spot.entity_details.jurisdiction?.toLowerCase().includes(jurisdiction.toLowerCase())
    )
  }

  return filteredSpots
}