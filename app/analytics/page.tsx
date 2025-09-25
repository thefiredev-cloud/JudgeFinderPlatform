'use client'

import Link from 'next/link'
import { Clock } from 'lucide-react'
import { AnalyticsHeader } from '@/components/analytics/AnalyticsHeader'
import { CoverageStatCards } from '@/components/analytics/CoverageStatCards'
import { OperationalMetricsSection } from '@/components/analytics/OperationalMetricsSection'
import { FreshnessByCourtTable } from '@/components/analytics/FreshnessByCourtTable'
import { ExploreJudgesCta } from '@/components/analytics/ExploreJudgesCta'
import { useAnalyticsData } from '@/lib/analytics/useAnalyticsData'

export const dynamic = 'force-dynamic'

export default function AnalyticsPage(): JSX.Element {
  const { stats, freshness, error, loading } = useAnalyticsData()

  return (
    <div className="min-h-screen bg-background">
      <AnalyticsHeader
        title="Platform Analytics"
        subtitle="Comprehensive judicial data insights and trends across California courts"
      />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <CoverageStatCards stats={stats} loading={loading} />
          {error ? <div className="text-sm text-red-500 mt-4">{error}</div> : null}
          <div className="mt-6 text-sm text-muted-foreground flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Last sync: {stats?.lastSyncTime ? new Date(stats.lastSyncTime).toLocaleString() : '—'}
          </div>
          <OperationalMetricsSection stats={stats} />
          <p className="mt-4 text-xs text-muted-foreground">
            Need more context? Review our{' '}
            <Link href="/docs/methodology" className="text-primary underline-offset-4 hover:text-foreground">
              methodology
            </Link>{' '}
            and{' '}
            <Link href="/docs/governance" className="text-primary underline-offset-4 hover:text-foreground">
              governance
            </Link>{' '}
            guides.
          </p>
          <FreshnessByCourtTable rows={freshness} />
          <ExploreJudgesCta />
        </div>
      </div>
    </div>
  )
}
