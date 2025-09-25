import type { DashboardStats, FreshnessRow } from '@/app/analytics/StatsTypes'
import type { AnalyticsDataPayload } from './AnalyticsDataService'

type NumericCandidate = number | null | undefined

function asNumberCandidate(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  return null
}

function pickNumber(source: Record<string, unknown>, key: string): number | null {
  return asNumberCandidate(source?.[key])
}

export function toDashboardStats(payload: AnalyticsDataPayload): DashboardStats {
  const judges = payload.judges || {}
  const courts = payload.courts || {}
  const cases = payload.cases || {}
  const platform = payload.platform || {}

  return {
    totalJudges: pickNumber(judges, 'totalJudges'),
    totalCourts: pickNumber(courts, 'totalCourts'),
    totalCases: pickNumber(cases, 'totalCases'),
    pendingSync: pickNumber(cases, 'pendingJobs') ?? 0,
    lastSyncTime: typeof cases?.lastUpdate === 'string' ? cases.lastUpdate : null,
    systemHealth: 'healthy',
    activeUsers: pickNumber(platform, 'activeUsers'),
    searchVolume: pickNumber(platform, 'monthlySearchesRaw'),
    syncSuccessRate: pickNumber(platform, 'syncSuccessRate') ?? 0,
    retryCount: pickNumber(platform, 'retryCount') ?? 0,
    cacheHitRatio: pickNumber(platform, 'cacheHitRatio') ?? 0,
    latencyP50: pickNumber(platform, 'latencyP50'),
    latencyP95: pickNumber(platform, 'latencyP95')
  }
}

export function extractFreshnessRows(payload: AnalyticsDataPayload): FreshnessRow[] {
  return Array.isArray(payload.freshness?.rows) ? payload.freshness?.rows ?? [] : []
}

