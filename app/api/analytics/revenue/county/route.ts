import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * County-specific revenue analytics API
 * Enhances revenue system with geographic targeting capabilities
 */

type County = 'orange-county' | 'la-county' | 'san-diego' | 'santa-clara' | 'all'

const COUNTY_FILTERS: Record<Exclude<County, 'all'>, string> = {
  'orange-county': 'jurisdiction.ilike.%Orange County%, jurisdiction.ilike.%Orange%, court_name.ilike.%Orange County%',
  'la-county': 'jurisdiction.ilike.%Los Angeles%, jurisdiction.ilike.%LA County%, jurisdiction.ilike.%L.A.%, court_name.ilike.%Los Angeles%',
  'san-diego': 'jurisdiction.ilike.%San Diego%, court_name.ilike.%San Diego%',
  'santa-clara': 'jurisdiction.ilike.%Santa Clara%, court_name.ilike.%Santa Clara%'
}

const COUNTY_NAMES: Record<Exclude<County, 'all'>, string> = {
  'orange-county': 'Orange County',
  'la-county': 'LA County',
  'san-diego': 'San Diego County',
  'santa-clara': 'Santa Clara County'
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const county = (searchParams.get('county') || 'all') as County
    const includeForecasting = searchParams.get('include_forecasting') === 'true'
    const includeCompetitiveAnalysis = searchParams.get('include_competitive') === 'true'
    
    const supabase = await createServerClient()

    // Get county-specific or all judge data
    let countyAnalytics: any[] = []
    
    if (county === 'all') {
      // Get analytics for all supported counties
      for (const [countyKey, filter] of Object.entries(COUNTY_FILTERS)) {
        const analytics = await getCountyAnalytics(supabase, countyKey as Exclude<County, 'all'>, filter)
        countyAnalytics.push(analytics)
      }
    } else if (COUNTY_FILTERS[county]) {
      const analytics = await getCountyAnalytics(supabase, county, COUNTY_FILTERS[county])
      countyAnalytics.push(analytics)
    } else {
      return NextResponse.json(
        { error: 'Invalid county. Supported: orange-county, la-county, san-diego, santa-clara, all' },
        { status: 400 }
      )
    }

    // Calculate totals and comparisons
    const totalAnalytics = {
      total_judges: countyAnalytics.reduce((sum, county) => sum + county.judges_count, 0),
      total_slots: countyAnalytics.reduce((sum, county) => sum + county.total_slots, 0),
      total_occupied_slots: countyAnalytics.reduce((sum, county) => sum + county.occupied_slots, 0),
      total_available_slots: countyAnalytics.reduce((sum, county) => sum + county.available_slots, 0),
      total_current_revenue: countyAnalytics.reduce((sum, county) => sum + county.current_monthly_revenue, 0),
      total_potential_revenue: countyAnalytics.reduce((sum, county) => sum + county.potential_monthly_revenue, 0),
      total_revenue_gap: countyAnalytics.reduce((sum, county) => sum + county.revenue_gap, 0)
    }

    // Revenue forecasting
    let forecasting = undefined
    if (includeForecasting) {
      forecasting = generateRevenueForecasting(countyAnalytics, totalAnalytics)
    }

    // Competitive analysis
    let competitiveAnalysis = undefined
    if (includeCompetitiveAnalysis) {
      competitiveAnalysis = generateCompetitiveAnalysis(countyAnalytics)
    }

    return NextResponse.json({
      request_params: {
        county: county,
        include_forecasting: includeForecasting,
        include_competitive: includeCompetitiveAnalysis
      },
      summary: totalAnalytics,
      county_breakdown: countyAnalytics,
      forecasting,
      competitive_analysis: competitiveAnalysis,
      generated_at: new Date().toISOString()
    })

  } catch (error) {
    console.error('County revenue analytics error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function getCountyAnalytics(supabase: any, county: Exclude<County, 'all'>, filter: string) {
  // Get judges with attorney slots
  const { data: judges, error } = await supabase
    .from('judges')
    .select(`
      id,
      name,
      court_name,
      jurisdiction,
      attorney_slots(id, position, price_per_month, is_active)
    `)
    .or(filter)

  if (error) {
    console.error(`Error fetching ${county} data:`, error)
    return createEmptyCountyAnalytics(county)
  }

  const judgesCount = judges?.length || 0
  const totalSlots = judgesCount * 3 // Max 3 slots per judge
  
  // Calculate occupied slots
  let occupiedSlots = 0
  let currentRevenue = 0
  
  judges?.forEach((judge: any) => {
    const activeSlots = judge.attorney_slots?.filter((slot: any) => slot.is_active) || []
    occupiedSlots += activeSlots.length
    currentRevenue += activeSlots.reduce((sum: number, slot: any) => sum + (slot.price_per_month || 500), 0)
  })

  const availableSlots = totalSlots - occupiedSlots
  const potentialRevenue = totalSlots * 500 // $500 per slot
  const revenueGap = potentialRevenue - currentRevenue
  const occupancyRate = totalSlots > 0 ? Math.round((occupiedSlots / totalSlots) * 100) : 0

  return {
    county: COUNTY_NAMES[county],
    county_slug: county,
    judges_count: judgesCount,
    total_slots: totalSlots,
    occupied_slots: occupiedSlots,
    available_slots: availableSlots,
    occupancy_rate: occupancyRate,
    current_monthly_revenue: currentRevenue,
    potential_monthly_revenue: potentialRevenue,
    revenue_gap: revenueGap,
    average_price_per_slot: occupiedSlots > 0 ? Math.round(currentRevenue / occupiedSlots) : 500,
    market_priority: county === 'orange-county' ? 'Primary' : 'Secondary',
    growth_potential: getGrowthPotential(occupancyRate, judgesCount)
  }
}

function createEmptyCountyAnalytics(county: Exclude<County, 'all'>) {
  return {
    county: COUNTY_NAMES[county],
    county_slug: county,
    judges_count: 0,
    total_slots: 0,
    occupied_slots: 0,
    available_slots: 0,
    occupancy_rate: 0,
    current_monthly_revenue: 0,
    potential_monthly_revenue: 0,
    revenue_gap: 0,
    average_price_per_slot: 500,
    market_priority: 'Unknown',
    growth_potential: 'Unknown'
  }
}

function getGrowthPotential(occupancyRate: number, judgesCount: number): string {
  if (judgesCount === 0) return 'Unknown'
  if (occupancyRate === 0) return 'Maximum - Untapped Market'
  if (occupancyRate < 25) return 'High - Low Competition'
  if (occupancyRate < 50) return 'Medium - Moderate Competition'
  if (occupancyRate < 75) return 'Limited - High Competition'
  return 'Saturated - Very High Competition'
}

function generateRevenueForecasting(countyAnalytics: any[], totalAnalytics: any) {
  // 90-day, 6-month, and 12-month projections
  const currentOccupancyRate = totalAnalytics.total_slots > 0 
    ? totalAnalytics.total_occupied_slots / totalAnalytics.total_slots 
    : 0

  // Conservative growth assumptions
  const monthlyGrowthRate = 0.15 // 15% monthly slot fill rate
  const maxOccupancyRate = 0.85 // 85% maximum realistic occupancy

  const projections = [
    { period: '90_days', months: 3 },
    { period: '6_months', months: 6 },
    { period: '12_months', months: 12 }
  ]

  return projections.map(({ period, months }) => {
    // Calculate projected occupancy rate
    let projectedOccupancyRate = currentOccupancyRate
    for (let i = 0; i < months; i++) {
      const remainingCapacity = maxOccupancyRate - projectedOccupancyRate
      projectedOccupancyRate += remainingCapacity * monthlyGrowthRate
      projectedOccupancyRate = Math.min(projectedOccupancyRate, maxOccupancyRate)
    }

    const projectedOccupiedSlots = Math.round(totalAnalytics.total_slots * projectedOccupancyRate)
    const projectedRevenue = projectedOccupiedSlots * 500

    return {
      period,
      months,
      projected_occupancy_rate: Math.round(projectedOccupancyRate * 100),
      projected_occupied_slots: projectedOccupiedSlots,
      projected_monthly_revenue: projectedRevenue,
      revenue_increase: projectedRevenue - totalAnalytics.total_current_revenue,
      confidence_level: months <= 3 ? 'High' : months <= 6 ? 'Medium' : 'Low'
    }
  })
}

function generateCompetitiveAnalysis(countyAnalytics: any[]) {
  // Sort counties by revenue potential
  const sortedCounties = [...countyAnalytics].sort((a, b) => 
    b.potential_monthly_revenue - a.potential_monthly_revenue
  )

  const totalRevenue = countyAnalytics.reduce((sum, county) => sum + county.potential_monthly_revenue, 0)

  return {
    market_leader: sortedCounties[0]?.county || 'Unknown',
    county_rankings: sortedCounties.map((county, index) => ({
      rank: index + 1,
      county: county.county,
      potential_revenue: county.potential_monthly_revenue,
      market_share: totalRevenue > 0 ? Math.round((county.potential_monthly_revenue / totalRevenue) * 100) : 0,
      judges_count: county.judges_count,
      growth_potential: county.growth_potential
    })),
    recommendations: [
      'Focus primary efforts on Orange County (highest volume)',
      'Expand to LA County for entertainment law market',
      'Consider San Diego for geographic diversification',
      'Monitor Santa Clara for tech industry opportunities'
    ]
  }
}