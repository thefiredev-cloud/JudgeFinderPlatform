import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { SyncQueueManager, type QueueStats } from '@/lib/sync/queue-manager'
import { logger } from '@/lib/utils/logger'

export interface SyncStatusSnapshot {
  health: HealthSection
  queue: QueueSection
  performance: PerformanceSection
  freshness: FreshnessSection
  recentLogs: RecentLogEntry[]
  syncBreakdown: unknown[]
  timestamp: string
}

export interface HealthSection {
  status: 'critical' | 'warning' | 'caution' | 'healthy'
  metrics: unknown[]
  uptime: number
}

export interface QueueSection {
  stats: QueueStats
  status: unknown[]
  backlog: number
}

export interface PerformanceSection {
  daily: PerformanceWindow
  weekly: PerformanceWindow
  externalApi: ExternalApiMetrics
}

export interface PerformanceWindow {
  totalRuns: number
  successRate: number
  avgDurationMs: number
  failedRuns: number
}

export interface ExternalApiMetrics {
  courtlistenerFailures24h: number
  courtlistenerCircuitOpens24h: number
  courtlistenerCircuitShortcircuits24h: number
}

export interface FreshnessSection {
  judges: FreshnessMetrics
  decisions: FreshnessMetrics
}

export interface FreshnessMetrics {
  lastSync: string | null
  hoursSince: number | null
}

export interface RecentLogEntry {
  id: string
  syncType: string
  status: string
  startedAt: string
  durationMs: number | null
  errorMessage?: string | null
}

interface ApiContext {
  supabase: SupabaseClient
  queueManager: SyncQueueManager
}

export class SyncStatusService {
  private constructor(private readonly context: ApiContext) {}

  static initialize(): SyncStatusService {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const queueManager = new SyncQueueManager()
    return new SyncStatusService({ supabase, queueManager })
  }

  async buildSnapshot(): Promise<SyncStatusSnapshot> {
    const timestamp = new Date()
    const [healthMetrics, queueStats, dashboardData, queueStatus] = await Promise.all([
      this.fetchHealthMetrics(),
      this.context.queueManager.getStats(),
      this.fetchDashboardRows(),
      this.fetchQueueStatusRows(),
    ])

    const recentLogs = await this.fetchRecentLogs()
    const performance = await this.buildPerformanceSection(timestamp)
    const freshness = await this.buildFreshnessSection(timestamp)

    return {
      timestamp: timestamp.toISOString(),
      health: {
        status: determineOverallHealth(healthMetrics, queueStats, performance.daily.successRate),
        metrics: healthMetrics,
        uptime: calculateUptime(recentLogs),
      },
      queue: {
        stats: queueStats,
        status: queueStatus,
        backlog: queueStats.pending + queueStats.running,
      },
      performance,
      freshness,
      recentLogs,
      syncBreakdown: dashboardData,
    }
  }

  private async fetchHealthMetrics(): Promise<unknown[]> {
    const { data, error } = await this.context.supabase.rpc('get_sync_health')
    if (error) {
      logger.error('SyncStatusService failed to fetch health metrics', { error })
      return []
    }
    return data ?? []
  }

  private async fetchDashboardRows(): Promise<unknown[]> {
    const { data, error } = await this.context.supabase.from('sync_dashboard').select('*')
    if (error) {
      logger.error('SyncStatusService failed to fetch dashboard rows', { error })
      return []
    }
    return data ?? []
  }

  private async fetchQueueStatusRows(): Promise<unknown[]> {
    const { data, error } = await this.context.supabase.from('queue_status').select('*')
    if (error) {
      logger.error('SyncStatusService failed to fetch queue status rows', { error })
      return []
    }
    return data ?? []
  }

  private async fetchRecentLogs(): Promise<RecentLogEntry[]> {
    const { data, error } = await this.context.supabase
      .from('sync_logs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(10)

    if (error) {
      logger.error('SyncStatusService failed to fetch recent logs', { error })
      return []
    }

    return (data ?? []).map((log) => ({
      id: log.id,
      syncType: log.sync_type,
      status: log.status,
      startedAt: log.started_at,
      durationMs: log.duration_ms,
      errorMessage: log.error_message,
    }))
  }

  private async buildPerformanceSection(referenceTime: Date): Promise<PerformanceSection> {
    const oneDayAgo = new Date(referenceTime.getTime() - 24 * 60 * 60 * 1000)
    const oneWeekAgo = new Date(referenceTime.getTime() - 7 * 24 * 60 * 60 * 1000)

    const [dailyStats, weeklyStats, externalMetrics] = await Promise.all([
      this.fetchSyncStats(oneDayAgo),
      this.fetchSyncStats(oneWeekAgo),
      this.fetchExternalApiMetrics(oneDayAgo),
    ])

    return {
      daily: dailyStats,
      weekly: weeklyStats,
      externalApi: externalMetrics,
    }
  }

  private async buildFreshnessSection(referenceTime: Date): Promise<FreshnessSection> {
    const [judgeRow, decisionRow] = await Promise.all([
      this.context.supabase
        .from('judges')
        .select('jurisdiction, last_synced_at')
        .eq('jurisdiction', 'CA')
        .not('last_synced_at', 'is', null)
        .order('last_synced_at', { ascending: false })
        .limit(1)
        .maybeSingle<{ last_synced_at: string | null }>(),
      this.context.supabase
        .from('cases')
        .select('created_at')
        .eq('sync_source', 'courtlistener')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle<{ created_at: string | null }>(),
    ])

    const judgeFreshness = buildFreshnessMetrics(judgeRow?.data?.last_synced_at ?? null, referenceTime)
    const decisionFreshness = buildFreshnessMetrics(decisionRow?.data?.created_at ?? null, referenceTime)

    return {
      judges: judgeFreshness,
      decisions: decisionFreshness,
    }
  }

  private async fetchSyncStats(since: Date): Promise<PerformanceWindow> {
    const { data, error } = await this.context.supabase
      .from('sync_logs')
      .select('status, duration_ms')
      .gte('started_at', since.toISOString())

    if (error) {
      logger.error('SyncStatusService failed to fetch sync statistics', { error })
      return {
        totalRuns: 0,
        successRate: 0,
        avgDurationMs: 0,
        failedRuns: 0,
      }
    }

    const rows = data ?? []
    const completedRuns = rows.filter((row) => row.status === 'completed').length
    const failedRuns = rows.filter((row) => row.status === 'failed').length
    const totalRuns = rows.length
    const successRate = totalRuns > 0 ? Math.round((completedRuns / totalRuns) * 100 * 100) / 100 : 0
    const avgDuration = totalRuns > 0
      ? Math.round(rows.reduce((sum, row) => sum + (row.duration_ms ?? 0), 0) / totalRuns)
      : 0

    return {
      totalRuns,
      successRate,
      avgDurationMs: avgDuration,
      failedRuns,
    }
  }

  private async fetchExternalApiMetrics(since: Date): Promise<ExternalApiMetrics> {
    const { data, error } = await this.context.supabase
      .from('performance_metrics')
      .select('metric_name')
      .gte('created_at', since.toISOString())
      .in('metric_name', [
        'courtlistener_fetch_courts_failed',
        'courtlistener_fetch_decisions_failed',
        'courtlistener_circuit_open',
        'courtlistener_circuit_shortcircuit',
      ])

    if (error) {
      logger.error('SyncStatusService failed to fetch external API metrics', { error })
      return {
        courtlistenerFailures24h: 0,
        courtlistenerCircuitOpens24h: 0,
        courtlistenerCircuitShortcircuits24h: 0,
      }
    }

    const rows = data ?? []
    return {
      courtlistenerFailures24h: rows.filter((row) =>
        row.metric_name === 'courtlistener_fetch_courts_failed' ||
        row.metric_name === 'courtlistener_fetch_decisions_failed'
      ).length,
      courtlistenerCircuitOpens24h: rows.filter((row) => row.metric_name === 'courtlistener_circuit_open').length,
      courtlistenerCircuitShortcircuits24h: rows.filter((row) => row.metric_name === 'courtlistener_circuit_shortcircuit').length,
    }
  }
}

function determineOverallHealth(healthMetrics: unknown[], queueStats: QueueStats, successRate: number): 'critical' | 'warning' | 'caution' | 'healthy' {
  const pendingJobs = queueStats.pending || 0
  if (successRate < 75 || pendingJobs > 100) return 'critical'
  if (successRate < 90 || pendingJobs > 50) return 'warning'
  if (successRate < 95 || pendingJobs > 20) return 'caution'
  return 'healthy'
}

function calculateUptime(recentLogs: RecentLogEntry[]): number {
  if (recentLogs.length === 0) return 0
  const successfulRuns = recentLogs.filter((log) => log.status === 'completed').length
  return Math.round((successfulRuns / recentLogs.length) * 100 * 100) / 100
}

function buildFreshnessMetrics(timestamp: string | null, referenceTime: Date): FreshnessMetrics {
  if (!timestamp) {
    return { lastSync: null, hoursSince: null }
  }
  const lastSyncDate = new Date(timestamp)
  const diffMs = referenceTime.getTime() - lastSyncDate.getTime()
  return {
    lastSync: timestamp,
    hoursSince: Math.round(diffMs / (1000 * 60 * 60)),
  }
}

