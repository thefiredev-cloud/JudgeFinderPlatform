import { useEffect, useState, useMemo } from 'react'
import type { DashboardStats, FreshnessRow } from '@/app/analytics/StatsTypes'
import { AnalyticsDataService } from './AnalyticsDataService'
import { extractFreshnessRows, toDashboardStats } from './AnalyticsTransformer'

interface UseAnalyticsDataState {
  stats: DashboardStats | null
  freshness: FreshnessRow[]
  error: string | null
  loading: boolean
}

export function useAnalyticsData(): UseAnalyticsDataState {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [freshness, setFreshness] = useState<FreshnessRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const service = useMemo(() => new AnalyticsDataService(), [])

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const payload = await service.fetchAnalytics()
        if (!active) return
        setStats(toDashboardStats(payload))
        setFreshness(extractFreshnessRows(payload))
      } catch (err) {
        if (!active) return
        const message = err instanceof Error ? err.message : 'Failed to load analytics stats'
        setError(message)
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [service])

  return { stats, freshness, error, loading }
}
