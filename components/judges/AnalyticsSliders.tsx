'use client'

import { useEffect, useMemo, useState } from 'react'
import { Clock, Database } from 'lucide-react'
import { cn } from '@/lib/utils/index'
import { useJudgeFilterParams } from '@/hooks/useJudgeFilters'

interface CaseAnalytics {
  civil_plaintiff_favor: number
  civil_defendant_favor: number
  family_custody_mother: number
  family_custody_father: number
  family_alimony_favorable: number
  contract_enforcement_rate: number
  contract_dismissal_rate: number
  criminal_sentencing_severity: number
  criminal_plea_acceptance: number
  
  // New metrics
  bail_release_rate: number
  appeal_reversal_rate: number
  settlement_encouragement_rate: number
  motion_grant_rate: number
  
  // Enhanced confidence metrics
  confidence_civil: number
  confidence_custody: number
  confidence_alimony: number
  confidence_contracts: number
  confidence_sentencing: number
  confidence_plea: number
  confidence_bail: number
  confidence_reversal: number
  confidence_settlement: number
  confidence_motion: number
  overall_confidence: number
  
  // Sample sizes for transparency
  sample_size_civil: number
  sample_size_custody: number
  sample_size_alimony: number
  sample_size_contracts: number
  sample_size_sentencing: number
  sample_size_plea: number
  sample_size_bail: number
  sample_size_reversal: number
  sample_size_settlement: number
  sample_size_motion: number
  
  total_cases_analyzed: number
  analysis_quality: string
  notable_patterns: string[]
  data_limitations: string[]
  ai_model: string
  generated_at: string
  last_updated: string
}

interface AnalyticsSlidersProps {
  judgeId: string
  judgeName: string
}

interface SliderProps {
  label: string
  value: number
  leftLabel: string
  rightLabel: string
  color: string
  description: string
  confidence: number
  sampleSize: number
}

function ConfidenceIndicator({ confidence, sampleSize }: { confidence: number, sampleSize: number }) {
  const getConfidenceColor = (conf: number) => {
    if (conf >= 85) return 'text-[color:hsl(var(--pos))] bg-[rgba(103,232,169,0.14)]'
    if (conf >= 75) return 'text-[color:hsl(var(--accent))] bg-[rgba(110,168,254,0.18)]'
    if (conf >= 65) return 'text-[color:hsl(var(--warn))] bg-[rgba(251,211,141,0.18)]'
    return 'text-[color:hsl(var(--neg))] bg-[rgba(252,165,165,0.2)]'
  }
  
  const getConfidenceLabel = (conf: number) => {
    if (conf >= 85) return 'High'
    if (conf >= 75) return 'Good'
    if (conf >= 65) return 'Fair'
    return 'Low'
  }
  
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span
        className={cn(
          'rounded-full px-2 py-1 font-medium whitespace-normal break-words leading-snug text-left',
          getConfidenceColor(confidence),
        )}
      >
        {getConfidenceLabel(confidence)} ({confidence}%)
      </span>
      <span className="text-[color:hsl(var(--text-3))]">
        {sampleSize} cases
      </span>
    </div>
  )
}

function AnalyticsSlider({ label, value, leftLabel, rightLabel, color, description, confidence, sampleSize }: SliderProps) {
  const isLowConfidence = confidence < 70

  return (
    <div className={cn('rounded-2xl border border-border bg-[hsl(var(--bg-2))] p-6 transition-colors', isLowConfidence && 'opacity-80')}>
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h3 className="mb-1 font-semibold text-[color:hsl(var(--text-1))]">{label}</h3>
          <ConfidenceIndicator confidence={confidence} sampleSize={sampleSize} />
        </div>
        <span
          className={cn(
            'rounded-full px-3 py-1 text-lg font-semibold whitespace-normal break-words leading-snug text-right',
            color,
          )}
        >
          {value}%
        </span>
      </div>

      <div className="mb-4">
        <div className="mb-2 flex justify-between text-sm text-[color:hsl(var(--text-3))]">
          <span>{leftLabel}</span>
          <span>{rightLabel}</span>
        </div>

        <div className="relative h-3.5 overflow-hidden rounded-full bg-[hsl(var(--bg-1))]">
          <div
            className={cn(
              'absolute left-0 top-0 h-full rounded-full transition-all duration-500',
              isLowConfidence && 'opacity-70',
              value < 30
                ? 'bg-[rgba(252,165,165,0.8)]'
                : value < 45
                ? 'bg-[rgba(251,211,141,0.8)]'
                : value < 55
                ? 'bg-[rgba(110,168,254,0.9)]'
                : value < 70
                ? 'bg-[rgba(103,232,169,0.9)]'
                : 'bg-[color:hsl(var(--accent))]'
            )}
            style={{ width: `${value}%` }}
          />
          <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 transform bg-[rgba(180,187,198,0.35)]" />
          {isLowConfidence && (
            <div className="absolute inset-0 flex items-center justify-center bg-[rgba(124,135,152,0.18)]">
              <span className="text-xs font-medium text-[color:hsl(var(--text-3))]">Limited data</span>
            </div>
          )}
        </div>
      </div>

      <p className="text-sm text-[color:hsl(var(--text-2))]">{description}</p>

      {isLowConfidence && (
        <div className="mt-3 rounded border border-[rgba(251,211,141,0.4)] bg-[rgba(251,211,141,0.12)] p-2 text-xs text-[color:hsl(var(--warn))]">
          ⚠️ Limited data available for this analysis
        </div>
      )}
    </div>
  )
}

function LegalDisclaimer({ analytics }: { analytics: CaseAnalytics }) {
  return (
    <div className="mt-6 rounded-2xl border border-[rgba(252,165,165,0.4)] bg-[rgba(252,165,165,0.15)] p-5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[rgba(252,165,165,0.25)]">
          <span className="text-sm font-bold text-[color:hsl(var(--neg))]">!</span>
        </div>
        <div className="space-y-2 text-sm text-[color:hsl(var(--text-2))]">
          <h4 className="font-semibold text-[color:hsl(var(--neg))]">Important legal disclaimer</h4>
          <p>
            <strong>These analytics are AI-generated estimates for informational purposes only.</strong> They are based on
            available case data and statistical patterns, not comprehensive legal analysis.
          </p>
          <ul className="ml-4 list-disc space-y-1 text-xs">
            <li>Judicial decisions involve complex legal reasoning that cannot be fully captured by statistics.</li>
            <li>Each case is unique and depends on its specific facts and legal posture.</li>
            <li>Past patterns do not guarantee future decisions.</li>
            <li>Confidence scores reflect data quality, not certainty of outcomes.</li>
            <li>Always consult qualified counsel for legal advice.</li>
          </ul>
          <div className="mt-3 rounded border border-[rgba(252,165,165,0.4)] bg-[rgba(252,165,165,0.2)] p-3 text-xs">
            <p className="font-medium text-[color:hsl(var(--neg))]">
              Data quality: {analytics.analysis_quality.toUpperCase()} · Model: {analytics.ai_model} · Cases analyzed{' '}
              {analytics.total_cases_analyzed.toLocaleString()} · Overall confidence: {analytics.overall_confidence}%
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AnalyticsSliders({ judgeId, judgeName }: AnalyticsSlidersProps) {
  const [analytics, setAnalytics] = useState<CaseAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dataSource, setDataSource] = useState<string>('unknown')
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [isCachedResponse, setIsCachedResponse] = useState(false)
  const { filters, filtersKey } = useJudgeFilterParams()

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true)
        const params = new URLSearchParams()
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.set(key, value)
        })

        const response = await fetch(
          `/api/judges/${judgeId}/analytics${params.toString() ? `?${params.toString()}` : ''}`,
        )

        if (!response.ok) {
          throw new Error('Failed to fetch analytics')
        }

        const data = await response.json()
        setAnalytics(data.analytics)
        setDataSource(data.data_source || 'unknown')
        setLastUpdated(
          data.last_updated ||
            data.analytics?.last_updated ||
            data.analytics?.generated_at ||
            null,
        )
        setIsCachedResponse(Boolean(data.cached))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    if (judgeId) {
      fetchAnalytics()
    }
  }, [filters, filtersKey, judgeId])

  const formatDataSourceLabel = (source: string, cached: boolean) => {
    switch (source) {
      case 'redis_cache':
        return cached ? 'Redis cache (fresh)' : 'Redis cache'
      case 'cached':
        return 'Supabase cache'
      case 'case_analysis':
        return 'Live case analysis'
      case 'profile_estimation':
        return 'Profile estimation'
      default:
        return cached ? 'Cached analytics' : 'Live analytics'
    }
  }

  const formatDateTime = (value?: string | null) => {
    if (!value) return 'Not available'
    try {
      return new Date(value).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'Not available'
    }
  }

  const formatRelativeTime = (value?: string | null) => {
    if (!value) return 'Unknown'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'Unknown'

    const diffMs = Date.now() - date.getTime()
    if (diffMs < 0) return 'Just now'

    const minutes = Math.floor(diffMs / 60000)
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes} min ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`
    const days = Math.floor(hours / 24)
    if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`
    const months = Math.floor(days / 30)
    if (months < 12) return `${months} mo${months === 1 ? '' : 's'} ago`
    const years = Math.floor(months / 12)
    return `${years} yr${years === 1 ? '' : 's'} ago`
  }

  const resolvedLastUpdated = lastUpdated || analytics?.last_updated || null
  const sourceLabel = formatDataSourceLabel(dataSource, isCachedResponse)
  const lastUpdatedRelative = formatRelativeTime(resolvedLastUpdated)
  const lastUpdatedAbsolute = formatDateTime(resolvedLastUpdated)

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-[hsl(var(--bg-2))] p-10 text-center text-sm text-[color:hsl(var(--text-2))]">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-[rgba(110,168,254,0.28)] border-t-[color:hsl(var(--accent))]" />
        <p className="mt-4 text-base text-[color:hsl(var(--text-1))]">Analyzing judicial patterns with AI…</p>
        <p className="text-xs text-[color:hsl(var(--text-3))]">This may take a few moments.</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-[rgba(252,165,165,0.4)] bg-[rgba(252,165,165,0.15)] p-6">
        <h3 className="mb-2 font-medium text-[color:hsl(var(--neg))]">Analytics unavailable</h3>
        <p className="text-sm text-[color:hsl(var(--text-2))]">
          Unable to load analytics for this judge. This may be due to insufficient case data or temporary system maintenance.
        </p>
        <details className="mt-3 text-xs text-[color:hsl(var(--text-3))]">
          <summary className="cursor-pointer text-[color:hsl(var(--neg))]">Technical details</summary>
          <p className="mt-2 rounded border border-[rgba(252,165,165,0.4)] bg-[rgba(252,165,165,0.2)] p-2">{error}</p>
        </details>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="rounded-2xl border border-border bg-[hsl(var(--bg-2))] p-6">
        <h3 className="mb-2 font-medium text-[color:hsl(var(--text-1))]">No analytics available</h3>
        <p className="text-sm text-[color:hsl(var(--text-2))]">
          Insufficient case data to generate meaningful analytics for {judgeName}.
        </p>
      </div>
    )
  }


  const sliders = [
    {
      label: 'Civil Cases',
      value: analytics.civil_plaintiff_favor,
      leftLabel: 'Defendant Favor',
      rightLabel: 'Plaintiff Favor',
      color: 'border border-[rgba(110,168,254,0.4)] bg-[rgba(110,168,254,0.18)] text-[color:hsl(var(--accent))]',
      description: 'In civil litigation, how often does this judge rule in favor of plaintiffs vs defendants?',
      confidence: analytics.confidence_civil,
      sampleSize: analytics.sample_size_civil
    },
    {
      label: 'Child Custody',
      value: analytics.family_custody_mother,
      leftLabel: 'Father Custody',
      rightLabel: 'Mother Custody',
      color: 'border border-[rgba(110,168,254,0.4)] bg-[rgba(110,168,254,0.18)] text-[color:hsl(var(--accent))]',
      description: 'In custody disputes, what is the pattern of custody awards between parents?',
      confidence: analytics.confidence_custody,
      sampleSize: analytics.sample_size_custody
    },
    {
      label: 'Alimony Decisions',
      value: analytics.family_alimony_favorable,
      leftLabel: 'Rarely Awards',
      rightLabel: 'Frequently Awards',
      color: 'border border-[rgba(110,168,254,0.4)] bg-[rgba(110,168,254,0.18)] text-[color:hsl(var(--accent))]',
      description: 'How likely is this judge to award alimony or spousal support in divorce proceedings?',
      confidence: analytics.confidence_alimony,
      sampleSize: analytics.sample_size_alimony
    },
    {
      label: 'Contract Enforcement',
      value: analytics.contract_enforcement_rate,
      leftLabel: 'Dismisses Claims',
      rightLabel: 'Enforces Contracts',
      color: 'border border-[rgba(103,232,169,0.35)] bg-[rgba(103,232,169,0.14)] text-[color:hsl(var(--pos))]',
      description: 'In contract disputes, how likely is this judge to enforce contract terms vs dismiss claims?',
      confidence: analytics.confidence_contracts,
      sampleSize: analytics.sample_size_contracts
    },
    {
      label: 'Criminal Sentencing',
      value: analytics.criminal_sentencing_severity,
      leftLabel: 'Lenient',
      rightLabel: 'Strict',
      color: 'border border-[rgba(252,165,165,0.4)] bg-[rgba(252,165,165,0.2)] text-[color:hsl(var(--neg))]',
      description: 'What is the typical severity of criminal sentences imposed by this judge?',
      confidence: analytics.confidence_sentencing,
      sampleSize: analytics.sample_size_sentencing
    },
    {
      label: 'Plea Deal Acceptance',
      value: analytics.criminal_plea_acceptance,
      leftLabel: 'Rarely Accepts',
      rightLabel: 'Often Accepts',
      color: 'border border-[rgba(251,211,141,0.35)] bg-[rgba(251,211,141,0.18)] text-[color:hsl(var(--warn))]',
      description: 'How receptive is this judge to plea bargain agreements in criminal cases?',
      confidence: analytics.confidence_plea,
      sampleSize: analytics.sample_size_plea
    },
    {
      label: 'Bail/Pretrial Release',
      value: analytics.bail_release_rate || 50,
      leftLabel: 'Denies Release',
      rightLabel: 'Grants Release',
      color: 'border border-[rgba(110,168,254,0.4)] bg-[rgba(110,168,254,0.18)] text-[color:hsl(var(--accent))]',
      description: 'How often does this judge grant bail or pretrial release in criminal cases?',
      confidence: analytics.confidence_bail || 60,
      sampleSize: analytics.sample_size_bail || 0
    },
    {
      label: 'Appeal Reversal Rate',
      value: analytics.appeal_reversal_rate || 15,
      leftLabel: 'Rarely Reversed',
      rightLabel: 'Often Reversed',
      color: 'border border-[rgba(110,168,254,0.4)] bg-[rgba(110,168,254,0.18)] text-[color:hsl(var(--accent))]',
      description: 'What percentage of this judge\'s decisions are overturned on appeal?',
      confidence: analytics.confidence_reversal || 60,
      sampleSize: analytics.sample_size_reversal || 0
    },
    {
      label: 'Settlement Encouragement',
      value: analytics.settlement_encouragement_rate || 60,
      leftLabel: 'Trial Focused',
      rightLabel: 'Settlement Focused',
      color: 'border border-[rgba(110,168,254,0.4)] bg-[rgba(110,168,254,0.18)] text-[color:hsl(var(--accent))]',
      description: 'Does this judge encourage parties to settle or proceed to trial?',
      confidence: analytics.confidence_settlement || 60,
      sampleSize: analytics.sample_size_settlement || 0
    },
    {
      label: 'Motion Grant Rate',
      value: analytics.motion_grant_rate || 45,
      leftLabel: 'Rarely Grants',
      rightLabel: 'Often Grants',
      color: 'border border-[rgba(251,211,141,0.35)] bg-[rgba(251,211,141,0.18)] text-[color:hsl(var(--warn))]',
      description: 'How receptive is this judge to procedural motions and requests?',
      confidence: analytics.confidence_motion || 60,
      sampleSize: analytics.sample_size_motion || 0
    }
  ]

  const summaryTone =
    analytics.overall_confidence >= 80
      ? 'positive'
      : analytics.overall_confidence >= 70
      ? 'accent'
      : analytics.overall_confidence >= 60
      ? 'warn'
      : 'critical'

  const summaryContainerClass =
    summaryTone === 'positive'
      ? 'border-[rgba(103,232,169,0.35)] bg-[rgba(103,232,169,0.14)]'
      : summaryTone === 'accent'
      ? 'border-[rgba(110,168,254,0.4)] bg-[rgba(110,168,254,0.18)]'
      : summaryTone === 'warn'
      ? 'border-[rgba(251,211,141,0.35)] bg-[rgba(251,211,141,0.18)]'
      : 'border-[rgba(252,165,165,0.4)] bg-[rgba(252,165,165,0.2)]'

  const summaryValueClass =
    summaryTone === 'positive'
      ? 'text-[color:hsl(var(--pos))]'
      : summaryTone === 'accent'
      ? 'text-[color:hsl(var(--accent))]'
      : summaryTone === 'warn'
      ? 'text-[color:hsl(var(--warn))]'
      : 'text-[color:hsl(var(--neg))]'

  return (
    <div className="space-y-6">
      <div className={cn('rounded-2xl border p-5', summaryContainerClass)}>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-[color:hsl(var(--text-1))]">Three-year judicial analytics</h2>
            <p className="text-sm text-[color:hsl(var(--text-2))]">
              Analysis based on {analytics.total_cases_analyzed.toLocaleString()} cases (2022-2025) using the{' '}
              {analytics.ai_model.replace('_', ' ')} model.
            </p>
            <div className="flex flex-wrap items-center gap-2 text-xs text-[color:hsl(var(--text-3))]">
              <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-[hsl(var(--bg-1))] px-3 py-1">
                <Database className="h-4 w-4 text-[color:hsl(var(--text-3))]" />
                {sourceLabel}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-[hsl(var(--bg-1))] px-3 py-1">
                <Clock className="h-4 w-4 text-[color:hsl(var(--text-3))]" />
                Updated {lastUpdatedRelative}
              </span>
              <span>
                Coverage: <span className="font-medium text-[color:hsl(var(--text-1))]">36-month analysis</span>
              </span>
              <span>
                Quality: <span className="font-medium capitalize text-[color:hsl(var(--text-1))]">{analytics.analysis_quality}</span>
              </span>
            </div>
            <div className="text-xs text-[color:hsl(var(--text-3))]">
              <span className="font-medium text-[color:hsl(var(--text-2))]">Last refresh:</span> {lastUpdatedAbsolute}
            </div>
          </div>
          <div className="text-right">
            <div className={cn('text-3xl font-bold', summaryValueClass)}>{analytics.overall_confidence}%</div>
            <div className="text-xs uppercase tracking-[0.2em] text-[color:hsl(var(--text-3))]">
              Overall confidence
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {sliders.map((slider, index) => (
          <AnalyticsSlider key={index} {...slider} />
        ))}
      </div>


      <div className="rounded-2xl border border-border bg-[hsl(var(--bg-2))] p-4">
        <div className="flex items-center justify-between text-xs text-[color:hsl(var(--text-3))]">
          <span>Last updated: {lastUpdatedAbsolute}</span>
          <span>Generated: {formatDateTime(analytics.generated_at)}</span>
        </div>
      </div>

      <LegalDisclaimer analytics={analytics} />
    </div>
  )
}
