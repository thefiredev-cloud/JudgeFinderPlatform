'use client'

import { useState } from 'react'
import { BarChart, PieChart, TrendingUp, TrendingDown } from 'lucide-react'
import useSWR from 'swr'
import { fetcher } from '@/lib/utils/fetcher'
import { Skeleton } from '@/components/ui/Skeleton'

interface AnalyticsResponse {
  analytics: {
    civil_plaintiff_favor?: number | null
    contract_enforcement_rate?: number | null
    settlement_encouragement_rate?: number | null
    criminal_sentencing_severity?: number | null
    motion_grant_rate?: number | null
    notable_patterns?: string[]
  }
}

interface JudgeRulingPatternsProps {
  judgeId: string
}

export function JudgeRulingPatterns({ judgeId }: JudgeRulingPatternsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'trends'>('overview')

  const { data, isLoading } = useSWR<AnalyticsResponse>(
    judgeId ? `/api/judges/${judgeId}/analytics` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 5 * 60 * 1000 }
  )

  const analytics = data?.analytics

  const metrics = [
    {
      label: 'Plaintiff Favor Rate',
      value: analytics?.civil_plaintiff_favor,
      tooltip: 'Percentage of civil cases favoring plaintiffs'
    },
    {
      label: 'Contract Enforcement Rate',
      value: analytics?.contract_enforcement_rate,
      tooltip: 'Share of contract disputes resulting in enforcement'
    },
    {
      label: 'Settlement Encouragement',
      value: analytics?.settlement_encouragement_rate,
      tooltip: 'Cases where settlements were reached or encouraged'
    },
    {
      label: 'Sentencing Severity',
      value: analytics?.criminal_sentencing_severity,
      tooltip: 'Relative severity of criminal sentences (higher is stricter)'
    },
    {
      label: 'Motion Grant Rate',
      value: analytics?.motion_grant_rate,
      tooltip: 'Percentage of motions granted'
    }
  ]

  const hasAnalytics = metrics.some(metric => typeof metric.value === 'number')

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Ruling Patterns</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`rounded px-3 py-1 text-sm ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('trends')}
            className={`rounded px-3 py-1 text-sm ${
              activeTab === 'trends'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Trends
          </button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {isLoading && (
            <div className="space-y-3">
              {[0, 1, 2].map(key => (
                <Skeleton key={key} className="h-20 rounded-lg" />
              ))}
            </div>
          )}

          {!isLoading && !hasAnalytics && (
            <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
              Analytics for this judge are still being generated. Check back after the next data refresh.
            </div>
          )}

          {!isLoading && hasAnalytics && (
            <div className="grid gap-4 sm:grid-cols-2">
              {metrics.map(metric => (
                <div key={metric.label} className="rounded-lg border border-gray-200 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm text-gray-600">{metric.label}</span>
                    <BarChart className="h-4 w-4 text-gray-400" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {typeof metric.value === 'number' ? `${metric.value.toFixed(0)}%` : '—'}
                  </p>
                  <p className="mt-2 text-xs text-gray-500">{metric.tooltip}</p>
                </div>
              ))}
            </div>
          )}

          {!isLoading && Array.isArray(analytics?.notable_patterns) && analytics.notable_patterns.length > 0 && (
            <div>
              <h3 className="mb-3 font-semibold text-gray-900">Notable Patterns</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                {analytics.notable_patterns.map(pattern => (
                  <li key={pattern} className="flex items-start">
                    <PieChart className="mr-2 h-4 w-4 mt-1 text-gray-400" />
                    <span>{pattern}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {activeTab === 'trends' && (
        <div className="py-8 text-center text-gray-500">
          <TrendingUp className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <p>
            Time-series trend visualizations are coming soon. We are aggregating monthly rulings to surface meaningful
            changes over time.
          </p>
        </div>
      )}
    </div>
  )
}