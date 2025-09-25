'use client'

import type { DashboardStats } from '@/app/analytics/StatsTypes'
import { formatCount, formatLatency, formatPercent } from '@/lib/analytics/formatters'

interface OperationalMetricsSectionProps {
  stats: DashboardStats | null
}

interface MetricCardDefinition {
  id: string
  label: string
  value: (stats: DashboardStats | null) => string
  sublabel?: (stats: DashboardStats | null) => string
}

const METRIC_CARDS: MetricCardDefinition[] = [
  {
    id: 'sync-success',
    label: 'Sync success',
    value: (stats) => formatPercent(stats?.syncSuccessRate ?? null),
    sublabel: (stats) => `Retry attempts: ${formatCount(stats?.retryCount ?? null)}`
  },
  {
    id: 'pending-jobs',
    label: 'Pending jobs',
    value: (stats) => formatCount(stats?.pendingSync ?? null),
    sublabel: (stats) => `Active users: ${formatCount(stats?.activeUsers ?? null)}`
  },
  {
    id: 'cache-hit',
    label: 'Cache hit ratio',
    value: (stats) => formatPercent(stats?.cacheHitRatio ?? null),
    sublabel: (stats) => `Lookup volume: ${formatCount(stats?.searchVolume ?? null)}`
  },
  {
    id: 'latency',
    label: 'Latency (p50 / p95)',
    value: (stats) => formatLatency(stats?.latencyP50 ?? null),
    sublabel: (stats) => formatLatency(stats?.latencyP95 ?? null)
  }
]

export function OperationalMetricsSection({ stats }: OperationalMetricsSectionProps): JSX.Element {
  return (
    <div className="mt-8 border-t border-border pt-6">
      <h3 className="text-xl font-semibold text-foreground">Operational metrics (last 24h)</h3>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {METRIC_CARDS.map((metric) => (
          <div key={metric.id} className="rounded-lg border border-border bg-background p-4">
            <div className="text-sm text-muted-foreground">{metric.label}</div>
            <div className="mt-2 text-2xl font-semibold">{metric.value(stats)}</div>
            {metric.sublabel ? (
              <div className="mt-1 text-xs text-muted-foreground">{metric.sublabel(stats)}</div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}

