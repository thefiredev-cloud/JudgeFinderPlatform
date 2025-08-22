import { NextResponse } from 'next/server'
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export const runtime = 'nodejs'

// GET revenue analytics and KPIs
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const timeframe = url.searchParams.get('timeframe') || 'month'
    const metric = url.searchParams.get('metric') || 'all'
    
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin for full analytics access
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'admin'

    // Calculate date ranges
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfYear = new Date(now.getFullYear(), 0, 1)
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))

    let dateFilter = startOfMonth
    if (timeframe === 'week') dateFilter = startOfWeek
    if (timeframe === 'year') dateFilter = startOfYear
    if (timeframe === 'all') dateFilter = new Date('2024-01-01')

    // Fetch revenue data
    let revenueQuery = supabase
      .from('revenue_tracking')
      .select('*')
      .gte('created_at', dateFilter.toISOString())
      .eq('status', 'completed')

    if (!isAdmin) {
      revenueQuery = revenueQuery.eq('user_id', user.id)
    }

    const { data: revenueData } = await revenueQuery

    // Calculate key metrics
    const totalRevenue = revenueData?.reduce((sum, r) => sum + Number(r.amount), 0) || 0
    const transactionCount = revenueData?.length || 0
    const averageOrderValue = transactionCount > 0 ? totalRevenue / transactionCount : 0

    // Fetch conversion data
    const { data: conversionData } = await supabase
      .from('conversion_tracking')
      .select('*')
      .gte('created_at', dateFilter.toISOString())

    const visitors = conversionData?.filter(c => c.funnel_stage === 'visitor').length || 0
    const signups = conversionData?.filter(c => c.conversion_type === 'signup').length || 0
    const purchases = conversionData?.filter(c => c.conversion_type === 'purchase').length || 0
    const upsells = conversionData?.filter(c => c.conversion_type === 'upsell').length || 0

    const conversionRate = visitors > 0 ? (purchases / visitors) * 100 : 0
    const signupRate = visitors > 0 ? (signups / visitors) * 100 : 0
    const upsellRate = purchases > 0 ? (upsells / purchases) * 100 : 0

    // Fetch active subscriptions
    const { data: activeSubscriptions } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('status', 'active')

    const mrr = activeSubscriptions?.reduce((sum, sub) => {
      // Extract monthly value from subscriptions
      return sum + 500 // Default $500/month per subscription
    }, 0) || 0

    // Fetch KPI metrics for trends
    const { data: kpiData } = await supabase
      .from('kpi_metrics')
      .select('*')
      .gte('metric_date', dateFilter.toISOString())
      .order('metric_date', { ascending: true })

    // Group revenue by day for chart
    const revenueByDay = revenueData?.reduce((acc: any, r: any) => {
      const date = new Date(r.created_at).toISOString().split('T')[0]
      if (!acc[date]) acc[date] = 0
      acc[date] += Number(r.amount)
      return acc
    }, {}) || {}

    // Calculate growth rate
    const previousPeriodStart = new Date(dateFilter)
    previousPeriodStart.setMonth(previousPeriodStart.getMonth() - 1)
    
    const { data: previousRevenue } = await supabase
      .from('revenue_tracking')
      .select('amount')
      .gte('created_at', previousPeriodStart.toISOString())
      .lt('created_at', dateFilter.toISOString())
      .eq('status', 'completed')

    const previousTotal = previousRevenue?.reduce((sum, r) => sum + Number(r.amount), 0) || 0
    const growthRate = previousTotal > 0 ? ((totalRevenue - previousTotal) / previousTotal) * 100 : 0

    // Fetch campaign performance if admin
    let campaignData = null
    if (isAdmin) {
      const { data: campaigns } = await supabase
        .from('marketing_campaigns')
        .select('*')
        .eq('status', 'active')

      campaignData = campaigns
    }

    // Return comprehensive analytics
    return NextResponse.json({
      summary: {
        totalRevenue,
        mrr,
        transactionCount,
        averageOrderValue,
        growthRate: growthRate.toFixed(2),
        activeSubscriptions: activeSubscriptions?.length || 0
      },
      conversion: {
        visitors,
        signups,
        purchases,
        upsells,
        conversionRate: conversionRate.toFixed(2),
        signupRate: signupRate.toFixed(2),
        upsellRate: upsellRate.toFixed(2)
      },
      revenueChart: Object.entries(revenueByDay).map(([date, amount]) => ({
        date,
        amount
      })),
      kpiMetrics: kpiData,
      campaigns: campaignData,
      timeframe,
      dateRange: {
        from: dateFilter.toISOString(),
        to: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Revenue analytics error:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}

// POST new revenue record
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId, judgeId, advertisementId, amount, type, metadata } = body

    const supabase = await createServiceRoleClient()

    // Create revenue record
    const { data: revenue, error } = await supabase
      .from('revenue_tracking')
      .insert({
        user_id: userId,
        judge_id: judgeId,
        advertisement_id: advertisementId,
        revenue_type: type || 'subscription',
        amount,
        status: 'completed',
        metadata
      })
      .select()
      .single()

    if (error) {
      console.error('Revenue tracking error:', error)
      return NextResponse.json({ error: 'Failed to track revenue' }, { status: 500 })
    }

    // Update KPI metrics
    const today = new Date().toISOString().split('T')[0]
    await supabase
      .from('kpi_metrics')
      .insert({
        metric_date: today,
        metric_type: 'revenue',
        metric_name: 'daily_revenue',
        metric_value: amount,
        metric_context: { source: type, user_id: userId }
      })

    // Track conversion if new customer
    if (type === 'subscription') {
      await supabase
        .from('conversion_tracking')
        .insert({
          user_id: userId,
          funnel_stage: 'recurring',
          conversion_type: 'purchase',
          revenue_impact: amount,
          metadata
        })
    }

    return NextResponse.json({ revenue, message: 'Revenue tracked successfully' })

  } catch (error) {
    console.error('Revenue tracking error:', error)
    return NextResponse.json({ error: 'Failed to track revenue' }, { status: 500 })
  }
}

// PATCH update revenue forecast
export async function PATCH(req: Request) {
  try {
    const supabase = await createServiceRoleClient()
    
    // Calculate and store daily analytics
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    // Get yesterday's revenue
    const { data: yesterdayRevenue } = await supabase
      .from('revenue_tracking')
      .select('amount')
      .gte('created_at', yesterday.toISOString().split('T')[0])
      .lt('created_at', today.toISOString().split('T')[0])
      .eq('status', 'completed')

    const dailyTotal = yesterdayRevenue?.reduce((sum, r) => sum + Number(r.amount), 0) || 0

    // Get active users count
    const { data: activeUsers } = await supabase
      .from('users')
      .select('id')
      .gte('created_at', yesterday.toISOString().split('T')[0])

    // Get conversion metrics
    const { data: conversions } = await supabase
      .from('conversion_tracking')
      .select('*')
      .gte('created_at', yesterday.toISOString().split('T')[0])
      .lt('created_at', today.toISOString().split('T')[0])

    const dailyConversions = conversions?.filter(c => c.conversion_type === 'purchase').length || 0
    const dailyVisitors = conversions?.filter(c => c.funnel_stage === 'visitor').length || 0
    const dailyConversionRate = dailyVisitors > 0 ? (dailyConversions / dailyVisitors) * 100 : 0

    // Store admin analytics
    await supabase
      .from('admin_analytics')
      .insert({
        analytics_date: yesterday.toISOString().split('T')[0],
        metric_category: 'revenue',
        daily_revenue: dailyTotal,
        new_users: activeUsers?.length || 0,
        conversion_rate: dailyConversionRate,
        metadata: {
          visitors: dailyVisitors,
          conversions: dailyConversions
        }
      })

    return NextResponse.json({ 
      message: 'Analytics updated',
      dailyRevenue: dailyTotal,
      conversionRate: dailyConversionRate
    })

  } catch (error) {
    console.error('Analytics update error:', error)
    return NextResponse.json({ error: 'Failed to update analytics' }, { status: 500 })
  }
}