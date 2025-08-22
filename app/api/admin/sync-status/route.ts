import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SyncQueueManager } from '@/lib/sync/queue-manager'
import { logger } from '@/lib/utils/logger'

export const dynamic = 'force-dynamic'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const apiKey = request.headers.get('x-api-key')
    if (!apiKey || apiKey !== process.env.SYNC_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const queueManager = new SyncQueueManager()

    // Get sync health metrics
    const { data: healthMetrics, error: healthError } = await supabase
      .rpc('get_sync_health')

    if (healthError) {
      logger.error('Failed to get sync health metrics', { error: healthError })
    }

    // Get recent sync logs
    const { data: recentLogs, error: logsError } = await supabase
      .from('sync_logs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(10)

    if (logsError) {
      logger.error('Failed to get recent logs', { error: logsError })
    }

    // Get queue statistics
    const queueStats = await queueManager.getStats()

    // Get sync dashboard view
    const { data: dashboard, error: dashboardError } = await supabase
      .from('sync_dashboard')
      .select('*')

    if (dashboardError) {
      logger.error('Failed to get dashboard data', { error: dashboardError })
    }

    // Get queue status view
    const { data: queueStatus, error: queueError } = await supabase
      .from('queue_status')
      .select('*')

    if (queueError) {
      logger.error('Failed to get queue status', { error: queueError })
    }

    // Get data freshness metrics
    const { data: dataFreshness, error: freshnessError } = await supabase
      .from('judges')
      .select('jurisdiction, last_synced_at')
      .eq('jurisdiction', 'CA')
      .not('last_synced_at', 'is', null)
      .order('last_synced_at', { ascending: false })
      .limit(1)

    const { data: recentDecisions, error: decisionsError } = await supabase
      .from('cases')
      .select('created_at')
      .eq('sync_source', 'courtlistener')
      .order('created_at', { ascending: false })
      .limit(1)

    // Calculate uptime and performance metrics
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const { data: dailyStats, error: dailyStatsError } = await supabase
      .from('sync_logs')
      .select('status, duration_ms')
      .gte('started_at', oneDayAgo.toISOString())

    const { data: weeklyStats, error: weeklyStatsError } = await supabase
      .from('sync_logs')
      .select('status, duration_ms')
      .gte('started_at', oneWeekAgo.toISOString())

    // Calculate metrics
    const dailySuccessRate = dailyStats ? 
      (dailyStats.filter(s => s.status === 'completed').length / dailyStats.length * 100) : 0

    const weeklySuccessRate = weeklyStats ? 
      (weeklyStats.filter(s => s.status === 'completed').length / weeklyStats.length * 100) : 0

    const avgDuration = dailyStats && dailyStats.length > 0 ? 
      dailyStats.reduce((sum, s) => sum + (s.duration_ms || 0), 0) / dailyStats.length : 0

    const status = {
      timestamp: now.toISOString(),
      
      // Overall health
      health: {
        status: determineOverallHealth(healthMetrics, queueStats, dailySuccessRate),
        metrics: healthMetrics || [],
        uptime: calculateUptime(recentLogs || [])
      },

      // Queue status
      queue: {
        stats: queueStats,
        status: queueStatus || [],
        backlog: queueStats.pending + queueStats.running
      },

      // Recent performance
      performance: {
        daily: {
          total_runs: dailyStats?.length || 0,
          success_rate: Math.round(dailySuccessRate * 100) / 100,
          avg_duration_ms: Math.round(avgDuration),
          failed_runs: dailyStats?.filter(s => s.status === 'failed').length || 0
        },
        weekly: {
          total_runs: weeklyStats?.length || 0,
          success_rate: Math.round(weeklySuccessRate * 100) / 100,
          failed_runs: weeklyStats?.filter(s => s.status === 'failed').length || 0
        }
      },

      // Data freshness
      freshness: {
        judges: {
          last_sync: dataFreshness?.[0]?.last_synced_at || null,
          hours_since: dataFreshness?.[0]?.last_synced_at ? 
            Math.round((now.getTime() - new Date(dataFreshness[0].last_synced_at).getTime()) / (1000 * 60 * 60)) : null
        },
        decisions: {
          last_created: recentDecisions?.[0]?.created_at || null,
          hours_since: recentDecisions?.[0]?.created_at ? 
            Math.round((now.getTime() - new Date(recentDecisions[0].created_at).getTime()) / (1000 * 60 * 60)) : null
        }
      },

      // Recent activity
      recent_logs: (recentLogs || []).map(log => ({
        id: log.id,
        sync_type: log.sync_type,
        status: log.status,
        started_at: log.started_at,
        duration_ms: log.duration_ms,
        error_message: log.error_message
      })),

      // Sync breakdown
      sync_breakdown: dashboard || []
    }

    return NextResponse.json(status)

  } catch (error) {
    logger.error('Failed to get sync status', { error })
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get sync status',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

/**
 * Trigger manual sync operations
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const apiKey = request.headers.get('x-api-key')
    if (!apiKey || apiKey !== process.env.SYNC_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const action = body.action // 'queue_job', 'cancel_jobs', 'cleanup', 'restart_queue'
    
    const queueManager = new SyncQueueManager()

    switch (action) {
      case 'queue_job':
        const jobId = await queueManager.addJob(
          body.type || 'decision',
          body.options || {},
          body.priority || 100
        )
        
        return NextResponse.json({
          success: true,
          message: 'Job queued successfully',
          jobId,
          timestamp: new Date().toISOString()
        })

      case 'cancel_jobs':
        const cancelledCount = await queueManager.cancelJobs(body.type)
        
        return NextResponse.json({
          success: true,
          message: `${cancelledCount} jobs cancelled`,
          cancelledCount,
          timestamp: new Date().toISOString()
        })

      case 'cleanup':
        const cleanupResult = await queueManager.cleanupOldJobs(body.days || 7)
        
        return NextResponse.json({
          success: true,
          message: `${cleanupResult} old jobs cleaned up`,
          deletedCount: cleanupResult,
          timestamp: new Date().toISOString()
        })

      case 'restart_queue':
        queueManager.stopProcessing()
        queueManager.startProcessing()
        
        return NextResponse.json({
          success: true,
          message: 'Queue processing restarted',
          timestamp: new Date().toISOString()
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' }, 
          { status: 400 }
        )
    }

  } catch (error) {
    logger.error('Failed to execute admin action', { error })
    
    return NextResponse.json({
      success: false,
      error: 'Failed to execute admin action',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

/**
 * Determine overall system health
 */
function determineOverallHealth(healthMetrics: any[], queueStats: any, successRate: number): string {
  const pendingJobs = queueStats.pending || 0
  
  if (successRate < 75 || pendingJobs > 100) {
    return 'critical'
  } else if (successRate < 90 || pendingJobs > 50) {
    return 'warning'
  } else if (successRate < 95 || pendingJobs > 20) {
    return 'caution'
  } else {
    return 'healthy'
  }
}

/**
 * Calculate system uptime based on recent logs
 */
function calculateUptime(recentLogs: any[]): number {
  if (recentLogs.length === 0) return 0
  
  const successfulRuns = recentLogs.filter(log => log.status === 'completed').length
  return Math.round((successfulRuns / recentLogs.length) * 100 * 100) / 100
}