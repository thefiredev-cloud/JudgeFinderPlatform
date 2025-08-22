import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      value,
      delta,
      id,
      rating,
      url,
      userAgent,
      timestamp,
      pageType,
      connectionType
    } = body

    // Validate required fields
    if (!name || typeof value !== 'number' || !url) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = await createServerClient()

    // Store performance metrics for analysis (if table exists)
    try {
      // First check if table exists
      const { data: tableExists } = await supabase
        .from('performance_metrics')
        .select('id')
        .limit(1)

      if (tableExists !== null) {
        const { error } = await supabase
          .from('performance_metrics')
          .insert({
            metric_name: name,
            metric_value: value,
            metric_delta: delta,
            metric_id: id,
            rating: rating,
            page_url: url,
            user_agent: userAgent,
            timestamp: new Date(timestamp).toISOString(),
            page_type: pageType,
            connection_type: connectionType,
            ip_address: request.ip || request.headers.get('x-forwarded-for') || 'unknown'
          })

        if (error) {
          // Log error but don't spam console
          if (error.code !== 'PGRST205') {
            console.error('Error storing performance metric:', error.message)
          }
        }
      }
    } catch (tableError) {
      // Table doesn't exist or other structural issue - silent fail
      // Only log once per session to avoid spam
      if (!(global as any).performanceTableWarningLogged) {
        console.log('Performance metrics table not available, analytics disabled')
        ;(global as any).performanceTableWarningLogged = true
      }
    }

    // Flag performance issues for immediate attention
    if (rating === 'poor') {
      const performanceIssue = {
        metric_name: name,
        metric_value: value,
        page_url: url,
        page_type: pageType,
        severity: 'high',
        reported_at: new Date().toISOString()
      }

      // Could integrate with monitoring services here
      console.warn('Performance issue detected:', performanceIssue)
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Performance analytics error:', error)
    return NextResponse.json({ error: 'Analytics error' }, { status: 500 })
  }
}

// Optional: GET endpoint to retrieve performance data for dashboard
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const pageType = url.searchParams.get('pageType')
    const days = parseInt(url.searchParams.get('days') || '7')

    const supabase = await createServerClient()
    let metrics: any[] = []

    try {
      // Check if table exists first
      const { data: tableCheck } = await supabase
        .from('performance_metrics')
        .select('id')
        .limit(1)

      if (tableCheck === null) {
        return NextResponse.json({ metrics: {}, message: 'Performance tracking not enabled' })
      }

      const query = supabase
        .from('performance_metrics')
        .select('*')
        .gte('timestamp', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .order('timestamp', { ascending: false })

      if (pageType) {
        query.eq('page_type', pageType)
      }

      const { data, error } = await query

      if (error) {
        if (error.code !== 'PGRST205') {
          console.log('Performance metrics query error:', error.message)
        }
        return NextResponse.json({ metrics: {}, message: 'Performance tracking not enabled' })
      }

      metrics = data || []
    } catch (tableError) {
      return NextResponse.json({ metrics: {}, message: 'Performance tracking not enabled' })
    }

    // Aggregate performance data for analysis
    const aggregated = metrics.reduce((acc: any, metric: any) => {
      if (!acc[metric.metric_name]) {
        acc[metric.metric_name] = {
          name: metric.metric_name,
          values: [],
          good: 0,
          needsImprovement: 0,
          poor: 0
        }
      }
      
      acc[metric.metric_name].values.push(metric.metric_value)
      acc[metric.metric_name][metric.rating === 'good' ? 'good' : 
                              metric.rating === 'poor' ? 'poor' : 'needsImprovement']++
      
      return acc
    }, {})

    return NextResponse.json({ metrics: aggregated })

  } catch (error) {
    console.error('Performance analytics retrieval error:', error)
    return NextResponse.json({ error: 'Failed to retrieve analytics' }, { status: 500 })
  }
}
