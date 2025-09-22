'use client'

import { useEffect, useMemo, useState } from 'react'
import { Clock, Database } from 'lucide-react'
import { cn } from '@/lib/utils/index'
import { useJudgeFilterParams } from '@/hooks/useJudgeFilters'
import { InfoTooltip } from '@/components/ui/InfoTooltip'
import { MetricProvenance } from '@/components/judges/MetricProvenance'
import {
  MIN_SAMPLE_SIZE,
  getQualityTier,
  isBelowSampleThreshold,
  shouldHideMetric,
  type QualityTier,
} from '@/lib/analytics/config'
import { QualityBadge } from '@/components/judges/QualityBadge'

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
  tooltip: string
  lastUpdated?: string | null
  quality: QualityTier
}

function ConfidenceIndicator({ confidence }: { confidence: number }) {
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
        {getConfidenceLabel(confidence)} confidence · {confidence}%
      </span>
    </div>
  )
}

function AnalyticsSlider({
  label,
  value,
  leftLabel,
  rightLabel,
  color,
  description,
  confidence,
  sampleSize,
  tooltip,
  lastUpdated,
  quality,
}: SliderProps) {
  const isLowConfidence = confidence < 70
  const belowThreshold = isBelowSampleThreshold(sampleSize)

  return (
    <div className={cn('rounded-2xl border border-border bg-[hsl(var(--bg-2))] p-6 transition-colors', isLowConfidence && 'opacity-80')}>
      <div className="mb-3 flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-[color:hsl(var(--text-1))]">{label}</h3>
            <InfoTooltip content={<p>{tooltip}</p>} label={`${label} methodology`} />
          </div>
          <p className="mt-2 text-xs text-[color:hsl(var(--text-3))]">{description}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <ConfidenceIndicator confidence={confidence} />
            <QualityBadge level={quality} />
          </div>
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

      {belowThreshold ? (
        <div className="mt-4 rounded-xl border border-dashed border-[rgba(251,211,141,0.45)] bg-[rgba(251,211,141,0.1)] p-4 text-xs text-[color:hsl(var(--warn))]">
          Not enough recent decisions to display this estimate yet. Request a data refresh or check back after the next sync.
        </div>
      ) : (
        <div className="mt-4">
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
      )}

      <MetricProvenance
        source="CourtListener + verified filings"
        lastUpdated={lastUpdated}
        n={sampleSize}
        quality={quality}
        className="mt-5"
      />
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
      label: 'Civil cases',
      value: analytics.civil_plaintiff_favor ?? 0,
      leftLabel: 'Defendant favor',
      rightLabel: 'Plaintiff favor',
      color: 'border border-[rgba(110,168,254,0.4)] bg-[rgba(110,168,254,0.18)] text-[color:hsl(var(--accent))]',
      description: 'Share of civil rulings that favor plaintiffs versus defendants.',
      tooltip: 'Based on contested civil rulings captured in the past 36 months; sealed or confidential matters are excluded.',
      confidence: analytics.confidence_civil ?? 0,
      sampleSize: analytics.sample_size_civil ?? 0,
      lastUpdated: resolvedLastUpdated,
    },
    {
      label: 'Child custody',
      value: analytics.family_custody_mother ?? 0,
      leftLabel: 'Father custody',
      rightLabel: 'Mother custody',
      color: 'border border-[rgba(110,168,254,0.4)] bg-[rgba(110,168,254,0.18)] text-[color:hsl(var(--accent))]',
      description: 'Relative share of custody awards between parents in family cases.',
      tooltip: 'Counts cases where the order names mother or father; guardianships and other caregivers are grouped separately.',
      confidence: analytics.confidence_custody ?? 0,
      sampleSize: analytics.sample_size_custody ?? 0,
      lastUpdated: resolvedLastUpdated,
    },
    {
      label: 'Alimony decisions',
      value: analytics.family_alimony_favorable ?? 0,
      leftLabel: 'Rarely awards',
      rightLabel: 'Frequently awards',
      color: 'border border-[rgba(110,168,254,0.4)] bg-[rgba(110,168,254,0.18)] text-[color:hsl(var(--accent))]',
      description: 'Tendency to award spousal support in divorce matters.',
      tooltip: 'Uses final divorce and support orders with explicit alimony outcomes; temporary stipulations are omitted.',
      confidence: analytics.confidence_alimony ?? 0,
      sampleSize: analytics.sample_size_alimony ?? 0,
      lastUpdated: resolvedLastUpdated,
    },
    {
      label: 'Contract enforcement',
      value: analytics.contract_enforcement_rate ?? 0,
      leftLabel: 'Dismisses claims',
      rightLabel: 'Enforces contracts',
      color: 'border border-[rgba(103,232,169,0.35)] bg-[rgba(103,232,169,0.14)] text-[color:hsl(var(--pos))]',
      description: 'Likelihood that contract disputes result in enforcement rather than dismissal.',
      tooltip: 'Looks at contract claims with a recorded disposition; settlements rely on court minutes or docket outcomes.',
      confidence: analytics.confidence_contracts ?? 0,
      sampleSize: analytics.sample_size_contracts ?? 0,
      lastUpdated: resolvedLastUpdated,
    },
    {
      label: 'Criminal sentencing',
      value: analytics.criminal_sentencing_severity ?? 0,
      leftLabel: 'Lenient',
      rightLabel: 'Strict',
      color: 'border border-[rgba(252,165,165,0.4)] bg-[rgba(252,165,165,0.2)] text-[color:hsl(var(--neg))]',
      description: 'Relative severity of imposed sentences compared with similar cases.',
      tooltip: 'Aggregates felony and misdemeanor sentencing ranges; missing duration values are excluded from the average.',
      confidence: analytics.confidence_sentencing ?? 0,
      sampleSize: analytics.sample_size_sentencing ?? 0,
      lastUpdated: resolvedLastUpdated,
    },
    {
      label: 'Plea deal acceptance',
      value: analytics.criminal_plea_acceptance ?? 0,
      leftLabel: 'Rarely accepts',
      rightLabel: 'Often accepts',
      color: 'border border-[rgba(251,211,141,0.35)] bg-[rgba(251,211,141,0.18)] text-[color:hsl(var(--warn))]',
      description: 'Frequency of pleas accepted on the record.',
      tooltip: 'Measures pleas accepted during recorded hearings; withdrawn or rejected plea offers are excluded.',
      confidence: analytics.confidence_plea ?? 0,
      sampleSize: analytics.sample_size_plea ?? 0,
      lastUpdated: resolvedLastUpdated,
    },
    {
      label: 'Bail & release',
      value: analytics.bail_release_rate ?? 0,
      leftLabel: 'Denies release',
      rightLabel: 'Grants release',
      color: 'border border-[rgba(110,168,254,0.4)] bg-[rgba(110,168,254,0.18)] text-[color:hsl(var(--accent))]',
      description: 'How often bail or supervised release is granted for pretrial defendants.',
      tooltip: 'Draws from arraignment minutes with explicit release decisions; cases lacking bail entries are omitted.',
      confidence: analytics.confidence_bail ?? 0,
      sampleSize: analytics.sample_size_bail ?? 0,
      lastUpdated: resolvedLastUpdated,
    },
    {
      label: 'Appeal reversals',
      value: analytics.appeal_reversal_rate ?? 0,
      leftLabel: 'Rarely reversed',
      rightLabel: 'Often reversed',
      color: 'border border-[rgba(110,168,254,0.4)] bg-[rgba(110,168,254,0.18)] text-[color:hsl(var(--accent))]',
      description: 'Share of this judge’s rulings that are overturned on appeal.',
      tooltip: 'Includes California appellate decisions linked to the judge; partial remands count as reversals.',
      confidence: analytics.confidence_reversal ?? 0,
      sampleSize: analytics.sample_size_reversal ?? 0,
      lastUpdated: resolvedLastUpdated,
    },
    {
      label: 'Settlement encouragement',
      value: analytics.settlement_encouragement_rate ?? 0,
      leftLabel: 'Trial focused',
      rightLabel: 'Settlement focused',
      color: 'border border-[rgba(110,168,254,0.4)] bg-[rgba(110,168,254,0.18)] text-[color:hsl(var(--accent))]',
      description: 'Tendency to push litigants toward negotiated outcomes.',
      tooltip: 'Derived from case notes referencing settlement conferences, mediations, and judge-facilitated agreements.',
      confidence: analytics.confidence_settlement ?? 0,
      sampleSize: analytics.sample_size_settlement ?? 0,
      lastUpdated: resolvedLastUpdated,
    },
    {
      label: 'Motion grant rate',
      value: analytics.motion_grant_rate ?? 0,
      leftLabel: 'Rarely grants',
      rightLabel: 'Often grants',
      color: 'border border-[rgba(251,211,141,0.35)] bg-[rgba(251,211,141,0.18)] text-[color:hsl(var(--warn))]',
      description: 'Approval rate for substantive motions (summary judgment, suppression, etc.).',
      tooltip: 'Uses motions with explicit granted/denied outcomes; tentative rulings without final orders are excluded.',
      confidence: analytics.confidence_motion ?? 0,
      sampleSize: analytics.sample_size_motion ?? 0,
      lastUpdated: resolvedLastUpdated,
    },
  ]

  const sliderEntries = sliders.map((slider) => ({
    ...slider,
    quality: getQualityTier(slider.sampleSize, slider.confidence),
    hidden: shouldHideMetric(slider.sampleSize),
  }))

  const visibleSliders = sliderEntries.filter((slider) => !slider.hidden)
  const hiddenCount = sliderEntries.length - visibleSliders.length

  if (visibleSliders.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-[hsl(var(--bg-2))] p-6 text-sm text-[color:hsl(var(--text-2))]">
        <h3 className="mb-2 font-semibold text-[color:hsl(var(--text-1))]">Analytics withheld for now</h3>
        <p>
          We need at least {MIN_SAMPLE_SIZE} recent cases to display these analytics. Fresh data is queued and the
          dashboard updates automatically once the sample size clears the threshold.
        </p>
      </div>
    )
  }

  const normalizedQuality = (analytics.analysis_quality || '').toLowerCase()
  const showLowQualityBanner = normalizedQuality.includes('low') || normalizedQuality.includes('limited')

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
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:hsl(var(--text-3))]">
              <span className="inline-flex items-center rounded-full border border-[rgba(110,168,254,0.45)] bg-[rgba(110,168,254,0.14)] px-3 py-1 text-[color:hsl(var(--accent))]">
                AI estimate
              </span>
              <span className="inline-flex items-center rounded-full border border-border/60 bg-[hsl(var(--bg-1))] px-3 py-1">
                Court record denominator
              </span>
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

      {showLowQualityBanner && (
        <div className="rounded-2xl border border-[rgba(251,211,141,0.45)] bg-[rgba(251,211,141,0.12)] p-5 text-sm text-[color:hsl(var(--warn))]">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-base font-semibold text-[color:hsl(var(--warn))]">Limited evidence</h3>
              <p className="text-xs text-[color:hsl(var(--text-3))]">
                Current analytics rely on small sample sizes. Request a data refresh so we can ingest more recent filings.
              </p>
            </div>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full border border-border bg-[hsl(var(--bg-1))] px-4 py-2 text-xs font-semibold text-[color:hsl(var(--text-1))] transition-colors hover:border-primary hover:text-primary"
              onClick={() => {
                document.dispatchEvent(new CustomEvent('open-report-profile-issue'))
              }}
            >
              Request data update
            </button>
          </div>
        </div>
      )}

      {hiddenCount > 0 && (
        <div className="rounded-2xl border border-dashed border-[rgba(251,211,141,0.45)] bg-[rgba(251,211,141,0.12)] px-4 py-3 text-xs text-[color:hsl(var(--warn))]">
          {hiddenCount} metric{hiddenCount === 1 ? '' : 's'} hidden — fewer than {MIN_SAMPLE_SIZE} recent decisions. They
          will repopulate automatically after the next sync.
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {visibleSliders.map(({ hidden: _hidden, ...slider }) => (
          <AnalyticsSlider key={slider.label} {...slider} />
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
