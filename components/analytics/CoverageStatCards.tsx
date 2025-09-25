'use client'

import { Database, RefreshCcw } from 'lucide-react'
import type { DashboardStats } from '@/app/analytics/StatsTypes'
import { formatCount } from '@/lib/analytics/formatters'

interface CoverageStatCardsProps {
  stats: DashboardStats | null
  loading?: boolean
}

const CARD_ITEMS: Array<{ label: string; accessor: keyof DashboardStats }> = [
  { label: 'Total Judges', accessor: 'totalJudges' },
  { label: 'Case Records', accessor: 'totalCases' },
  { label: 'CA Courts', accessor: 'totalCourts' }
]

export function CoverageStatCards({ stats, loading = false }: CoverageStatCardsProps): JSX.Element {
  return (
    <div className="bg-card rounded-lg border border-border p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Coverage & Freshness</h2>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Loading…' : 'Updated'}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {CARD_ITEMS.map((item) => (
          <div key={item.accessor} className="p-4 rounded-lg border border-border bg-background">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Database className="h-4 w-4" />
              {item.label}
            </div>
            <div className="text-3xl font-bold">{formatCount(stats?.[item.accessor] as number | null)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

