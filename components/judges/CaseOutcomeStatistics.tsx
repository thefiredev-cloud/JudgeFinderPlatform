'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts'
import type { LucideIcon } from 'lucide-react'
import { TrendingUp, Target, Clock, Scale, Award, AlertTriangle, BarChart3 } from 'lucide-react'
import type { Judge } from '@/types'
import { chartTheme } from '@/lib/charts/theme'
import { cn } from '@/lib/utils/index'
import { useJudgeFilterParams } from '@/hooks/useJudgeFilters'
import { getQualityTier, shouldHideMetric, MIN_SAMPLE_SIZE } from '@/lib/analytics/config'
import { QualityBadge } from '@/components/judges/QualityBadge'

interface CaseOutcomeStats {
  overall_stats: {
    total_cases: number
    win_rate: number
    settlement_rate: number
    dismissal_rate: number
    reversal_rate: number
    average_case_duration: number
  }
  case_type_breakdown: Array<{
    case_type: string
    total_cases: number
    win_rate: number
    settlement_rate: number
    avg_duration: number
  }>
  yearly_trends: Array<{
    year: number
    total_cases: number
    settlement_rate: number
    win_rate: number
  }>
  performance_metrics: {
    efficiency_score: number
    consistency_score: number
    speed_ranking: 'Fast' | 'Average' | 'Slow'
    specialization_areas: string[]
  }
}

interface CaseOutcomeStatisticsProps {
  judge: Judge
}

const VIEW_TABS = [
  { id: 'overview', label: 'Overview', icon: Target },
  { id: 'breakdown', label: 'Case types', icon: BarChart3 },
  { id: 'trends', label: 'Trends', icon: TrendingUp },
] as const

type ViewTabId = (typeof VIEW_TABS)[number]['id']

export function CaseOutcomeStatistics({ judge }: CaseOutcomeStatisticsProps) {
  const [outcomeStats, setOutcomeStats] = useState<CaseOutcomeStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState<ViewTabId>('overview')
  const [activeSeries, setActiveSeries] = useState<string[]>(['win_rate', 'settlement_rate'])
  const { filters, filtersKey } = useJudgeFilterParams()

  useEffect(() => {
    const fetchOutcomeStats = async () => {
      try {
        const params = new URLSearchParams()
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.set(key, value)
        })
        const response = await fetch(
          `/api/judges/${judge.id}/case-outcomes${params.toString() ? `?${params.toString()}` : ''}`,
        )
        if (response.ok) {
          const data = await response.json()
          setOutcomeStats(data)
        }
      } catch (error) {
        console.error('Failed to fetch outcome statistics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOutcomeStats()
  }, [filters, filtersKey, judge.id])

  const handleSeriesToggle = useCallback((dataKey?: string) => {
    if (!dataKey) return
    setActiveSeries((prev) => {
      const isActive = prev.includes(dataKey)
      if (isActive && prev.length === 1) return prev
      return isActive ? prev.filter((key) => key !== dataKey) : [...prev, dataKey]
    })
  }, [])

  const isSeriesActive = useCallback((dataKey: string) => activeSeries.includes(dataKey), [activeSeries])

  const containerClass = 'rounded-2xl border border-border bg-card/90 p-6 shadow-md backdrop-blur supports-[backdrop-filter]:bg-card/75'

  const pieData = useMemo(() => {
    if (!outcomeStats) return []

    const { settlement_rate, win_rate, dismissal_rate } = outcomeStats.overall_stats
    const otherShare = 1 - (settlement_rate + win_rate + dismissal_rate)
    const segments = [
      { name: 'Settlements', value: settlement_rate, tone: 'positive' as const },
      { name: 'Wins', value: Math.max(win_rate - settlement_rate, 0), tone: 'info' as const },
      { name: 'Dismissals', value: dismissal_rate, tone: 'warn' as const },
      { name: 'Other', value: Math.max(otherShare, 0), tone: 'muted' as const },
    ]

    return segments
      .filter((item) => item.value > 0)
      .map((item, index) => ({
        ...item,
        fill:
          item.tone === 'positive'
            ? chartTheme.getSeriesColor(1)
            : item.tone === 'warn'
            ? chartTheme.getSeriesColor(2)
            : item.tone === 'info'
            ? chartTheme.getSeriesColor(0)
            : chartTheme.getSeriesColor(3),
        index,
      }))
  }, [outcomeStats])

  if (loading) {
    return (
      <section className={containerClass} aria-busy>
        <div className="flex flex-col gap-4">
          <div className="h-4 w-1/3 rounded bg-muted animate-pulse" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4" id="overview">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-20 rounded-xl border border-border bg-muted animate-pulse" />
            ))}
          </div>
          <div className="h-64 rounded-2xl border border-border bg-muted animate-pulse" />
        </div>
      </section>
    )
  }

  if (!outcomeStats) {
    return (
      <section className={cn(containerClass, 'text-center text-sm text-muted-foreground')}>
        <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-[color:hsl(var(--warn))]" />
        <p>Case outcome statistics are unavailable right now. Refresh the page or try narrowing your filters.</p>
      </section>
    )
  }

  const totalSample = outcomeStats.overall_stats?.total_cases ?? 0
  const consistencyScore = outcomeStats.performance_metrics?.consistency_score ?? 70
  const outcomeQuality = getQualityTier(totalSample, consistencyScore)
  const hideOutcomes = shouldHideMetric(totalSample)

  if (hideOutcomes) {
    return (
      <section className={cn(containerClass, 'text-sm text-muted-foreground')}>
        <div className="mb-4 flex items-center gap-2">
          <QualityBadge level={outcomeQuality} />
          <span className="text-xs text-[color:hsl(var(--warn))]">Limited sample size</span>
        </div>
        <AlertTriangle className="mb-3 h-8 w-8 text-[color:hsl(var(--warn))]" />
        <p className="leading-6">
          We need at least {MIN_SAMPLE_SIZE} recent decisions with outcome classifications before rendering trend charts.
          Once the sync backlog clears, this view will repopulate automatically.
        </p>
      </section>
    )
  }

  const speedToneClass =
    outcomeStats.performance_metrics.speed_ranking === 'Fast'
      ? 'text-[color:hsl(var(--pos))]'
      : outcomeStats.performance_metrics.speed_ranking === 'Slow'
      ? 'text-[color:hsl(var(--neg))]'
      : 'text-[color:hsl(var(--warn))]'

  return (
    <section className={containerClass}>
      <header className="mb-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3 text-foreground">
          <span className="flex items-center gap-2">
            <Target className="h-6 w-6 text-[color:hsl(var(--accent))]" aria-hidden />
            <h3 className="text-xl font-semibold">Case outcome statistics</h3>
          </span>
          <QualityBadge level={outcomeQuality} />
        </div>
        <p className="text-sm text-muted-foreground break-words sm:min-w-0 sm:text-right sm:leading-relaxed">
          Key performance signals generated from verified rulings.
        </p>
      </header>

      <nav className="-mx-2 mb-6 overflow-x-auto pb-2 sm:overflow-visible" role="tablist" aria-label="Case outcome views">
        <div className="flex min-w-full flex-wrap items-center gap-2 gap-y-3 px-2 sm:min-w-0">
          {VIEW_TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={activeView === id}
              aria-controls={`${id}-panel`}
              onClick={() => setActiveView(id)}
              className={cn(
                'flex items-center gap-2 rounded-full border border-transparent px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap',
                activeView === id
                  ? 'bg-[color:hsl(var(--accent))] text-[color:hsl(var(--accent-foreground))] shadow-sm'
                  : 'bg-[hsl(var(--bg-1))] text-[color:hsl(var(--text-2))] hover:text-[color:hsl(var(--text-1))]',
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {label}
            </button>
          ))}
        </div>
      </nav>

      {activeView === 'overview' && (
        <section id="overview-panel" role="tabpanel" aria-labelledby="overview">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricTile
              icon={Scale}
              label="Total decisions"
              value={outcomeStats.overall_stats.total_cases.toLocaleString()}
              tone="info"
            />
            <MetricTile
              icon={Award}
              label="Win rate"
              value={`${(outcomeStats.overall_stats.win_rate * 100).toFixed(1)}%`}
              tone="positive"
            />
            <MetricTile
              icon={Target}
              label="Settlement rate"
              value={`${(outcomeStats.overall_stats.settlement_rate * 100).toFixed(1)}%`}
              tone="accent"
            />
            <MetricTile
              icon={Clock}
              label="Median days to decision"
              value={`${outcomeStats.overall_stats.average_case_duration} days`
              }
              tone="muted"
            />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-[hsl(var(--bg-2))] p-4">
              <h4 className="mb-4 text-lg font-medium text-foreground">Outcome distribution</h4>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={65} outerRadius={110} dataKey="value">
                    {pieData.map((segment) => (
                      <Cell key={segment.name} fill={segment.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [`${(value as number * 100).toFixed(1)}%`, name]}
                    contentStyle={{
                      backgroundColor: chartTheme.tooltip.backgroundColor,
                      border: `1px solid ${chartTheme.tooltip.borderColor}`,
                      borderRadius: '0.75rem',
                      color: chartTheme.tooltip.textColor,
                    }}
                  />
                  <Legend
                    align="left"
                    verticalAlign="top"
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ paddingBottom: 12 }}
                    formatter={(value) => (
                      <span className="text-xs" style={{ color: chartTheme.legend.textColor }}>
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-2xl border border-border bg-[hsl(var(--bg-2))] p-4">
              <h4 className="mb-4 text-lg font-medium text-foreground">Performance signals</h4>
              <dl className="space-y-3 text-sm text-[color:hsl(var(--text-2))]">
                <div className="flex items-center justify-between">
                  <dt>Efficiency score</dt>
                  <dd className="font-medium text-[color:hsl(var(--pos))]">
                    {outcomeStats.performance_metrics.efficiency_score.toFixed(1)} cases/month
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt>Consistency score</dt>
                  <dd className="font-medium text-[color:hsl(var(--accent))]">
                    {outcomeStats.performance_metrics.consistency_score.toFixed(0)}/100
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt>Decision speed</dt>
                  <dd className={cn('font-medium', speedToneClass)}>
                    {outcomeStats.performance_metrics.speed_ranking}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt>Reversal rate</dt>
                  <dd className="font-medium text-[color:hsl(var(--neg))]">
                    {(outcomeStats.overall_stats.reversal_rate * 100).toFixed(1)}%
                  </dd>
                </div>
              </dl>

              <div className="mt-5">
                <h5 className="text-sm font-medium uppercase tracking-[0.24em] text-[color:hsl(var(--text-3))]">
                  Specialization areas
                </h5>
                <div className="mt-3 flex flex-wrap gap-2">
                  {outcomeStats.performance_metrics.specialization_areas.map((area) => (
                    <span
                      key={area}
                      className="inline-flex items-center rounded-full border border-border/60 bg-[hsl(var(--bg-1))] px-3 py-1 text-xs text-[color:hsl(var(--text-2))]"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {activeView === 'breakdown' && (
        <section id="breakdown-panel" role="tabpanel" aria-labelledby="breakdown">
          <h4 className="mb-4 text-lg font-medium text-foreground">Performance by case type</h4>
          <div className="rounded-2xl border border-border bg-[hsl(var(--bg-2))] p-4" id="case-types">
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={outcomeStats.case_type_breakdown}>
                <CartesianGrid vertical={false} stroke={chartTheme.gridStroke} />
                <XAxis
                  dataKey="case_type"
                  stroke={chartTheme.axisLine}
                  tick={{ fill: chartTheme.axisLabel, fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: chartTheme.axisLine }}
                  angle={-30}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  stroke={chartTheme.axisLine}
                  tick={{ fill: chartTheme.axisLabel, fontSize: 12 }}
                  tickFormatter={(value: number) => `${Math.round(value * 100)}%`}
                  tickLine={false}
                  axisLine={{ stroke: chartTheme.axisLine }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: chartTheme.tooltip.backgroundColor,
                    border: `1px solid ${chartTheme.tooltip.borderColor}`,
                    borderRadius: '0.75rem',
                    color: chartTheme.tooltip.textColor,
                  }}
                  formatter={(value: number, name: string) => [
                    name.includes('rate') ? `${(value as number * 100).toFixed(1)}%` : value,
                    name.replace('_', ' '),
                  ]}
                />
                <Legend
                  align="left"
                  verticalAlign="top"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ paddingBottom: 12 }}
                  onClick={(entry) => handleSeriesToggle(entry?.dataKey as string)}
                  formatter={(value, entry) => (
                    <span
                      className="text-xs"
                      style={{
                        color: chartTheme.legend.textColor,
                        opacity: entry?.dataKey && isSeriesActive(entry.dataKey as string) ? 1 : 0.4,
                        cursor: 'pointer',
                      }}
                    >
                      {value}
                    </span>
                  )}
                />
                <Bar
                  dataKey="win_rate"
                  name="Win rate"
                  fill={chartTheme.getSeriesColor(1)}
                  radius={[6, 6, 0, 0]}
                  hide={!isSeriesActive('win_rate')}
                />
                <Bar
                  dataKey="settlement_rate"
                  name="Settlement rate"
                  fill={chartTheme.getSeriesColor(0)}
                  radius={[6, 6, 0, 0]}
                  hide={!isSeriesActive('settlement_rate')}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border/80 text-[color:hsl(var(--text-3))]">
                  <th className="py-2 text-left font-medium">Case type</th>
                  <th className="py-2 text-right font-medium">Cases</th>
                  <th className="py-2 text-right font-medium">Win rate</th>
                  <th className="py-2 text-right font-medium">Settlement rate</th>
                  <th className="py-2 text-right font-medium">Median duration</th>
                </tr>
              </thead>
              <tbody>
                {outcomeStats.case_type_breakdown.map((item, index) => (
                  <tr key={item.case_type} className={index % 2 === 0 ? 'bg-[hsl(var(--bg-1))]/40' : ''}>
                    <td className="py-2 text-left text-[color:hsl(var(--text-1))]">{item.case_type}</td>
                    <td className="py-2 text-right text-[color:hsl(var(--text-2))]">{item.total_cases}</td>
                    <td className="py-2 text-right text-[color:hsl(var(--pos))]">{(item.win_rate * 100).toFixed(1)}%</td>
                    <td className="py-2 text-right text-[color:hsl(var(--accent))]">{(item.settlement_rate * 100).toFixed(1)}%</td>
                    <td className="py-2 text-right text-[color:hsl(var(--warn))]">{item.avg_duration} days</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeView === 'trends' && (
        <section id="trends-panel" role="tabpanel" aria-labelledby="trends">
          <h4 className="mb-4 text-lg font-medium text-foreground">Performance trends over time</h4>
          <div className="rounded-2xl border border-border bg-[hsl(var(--bg-2))] p-4" id="trends">
            <ResponsiveContainer width="100%" height={360}>
              <LineChart data={outcomeStats.yearly_trends}>
                <CartesianGrid vertical={false} stroke={chartTheme.gridStroke} />
                <XAxis
                  dataKey="year"
                  stroke={chartTheme.axisLine}
                  tick={{ fill: chartTheme.axisLabel, fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: chartTheme.axisLine }}
                />
                <YAxis
                  stroke={chartTheme.axisLine}
                  tick={{ fill: chartTheme.axisLabel, fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: chartTheme.axisLine }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: chartTheme.tooltip.backgroundColor,
                    border: `1px solid ${chartTheme.tooltip.borderColor}`,
                    borderRadius: '0.75rem',
                    color: chartTheme.tooltip.textColor,
                  }}
                  formatter={(value: number, name: string) => [
                    name.includes('rate') ? `${(value as number * 100).toFixed(1)}%` : value,
                    name.replace('_', ' '),
                  ]}
                />
                <Legend
                  align="left"
                  verticalAlign="top"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ paddingBottom: 12 }}
                />
                <Line
                  type="monotone"
                  dataKey="total_cases"
                  name="Total cases"
                  stroke={chartTheme.getSeriesColor(3)}
                  strokeWidth={2.5}
                  dot={{ r: 2.5, strokeWidth: 2, stroke: chartTheme.getSeriesColor(3), fillOpacity: 0 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="win_rate"
                  name="Win rate"
                  stroke={chartTheme.getSeriesColor(1)}
                  strokeWidth={2.5}
                  dot={{ r: 2.5, strokeWidth: 2, stroke: chartTheme.getSeriesColor(1), fillOpacity: 0 }}
                  strokeDasharray="6 4"
                />
                <Line
                  type="monotone"
                  dataKey="settlement_rate"
                  name="Settlement rate"
                  stroke={chartTheme.getSeriesColor(0)}
                  strokeWidth={2.5}
                  dot={{ r: 2.5, strokeWidth: 2, stroke: chartTheme.getSeriesColor(0), fillOpacity: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}
    </section>
  )
}

function MetricTile({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon
  label: string
  value: string
  tone: 'positive' | 'accent' | 'info' | 'muted'
}) {
  const toneClass =
    tone === 'positive'
      ? 'bg-[rgba(103,232,169,0.14)] text-[color:hsl(var(--pos))]'
      : tone === 'accent'
      ? 'bg-[rgba(110,168,254,0.18)] text-[color:hsl(var(--accent))]'
      : tone === 'info'
      ? 'bg-[hsl(var(--bg-1))]/70 text-[color:hsl(var(--text-1))]'
      : 'bg-[hsl(var(--bg-1))] text-[color:hsl(var(--text-2))]'

  return (
    <article className="rounded-2xl border border-border/60 bg-[hsl(var(--bg-2))] p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-[color:hsl(var(--text-3))]">
        <Icon className="h-4 w-4" aria-hidden />
        {label}
      </div>
      <div
        className={cn(
          'mt-3 inline-flex flex-wrap rounded-full px-4 py-2 text-base font-semibold leading-normal break-words text-left whitespace-normal',
          toneClass,
        )}
      >
        {value}
      </div>
    </article>
  )
}
