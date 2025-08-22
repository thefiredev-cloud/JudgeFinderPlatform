import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * LA County specific judge API endpoint
 * Expansion target for revenue system beyond Orange County
 */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { searchParams } = new URL(request.url)
    
    // Parameters
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1)
    const searchQuery = searchParams.get('q')?.trim()
    const includeSlots = searchParams.get('include_slots') === 'true'
    const availableSlotsOnly = searchParams.get('available_slots_only') === 'true'
    
    const offset = (page - 1) * limit

    // Base query for LA County judges
    let query = supabase
      .from('judges')
      .select(`
        id,
        name,
        court_name,
        jurisdiction,
        appointed_date,
        education,
        total_cases,
        courtlistener_id,
        bio,
        profile_image_url,
        created_at,
        updated_at
        ${includeSlots ? ',attorney_slots(id, position, price_per_month, is_active, start_date, end_date, attorney_id)' : ''}
      `)
      .or('jurisdiction.ilike.%Los Angeles%, jurisdiction.ilike.%LA County%, jurisdiction.ilike.%L.A.%, court_name.ilike.%Los Angeles%')
      .order('name')

    // Apply search filter if provided
    if (searchQuery) {
      query = query.or(`name.ilike.%${searchQuery}%,court_name.ilike.%${searchQuery}%`)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: judges, error } = await query

    if (error) {
      console.error('Error fetching LA County judges:', error)
      return NextResponse.json(
        { error: 'Failed to fetch LA County judges', details: error.message },
        { status: 500 }
      )
    }

    // Get total count for pagination
    const { count: totalCount, error: countError } = await supabase
      .from('judges')
      .select('*', { count: 'exact', head: true })
      .or('jurisdiction.ilike.%Los Angeles%, jurisdiction.ilike.%LA County%, jurisdiction.ilike.%L.A.%, court_name.ilike.%Los Angeles%')

    if (countError) {
      console.error('Error counting LA County judges:', countError)
    }

    // Filter for available slots if requested
    let filteredJudges = judges || []
    if (availableSlotsOnly && includeSlots) {
      filteredJudges = judges?.filter(judge => {
        const slots = (judge as any).attorney_slots || []
        return slots.length < 3 // Assuming max 3 slots per judge
      }) || []
    }

    // Calculate advertising slot availability
    const judgesWithSlotInfo = filteredJudges.map(judge => {
      if (!judge || typeof judge !== 'object') return judge;
      
      return {
        ...(judge as Record<string, any>),
        advertising_slots: {
          total: 3, // Maximum slots per judge
          occupied: includeSlots ? ((judge as any).attorney_slots?.length || 0) : 0,
          available: includeSlots ? (3 - ((judge as any).attorney_slots?.length || 0)) : 3
        }
      }
    })

    return NextResponse.json({
      judges: judgesWithSlotInfo,
      total_count: totalCount || 0,
      page,
      per_page: limit,
      has_more: (page * limit) < (totalCount || 0),
      county: 'LA County',
      revenue_potential: {
        target_judges: judgesWithSlotInfo.length,
        max_slots: judgesWithSlotInfo.length * 3,
        available_slots: judgesWithSlotInfo.reduce((sum, judge) => sum + ((judge as any)?.advertising_slots?.available || 0), 0),
        estimated_monthly_revenue: judgesWithSlotInfo.reduce((sum, judge) => sum + ((judge as any)?.advertising_slots?.available || 0), 0) * 500 // $500 per slot
      }
    })

  } catch (error) {
    console.error('LA County judges API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}