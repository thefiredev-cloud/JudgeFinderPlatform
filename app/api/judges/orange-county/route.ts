import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

/**
 * Orange County specific judge API endpoint
 * Supports the $78.5K/month revenue pipeline with targeted data access
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

    // Base query for Orange County judges
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
      .or('jurisdiction.ilike.%Orange County%, jurisdiction.ilike.%Orange%, court_name.ilike.%Orange County%')
      .order('name')

    // Apply search filter if provided
    if (searchQuery) {
      query = query.or(`name.ilike.%${searchQuery}%,court_name.ilike.%${searchQuery}%`)
    }

    // Filter for judges with available slots if requested
    if (availableSlotsOnly && includeSlots) {
      // This would require a more complex query - for now we'll filter in memory
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: judges, error } = await query

    if (error) {
      console.error('Error fetching Orange County judges:', error)
      return NextResponse.json(
        { error: 'Failed to fetch Orange County judges', details: error.message },
        { status: 500 }
      )
    }

    // Get total count for pagination
    const { count: totalCount, error: countError } = await supabase
      .from('judges')
      .select('*', { count: 'exact', head: true })
      .or('jurisdiction.ilike.%Orange County%, jurisdiction.ilike.%Orange%, court_name.ilike.%Orange County%')

    if (countError) {
      console.error('Error counting Orange County judges:', countError)
    }

    // Filter for available slots if requested (post-query filtering)
    let filteredJudges = judges || []
    if (availableSlotsOnly && includeSlots) {
      filteredJudges = judges?.filter(judge => {
        const slots = (judge as any).attorney_slots || []
        return slots.length < 3 // Assuming max 3 slots per judge
      }) || []
    }

    // Calculate advertising slot availability
    const judgesWithSlotInfo = filteredJudges.map(judge => ({
      ...judge,
      advertising_slots: {
        total: 3, // Maximum slots per judge
        occupied: includeSlots ? ((judge as any).attorney_slots?.length || 0) : 0,
        available: includeSlots ? (3 - ((judge as any).attorney_slots?.length || 0)) : 3
      }
    }))

    return NextResponse.json({
      judges: judgesWithSlotInfo,
      total_count: totalCount || 0,
      page,
      per_page: limit,
      has_more: (page * limit) < (totalCount || 0),
      county: 'Orange County',
      revenue_potential: {
        target_judges: judgesWithSlotInfo.length,
        max_slots: judgesWithSlotInfo.length * 3,
        available_slots: judgesWithSlotInfo.reduce((sum, judge) => sum + judge.advertising_slots.available, 0),
        estimated_monthly_revenue: judgesWithSlotInfo.reduce((sum, judge) => sum + judge.advertising_slots.available, 0) * 500 // $500 per slot
      }
    })

  } catch (error) {
    console.error('Orange County judges API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}