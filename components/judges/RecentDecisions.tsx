"use client"

import { useEffect, useMemo, useState } from 'react'
import { Calendar, FileText, ExternalLink, Gavel, TrendingUp, AlertCircle } from 'lucide-react'
import { useJudgeFilterParams } from '@/hooks/useJudgeFilters'

interface RecentDecisionsProps {
  judgeId: string
}

interface DecisionItem {
  id: string
  case_name: string
  case_number: string
  filing_date?: string
  decision_date?: string
  case_type?: string
  outcome?: string
  summary?: string
  courtlistener_id?: string
  status?: string
  source_url?: string
}

// No sample data - use real case data only

export function RecentDecisions({ judgeId }: RecentDecisionsProps) {
  const [decisions, setDecisions] = useState<DecisionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showingSampleData, setShowingSampleData] = useState(false)
  const [visibleCount, setVisibleCount] = useState(0)
  const { filters, filtersKey } = useJudgeFilterParams()

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const params = new URLSearchParams({ limit: '100' })
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.set(key, value)
        })
        const res = await fetch(`/api/judges/${judgeId}/recent-cases?${params}`, { cache: 'no-store' })
        if (!res.ok) {
          setDecisions([])
          setShowingSampleData(false)
          setVisibleCount(0)
          return
        }
        const data = await res.json()
        if (data.cases && data.cases.length > 0) {
          setDecisions(data.cases)
          setShowingSampleData(false)
          setVisibleCount(Math.min(10, data.cases.length))
        } else {
          setDecisions([])
          setShowingSampleData(false)
          setVisibleCount(0)
        }
      } catch (e: any) {
        setError('Unable to load recent cases')
        setDecisions([])
        setShowingSampleData(false)
        setVisibleCount(0)
      } finally {
        setLoading(false)
      }
    }
    if (judgeId) load()
  }, [filters, filtersKey, judgeId])

  const displayedDecisions = useMemo(() => {
    if (visibleCount === 0) return []
    return decisions.slice(0, visibleCount)
  }, [decisions, visibleCount])

  const remainingCount = Math.max(decisions.length - visibleCount, 0)

  const formatDate = (value?: string) => {
    if (!value) return null
    try {
      return new Date(value).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return null
    }
  }

  const getExternalUrl = (decision: DecisionItem) => {
    if (decision.source_url) return decision.source_url
    if (decision.courtlistener_id) {
      if (decision.courtlistener_id.startsWith('docket-')) {
        const docketId = decision.courtlistener_id.replace('docket-', '')
        if (docketId.length > 0) {
          return `https://www.courtlistener.com/docket/${docketId}/`
        }
      }
      if (/^\d+$/.test(decision.courtlistener_id)) {
        return `https://www.courtlistener.com/opinion/${decision.courtlistener_id}/`
      }
    }
    return null
  }

  const handleLoadMore = () => {
    setVisibleCount(prev => Math.min(prev + 10, decisions.length))
  }

  const handleShowAll = () => {
    setVisibleCount(decisions.length)
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-[hsl(var(--bg-2))] p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="flex items-center text-2xl font-semibold text-[color:hsl(var(--text-1))]">
            <Gavel className="mr-2 h-6 w-6 text-[color:hsl(var(--accent))]" />
            Recent decisions
          </h2>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-24 animate-pulse rounded-2xl border border-border/60 bg-[hsl(var(--bg-1))]" />
          ))}
        </div>
      </div>
    )
  }

  // If no real decisions available, show placeholder
  if (!loading && decisions.length === 0) {
    return (
      <div className="overflow-hidden rounded-2xl border border-border bg-[hsl(var(--bg-2))]">
        <div className="border-b border-border/60 bg-[hsl(var(--bg-1))] p-6">
          <h2 className="flex items-center text-2xl font-semibold text-[color:hsl(var(--text-1))]">
            <Gavel className="mr-2 h-6 w-6 text-[color:hsl(var(--accent))]" />
            Recent court filings & decisions
          </h2>
        </div>
        <div className="p-6 text-center text-sm text-[color:hsl(var(--text-2))]">
          <Gavel className="mx-auto mb-4 h-10 w-10 text-[color:hsl(var(--text-3))]" />
          <h3 className="mb-2 text-lg font-medium text-[color:hsl(var(--text-1))]">Recent filings not available</h3>
          <p className="mb-4">
            We're working on connecting recent court filings and decisions for this judge from CourtListener.
          </p>
          <div className="rounded-2xl border border-[rgba(110,168,254,0.35)] bg-[rgba(110,168,254,0.18)] p-4 text-[color:hsl(var(--accent))]">
            <p className="text-xs">
              <strong>Coming soon:</strong> Real-time filing data integration with detailed judicial decision patterns and
              analytics.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Count case types for the CTA
  const caseTypeCounts = decisions.reduce((acc, decision) => {
    const type = decision.case_type || 'Other'
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const topCaseType = Object.entries(caseTypeCounts).sort((a, b) => b[1] - a[1])[0]?.[0]

  const badgeBaseClass =
    'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border whitespace-normal break-words leading-snug text-left'
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'decided':
        return `${badgeBaseClass} border-[rgba(103,232,169,0.35)] bg-[rgba(103,232,169,0.14)] text-[color:hsl(var(--pos))]`
      case 'settled':
        return `${badgeBaseClass} border-[rgba(110,168,254,0.4)] bg-[rgba(110,168,254,0.16)] text-[color:hsl(var(--accent))]`
      case 'dismissed':
        return `${badgeBaseClass} border-[rgba(251,211,141,0.4)] bg-[rgba(251,211,141,0.18)] text-[color:hsl(var(--warn))]`
      default:
        return `${badgeBaseClass} border-border/60 bg-[hsl(var(--bg-1))] text-[color:hsl(var(--text-2))]`
    }
  }

  const getCaseTypeClass = (caseType: string) => {
    const value = caseType.toLowerCase()
    if (value.includes('criminal')) {
      return `${badgeBaseClass} border-[rgba(252,165,165,0.4)] bg-[rgba(252,165,165,0.16)] text-[color:hsl(var(--neg))]`
    }
    if (value.includes('family')) {
      return `${badgeBaseClass} border-[rgba(144,119,255,0.35)] bg-[rgba(144,119,255,0.18)] text-[rgba(198,180,255,0.95)]`
    }
    if (value.includes('civil')) {
      return `${badgeBaseClass} border-[rgba(110,168,254,0.35)] bg-[rgba(110,168,254,0.14)] text-[color:hsl(var(--accent))]`
    }
    if (value.includes('tax')) {
      return `${badgeBaseClass} border-[rgba(251,211,141,0.4)] bg-[rgba(251,211,141,0.18)] text-[color:hsl(var(--warn))]`
    }
    if (value.includes('probate')) {
      return `${badgeBaseClass} border-[rgba(124,135,152,0.45)] bg-[rgba(124,135,152,0.18)] text-[color:hsl(var(--text-2))]`
    }
    return `${badgeBaseClass} border-border/60 bg-[hsl(var(--bg-1))] text-[color:hsl(var(--text-2))]`
  }

  const getOutcomeClass = (outcome: string) => {
    const normalized = outcome.toLowerCase()
    if (normalized.includes('plaintiff')) {
      return `${badgeBaseClass} border-[rgba(103,232,169,0.35)] bg-[rgba(103,232,169,0.14)] text-[color:hsl(var(--pos))]`
    }
    if (normalized.includes('defendant')) {
      return `${badgeBaseClass} border-[rgba(251,211,141,0.4)] bg-[rgba(251,211,141,0.18)] text-[color:hsl(var(--warn))]`
    }
    if (normalized.includes('guilty')) {
      return `${badgeBaseClass} border-[rgba(252,165,165,0.4)] bg-[rgba(252,165,165,0.16)] text-[color:hsl(var(--neg))]`
    }
    return `${badgeBaseClass} border-border/60 bg-[hsl(var(--bg-1))] text-[color:hsl(var(--text-2))]`
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-[hsl(var(--bg-2))] shadow-md">
      <div className="border-b border-border/60 bg-[hsl(var(--bg-1))] px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center text-2xl font-semibold text-[color:hsl(var(--text-1))]">
            <Gavel className="mr-2 h-6 w-6 text-[color:hsl(var(--accent))]" />
            Recent Court Filings & Decisions
          </h2>
          {decisions.length > 0 && (
            <div className="text-sm text-[color:hsl(var(--text-3))]">
              Showing {visibleCount} of {decisions.length} records
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4 px-6 py-5">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-[rgba(252,165,165,0.4)] bg-[rgba(252,165,165,0.18)] px-3 py-2 text-sm text-[color:hsl(var(--neg))]">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {displayedDecisions.map((decision, index) => {
          const externalUrl = getExternalUrl(decision)
          const filingLabel = formatDate(decision.filing_date)
          const decisionLabel = formatDate(decision.decision_date)
          const statusKey = (decision.status || (decision.decision_date ? 'decided' : 'pending')).toLowerCase()
          const statusLabel = statusKey.replace(/_/g, ' ').toUpperCase()
          const statusClass = getStatusClass(statusKey)
          const caseType = decision.case_type || 'General Litigation'
          const caseTypeClass = getCaseTypeClass(caseType)
          const mostRecent = index === 0

          return (
            <article
              key={decision.id}
              className="rounded-2xl border border-border/70 bg-[hsl(var(--bg-2))] p-5 transition-transform duration-200 hover:-translate-y-0.5 hover:border-[rgba(110,168,254,0.45)]"
            >
              <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="flex-1">
                  <h3 className="break-words text-lg font-semibold text-[color:hsl(var(--text-1))]">
                    {decision.case_name}
                  </h3>
                  <p className="break-words text-sm text-[color:hsl(var(--text-3))]">Case No. {decision.case_number}</p>
                </div>
                {externalUrl && (
                  <a
                    className="inline-flex items-center gap-1 rounded-full border border-border/60 px-3 py-1 text-xs text-[color:hsl(var(--text-3))] transition-colors hover:border-[rgba(110,168,254,0.45)] hover:text-[color:hsl(var(--accent))]"
                    href={externalUrl}
                    target="_blank"
                    rel="noreferrer"
                    title="View on CourtListener"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open document
                  </a>
                )}
              </div>

              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className={statusClass}>{statusLabel}</span>
                <span className={caseTypeClass}>{caseType}</span>
                {decision.outcome && <span className={getOutcomeClass(decision.outcome)}>{decision.outcome}</span>}
              </div>

              {decision.summary && (
                <p className="mb-3 break-words text-sm leading-relaxed text-[color:hsl(var(--text-2))]">{decision.summary}</p>
              )}

              <div className="flex flex-col gap-2 text-xs text-[color:hsl(var(--text-3))] sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" aria-hidden />
                    {filingLabel ? `Filed ${filingLabel}` : 'Filed date unavailable'}
                  </span>
                  {decisionLabel && (
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" aria-hidden />
                      {`Closed ${decisionLabel}`}
                    </span>
                  )}
                </div>
                {mostRecent && (
                  <span className="inline-flex items-center gap-1.5 text-[color:hsl(var(--pos))]">
                    <TrendingUp className="h-3 w-3" aria-hidden />
                    Most recent
                  </span>
                )}
              </div>
            </article>
          )
        })}
      </div>

      {decisions.length > 0 && remainingCount > 0 && (
        <div className="flex items-center justify-between gap-3 border-t border-border/60 bg-[hsl(var(--bg-1))] px-6 py-4 text-sm">
          <div className="text-[color:hsl(var(--text-2))]">
            {remainingCount} additional {remainingCount === 1 ? 'filing' : 'filings'} available
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleLoadMore}
              className="text-[color:hsl(var(--accent))] transition-colors hover:text-[rgba(110,168,254,0.8)]"
            >
              Load more
            </button>
            <span className="text-[color:hsl(var(--text-3))]">•</span>
            <button
              type="button"
              onClick={handleShowAll}
              className="text-[color:hsl(var(--accent))] transition-colors hover:text-[rgba(110,168,254,0.8)]"
            >
              Show all
            </button>
          </div>
        </div>
      )}

      <div className="border-t border-border/60 bg-[hsl(var(--bg-1))] px-6 py-4">
        <p className="text-sm text-[color:hsl(var(--text-2))]">
          <strong className="text-[color:hsl(var(--text-1))]">Attorneys:</strong> This judge frequently handles{' '}
          <span className="font-semibold text-[color:hsl(var(--accent))]">{topCaseType || 'various'}</span> filings.{' '}
          <a
            href="#attorney-slots"
            className="text-[color:hsl(var(--accent))] underline-offset-2 transition-colors hover:text-[rgba(110,168,254,0.8)]"
          >
            Advertise your expertise here →
          </a>
        </p>
      </div>
    </div>
  )
}
