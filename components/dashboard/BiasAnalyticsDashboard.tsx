'use client'

import { useState, useEffect, useMemo } from 'react'
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
import { TrendingUp, AlertTriangle, Scale, Users, Target, Clock, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { chartTheme } from '@/lib/charts/theme'
import { cn } from '@/lib/utils/index'

interface BiasAnalyticsData {
  overview: {
    total_judges: number
    avg_consistency_score: number
    avg_settlement_rate: number
    potential_bias_flags: number
    cases_analyzed: number
  }
  consistency_distribution: Array<{
    score_range: string
    judge_count: number
    percentage: number
  }>
  settlement_patterns: Array<{
    case_type: string
    avg_settlement_rate: number
    judge_count: number
    variance: number
  }>
  temporal_trends: Array<{
    month: string
    avg_consistency: number
    avg_settlement_rate: number
    case_volume: number
  }>
  bias_indicators: Array<{
    judge_name: string
    judge_id: string
    consistency_score: number
    settlement_rate: number
    speed_score: number
    bias_risk_level: 'Low' | 'Medium' | 'High'
    flags: string[]
  }>
  geographic_distribution: Array<{
    jurisdiction: string
    avg_consistency: number
    avg_settlement_rate: number
    judge_count: number
  }>
  case_value_impact: Array<{
    value_range: string
    settlement_rate: number
    dismissal_rate: number
    judge_count: number
  }>
}

const panelClass = 'rounded-2xl border border-border bg-[hsl(var(--bg-2))] p-5 shadow-[0_1px_0_rgba(38,43,54,0.35)]'
const selectClass =
  'rounded-full border border-border/60 bg-[hsl(var(--bg-1))] px-3 py-1.5 text-sm text-[color:hsl(var(--text-1))] focus:outline-none focus:ring-2 focus:ring-[color:hsl(var(--accent))] focus:ring-offset-0'

const RISK_BADGES = {
  High: 'bg-[rgba(252,165,165,0.2)] text-[color:hsl(var(--neg))] border border-[rgba(252,165,165,0.4)]',
  Medium: 'bg-[rgba(251,211,141,0.18)] text-[color:hsl(var(--warn))] border border-[rgba(251,211,141,0.35)]',
  Low: 'bg-[rgba(103,232,169,0.14)] text-[color:hsl(var(--pos))] border border-[rgba(103,232,169,0.35)]',
} satisfies Record<'High' | 'Medium' | 'Low', string>

type TabId = 'overview' | 'patterns' | 'judges' | 'geographic'

const TABS: Array<{ id: TabId; label: string; icon: LucideIcon }> = [
  { id: 'overview', label: 'Overview', icon: TrendingUp },
  { id: 'patterns', label: 'Bias Patterns', icon: Scale },
  { id: 'judges', label: 'Judge Analysis', icon: Users },
  { id: 'geographic', label: 'Geographic', icon: Target },
]

export function BiasAnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState<BiasAnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string>('all')
  const [riskFilter, setRiskFilter] = useState<string>('all')

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        const params = new URLSearchParams()
        if (selectedJurisdiction !== 'all') params.append('jurisdiction', selectedJurisdiction)
        if (riskFilter !== 'all') params.append('risk_level', riskFilter)

        const response = await fetch(`/api/admin/bias-analytics?${params.toString()}`)
        if (response.ok) {
          const data = await response.json()
          setAnalyticsData(data)
        }
      } catch (error) {
        console.error('Failed to fetch bias analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalyticsData()
  }, [selectedJurisdiction, riskFilter])

  const exportData = async () => {
    try {
      const response = await fetch('/api/admin/bias-analytics/export')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = `bias-analytics-${new Date().toISOString().split('T')[0]}.csv`
        anchor.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Failed to export data:', error)
    }
  }

  const jurisdictionOptions = useMemo(
    () => [
      { value: 'all', label: 'All jurisdictions' },
      { value: 'CA', label: 'California' },
      { value: 'Federal', label: 'Federal' },
    ],
    [],
  )

  if (loading) {
    return (
      <section className={cn(panelClass, 'flex h-64 items-center justify-center')}>
        <div className="flex items-center gap-3 text-sm text-[color:hsl(var(--text-2))]">
          <div className="h-3 w-3 animate-ping rounded-full bg-[color:hsl(var(--accent))]" />
          Loading bias analytics…
        </div>
      </section>
    )
  }

  if (!analyticsData) {
    return (
      <section className={cn(panelClass, 'text-center text-sm text-[color:hsl(var(--text-2))]')}>
        <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-[color:hsl(var(--warn))]" aria-hidden />
        <p>We couldn’t load analytics right now. Try adjusting filters or refresh later.</p>
      </section>
    )
  }

  return (
    <section className="space-y-6">
      <header className={cn(panelClass, 'space-y-4')}
        aria-label="Dashboard filters"
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.28em] text-[color:hsl(var(--text-3))]">Platform analytics</div>
            <h2 className="mt-2 text-2xl font-semibold text-[color:hsl(var(--text-1))]">
              Judicial bias analytics
            </h2>
            <p className="text-sm text-[color:hsl(var(--text-2))]">
              Aggregated from {analyticsData.overview.total_judges.toLocaleString()} judges · {analyticsData.overview.cases_analyzed.toLocaleString()} cases processed
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedJurisdiction}
              onChange={(event) => setSelectedJurisdiction(event.target.value)}
              className={selectClass}
            >
              {jurisdictionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-full border border-border/60 bg-[hsl(var(--bg-1))] px-3 text-[color:hsl(var(--text-2))] hover:text-[color:hsl(var(--text-1))]"
              onClick={exportData}
            >
              <Download className="h-4 w-4" aria-hidden />
              Export data
            </Button>
          </div>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Total judges"
          value={analyticsData.overview.total_judges.toLocaleString()}
          icon={Users}
          tone="info"
        />
        <MetricCard
          label="Avg consistency"
          value={analyticsData.overview.avg_consistency_score.toFixed(1)}
          icon={Target}
          tone="positive"
        />
        <MetricCard
          label="Settlement rate"
          value={`${(analyticsData.overview.avg_settlement_rate * 100).toFixed(1)}%`}
          icon={Scale}
          tone="accent"
        />
        <MetricCard
          label="Bias alerts"
          value={analyticsData.overview.potential_bias_flags.toLocaleString()}
          icon={AlertTriangle}
          tone="critical"
        />
        <MetricCard
          label="Cases analyzed"
          value={analyticsData.overview.cases_analyzed.toLocaleString()}
          icon={Clock}
          tone="muted"
        />
      </div>

      <nav className="-mx-2 overflow-x-auto pb-2" role="tablist" aria-label="Bias analytics sections">
        <div className="flex min-w-full items-center gap-2 px-2">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={activeTab === id}
              aria-controls={`${id}-panel`}
              onClick={() => setActiveTab(id)}
              className={cn(
                'flex items-center gap-2 rounded-full border border-transparent px-4 py-2 text-sm font-medium transition-colors',
                activeTab === id
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

      {activeTab === 'overview' && (
        <div id="overview-panel" role="tabpanel" aria-labelledby="overview" className="grid gap-6 lg:grid-cols-2">
          <article className={panelClass}>
            <h3 className="text-lg font-semibold text-[color:hsl(var(--text-1))]">Consistency score distribution</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={analyticsData.consistency_distribution}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridStroke} />
                <XAxis
                  dataKey="score_range"
                  tick={{ fill: chartTheme.axisLabel, fontSize: 12 }}
                  axisLine={{ stroke: chartTheme.axisLine }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: chartTheme.axisLabel, fontSize: 12 }}
                  axisLine={{ stroke: chartTheme.axisLine }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: chartTheme.tooltip.backgroundColor,
                    border: `1px solid ${chartTheme.tooltip.borderColor}`,
                    borderRadius: '0.75rem',
                    color: chartTheme.tooltip.textColor,
                  }}
                  formatter={(value: number, name: string) => [`${value.toLocaleString()}`, name]}
                />
                <Bar dataKey="judge_count" fill={chartTheme.getSeriesColor(0)} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </article>

          <article className={panelClass}>
            <h3 className="text-lg font-semibold text-[color:hsl(var(--text-1))]">Settlement patterns by case type</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={analyticsData.settlement_patterns}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridStroke} />
                <XAxis
                  dataKey="case_type"
                  height={80}
                  angle={-25}
                  textAnchor="end"
                  tick={{ fill: chartTheme.axisLabel, fontSize: 12 }}
                  axisLine={{ stroke: chartTheme.axisLine }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: chartTheme.axisLabel, fontSize: 12 }}
                  axisLine={{ stroke: chartTheme.axisLine }}
                  tickLine={false}
                  tickFormatter={(value: number) => `${Math.round(value * 100)}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: chartTheme.tooltip.backgroundColor,
                    border: `1px solid ${chartTheme.tooltip.borderColor}`,
                    borderRadius: '0.75rem',
                    color: chartTheme.tooltip.textColor,
                  }}
                  formatter={(value: number) => [`${(value as number * 100).toFixed(1)}%`, 'Avg settlement rate']}
                />
                <Bar dataKey="avg_settlement_rate" fill={chartTheme.getSeriesColor(1)} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </article>
        </div>
      )}

      {activeTab === 'patterns' && (
        <section id="patterns-panel" role="tabpanel" aria-labelledby="patterns" className="space-y-6">
          <article className={panelClass}>
            <h3 className="text-lg font-semibold text-[color:hsl(var(--text-1))]">Bias pattern trends over time</h3>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={analyticsData.temporal_trends}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridStroke} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: chartTheme.axisLabel, fontSize: 12 }}
                  axisLine={{ stroke: chartTheme.axisLine }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: chartTheme.axisLabel, fontSize: 12 }}
                  axisLine={{ stroke: chartTheme.axisLine }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: chartTheme.tooltip.backgroundColor,
                    border: `1px solid ${chartTheme.tooltip.borderColor}`,
                    borderRadius: '0.75rem',
                    color: chartTheme.tooltip.textColor,
                  }}
                />
                <Legend
                  formatter={(value) => (
                    <span className="text-xs" style={{ color: chartTheme.legend.textColor }}>
                      {value}
                    </span>
                  )}
                />
                <Line type="monotone" dataKey="avg_consistency" stroke={chartTheme.getSeriesColor(0)} strokeWidth={2.5} dot={false} name="Consistency score" />
                <Line type="monotone" dataKey="avg_settlement_rate" stroke={chartTheme.getSeriesColor(1)} strokeWidth={2.5} dot={false} strokeDasharray="6 4" name="Settlement rate" />
                <Line type="monotone" dataKey="case_volume" stroke={chartTheme.getSeriesColor(2)} strokeWidth={2.5} dot={false} name="Case volume" />
              </LineChart>
            </ResponsiveContainer>
          </article>

          <article className={panelClass}>
            <h3 className="text-lg font-semibold text-[color:hsl(var(--text-1))]">Case value impact on outcomes</h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={analyticsData.case_value_impact}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridStroke} />
                <XAxis
                  dataKey="value_range"
                  tick={{ fill: chartTheme.axisLabel, fontSize: 12 }}
                  axisLine={{ stroke: chartTheme.axisLine }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: chartTheme.axisLabel, fontSize: 12 }}
                  axisLine={{ stroke: chartTheme.axisLine }}
                  tickLine={false}
                  tickFormatter={(value: number) => `${Math.round(value * 100)}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: chartTheme.tooltip.backgroundColor,
                    border: `1px solid ${chartTheme.tooltip.borderColor}`,
                    borderRadius: '0.75rem',
                    color: chartTheme.tooltip.textColor,
                  }}
                  formatter={(value: number, name: string) => [`${(value as number * 100).toFixed(1)}%`, name.replace('_', ' ')]}
                />
                <Legend
                  formatter={(value) => (
                    <span className="text-xs" style={{ color: chartTheme.legend.textColor }}>
                      {value.replace('_', ' ')}
                    </span>
                  )}
                />
                <Bar dataKey="settlement_rate" fill={chartTheme.getSeriesColor(1)} name="Settlement rate" radius={[6, 6, 0, 0]} />
                <Bar dataKey="dismissal_rate" fill={chartTheme.getSeriesColor(5)} name="Dismissal rate" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </article>
        </section>
      )}

      {activeTab === 'judges' && (
        <section id="judges-panel" role="tabpanel" aria-labelledby="judges" className="space-y-5">
          <div className={cn(panelClass, 'flex flex-wrap items-center gap-3 text-sm text-[color:hsl(var(--text-2))]')}>
            <label htmlFor="risk-filter" className="font-medium text-[color:hsl(var(--text-2))]">
              Filter by risk level
            </label>
            <select
              id="risk-filter"
              value={riskFilter}
              onChange={(event) => setRiskFilter(event.target.value)}
              className={selectClass}
            >
              <option value="all">All risk levels</option>
              <option value="High">High risk</option>
              <option value="Medium">Medium risk</option>
              <option value="Low">Low risk</option>
            </select>
          </div>

          <article className={cn(panelClass, 'overflow-hidden p-0')}>
            <header className="border-b border-border/60 px-6 py-4">
              <h3 className="text-lg font-semibold text-[color:hsl(var(--text-1))]">Individual judge analysis</h3>
            </header>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border/60 text-sm">
                <thead className="bg-[hsl(var(--bg-1))] text-[color:hsl(var(--text-3))]">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium uppercase tracking-wider">Judge</th>
                    <th className="px-6 py-3 text-left font-medium uppercase tracking-wider">Consistency</th>
                    <th className="px-6 py-3 text-left font-medium uppercase tracking-wider">Settlement rate</th>
                    <th className="px-6 py-3 text-left font-medium uppercase tracking-wider">Speed score</th>
                    <th className="px-6 py-3 text-left font-medium uppercase tracking-wider">Risk level</th>
                    <th className="px-6 py-3 text-left font-medium uppercase tracking-wider">Flags</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {analyticsData.bias_indicators.map((judge) => (
                    <tr key={judge.judge_id} className="hover:bg-[hsl(var(--bg-1))]/60">
                      <td className="px-6 py-4 text-[color:hsl(var(--text-1))]">{judge.judge_name}</td>
                      <td className="px-6 py-4 text-[color:hsl(var(--text-2))]">{judge.consistency_score}</td>
                      <td className="px-6 py-4 text-[color:hsl(var(--text-2))]">{(judge.settlement_rate * 100).toFixed(1)}%</td>
                      <td className="px-6 py-4 text-[color:hsl(var(--text-2))]">{judge.speed_score}</td>
                      <td className="px-6 py-4">
                        <Badge className={cn('border px-3 py-1 text-xs font-semibold', RISK_BADGES[judge.bias_risk_level])}>
                          {judge.bias_risk_level}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-xs text-[color:hsl(var(--text-3))]">
                        {judge.flags.length > 0 ? judge.flags.join(', ') : 'None'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </section>
      )}

      {activeTab === 'geographic' && (
        <section id="geographic-panel" role="tabpanel" aria-labelledby="geographic">
          <article className={panelClass}>
            <h3 className="text-lg font-semibold text-[color:hsl(var(--text-1))]">Geographic distribution of bias patterns</h3>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-border/60 text-sm">
                <thead className="bg-[hsl(var(--bg-1))] text-[color:hsl(var(--text-3))]">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium uppercase tracking-wider">Jurisdiction</th>
                    <th className="px-4 py-3 text-left font-medium uppercase tracking-wider">Judges</th>
                    <th className="px-4 py-3 text-left font-medium uppercase tracking-wider">Avg consistency</th>
                    <th className="px-4 py-3 text-left font-medium uppercase tracking-wider">Avg settlement rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {analyticsData.geographic_distribution.map((item) => (
                    <tr key={item.jurisdiction} className="hover:bg-[hsl(var(--bg-1))]/60">
                      <td className="px-4 py-3 text-[color:hsl(var(--text-1))]">{item.jurisdiction}</td>
                      <td className="px-4 py-3 text-[color:hsl(var(--text-2))]">{item.judge_count}</td>
                      <td className="px-4 py-3 text-[color:hsl(var(--text-2))]">{item.avg_consistency.toFixed(1)}</td>
                      <td className="px-4 py-3 text-[color:hsl(var(--text-2))]">{(item.avg_settlement_rate * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </section>
      )}
    </section>
  )
}

function MetricCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string
  value: string
  icon: LucideIcon
  tone: 'positive' | 'critical' | 'accent' | 'info' | 'muted'
}) {
  const toneClass =
    tone === 'positive'
      ? 'bg-[rgba(103,232,169,0.14)] text-[color:hsl(var(--pos))]'
      : tone === 'critical'
      ? 'bg-[rgba(252,165,165,0.18)] text-[color:hsl(var(--neg))]'
      : tone === 'accent'
      ? 'bg-[rgba(110,168,254,0.18)] text-[color:hsl(var(--accent))]'
      : tone === 'info'
      ? 'bg-[hsl(var(--bg-1))]/70 text-[color:hsl(var(--text-1))]'
      : 'bg-[hsl(var(--bg-1))] text-[color:hsl(var(--text-2))]'

  return (
    <article className={panelClass}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.24em] text-[color:hsl(var(--text-3))]">{label}</div>
          <div className={cn('mt-3 inline-flex rounded-full px-4 py-2 text-lg font-semibold', toneClass)}>{value}</div>
        </div>
        <Icon className="h-6 w-6 text-[color:hsl(var(--text-3))]" aria-hidden />
      </div>
    </article>
  )
}
