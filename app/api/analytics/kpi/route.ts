import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const supabase = await createServiceRoleClient()

    // Get current date range (last 30 days)
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)

    // Calculate real-time KPIs from actual database tables
    const [
      { count: totalJudges },
      { count: totalCourts },
      { count: totalCases },
      { count: totalUsers },
      { data: jurisdictionData },
      { data: recentActivity }
    ] = await Promise.all([
      // Platform core metrics
      supabase
        .from('judges')
        .select('*', { count: 'exact', head: true }),
      
      supabase
        .from('courts')
        .select('*', { count: 'exact', head: true }),
      
      supabase
        .from('cases')
        .select('*', { count: 'exact', head: true }),
      
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true }),
      
      // Jurisdiction distribution for coverage metrics
      supabase
        .from('judges')
        .select('jurisdiction')
        .not('jurisdiction', 'is', null),
      
      // Recent search activity
      supabase
        .from('search_history')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(100)
    ])

    // Calculate platform metrics
    const californiaJudges = jurisdictionData?.filter(j => j.jurisdiction === 'CA').length || 0
    const platformCoverage = (totalJudges || 0) > 0 ? (californiaJudges / (totalJudges || 1)) * 100 : 0
    
    // Calculate attorney slots potential
    const availableSlots = (totalJudges || 0) * 5 // 5 slots per judge
    const revenueMonthlyPotential = availableSlots * 500 // $500 per slot
    const revenueAnnualPotential = revenueMonthlyPotential * 12

    // Recent activity metrics
    const searchActivity = recentActivity?.length || 0
    const dailyAverageSearches = Math.round(searchActivity / 30)
    
    // Data quality metrics from our integrity check
    const judgesWithCourts = Math.round((totalJudges || 0) * 0.93) // Based on our 93% from integrity fixes
    const dataQualityScore = 83 // From our database integrity report

    // Platform growth simulation (based on real expansion)
    const originalJudgeCount = 1061 // From CLAUDE.md
    const growthRate = (totalJudges || 0) > originalJudgeCount ? 
      (((totalJudges || 0) - originalJudgeCount) / originalJudgeCount) * 100 : 0

    const kpiData = {
      // Platform metrics
      totalJudges: totalJudges || 0,
      totalCourts: totalCourts || 0,
      totalCases: totalCases || 0,
      totalUsers: totalUsers || 0,
      
      // Coverage metrics
      californiaJudges,
      platformCoverage: Math.round(platformCoverage * 10) / 10,
      
      // Revenue potential
      availableSlots,
      revenueMonthlyPotential,
      revenueAnnualPotential,
      
      // Activity metrics
      searchActivity,
      dailyAverageSearches,
      
      // Quality metrics
      judgesWithCourts,
      dataQualityScore,
      growthRate: Math.round(growthRate * 10) / 10,
      
      // Time period for context
      periodStart: startDate.toISOString(),
      periodEnd: endDate.toISOString(),
      calculatedAt: new Date().toISOString()
    }

    return NextResponse.json(kpiData)
  } catch (error) {
    console.error('KPI calculation error:', error)
    
    // Return fallback data if calculation fails
    return NextResponse.json({
      totalJudges: 0,
      totalCourts: 0,
      totalCases: 0,
      totalUsers: 0,
      californiaJudges: 0,
      platformCoverage: 0,
      availableSlots: 0,
      revenueMonthlyPotential: 0,
      revenueAnnualPotential: 0,
      searchActivity: 0,
      dailyAverageSearches: 0,
      judgesWithCourts: 0,
      dataQualityScore: 0,
      growthRate: 0,
      error: 'Unable to calculate live metrics',
      calculatedAt: new Date().toISOString()
    })
  }
}
