'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
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
import { chartTheme } from '@/lib/charts/theme'
import { useJudgeFilterParams } from '@/hooks/useJudgeFilters'
import { InfoTooltip } from '@/components/ui/InfoTooltip'
import { MetricProvenance } from '@/components/judges/MetricProvenance'
import { getQualityTier, isBelowSampleThreshold } from '@/lib/analytics/config'

interface BiasMetricBody {
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

interface CourtBaseline {
  metrics: BiasMetricBody
  sample_size: number
  generated_at: string
}

interface BiasMetrics extends BiasMetricBody {
  court_baseline?: CourtBaseline | null
}

interface BiasPatternAnalysisProps {
  judge: Judge
}

export function BiasPatternAnalysis({ judge }: BiasPatternAnalysisProps) {
  const [biasMetrics, setBiasMetrics] = useState<BiasMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'patterns' | 'outcomes' | 'trends' | 'indicators'>('patterns')
  const [outcomeSeries, setOutcomeSeries] = useState<string[]>(['case_count', 'settlement_rate'])
  const [temporalSeries, setTemporalSeries] = useState<string[]>(['case_count', 'settlement_rate'])
  const { filters, filtersKey } = useJudgeFilterParams()

  useEffect(() => {
    const fetchBiasMetrics = async () => {
      try {
        const params = new URLSearchParams()
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.set(key, value)
        })
        const response = await fetch(
          `/api/judges/${judge.id}/bias-analysis${params.toString() ? `?${params.toString()}` : ''}`,
        )
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
  }, [filters, filtersKey, judge.id])

  const tabs = useMemo(
    () => [
      { id: 'patterns', label: 'Case Patterns', icon: BarChart3 },
      { id: 'outcomes', label: 'Outcome Analysis', icon: TrendingUp },
      { id: 'trends', label: 'Temporal Trends', icon: Clock },
      { id: 'indicators', label: 'Bias Indicators', icon: Scale },
    ] as const,
    []
  )

  const toggleOutcomeSeries = useCallback((dataKey?: string) => {
    if (!dataKey) return
    setOutcomeSeries((prev) => {
      const isActive = prev.includes(dataKey)
      if (isActive && prev.length === 1) return prev
      return isActive ? prev.filter((key) => key !== dataKey) : [...prev, dataKey]
    })
  }, [])

  const isOutcomeSeriesActive = useCallback(
    (dataKey: string) => outcomeSeries.includes(dataKey),
    [outcomeSeries],
  )

  const toggleTemporalSeries = useCallback((dataKey?: string) => {
    if (!dataKey) return
    setTemporalSeries((prev) => {
      const isActive = prev.includes(dataKey)
      if (isActive && prev.length === 1) return prev
      return isActive ? prev.filter((key) => key !== dataKey) : [...prev, dataKey]
    })
  }, [])

  const isTemporalSeriesActive = useCallback(
    (dataKey: string) => temporalSeries.includes(dataKey),
    [temporalSeries],
  )

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-[color:hsl(var(--pos))]'
    if (score >= 60) return 'text-[color:hsl(var(--warn))]'
    if (score >= 40) return 'text-[color:hsl(var(--accent))]'
    return 'text-[color:hsl(var(--neg))]'
  }

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-4 w-4 text-[color:hsl(var(--pos))]" />
    if (score >= 60) return <Clock className="h-4 w-4 text-[color:hsl(var(--warn))]" />
    if (score >= 40) return <TrendingUp className="h-4 w-4 text-[color:hsl(var(--accent))]" />
    return <AlertTriangle className="h-4 w-4 text-[color:hsl(var(--neg))]" />
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
        <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-[color:hsl(var(--warn))]" />
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t load judicial pattern analytics right now. Please refresh the page or try again later.
        </p>
      </section>
    )
  }

  const indicatorDefinitions = [
    {
      key: 'consistency_score' as const,
      name: 'Consistency score',
      value: biasMetrics.bias_indicators.consistency_score,
      description: 'How evenly the judge rules across similar cases',
    },
    {
      key: 'speed_score' as const,
      name: 'Decision speed',
      value: biasMetrics.bias_indicators.speed_score,
      description: 'Relative time from filing to decision',
    },
    {
      key: 'settlement_preference' as const,
      name: 'Settlement preference',
      value: Math.abs(biasMetrics.bias_indicators.settlement_preference),
      description: 'Lean toward settlements vs. rulings',
    },
    {
      key: 'risk_tolerance' as const,
      name: 'Risk tolerance',
      value: biasMetrics.bias_indicators.risk_tolerance,
      description: 'Comfort with high-value or complex matters',
    },
    {
      key: 'predictability_score' as const,
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

  const casePatternSample = biasMetrics.case_type_patterns.reduce((sum, pattern) => sum + (pattern.total_cases || 0), 0)
  const outcomeSampleSize = biasMetrics.outcome_analysis.case_value_trends.reduce(
    (sum, entry) => sum + (entry.case_count || 0),
    0,
  )
  const temporalSampleSize = biasMetrics.temporal_patterns.reduce((sum, entry) => sum + (entry.case_count || 0), 0)

  const caseQuality = getQualityTier(casePatternSample, 75)
  const outcomeQuality = getQualityTier(outcomeSampleSize, 75)
  const temporalQuality = getQualityTier(temporalSampleSize, 70)

  const insufficientCasePattern = isBelowSampleThreshold(casePatternSample)
  const insufficientOutcomeData = isBelowSampleThreshold(outcomeSampleSize)
  const insufficientTemporalData = isBelowSampleThreshold(temporalSampleSize)

  const lastUpdated = judge.updated_at

  const courtBaseline = biasMetrics.court_baseline
  const baselineMetrics = courtBaseline?.metrics
  const baselineOutcome = baselineMetrics?.outcome_analysis
  const baselineIndicators = baselineMetrics?.bias_indicators
  const baselineSampleSize = courtBaseline?.sample_size ?? 0

  const tooltipCopy = {
    patterns:
      'Includes case types captured in the last 36 months. Categories with fewer than five cases are grouped as “Other”.',
    outcomes:
      'Outcome rates reflect cases with a clear disposition in the underlying docket. Sealed or incomplete cases are omitted.',
    trends:
      'Shows month-by-month filings and settlements. Months without public filings are displayed as zero for transparency.',
    indicators:
      'Composite scores combine timing, variance, and percentile ranks. They are comparative signals, not legal findings.',
  }

  return (
    <section className={containerClass}>
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Scale className="h-6 w-6 text-primary" />
          <h3 className="text-xl font-semibold text-foreground">Judicial pattern analysis</h3>
        </div>
        <p className="text-sm text-muted-foreground break-words sm:min-w-0 sm:text-right sm:leading-relaxed">
          Powered by verified decisions and normalized case outcomes for {judge.name}.
        </p>
      </div>

      {courtBaseline && (
        <div className="mb-6 flex flex-wrap items-center gap-3 text-xs text-[color:hsl(var(--text-3))]">
          <span className="inline-flex items-center rounded-full border border-border/60 bg-[hsl(var(--bg-1))] px-3 py-1 font-semibold uppercase tracking-[0.2em]">
            Court average baseline
          </span>
          <span>n = {baselineSampleSize.toLocaleString()}</span>
          <span>
            Generated {new Date(courtBaseline.generated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <span className="text-[color:hsl(var(--accent))]">Δ values compare judge to court average</span>
        </div>
      )}

      <div
        className="-mx-2 mb-6 overflow-x-auto pb-2 sm:overflow-visible"
        role="tablist"
        aria-label="Bias analysis sections"
      >
        <div className="flex min-w-full flex-wrap items-center gap-2 gap-y-3 px-2 sm:min-w-0">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              role="tab"
              aria-selected={activeTab === id}
              aria-controls={`${id}-panel`}
              className={cn(
                'flex items-center gap-2 rounded-full border border-transparent px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap',
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
          <div className="mb-4 flex items-center gap-2">
            <h4 className="text-lg font-medium text-foreground">Case type distribution &amp; outcomes</h4>
            <InfoTooltip content={<p className="text-xs text-muted-foreground">{tooltipCopy.patterns}</p>} label="Case patterns methodology" />
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2" id="case-patterns">
            <div className="flex flex-col rounded-xl border border-border bg-[hsl(var(--bg-2))] p-4">
              {insufficientCasePattern ? (
                <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border/60 bg-[hsl(var(--bg-1))] p-6 text-sm text-muted-foreground">
                  Not enough categorized cases yet to chart case volumes.
                </div>
              ) : (
                <div className="min-h-[260px] flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={biasMetrics.case_type_patterns}>
                      <CartesianGrid vertical={false} stroke={chartTheme.gridStroke} />
                      <XAxis
                        dataKey="case_type"
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
                        labelStyle={{ color: chartTheme.tooltip.textColor }}
                      />
                      <Bar dataKey="total_cases" fill={chartTheme.getSeriesColor(0)} radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              <MetricProvenance
                source="CourtListener + case docket sync"
                lastUpdated={lastUpdated}
                n={casePatternSample}
                quality={caseQuality}
                className="mt-4"
              />
              {courtBaseline && (
                <p className="mt-2 text-xs text-[color:hsl(var(--text-3))]">
                  Court sample size: {baselineSampleSize.toLocaleString()} decisions
                </p>
              )}
            </div>
            <div className="flex flex-col rounded-xl border border-border bg-[hsl(var(--bg-2))] p-4">
              {insufficientCasePattern ? (
                <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border/60 bg-[hsl(var(--bg-1))] p-6 text-sm text-muted-foreground">
                  Not enough settlement outcomes to calculate reliable rates.
                </div>
              ) : (
                <div className="min-h-[260px] flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={biasMetrics.case_type_patterns}>
                      <CartesianGrid vertical={false} stroke={chartTheme.gridStroke} />
                      <XAxis
                        dataKey="case_type"
                        stroke={chartTheme.axisLine}
                        tick={{ fill: chartTheme.axisLabel, fontSize: 12 }}
                        tickLine={false}
                        axisLine={{ stroke: chartTheme.axisLine }}
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
                        labelStyle={{ color: chartTheme.tooltip.textColor }}
                        formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, 'Settlement rate']}
                      />
                      <Bar dataKey="settlement_rate" fill={chartTheme.getSeriesColor(1)} radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              <MetricProvenance
                source="CourtListener + case docket sync"
                lastUpdated={lastUpdated}
                n={casePatternSample}
                quality={caseQuality}
                className="mt-4"
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'outcomes' && (
        <div id="outcomes-panel" role="tabpanel" aria-labelledby="outcomes">
          <div className="mb-4 flex items-center gap-2">
            <h4 className="text-lg font-medium text-foreground">Outcome analysis</h4>
            <InfoTooltip content={<p className="text-xs text-muted-foreground">{tooltipCopy.outcomes}</p>} label="Outcome analysis methodology" />
          </div>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Settlement rate"
              value={biasMetrics.outcome_analysis.overall_settlement_rate}
              baseline={baselineOutcome?.overall_settlement_rate ?? null}
              format={(val) => `${(val * 100).toFixed(1)}%`}
              formatDelta={(delta) => `${delta >= 0 ? '+' : ''}${(delta * 100).toFixed(1)} pts`}
              tone="positive"
            />
            <StatCard
              title="Dismissal rate"
              value={biasMetrics.outcome_analysis.dismissal_rate}
              baseline={baselineOutcome?.dismissal_rate ?? null}
              format={(val) => `${(val * 100).toFixed(1)}%`}
              formatDelta={(delta) => `${delta >= 0 ? '+' : ''}${(delta * 100).toFixed(1)} pts`}
              tone="critical"
            />
            <StatCard
              title="Judgment rate"
              value={biasMetrics.outcome_analysis.judgment_rate}
              baseline={baselineOutcome?.judgment_rate ?? null}
              format={(val) => `${(val * 100).toFixed(1)}%`}
              formatDelta={(delta) => `${delta >= 0 ? '+' : ''}${(delta * 100).toFixed(1)} pts`}
              tone="info"
            />
            <StatCard
              title="Avg. duration"
              value={biasMetrics.outcome_analysis.average_case_duration}
              baseline={baselineOutcome?.average_case_duration ?? null}
              format={(val) => `${val.toFixed(0)} days`}
              formatDelta={(delta) => `${delta > 0 ? '+' : ''}${delta.toFixed(0)} days`}
              tone="neutral"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="flex flex-col rounded-xl border border-border bg-[hsl(var(--bg-2))] p-4" id="outcomes">
              {insufficientOutcomeData ? (
                <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border/60 bg-[hsl(var(--bg-1))] p-6 text-sm text-muted-foreground">
                  Outcome charts need more decided cases before they can render.
                </div>
              ) : (
                <div className="min-h-[300px] flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={biasMetrics.outcome_analysis.case_value_trends}>
                      <CartesianGrid vertical={false} stroke={chartTheme.gridStroke} />
                      <XAxis
                        dataKey="value_range"
                        stroke={chartTheme.axisLine}
                        tick={{ fill: chartTheme.axisLabel, fontSize: 12 }}
                        tickLine={false}
                        axisLine={{ stroke: chartTheme.axisLine }}
                      />
                      <YAxis
                        yAxisId="left"
                        stroke={chartTheme.axisLine}
                        tick={{ fill: chartTheme.axisLabel, fontSize: 12 }}
                        tickLine={false}
                        axisLine={{ stroke: chartTheme.axisLine }}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
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
                        labelStyle={{ color: chartTheme.tooltip.textColor }}
                      />
                      <Legend
                        align="left"
                        verticalAlign="top"
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ paddingBottom: 12 }}
                        onClick={(entry) => toggleOutcomeSeries(entry?.dataKey as string)}
                        formatter={(value, entry) => (
                          <span
                            className="text-xs"
                            style={{
                              color: chartTheme.legend.textColor,
                              opacity: entry?.dataKey && isOutcomeSeriesActive(entry.dataKey as string) ? 1 : 0.4,
                              cursor: 'pointer',
                            }}
                          >
                            {value}
                          </span>
                        )}
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="case_count"
                        stroke={chartTheme.getSeriesColor(0)}
                        strokeWidth={2.5}
                        dot={{ r: 2.5, strokeWidth: 2, stroke: chartTheme.getSeriesColor(0), fillOpacity: 0 }}
                        activeDot={{ r: 5 }}
                        hide={!isOutcomeSeriesActive('case_count')}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="settlement_rate"
                        stroke={chartTheme.getSeriesColor(1)}
                        strokeWidth={2.5}
                        dot={{ r: 2.5, strokeWidth: 2, stroke: chartTheme.getSeriesColor(1), fillOpacity: 0 }}
                        strokeDasharray="6 4"
                        hide={!isOutcomeSeriesActive('settlement_rate')}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
              <MetricProvenance
                source="CourtListener + case disposal tracking"
                lastUpdated={lastUpdated}
                n={outcomeSampleSize}
                quality={outcomeQuality}
                className="mt-4"
              />
            </div>
            <div className="flex flex-col gap-3 rounded-xl border border-border bg-[hsl(var(--bg-2))] p-4 text-sm text-muted-foreground">
              <h5 className="text-base font-semibold text-foreground">What stands out</h5>
              <ul className="space-y-2">
                {outcomeSummary.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                    <span className="flex-1 min-w-0 break-words leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'trends' && (
        <div id="trends-panel" role="tabpanel" aria-labelledby="trends">
          <div className="mb-4 flex items-center gap-2">
            <h4 className="text-lg font-medium text-foreground">Temporal trends</h4>
            <InfoTooltip content={<p className="text-xs text-muted-foreground">{tooltipCopy.trends}</p>} label="Temporal trends methodology" />
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="flex flex-col rounded-xl border border-border bg-[hsl(var(--bg-2))] p-4 lg:col-span-2" id="temporal-trends">
              {insufficientTemporalData ? (
                <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border/60 bg-[hsl(var(--bg-1))] p-6 text-sm text-muted-foreground">
                  Temporal trends require more dated filings before a chart can be shown.
                </div>
              ) : (
                <div className="min-h-[300px] flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={biasMetrics.temporal_patterns}>
                      <CartesianGrid vertical={false} stroke={chartTheme.gridStroke} />
                      <XAxis
                        dataKey="month"
                        stroke={chartTheme.axisLine}
                        tick={{ fill: chartTheme.axisLabel, fontSize: 12 }}
                        tickLine={false}
                        axisLine={{ stroke: chartTheme.axisLine }}
                      />
                      <YAxis
                        yAxisId="left"
                        stroke={chartTheme.axisLine}
                        tick={{ fill: chartTheme.axisLabel, fontSize: 12 }}
                        tickLine={false}
                        axisLine={{ stroke: chartTheme.axisLine }}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
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
                        labelStyle={{ color: chartTheme.tooltip.textColor }}
                      />
                      <Legend
                        align="left"
                        verticalAlign="top"
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ paddingBottom: 12 }}
                        onClick={(entry) => toggleTemporalSeries(entry?.dataKey as string)}
                        formatter={(value, entry) => (
                          <span
                            className="text-xs"
                            style={{
                              color: chartTheme.legend.textColor,
                              opacity: entry?.dataKey && isTemporalSeriesActive(entry.dataKey as string) ? 1 : 0.4,
                              cursor: 'pointer',
                            }}
                          >
                            {value}
                          </span>
                        )}
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="case_count"
                        stroke={chartTheme.getSeriesColor(0)}
                        strokeWidth={2.5}
                        dot={{ r: 2.5, strokeWidth: 2, stroke: chartTheme.getSeriesColor(0), fillOpacity: 0 }}
                        name="Case count"
                        activeDot={{ r: 5 }}
                        hide={!isTemporalSeriesActive('case_count')}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="settlement_rate"
                        stroke={chartTheme.getSeriesColor(2)}
                        strokeWidth={2.5}
                        dot={{ r: 2.5, strokeWidth: 2, stroke: chartTheme.getSeriesColor(2), fillOpacity: 0 }}
                        name="Settlement rate"
                        strokeDasharray="6 4"
                        hide={!isTemporalSeriesActive('settlement_rate')}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
              <MetricProvenance
                source="CourtListener + filings timeline"
                lastUpdated={lastUpdated}
                n={temporalSampleSize}
                quality={temporalQuality}
                className="mt-4"
              />
            </div>
            <div className="rounded-xl border border-border bg-[hsl(var(--bg-2))] p-4">
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
          <div className="mb-4 flex items-center gap-2">
            <h4 className="text-lg font-medium text-foreground">Bias indicators</h4>
            <InfoTooltip content={<p className="text-xs text-muted-foreground">{tooltipCopy.indicators}</p>} label="Bias indicator methodology" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {indicatorDefinitions.map(({ key, name, value, description }) => {
              const baselineValue = baselineIndicators
                ? key === 'settlement_preference'
                  ? Math.abs(baselineIndicators[key])
                  : baselineIndicators[key]
                : null
              const delta = baselineValue !== null && baselineValue !== undefined ? value - baselineValue : null
              const deltaClass =
                delta === null
                  ? 'text-[color:hsl(var(--text-3))]'
                  : delta > 0
                  ? 'text-[color:hsl(var(--accent))]'
                  : delta < 0
                  ? 'text-[color:hsl(var(--neg))]'
                  : 'text-[color:hsl(var(--text-3))]'

              return (
                <div key={name} className="rounded-xl border border-border bg-[hsl(var(--bg-2))] p-4">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-foreground">{name}</span>
                    {getScoreIcon(value)}
                  </div>
                  <div className={cn('text-3xl font-semibold', getScoreColor(value))}>{value.toFixed(0)}</div>
                  {delta !== null && (
                    <p className={`mt-1 text-xs font-medium ${deltaClass}`}>
                      {delta >= 0 ? '+' : ''}{delta.toFixed(1)} vs court avg
                    </p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">{description}</p>
                  <div className="mt-3 h-2 rounded-full bg-muted">
                    <div
                      className={cn(
                        'h-2 rounded-full transition-all duration-500',
                        getScoreColor(value).replace('text', 'bg'),
                      )}
                      style={{ width: `${Math.min(value, 100)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-6 rounded-xl border border-border bg-[hsl(var(--bg-2))] p-4 text-sm text-muted-foreground">
            <h5 className="text-base font-semibold text-foreground">How to interpret these scores</h5>
            <p className="mt-2">
              Scores above 80 indicate a strong signal (for example, highly consistent rulings), while 60–79 reflect moderate confidence. Values below 40 highlight areas where additional context or qualitative review is recommended.
            </p>
          </div>
          <MetricProvenance
            source="JudgeFinder composite scoring"
            lastUpdated={lastUpdated}
            n={casePatternSample}
            quality={caseQuality}
            className="mt-6"
          />
        </div>
      )}
    </section>
  )
}

interface StatCardProps {
  title: string
  value: number
  tone: 'positive' | 'critical' | 'info' | 'neutral'
  format?: (value: number) => string
  baseline?: number | null
  formatDelta?: (delta: number) => string
}

function StatCard({ title, value, tone, format = (val) => val.toString(), baseline, formatDelta }: StatCardProps) {
  const toneClass =
    tone === 'positive'
      ? 'bg-[rgba(103,232,169,0.12)] text-[color:hsl(var(--pos))]'
      : tone === 'critical'
      ? 'bg-[rgba(252,165,165,0.16)] text-[color:hsl(var(--neg))]'
      : tone === 'info'
      ? 'bg-[rgba(110,168,254,0.16)] text-[color:hsl(var(--accent))]'
      : 'bg-[hsl(var(--bg-1))] text-[color:hsl(var(--text-2))]'

  const delta = baseline !== undefined && baseline !== null ? value - baseline : null
  const defaultFormatDelta = (deltaValue: number) => {
    const sign = deltaValue > 0 ? '+' : ''
    return `${sign}${deltaValue.toFixed(1)}`
  }
  const formattedDelta = delta !== null ? (formatDelta ? formatDelta(delta) : defaultFormatDelta(delta)) : null
  const deltaClass =
    delta === null
      ? 'text-[color:hsl(var(--text-3))]'
      : delta > 0
      ? 'text-[color:hsl(var(--accent))]'
      : delta < 0
      ? 'text-[color:hsl(var(--neg))]'
      : 'text-[color:hsl(var(--text-3))]'

  return (
    <div className="rounded-xl border border-border bg-[hsl(var(--bg-2))] p-4">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{title}</span>
      <div className="mt-2 text-2xl font-semibold text-[color:hsl(var(--text-1))]">
        {format(value)}
      </div>
      {formattedDelta && (
        <div className={`mt-1 text-xs font-medium ${deltaClass}`}>{formattedDelta}</div>
      )}
      <div className={cn('mt-3 inline-flex items-center rounded-full px-3 py-1 text-xs font-medium', toneClass)}>
        {title}
      </div>
    </div>
  )
}
