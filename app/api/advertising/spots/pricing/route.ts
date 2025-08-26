import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'


export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { searchParams } = new URL(request.url)
    
    const entityType = searchParams.get('entity_type') || 'judge'
    const courtLevel = searchParams.get('court_level')
    const duration = parseInt(searchParams.get('duration') || '1')

    // Fetch pricing tiers
    let query = supabase
      .from('pricing_tiers')
      .select('*')
      .eq('entity_type', entityType)
      .eq('is_active', true)

    if (courtLevel) {
      query = query.eq('court_level', courtLevel)
    }

    const { data: pricingTiers, error } = await query

    if (error) {
      console.error('Error fetching pricing tiers:', error)
      return NextResponse.json({ error: 'Failed to fetch pricing' }, { status: 500 })
    }

    // Calculate prices with discounts
    const pricing = pricingTiers?.map(tier => {
      const isAnnual = duration >= 12
      const baseMonthlyPrice = tier.monthly_price
      
      let totalPrice: number
      let effectiveMonthlyPrice: number
      let savings = 0

      if (isAnnual) {
        // Annual pricing with discount
        totalPrice = tier.annual_price
        effectiveMonthlyPrice = tier.annual_price / 12
        savings = (baseMonthlyPrice * 12) - tier.annual_price
      } else {
        // Regular monthly pricing
        totalPrice = baseMonthlyPrice * duration
        effectiveMonthlyPrice = baseMonthlyPrice
      }

      return {
        tier_name: tier.tier_name,
        court_level: tier.court_level,
        entity_type: tier.entity_type,
        base_monthly_price: baseMonthlyPrice,
        total_price: totalPrice,
        effective_monthly_price: effectiveMonthlyPrice,
        savings: savings,
        duration_months: duration,
        is_annual: isAnnual,
        features: tier.features
      }
    }) || []

    return NextResponse.json({
      success: true,
      pricing,
      federal_monthly: 500,
      state_monthly: 200,
      federal_annual: 5000,
      state_annual: 2000,
      annual_discount_months: 2
    })
  } catch (error) {
    console.error('Error in pricing API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const body = await request.json()
    
    const {
      tier_name,
      months
    } = body

    // Use the database function to calculate pricing
    const { data, error } = await supabase
      .rpc('calculate_ad_pricing', {
        p_tier_name: tier_name,
        p_months: months
      })
      .single()

    if (error) {
      console.error('Error calculating pricing:', error)
      return NextResponse.json({ error: 'Failed to calculate pricing' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      pricing: data
    })
  } catch (error) {
    console.error('Error in pricing calculation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}