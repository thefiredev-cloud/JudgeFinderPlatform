'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from 'recharts'
import { TrendingUp, Scale, AlertTriangle, CheckCircle, Clock, BarChart3 } from 'lucide-react'
import type { Judge } from '@/types'
import { cn } from '@/lib/utils'

interface BiasMetrics {
  case_type_patterns: Array<{
    case_type: string
    total_cases: number
    settlement_rate: number
    average_case_value: number
    outcome_distribution: {
      settled: number
      dismissed: number
      judgment: number
      other: number
    }
  }>
  outcome_analysis: {
    overall_settlement_rate: number
    dismissal_rate: number
    judgment_rate: number
    average_case_duration: number
    case_value_trends: Array<{
      value_range: string
      case_count: number
      settlement_rate: number
    }>
  }
  temporal_patterns: Array<{
    year: number
    month: number
    case_count: number
    settlement_rate: number
    average_duration: number
  }>
  bias_indicators: {
    consistency_score: number
    speed_score: number
    settlement_preference: number
    risk_tolerance: number
    predictability_score: number
  }
}

interface BiasPatternAnalysisProps {
  judge: Judge
}

const COLORS = ['#2563eb', '#16a34a', '#f97316', '#ef4444', '#8b5cf6']

export function BiasPatternAnalysis({ judge }: BiasPatternAnalysisProps) {
  const [biasMetrics, setBiasMetrics] = useState<BiasMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'patterns' | 'outcomes' | 'trends' | 'indicators'>('patterns')

  useEffect(() => {
    const fetchBiasMetrics = async () => {
      try {
        const response = await fetch(`/api/judges/${judge.id}/bias-analysis`)
        if (response.ok) {
          const data = await response.json()
          setBiasMetrics(data)
        }
      } catch (error) {
        console.error('Failed to fetch bias metrics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBiasMetrics()
  }, [judge.id])

  const tabs = useMemo(
    () => [
      { id: 'patterns', label: 'Case Patterns', icon: BarChart3 },
      { id: 'outcomes', label: 'Outcome Analysis', icon: TrendingUp },
      { id: 'trends', label: 'Temporal Trends', icon: Clock },
      { id: 'indicators', label: 'Bias Indicators', icon: Scale },
    ] as const,
    []
  )

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500'
    if (score >= 60) return 'text-amber-500'
    if (score >= 40) return 'text-orange-500'
    return 'text-red-500'
  }

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-4 w-4" />
    if (score >= 60) return <Clock className="h-4 w-4" />
    return <AlertTriangle className="h-4 w-4" />
  }

  const containerClass = 'rounded-2xl border border-border bg-card/90 p-6 shadow-md backdrop-blur supports-[backdrop-filter]:bg-card/75'

  if (loading) {
    return (
      <section className={containerClass}>
        <div className="space-y-4">
          <div className="h-4 w-1/2 rounded bg-muted animate-pulse" />
          <div className="space-y-3">
            <div className="h-3 rounded bg-muted animate-pulse" />
            <div className="h-3 w-5/6 rounded bg-muted animate-pulse" />
            <div className="h-3 w-4/6 rounded bg-muted animate-pulse" />
          </div>
        </div>
      </section>
    )
  }

  if (!biasMetrics) {
    return (
      <section className={cn(containerClass, 'text-center')}>
        <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-warning" />
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t load judicial pattern analytics right now. Please refresh the page or try again later.
        </p>
      </section>
    )
  }

  const indicatorDefinitions = [
    {
      name: 'Consistency score',
      value: biasMetrics.bias_indicators.consistency_score,
      description: 'How evenly the judge rules across similar cases',
    },
    {
      name: 'Decision speed',
      value: biasMetrics.bias_indicators.speed_score,
      description: 'Relative time from filing to decision',
    },
    {
      name: 'Settlement preference',
      value: Math.abs(biasMetrics.bias_indicators.settlement_preference),
      description: 'Lean toward settlements vs. rulings',
    },
    {
      name: 'Risk tolerance',
      value: biasMetrics.bias_indicators.risk_tolerance,
      description: 'Comfort with high-value or complex matters',
    },
    {
      name: 'Predictability score',
      value: biasMetrics.bias_indicators.predictability_score,
      description: 'Alignment with historical outcome patterns',
    },
  ]

  const busiestPeriod = biasMetrics.temporal_patterns.length
    ? biasMetrics.temporal_patterns.reduce((acc, curr) =>
        curr.case_count > acc.case_count ? curr : acc,
      biasMetrics.temporal_patterns[0])
    : null

  const formattedBusiestPeriod = busiestPeriod
    ? new Date(busiestPeriod.year, busiestPeriod.month - 1).toLocaleDateString(undefined, {
        month: 'short',
        year: 'numeric',
      })
    : null

  const settlementRates = biasMetrics.temporal_patterns.map((pattern) => pattern.settlement_rate)
  const minSettlement = settlementRates.length ? Math.min(...settlementRates) : 0
  const maxSettlement = settlementRates.length ? Math.max(...settlementRates) : 0

  const outcomeSummary = [
    `${(biasMetrics.outcome_analysis.overall_settlement_rate * 100).toFixed(1)}% settlement rate overall`,
    `${(biasMetrics.outcome_analysis.judgment_rate * 100).toFixed(1)}% of matters end with a judgment`,
    `Average resolution in ${biasMetrics.outcome_analysis.average_case_duration.toFixed(0)} days`,
  ]

  return (
    <section className={containerClass}>
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Scale className="h-6 w-6 text-primary" />
          <h3 className="text-xl font-semibold text-foreground">Judicial pattern analysis</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Powered by verified decisions and normalized case outcomes for {judge.name}.
        </p>
      </div>

      <div
        className="-mx-2 mb-6 overflow-x-auto pb-2"
        role="tablist"
        aria-label="Bias analysis sections"
      >
        <div className="flex min-w-full items-center gap-2 px-2">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              role="tab"
              aria-selected={activeTab === id}
              aria-controls={`${id}-panel`}
              className={cn(
                'flex items-center gap-2 rounded-full border border-transparent px-4 py-2 text-sm font-medium transition-colors',
                activeTab === id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'patterns' && (
        <div id="patterns-panel" role="tabpanel" aria-labelledby="patterns">
          <h4 className="mb-4 text-lg font-medium text-foreground">Case type distribution &amp; outcomes</h4>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={biasMetrics.case_type_patterns}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
                  <XAxis dataKey="case_type" stroke="var(--tw-prose-body)" tick={{ fill: 'var(--tw-prose-body)' }} />
                  <YAxis stroke="var(--tw-prose-body)" tick={{ fill: 'var(--tw-prose-body)' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.75rem',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Bar dataKey="total_cases" fill={COLORS[0]} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={biasMetrics.case_type_patterns}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
                  <XAxis dataKey="case_type" stroke="var(--tw-prose-body)" tick={{ fill: 'var(--tw-prose-body)' }} />
                  <YAxis
                    stroke="var(--tw-prose-body)"
                    tick={{ fill: 'var(--tw-prose-body)' }}
                    tickFormatter={(value: number) => `${Math.round(value * 100)}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.75rem',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, 'Settlement rate']}
                  />
                  <Bar dataKey="settlement_rate" fill={COLORS[1]} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'outcomes' && (
        <div id="outcomes-panel" role="tabpanel" aria-labelledby="outcomes">
          <h4 className="mb-4 text-lg font-medium text-foreground">Outcome analysis</h4>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Settlement rate" value={`${(biasMetrics.outcome_analysis.overall_settlement_rate * 100).toFixed(1)}%`} tone="positive" />
            <StatCard title="Dismissal rate" value={`${(biasMetrics.outcome_analysis.dismissal_rate * 100).toFixed(1)}%`} tone="critical" />
            <StatCard title="Judgment rate" value={`${(biasMetrics.outcome_analysis.judgment_rate * 100).toFixed(1)}%`} tone="info" />
            <StatCard title="Avg. duration" value={`${biasMetrics.outcome_analysis.average_case_duration.toFixed(0)} days`} tone="neutral" />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={biasMetrics.outcome_analysis.case_value_trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
                  <XAxis dataKey="value_range" stroke="var(--tw-prose-body)" tick={{ fill: 'var(--tw-prose-body)' }} />
                  <YAxis
                    yAxisId="left"
                    stroke="var(--tw-prose-body)"
                    tick={{ fill: 'var(--tw-prose-body)' }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="var(--tw-prose-body)"
                    tick={{ fill: 'var(--tw-prose-body)' }}
                    tickFormatter={(value: number) => `${Math.round(value * 100)}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.75rem',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="case_count"
                    stroke={COLORS[0]}
                    strokeWidth={2.5}
                    dot={false}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="settlement_rate"
                    stroke={COLORS[1]}
                    strokeWidth={2.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
              <h5 className="text-base font-semibold text-foreground">What stands out</h5>
              <ul className="space-y-2">
                {outcomeSummary.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'trends' && (
        <div id="trends-panel" role="tabpanel" aria-labelledby="trends">
          <h4 className="mb-4 text-lg font-medium text-foreground">Temporal trends</h4>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-xl border border-border bg-muted/20 p-4">
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={biasMetrics.temporal_patterns}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
                  <XAxis dataKey="month" stroke="var(--tw-prose-body)" tick={{ fill: 'var(--tw-prose-body)' }} />
                  <YAxis
                    yAxisId="left"
                    stroke="var(--tw-prose-body)"
                    tick={{ fill: 'var(--tw-prose-body)' }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="var(--tw-prose-body)"
                    tick={{ fill: 'var(--tw-prose-body)' }}
                    tickFormatter={(value: number) => `${Math.round(value * 100)}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.75rem',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Legend formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>} />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="case_count"
                    stroke={COLORS[0]}
                    strokeWidth={2.5}
                    dot={false}
                    name="Case count"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="settlement_rate"
                    stroke={COLORS[2]}
                    strokeWidth={2.5}
                    dot={false}
                    name="Settlement rate"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <h5 className="text-base font-semibold text-foreground">Seasonal highlights</h5>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {formattedBusiestPeriod ? (
                  <li>
                    • Highest caseload recorded in <strong>{formattedBusiestPeriod}</strong>.
                  </li>
                ) : (
                  <li>• Caseload is evenly distributed across the observed range.</li>
                )}
                <li>
                  • Settlement rates stay within {Math.round(minSettlement * 100)}% – {Math.round(maxSettlement * 100)}% month to month.
                </li>
                <li>
                  • Average duration trends mirror the case volume spikes, signalling resourcing opportunities.
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'indicators' && (
        <div id="indicators-panel" role="tabpanel" aria-labelledby="indicators">
          <h4 className="mb-4 text-lg font-medium text-foreground">Bias indicators</h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {indicatorDefinitions.map(({ name, value, description }) => (
              <div key={name} className="rounded-xl border border-border bg-muted/20 p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-foreground">{name}</span>
                  {getScoreIcon(value)}
                </div>
                <div className={cn('text-3xl font-semibold', getScoreColor(value))}>{value.toFixed(0)}</div>
                <p className="mt-2 text-xs text-muted-foreground">{description}</p>
                <div className="mt-3 h-2 rounded-full bg-muted">
                  <div
                    className={cn('h-2 rounded-full transition-all duration-500', getScoreColor(value).replace('text', 'bg'))}
                    style={{ width: `${Math.min(value, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-xl border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
            <h5 className="text-base font-semibold text-foreground">How to interpret these scores</h5>
            <p className="mt-2">
              Scores above 80 indicate a strong signal (for example, highly consistent rulings), while 60–79 reflect moderate confidence. Values below 40 highlight areas where additional context or qualitative review is recommended.
            </p>
          </div>
        </div>
      )}
    </section>
  )
}

function StatCard({ title, value, tone }: { title: string; value: string; tone: 'positive' | 'critical' | 'info' | 'neutral' }) {
  const toneClass =
    tone === 'positive'
      ? 'bg-emerald-500/10 text-emerald-500'
      : tone === 'critical'
      ? 'bg-red-500/10 text-red-500'
      : tone === 'info'
      ? 'bg-sky-500/10 text-sky-500'
      : 'bg-muted text-foreground'

  return (
    <div className="rounded-xl border border-border bg-muted/20 p-4">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{title}</span>
      <div className={cn('mt-2 inline-flex rounded-full px-3 py-1 text-sm font-semibold', toneClass)}>{value}</div>
    </div>
  )
}
