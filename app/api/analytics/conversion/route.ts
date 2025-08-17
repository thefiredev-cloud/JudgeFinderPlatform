import { NextResponse } from 'next/server'
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

export const runtime = 'nodejs'

// GET conversion analytics
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const timeframe = url.searchParams.get('timeframe') || 'month'
    const funnel = url.searchParams.get('funnel') || 'all'
    
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Calculate date range
    const now = new Date()
    let startDate = new Date(now.getFullYear(), now.getMonth(), 1) // Start of month
    
    if (timeframe === 'week') {
      startDate = new Date(now.setDate(now.getDate() - 7))
    } else if (timeframe === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1)
    }

    // Fetch conversion data
    let query = supabase
      .from('conversion_tracking')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })

    if (funnel !== 'all') {
      query = query.eq('funnel_stage', funnel)
    }

    const { data: conversions } = await query

    // Calculate funnel metrics
    const funnelStages = ['visitor', 'signup', 'verification', 'first_ad', 'recurring']
    const stageMetrics = funnelStages.map(stage => {
      const stageData = conversions?.filter(c => c.funnel_stage === stage) || []
      return {
        stage,
        count: stageData.length,
        unique_users: [...new Set(stageData.map(c => c.user_id).filter(Boolean))].length,
        revenue_impact: stageData.reduce((sum, c) => sum + (c.revenue_impact || 0), 0)
      }
    })

    // Calculate conversion rates between stages
    const conversionRates = []
    for (let i = 0; i < stageMetrics.length - 1; i++) {
      const current = stageMetrics[i]
      const next = stageMetrics[i + 1]
      const rate = current.count > 0 ? (next.count / current.count) * 100 : 0
      
      conversionRates.push({
        from: current.stage,
        to: next.stage,
        rate: parseFloat(rate.toFixed(2)),
        absolute: next.count
      })
    }

    // Group by source/medium
    const sourceMetrics = conversions?.reduce((acc: any, conv: any) => {
      const source = conv.source || 'direct'
      if (!acc[source]) {
        acc[source] = {
          visitors: 0,
          signups: 0,
          purchases: 0,
          revenue: 0
        }
      }
      
      if (conv.funnel_stage === 'visitor') acc[source].visitors++
      if (conv.conversion_type === 'signup') acc[source].signups++
      if (conv.conversion_type === 'purchase') acc[source].purchases++
      acc[source].revenue += conv.revenue_impact || 0
      
      return acc
    }, {})

    // Calculate daily conversion trends
    const dailyTrends = conversions?.reduce((acc: any, conv: any) => {
      const date = conv.created_at.split('T')[0]
      if (!acc[date]) {
        acc[date] = {
          date,
          visitors: 0,
          signups: 0,
          purchases: 0,
          revenue: 0
        }
      }
      
      if (conv.funnel_stage === 'visitor') acc[date].visitors++
      if (conv.conversion_type === 'signup') acc[date].signups++
      if (conv.conversion_type === 'purchase') acc[date].purchases++
      acc[date].revenue += conv.revenue_impact || 0
      
      return acc
    }, {})

    return NextResponse.json({
      funnelStages: stageMetrics,
      conversionRates,
      sourceMetrics: Object.entries(sourceMetrics || {}).map(([source, data]) => ({
        source,
        ...(data as object)
      })),
      dailyTrends: Object.values(dailyTrends || {}),
      summary: {
        totalVisitors: stageMetrics[0]?.count || 0,
        totalSignups: stageMetrics[1]?.count || 0,
        totalPurchases: conversions?.filter(c => c.conversion_type === 'purchase').length || 0,
        totalRevenue: conversions?.reduce((sum, c) => sum + (c.revenue_impact || 0), 0) || 0,
        overallConversionRate: stageMetrics[0]?.count > 0 
          ? ((conversions?.filter(c => c.conversion_type === 'purchase').length || 0) / stageMetrics[0].count * 100).toFixed(2)
          : '0.00'
      }
    })

  } catch (error) {
    console.error('Conversion analytics error:', error)
    return NextResponse.json({ error: 'Failed to fetch conversion data' }, { status: 500 })
  }
}

// POST track conversion event
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { 
      userId, 
      sessionId, 
      funnelStage, 
      conversionType, 
      source, 
      utmParams = {},
      revenueImpact = 0,
      metadata = {} 
    } = body

    const supabase = await createServiceRoleClient()
    
    // Get user IP and user agent for tracking
    const headersList = await headers()
    const forwardedFor = headersList.get('x-forwarded-for')
    const userAgent = headersList.get('user-agent')
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 'unknown'

    // Create conversion tracking record
    const { data: conversion, error } = await supabase
      .from('conversion_tracking')
      .insert({
        user_id: userId || null,
        session_id: sessionId || `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        funnel_stage: funnelStage,
        conversion_type: conversionType || null,
        source: source || 'direct',
        utm_source: utmParams.utm_source || null,
        utm_medium: utmParams.utm_medium || null,
        utm_campaign: utmParams.utm_campaign || null,
        revenue_impact: revenueImpact,
        metadata: {
          ...metadata,
          ip_address: ip,
          user_agent: userAgent,
          timestamp: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (error) {
      console.error('Conversion tracking error:', error)
      return NextResponse.json({ error: 'Failed to track conversion' }, { status: 500 })
    }

    // Update daily KPI metrics
    const today = new Date().toISOString().split('T')[0]
    await supabase
      .from('kpi_metrics')
      .insert({
        metric_date: today,
        metric_type: 'conversion',
        metric_name: `${funnelStage}_${conversionType || 'event'}`,
        metric_value: 1,
        metric_context: {
          user_id: userId,
          source,
          revenue_impact: revenueImpact
        }
      })

    return NextResponse.json({ 
      success: true, 
      conversion,
      message: 'Conversion tracked successfully' 
    })

  } catch (error) {
    console.error('Conversion tracking error:', error)
    return NextResponse.json({ error: 'Failed to track conversion' }, { status: 500 })
  }
}

// PATCH update conversion data (for attribution)
export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const { conversionId, revenueImpact, metadata } = body

    const supabase = await createServiceRoleClient()

    const { error } = await supabase
      .from('conversion_tracking')
      .update({
        revenue_impact: revenueImpact,
        metadata: metadata
      })
      .eq('id', conversionId)

    if (error) {
      return NextResponse.json({ error: 'Failed to update conversion' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Conversion updated' })

  } catch (error) {
    console.error('Conversion update error:', error)
    return NextResponse.json({ error: 'Failed to update conversion' }, { status: 500 })
  }
}