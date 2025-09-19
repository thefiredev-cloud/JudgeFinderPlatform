import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth/is-admin'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

export const dynamic = 'force-dynamic'

function calculatePercentile(values: number[], percentile: number): number | null {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const index = (sorted.length - 1) * percentile
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  if (lower === upper) {
    return Math.round(sorted[lower])
  }
  const weight = index - lower
  return Math.round(sorted[lower] * (1 - weight) + sorted[upper] * weight)
}

export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId || !(await isAdmin())) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabase = await createServiceRoleClient()
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const [
      judgesRes,
      courtsRes,
      casesRes,
      usersRes,
      pendingRes,
      syncLogsRes,
      retryRowsRes,
      performanceRowsRes,
    ] = await Promise.all([
      supabase.from('judges').select('*', { count: 'exact', head: true }),
      supabase.from('courts').select('*', { count: 'exact', head: true }),
      supabase.from('cases').select('*', { count: 'exact', head: true }),
      supabase.from('user_preferences').select('*', { count: 'exact', head: true }),
      supabase
        .from('sync_queue')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),
      supabase
        .from('sync_logs')
        .select('status, duration_ms, completed_at, started_at')
        .gte('started_at', since)
        .order('started_at', { ascending: false }),
      supabase
        .from('sync_queue')
        .select('retry_count')
        .gt('retry_count', 0),
      supabase
        .from('performance_metrics')
        .select('metric_name, metric_value')
        .gte('timestamp', since)
        .in('metric_name', [
          'judge_lookup_cache_hit',
          'court_cache_hit',
          'judge_lookup_slug_lookup',
          'court_slug_lookup',
        ]),
    ])

    if (judgesRes.error) {
      logger.error('Error fetching judges count', { error: judgesRes.error.message })
      return NextResponse.json({ error: 'Failed to fetch judges count' }, { status: 500 })
    }

    if (courtsRes.error) {
      logger.error('Error fetching courts count', { error: courtsRes.error.message })
      return NextResponse.json({ error: 'Failed to fetch courts count' }, { status: 500 })
    }

    if (casesRes.error) {
      logger.error('Error fetching case count', { error: casesRes.error.message })
      return NextResponse.json({ error: 'Failed to fetch case count' }, { status: 500 })
    }

    if (usersRes.error) {
      logger.error('Error fetching users count', { error: usersRes.error.message })
      return NextResponse.json({ error: 'Failed to fetch users count' }, { status: 500 })
    }

    if (pendingRes.error) {
      logger.error('Error fetching pending sync count', { error: pendingRes.error.message })
    }

    if (syncLogsRes.error) {
      logger.error('Error fetching sync logs', { error: syncLogsRes.error.message })
    }

    if (retryRowsRes.error) {
      logger.error('Error fetching retry rows', { error: retryRowsRes.error.message })
    }

    if (performanceRowsRes.error) {
      logger.error('Error fetching performance metrics', { error: performanceRowsRes.error.message })
    }

    const judgesCount = judgesRes.count || 0
    const courtsCount = courtsRes.count || 0
    const casesCount = casesRes.count || 0
    const usersCount = usersRes.count || 0
    const pendingSync = pendingRes.count || 0
    const syncLogs = syncLogsRes.data || []
    const retryRows = retryRowsRes.data || []
    const performanceRows = performanceRowsRes.data || []

    const completedLogs = syncLogs.filter((log) => log.status === 'completed')
    const successRate = syncLogs.length
      ? Math.round((completedLogs.length / syncLogs.length) * 1000) / 10
      : 0
    const lastSyncTime = completedLogs.length ? completedLogs[0].completed_at : null

    const retryCount = retryRows.reduce((total, row) => total + (row.retry_count || 0), 0)

    const hitCount = performanceRows.filter((row) => row.metric_name.endsWith('cache_hit')).length
    const lookupCount = performanceRows.filter((row) => row.metric_name.endsWith('slug_lookup')).length
    const totalLookups = hitCount + lookupCount
    const cacheHitRatio = totalLookups > 0 ? Math.round((hitCount / totalLookups) * 1000) / 10 : 0

    const latencyValues = performanceRows
      .filter((row) => row.metric_name.endsWith('slug_lookup'))
      .map((row) => Number(row.metric_value))
      .filter((value) => Number.isFinite(value) && value >= 0)

    const latencyP50 = calculatePercentile(latencyValues, 0.5)
    const latencyP95 = calculatePercentile(latencyValues, 0.95)

    let systemHealth: 'healthy' | 'warning' | 'error' = 'healthy'
    if (judgesCount < 1000) systemHealth = 'warning'
    if (judgesCount < 500) systemHealth = 'error'

    return NextResponse.json({
      totalJudges: judgesCount,
      totalCourts: courtsCount,
      totalCases: casesCount,
      totalUsers: usersCount,
      pendingSync,
      lastSyncTime,
      systemHealth,
      activeUsers: Math.floor(usersCount * 0.3),
      searchVolume: totalLookups,
      syncSuccessRate: successRate,
      retryCount,
      cacheHitRatio,
      latencyP50,
      latencyP95,
    })
  } catch (error) {
    logger.error('Admin stats error', {}, error instanceof Error ? error : undefined)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
