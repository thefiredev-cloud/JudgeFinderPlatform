import type { SupabaseClient } from '@supabase/supabase-js'
import type { PostgrestFilterBuilder } from '@supabase/postgrest-js'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

export interface AdminStatsSnapshot {
  totals: {
    judges: number
    courts: number
    cases: number
    users: number
  }
  pendingSync: number
  syncHealth: {
    successRate: number
    lastCompletedAt: string | null
    retryCount: number
  }
  cacheMetrics: {
    lookupVolume: number
    cacheHitRatio: number
    latencyP50: number | null
    latencyP95: number | null
  }
  systemHealth: 'healthy' | 'warning' | 'error'
  activeUsersEstimate: number
}

interface CountsResponse {
  judges: number
  courts: number
  cases: number
  users: number
  pendingSync: number
}

interface SyncSnapshot {
  successRate: number
  lastCompletedAt: string | null
  retryCount: number
}

interface CacheSnapshot {
  lookupVolume: number
  cacheHitRatio: number
  latencyP50: number | null
  latencyP95: number | null
}

type FilterBuilder = PostgrestFilterBuilder<any, any, any[], unknown, unknown>

export class AdminStatsService {
  private constructor(private readonly supabase: SupabaseClient) {}

  static async initialize(): Promise<AdminStatsService> {
    const supabase = await createServiceRoleClient()
    return new AdminStatsService(supabase)
  }

  async buildSnapshot(): Promise<AdminStatsSnapshot> {
    const counts = await this.fetchEntityCounts()
    const syncSnapshot = await this.fetchSyncSnapshot()
    const cacheSnapshot = await this.fetchCacheSnapshot()

    const systemHealth = this.evaluateSystemHealth(counts.judges)
    const activeUsersEstimate = Math.floor(counts.users * 0.3)

    return {
      totals: {
        judges: counts.judges,
        courts: counts.courts,
        cases: counts.cases,
        users: counts.users,
      },
      pendingSync: counts.pendingSync,
      syncHealth: syncSnapshot,
      cacheMetrics: cacheSnapshot,
      systemHealth,
      activeUsersEstimate,
    }
  }

  private async fetchEntityCounts(): Promise<CountsResponse> {
    const [judges, courts, cases, users, pending] = await Promise.all([
      this.countRows('judges'),
      this.countRows('courts'),
      this.countRows('cases'),
      this.countRows('user_preferences'),
      this.countRows('sync_queue', (query) => query.eq('status', 'pending')),
    ])

    return {
      judges,
      courts,
      cases,
      users,
      pendingSync: pending,
    }
  }

  private async fetchSyncSnapshot(): Promise<SyncSnapshot> {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const [{ data: logs, error: logsError }, { data: retries, error: retryError }] = await Promise.all([
      this.supabase
        .from('sync_logs')
        .select('status, completed_at, started_at')
        .gte('started_at', since)
        .order('started_at', { ascending: false }),
      this.supabase
        .from('sync_queue')
        .select('retry_count')
        .gt('retry_count', 0),
    ])

    if (logsError) {
      logger.error('AdminStatsService: failed to fetch sync logs', { error: logsError.message })
    }

    if (retryError) {
      logger.error('AdminStatsService: failed to fetch retry rows', { error: retryError.message })
    }

    const syncLogs = logs ?? []
    const retryRows = retries ?? []

    const completed = syncLogs.filter((log) => log.status === 'completed')
    const successRate = syncLogs.length ? Math.round((completed.length / syncLogs.length) * 1000) / 10 : 0
    const lastCompletedAt = completed.length ? completed[0].completed_at : null
    const retryCount = retryRows.reduce((total, row) => total + (row.retry_count || 0), 0)

    return {
      successRate,
      lastCompletedAt,
      retryCount,
    }
  }

  private async fetchCacheSnapshot(): Promise<CacheSnapshot> {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const metricNames = [
      'judge_lookup_cache_hit',
      'court_cache_hit',
      'judge_lookup_slug_lookup',
      'court_slug_lookup',
    ]

    const { data, error } = await this.supabase
      .from('performance_metrics')
      .select('metric_name, metric_value')
      .gte('timestamp', since)
      .in('metric_name', metricNames)

    if (error) {
      logger.error('AdminStatsService: failed to fetch performance metrics', { error: error.message })
      return {
        lookupVolume: 0,
        cacheHitRatio: 0,
        latencyP50: null,
        latencyP95: null,
      }
    }

    const rows = data ?? []
    const cacheHits = rows.filter((row) => row.metric_name.endsWith('cache_hit')).length
    const lookups = rows.filter((row) => row.metric_name.endsWith('slug_lookup')).length
    const totalLookups = cacheHits + lookups
    const cacheHitRatio = totalLookups > 0 ? Math.round((cacheHits / totalLookups) * 1000) / 10 : 0

    const latencyValues = rows
      .filter((row) => row.metric_name.endsWith('slug_lookup'))
      .map((row) => Number(row.metric_value))
      .filter((value) => Number.isFinite(value) && value >= 0)

    return {
      lookupVolume: totalLookups,
      cacheHitRatio,
      latencyP50: this.calculatePercentile(latencyValues, 0.5),
      latencyP95: this.calculatePercentile(latencyValues, 0.95),
    }
  }

  private calculatePercentile(values: number[], percentile: number): number | null {
    if (!values.length) return null
    const sorted = [...values].sort((first, second) => first - second)
    const index = (sorted.length - 1) * percentile
    const lowerIndex = Math.floor(index)
    const upperIndex = Math.ceil(index)
    if (lowerIndex === upperIndex) {
      return Math.round(sorted[lowerIndex])
    }
    const weight = index - lowerIndex
    const lowerValue = sorted[lowerIndex]
    const upperValue = sorted[upperIndex]
    return Math.round(lowerValue * (1 - weight) + upperValue * weight)
  }

  private async countRows(
    table: string,
    applyFilter?: (query: FilterBuilder) => FilterBuilder
  ): Promise<number> {
    const baseQuery = this.supabase.from(table).select('*', { count: 'exact', head: true }) as FilterBuilder
    const filteredQuery = applyFilter ? applyFilter(baseQuery) : baseQuery
    const { count, error } = await filteredQuery
    if (error) {
      throw new Error(`Failed to count ${table}: ${error.message}`)
    }
    return count ?? 0
  }

  private evaluateSystemHealth(judgeCount: number): 'healthy' | 'warning' | 'error' {
    if (judgeCount < 500) return 'error'
    if (judgeCount < 1000) return 'warning'
    return 'healthy'
  }
}

