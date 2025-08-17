import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const supabase = await createServiceRoleClient()

    // Get current date range (last 30 days)
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)

    // Calculate real-time KPIs from database
    const [
      { data: totalAdvertisements },
      { data: activeAds },
      { data: payments },
      { data: subscriptions },
      { data: totalVisitors },
      { data: slotBookings }
    ] = await Promise.all([
      // Total advertisement records
      supabase
        .from('advertisements')
        .select('*', { count: 'exact', head: true }),
      
      // Active advertisements
      supabase
        .from('advertisements')
        .select('*')
        .eq('status', 'active'),
      
      // Payment history for LTV calculation
      supabase
        .from('payment_history')
        .select('amount, user_id, created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString()),
      
      // Active subscriptions
      supabase
        .from('subscriptions')
        .select('*')
        .eq('status', 'active'),
      
      // Analytics events for traffic data
      supabase
        .from('analytics_events')
        .select('event_type, created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString()),
      
      // Attorney slot bookings (advertisements created in last 30 days)
      supabase
        .from('advertisements')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
    ])

    // Calculate conversion metrics
    const pageViews = totalVisitors?.filter(event => 
      event.event_type === 'page_view' || event.event_type === 'judge_view'
    ).length || 0

    const slotBookingCount = slotBookings?.length || 0
    const conversionRate = pageViews > 0 ? (slotBookingCount / pageViews) * 100 : 0

    // Calculate customer LTV
    const uniqueCustomers = new Set(payments?.map(p => p.user_id) || []).size
    const totalRevenue = payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0
    const averageLTV = uniqueCustomers > 0 ? totalRevenue / uniqueCustomers / 100 : 0 // Convert from cents

    // Calculate landing page CTR
    const landingPageViews = totalVisitors?.filter(event => 
      event.event_type === 'landing_page_view'
    ).length || 0
    const landingCTR = landingPageViews > 0 ? (slotBookingCount / landingPageViews) * 100 : 0

    // Calculate trial signups (new users in last 30 days)
    const { count: trialSignups } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    // Calculate average page time (mock calculation based on events)
    const sessionEvents = totalVisitors?.length || 0
    const averagePageTime = sessionEvents > 0 ? (sessionEvents * 2.5) : 4.2 // Average 2.5 minutes per session

    const kpiData = {
      conversionRate: Math.round(conversionRate * 10) / 10,
      landingCTR: Math.round(landingCTR * 10) / 10,
      averageLTV: Math.round(averageLTV),
      slotBookings: slotBookingCount,
      trialSignups: trialSignups || 0,
      averagePageTime: `${Math.round(averagePageTime * 10) / 10}m`,
      
      // Additional metrics for dashboard
      totalActiveAds: activeAds?.length || 0,
      totalRevenue: Math.round(totalRevenue / 100), // Convert from cents
      totalSubscriptions: subscriptions?.length || 0,
      pageViews,
      
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
      conversionRate: 0.0,
      landingCTR: 0.0,
      averageLTV: 0,
      slotBookings: 0,
      trialSignups: 0,
      averagePageTime: '0.0m',
      totalActiveAds: 0,
      totalRevenue: 0,
      totalSubscriptions: 0,
      pageViews: 0,
      error: 'Unable to calculate live metrics',
      calculatedAt: new Date().toISOString()
    })
  }
}
