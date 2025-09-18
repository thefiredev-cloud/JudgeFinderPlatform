"use client"

import { Calendar, FileText, ExternalLink, Gavel, TrendingUp, AlertCircle } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

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

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const res = await fetch(`/api/judges/${judgeId}/recent-cases?limit=100`, { cache: 'no-store' })
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
  }, [judgeId])

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
      <div className="rounded-lg bg-white p-6 shadow-md">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Gavel className="h-6 w-6 mr-2 text-blue-600" />
            Recent Decisions
          </h2>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-32 bg-gray-100 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // If no real decisions available, show placeholder
  if (!loading && decisions.length === 0) {
    return (
      <div className="rounded-lg bg-white shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Gavel className="h-6 w-6 mr-2 text-blue-600" />
            Recent Court Filings & Decisions
          </h2>
        </div>
        <div className="p-6">
          <div className="text-center py-8">
            <Gavel className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Recent Court Filings Not Available</h3>
            <p className="text-gray-600 mb-4">
              We're working on connecting recent court filings and decisions for this judge from CourtListener.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Coming Soon:</strong> Real-time filing data integration with detailed judicial decision patterns and analytics.
              </p>
            </div>
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

  return (
    <div className="rounded-lg bg-white shadow-md overflow-hidden">
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Gavel className="h-6 w-6 mr-2 text-blue-600" />
            Recent Court Filings & Decisions
          </h2>
          {decisions.length > 0 && (
            <div className="text-sm text-gray-500">
              Showing {visibleCount} of {decisions.length} records
            </div>
          )}
        </div>
      </div>

      <div className="p-6 space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
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
          const statusClass = statusKey === 'decided'
            ? 'bg-green-100 text-green-800'
            : statusKey === 'settled'
            ? 'bg-blue-100 text-blue-800'
            : statusKey === 'dismissed'
            ? 'bg-orange-100 text-orange-800'
            : 'bg-yellow-100 text-yellow-800'
          const caseType = decision.case_type || 'General Litigation'
          const caseTypeKey = caseType.toLowerCase()
          const caseTypeClass = caseTypeKey.includes('criminal')
            ? 'bg-red-100 text-red-800'
            : caseTypeKey.includes('family')
            ? 'bg-purple-100 text-purple-800'
            : caseTypeKey.includes('civil')
            ? 'bg-blue-100 text-blue-800'
            : caseTypeKey.includes('tax')
            ? 'bg-amber-100 text-amber-800'
            : caseTypeKey.includes('probate')
            ? 'bg-indigo-100 text-indigo-800'
            : 'bg-gray-100 text-gray-800'
          const outcomeLower = decision.outcome?.toLowerCase() || ''
          const outcomeClass = outcomeLower.includes('plaintiff')
            ? 'bg-green-100 text-green-800'
            : outcomeLower.includes('defendant')
            ? 'bg-orange-100 text-orange-800'
            : outcomeLower.includes('guilty')
            ? 'bg-red-100 text-red-800'
            : 'bg-gray-100 text-gray-800'
          const mostRecent = index === 0

          return (
            <div
              key={decision.id}
              className="rounded-lg border border-gray-200 p-4 transition-all hover:shadow-md hover:border-blue-200"
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-lg">{decision.case_name}</h3>
                  <p className="text-sm text-gray-500">Case No. {decision.case_number}</p>
                </div>
                {externalUrl && (
                  <a
                    className="text-gray-400 hover:text-blue-600 transition-colors"
                    href={externalUrl}
                    target="_blank"
                    rel="noreferrer"
                    title="View on CourtListener"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>

              <div className="mb-3 flex flex-wrap gap-2">
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${statusClass}`}>
                  {statusLabel}
                </span>
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${caseTypeClass}`}>
                  {caseType}
                </span>
                {decision.outcome && (
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${outcomeClass}`}>
                    {decision.outcome}
                  </span>
                )}
              </div>

              {decision.summary && (
                <p className="mb-3 text-sm text-gray-700 leading-relaxed">{decision.summary}</p>
              )}

              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-3">
                  <div className="flex items-center">
                    <Calendar className="mr-1 h-3 w-3" />
                    {filingLabel ? `Filed ${filingLabel}` : 'Filed date unavailable'}
                  </div>
                  {decisionLabel && (
                    <div className="flex items-center">
                      <Calendar className="mr-1 h-3 w-3" />
                      {`Closed ${decisionLabel}`}
                    </div>
                  )}
                </div>
                {mostRecent && (
                  <span className="inline-flex items-center text-green-600">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Most Recent
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {decisions.length > 0 && remainingCount > 0 && (
        <div className="border-t bg-gray-50 px-6 py-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {remainingCount} additional {remainingCount === 1 ? 'filing' : 'filings'} available
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLoadMore}
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Load More
            </button>
            <span className="text-gray-300">|</span>
            <button
              type="button"
              onClick={handleShowAll}
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Show All
            </button>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 border-t">
        <p className="text-sm text-gray-700">
          <strong className="text-gray-900">Attorneys:</strong> This judge frequently handles{' '}
          <span className="font-semibold text-blue-600">{topCaseType || 'various'}</span> filings.{' '}
          <a href="#attorney-slots" className="text-blue-600 hover:text-blue-700 underline">
            Advertise your expertise here →
          </a>
        </p>
      </div>
    </div>
  )
}
