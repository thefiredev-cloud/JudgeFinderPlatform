'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
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
  Legend,
} from 'recharts'
import type { LucideIcon } from 'lucide-react'
import { Calendar, Users, DollarSign, FileText, Filter, Download, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { chartTheme } from '@/lib/charts/theme'
import { cn } from '@/lib/utils/index'
import { useJudgeFilterParams } from '@/hooks/useJudgeFilters'

interface CaseData {
  id: string
  case_number: string
  case_name: string
  practice_area: string
  filing_date: string
  decision_date?: string
  status: string
  case_value?: number
  outcome?: string
  attorneys: {
    name: string
    firm?: string
    role: string
  }[]
  parties: {
    plaintiff?: string
    defendant?: string
  }
}

interface JudgeAnalytics {
  practice_area: string
  total_cases: number
  plaintiff_wins: number
  defendant_wins: number
  settlements: number
  average_case_duration: number
  average_case_value: number
}

interface Phase2CaseHistoryProps {
  judgeId: string
  judgeName: string
  courtName: string
}

const panelClass = 'rounded-2xl border border-border bg-[hsl(var(--bg-2))] p-5 shadow-[0_1px_0_rgba(38,43,54,0.35)]'
const selectClass =
  'rounded-full border border-border/60 bg-[hsl(var(--bg-1))] px-3 py-1.5 text-sm text-[color:hsl(var(--text-1))] focus:outline-none focus:ring-2 focus:ring-[color:hsl(var(--accent))] focus:ring-offset-0'

export default function Phase2CaseHistory({ judgeId, judgeName, courtName }: Phase2CaseHistoryProps) {
  const [cases, setCases] = useState<CaseData[]>([])
  const [analytics, setAnalytics] = useState<JudgeAnalytics[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPracticeArea, setSelectedPracticeArea] = useState<string>('All')
  const [timeRange, setTimeRange] = useState<string>('2-years')
  const { filters } = useJudgeFilterParams()

  const fetchCaseHistory = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        practice_area: selectedPracticeArea !== 'All' ? selectedPracticeArea : '',
        time_range: timeRange,
      })
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value)
      })

      const response = await fetch(`/api/judges/${judgeId}/case-history?${params}`)
      if (response.ok) {
        const data = await response.json()
        setCases(data.cases || [])
      } else {
        setCases(generateSampleCases())
      }
    } catch (error) {
      console.error('Error fetching case history:', error)
      setCases(generateSampleCases())
    } finally {
      setLoading(false)
    }
  }, [filters, judgeId, selectedPracticeArea, timeRange])

  const fetchJudgeAnalytics = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value)
      })
      const response = await fetch(
        `/api/judges/${judgeId}/analytics${params.toString() ? `?${params.toString()}` : ''}`,
      )
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data.analytics || [])
      } else {
        setAnalytics(generateSampleAnalytics())
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
      setAnalytics(generateSampleAnalytics())
    }
  }, [filters, judgeId])

  useEffect(() => {
    fetchCaseHistory()
    fetchJudgeAnalytics()
  }, [fetchCaseHistory, fetchJudgeAnalytics])

  const practiceAreas = useMemo(() => {
    const fromAnalytics = analytics.map((a) => a.practice_area)
    const fromCases = cases.map((c) => c.practice_area)
    const unique = Array.from(new Set([...fromAnalytics, ...fromCases])).filter(Boolean)
    return ['All', ...unique]
  }, [analytics, cases])

  const practiceAreaColorMap = useMemo(() => {
    const entries = practiceAreas.filter((area) => area !== 'All')
    const map = new Map<string, string>()
    entries.forEach((area, index) => {
      map.set(area, chartTheme.getSeriesColor(index))
    })
    return map
  }, [practiceAreas])

  const getPracticeColor = useCallback(
    (area: string) => practiceAreaColorMap.get(area) ?? chartTheme.getSeriesColor(practiceAreaColorMap.size + 1),
    [practiceAreaColorMap],
  )

  const filteredCases = selectedPracticeArea === 'All' ? cases : cases.filter((c) => c.practice_area === selectedPracticeArea)

  const totalCases = analytics.reduce((sum, a) => sum + a.total_cases, 0)
  const totalValue = cases.reduce((sum, c) => sum + (c.case_value || 0), 0)
  const avgDuration = analytics.length
    ? Math.round(analytics.reduce((sum, a) => sum + a.average_case_duration, 0) / analytics.length)
    : 0
  const uniqueAttorneys = useMemo(
    () => Array.from(new Set(cases.flatMap((c) => c.attorneys.map((a) => a.name)))).length,
    [cases],
  )

  const compactCurrency = useMemo(
    () =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        notation: 'compact',
        maximumFractionDigits: 1,
      }),
    [],
  )

  if (loading) {
    return (
      <section className={cn(panelClass, 'flex h-48 items-center justify-center')}>
        <div className="flex items-center gap-3 text-sm text-[color:hsl(var(--text-2))]">
          <div className="h-3 w-3 animate-ping rounded-full bg-[color:hsl(var(--accent))]" />
          Loading recent case history…
        </div>
      </section>
    )
  }

  const pieData = analytics.map((entry) => ({
    name: entry.practice_area,
    value: entry.total_cases,
    fill: getPracticeColor(entry.practice_area),
  }))

  return (
    <section className="space-y-6">
      <header className={cn(panelClass, 'space-y-5')}>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.28em] text-[color:hsl(var(--text-3))]">Phase 2 · Case history</div>
            <h2 className="mt-2 text-2xl font-semibold text-[color:hsl(var(--text-1))]">
              Case patterns for {judgeName}
            </h2>
            <p className="text-sm text-[color:hsl(var(--text-2))]">
              {timeRangeLabel(timeRange)} snapshot · {courtName}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-full border border-border/60 bg-[hsl(var(--bg-1))] px-3 text-[color:hsl(var(--text-2))] hover:text-[color:hsl(var(--text-1))]"
            >
              <Download className="h-4 w-4" aria-hidden />
              Export
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-full border border-border/60 bg-[hsl(var(--bg-1))] px-3 text-[color:hsl(var(--text-2))] hover:text-[color:hsl(var(--text-1))]"
            >
              <Eye className="h-4 w-4" aria-hidden />
              Full report
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border/60 bg-[hsl(var(--bg-1))] px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-[color:hsl(var(--text-2))]">
            <Filter className="h-4 w-4" aria-hidden />
            Practice area
            <select
              value={selectedPracticeArea}
              onChange={(event) => setSelectedPracticeArea(event.target.value)}
              className={selectClass}
            >
              {practiceAreas.map((area) => (
                <option key={area}>{area}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 text-sm text-[color:hsl(var(--text-2))]">
            <Calendar className="h-4 w-4" aria-hidden />
            Time range
            <select value={timeRange} onChange={(event) => setTimeRange(event.target.value)} className={selectClass}>
              <option value="6-months">Last 6 months</option>
              <option value="1-year">Last year</option>
              <option value="2-years">Last 2 years</option>
            </select>
          </div>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile label="Total decisions" value={totalCases.toLocaleString()} icon={FileText} tone="info" />
        <MetricTile
          label="Total case value"
          value={compactCurrency.format(totalValue || 0)}
          icon={DollarSign}
          tone="accent"
        />
        <MetricTile label="Median duration" value={`${avgDuration} days`} icon={Calendar} tone="warn" />
        <MetricTile label="Active attorneys" value={uniqueAttorneys.toString()} icon={Users} tone="muted" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <article className={panelClass}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[color:hsl(var(--text-1))]">Cases by practice area</h3>
            <span className="text-xs text-[color:hsl(var(--text-3))]">Interactive · hover to inspect</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={105}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((segment) => (
                  <Cell key={segment.name} fill={segment.fill} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [`${value.toLocaleString()} cases`, name]}
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
            </PieChart>
          </ResponsiveContainer>
        </article>

        <article className={panelClass}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[color:hsl(var(--text-1))]">Ruling patterns by practice area</h3>
            <span className="text-xs text-[color:hsl(var(--text-3))]">Stacked outcomes</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={analytics}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridStroke} />
              <XAxis
                dataKey="practice_area"
                height={80}
                angle={-25}
                textAnchor="end"
                tick={{ fill: chartTheme.axisLabel, fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: chartTheme.axisLine }}
              />
              <YAxis
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
                formatter={(value: number, name: string) => [`${value.toLocaleString()}`, name]}
              />
              <Legend
                formatter={(value) => (
                  <span className="text-xs" style={{ color: chartTheme.legend.textColor }}>
                    {value}
                  </span>
                )}
              />
              <Bar dataKey="plaintiff_wins" stackId="stack" name="Plaintiff wins" fill={chartTheme.getSeriesColor(1)} radius={[6, 6, 0, 0]} />
              <Bar dataKey="defendant_wins" stackId="stack" name="Defendant wins" fill={chartTheme.getSeriesColor(5)} radius={[0, 0, 0, 0]} />
              <Bar dataKey="settlements" stackId="stack" name="Settlements" fill={chartTheme.getSeriesColor(2)} radius={[0, 0, 6, 6]} />
            </BarChart>
          </ResponsiveContainer>
        </article>
      </div>

      <article className={cn(panelClass, 'space-y-5')}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-[color:hsl(var(--text-1))]">Recent cases</h3>
            <p className="text-sm text-[color:hsl(var(--text-3))]">
              {filteredCases.length} cases{selectedPracticeArea !== 'All' ? ` in ${selectedPracticeArea}` : ''}
            </p>
          </div>
        </div>
        <div className="space-y-4">
          {filteredCases.slice(0, 10).map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-border/60 bg-[hsl(var(--bg-1))] p-4 transition-colors hover:border-[rgba(110,168,254,0.45)]"
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <h4 className="text-lg font-semibold text-[color:hsl(var(--text-1))]">{item.case_name}</h4>
                  <p className="text-sm text-[color:hsl(var(--text-3))]">
                    Case #{item.case_number} · Filed {formatDate(item.filing_date)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className="border-border/60 text-[color:hsl(var(--text-2))]"
                    style={{
                      backgroundColor: `${getPracticeColor(item.practice_area)}1f`,
                      color: getPracticeColor(item.practice_area),
                    }}
                  >
                    {item.practice_area}
                  </Badge>
                  <Badge
                    variant={item.status === 'decided' ? 'default' : 'secondary'}
                    className={cn(
                      item.status === 'decided'
                        ? 'bg-[rgba(103,232,169,0.14)] text-[color:hsl(var(--pos))]'
                        : 'bg-[hsl(var(--bg-1))] text-[color:hsl(var(--text-2))]',
                    )}
                  >
                    {item.status}
                  </Badge>
                </div>
              </div>

              <div className="mt-4 grid gap-4 text-sm text-[color:hsl(var(--text-2))] md:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-[color:hsl(var(--text-3))]">Parties</p>
                  <p className="mt-1">
                    {item.parties.plaintiff} v. {item.parties.defendant}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-[color:hsl(var(--text-3))]">Attorneys</p>
                  <ul className="mt-1 space-y-1">
                    {item.attorneys.map((attorney, index) => (
                      <li key={`${attorney.name}-${index}`}>
                        {attorney.name}
                        {attorney.firm ? ` · ${attorney.firm}` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.18em] text-[color:hsl(var(--text-3))]">Details</p>
                  {item.case_value ? <p>Value: {compactCurrency.format(item.case_value)}</p> : null}
                  {item.outcome ? <p>Outcome: {item.outcome}</p> : null}
                  {item.decision_date ? <p>Decided: {formatDate(item.decision_date)}</p> : null}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredCases.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-border/60 bg-[hsl(var(--bg-1))] p-12 text-center">
            <FileText className="mb-4 h-12 w-12 text-[color:hsl(var(--text-3))]" aria-hidden />
            <p className="text-sm text-[color:hsl(var(--text-2))]">No cases match the current filters.</p>
            <p className="mt-1 text-xs text-[color:hsl(var(--text-3))]">Adjust the practice area or time range to broaden your scope.</p>
          </div>
        )}
      </article>

      <article className={cn(panelClass, 'space-y-4')}>
        <div>
          <h3 className="text-lg font-semibold text-[color:hsl(var(--text-1))]">Attorney marketing intelligence</h3>
          <p className="text-sm text-[color:hsl(var(--text-3))]">
            Frequent counsel appearing before this judge · useful for placement outreach
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from(
            new Map(cases.flatMap((c) => c.attorneys.map((attorney) => [attorney.name, attorney]))).values(),
          )
            .slice(0, 6)
            .map((attorney) => (
              <div
                key={`${attorney.name}-${attorney.firm ?? 'solo'}`}
                className="rounded-2xl border border-border/60 bg-[hsl(var(--bg-1))] p-4"
              >
                <div className="text-sm font-semibold text-[color:hsl(var(--text-1))]">{attorney.name}</div>
                {attorney.firm && (
                  <div className="text-xs text-[color:hsl(var(--text-3))]">{attorney.firm}</div>
                )}
                <Badge
                  variant="outline"
                  className="mt-3 inline-flex border-border/60 bg-[rgba(110,168,254,0.14)] text-[color:hsl(var(--accent))]"
                >
                  🎯 Advertising target
                </Badge>
                <div className="mt-3 text-xs text-[color:hsl(var(--text-3))]">
                  Cases linked: {
                    cases.filter((c) => c.attorneys.some((entry) => entry.name === attorney.name)).length
                  }
                </div>
              </div>
            ))}
        </div>
      </article>
    </section>
  )
}

function formatDate(value?: string) {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function timeRangeLabel(range: string) {
  switch (range) {
    case '6-months':
      return 'Six month'
    case '1-year':
      return 'One year'
    default:
      return 'Two year'
  }
}

function generateSampleCases(): CaseData[] {
  return [
    {
      id: '1',
      case_number: '23-CV-12345',
      case_name: 'Smith v. Newport Medical Center',
      practice_area: 'Personal Injury',
      filing_date: '2023-03-15',
      decision_date: '2023-09-22',
      status: 'decided',
      case_value: 850000,
      outcome: 'Plaintiff verdict',
      attorneys: [
        { name: 'Michael Johnson', firm: 'Newport Beach Personal Injury Group', role: 'plaintiff' },
        { name: 'Sarah Davis', firm: 'Medical Defense Associates', role: 'defendant' },
      ],
      parties: {
        plaintiff: 'John Smith',
        defendant: 'Newport Medical Center',
      },
    },
    {
      id: '2',
      case_number: '23-FL-67890',
      case_name: 'In re Marriage of Anderson',
      practice_area: 'Family Law',
      filing_date: '2023-06-10',
      decision_date: '2023-11-15',
      status: 'decided',
      case_value: 125000,
      outcome: 'Custody to petitioner',
      attorneys: [
        { name: 'Lisa Chen', firm: 'Orange County Family Law Associates', role: 'petitioner' },
        { name: 'Robert Wilson', firm: 'Family Law Defense Group', role: 'respondent' },
      ],
      parties: {
        plaintiff: 'Jennifer Anderson',
        defendant: 'Mark Anderson',
      },
    },
    {
      id: '3',
      case_number: '24-BC-11111',
      case_name: 'TechCorp v. Innovation Solutions',
      practice_area: 'Business Litigation',
      filing_date: '2024-01-20',
      status: 'pending',
      case_value: 2500000,
      attorneys: [
        { name: 'David Park', firm: 'Dana Point Business Litigation Firm', role: 'plaintiff' },
        { name: 'Amanda Torres', firm: 'Corporate Defense Partners', role: 'defendant' },
      ],
      parties: {
        plaintiff: 'TechCorp Inc.',
        defendant: 'Innovation Solutions LLC',
      },
    },
  ]
}

function generateSampleAnalytics(): JudgeAnalytics[] {
  return [
    {
      practice_area: 'Personal Injury',
      total_cases: 45,
      plaintiff_wins: 28,
      defendant_wins: 12,
      settlements: 5,
      average_case_duration: 189,
      average_case_value: 750000,
    },
    {
      practice_area: 'Family Law',
      total_cases: 78,
      plaintiff_wins: 35,
      defendant_wins: 25,
      settlements: 18,
      average_case_duration: 145,
      average_case_value: 85000,
    },
    {
      practice_area: 'Business Litigation',
      total_cases: 23,
      plaintiff_wins: 12,
      defendant_wins: 8,
      settlements: 3,
      average_case_duration: 267,
      average_case_value: 1250000,
    },
    {
      practice_area: 'Real Estate',
      total_cases: 34,
      plaintiff_wins: 18,
      defendant_wins: 11,
      settlements: 5,
      average_case_duration: 156,
      average_case_value: 450000,
    },
  ]
}

function MetricTile({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string
  value: string
  icon: LucideIcon
  tone: 'info' | 'accent' | 'warn' | 'muted'
}) {
  const toneClass =
    tone === 'info'
      ? 'bg-[hsl(var(--bg-1))]/70 text-[color:hsl(var(--text-1))]'
      : tone === 'accent'
      ? 'bg-[rgba(110,168,254,0.18)] text-[color:hsl(var(--accent))]'
      : tone === 'warn'
      ? 'bg-[rgba(251,211,141,0.18)] text-[color:hsl(var(--warn))]'
      : 'bg-[hsl(var(--bg-1))] text-[color:hsl(var(--text-2))]'

  return (
    <article className={panelClass}>
      <div className="flex items-center gap-3 text-xs uppercase tracking-[0.24em] text-[color:hsl(var(--text-3))]">
        <Icon className="h-4 w-4" aria-hidden />
        {label}
      </div>
      <div className={cn('mt-3 inline-flex rounded-full px-4 py-2 text-base font-semibold', toneClass)}>{value}</div>
    </article>
  )
}
