"use client"

import { Calendar, FileText, ExternalLink, Gavel, TrendingUp, AlertCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

interface RecentDecisionsProps {
  judgeId: string
}

interface DecisionItem {
  id: string
  case_name: string
  case_number: string
  decision_date?: string
  case_type?: string
  outcome?: string
  summary?: string
  courtlistener_id?: string
}

// No sample data - use real case data only

export function RecentDecisions({ judgeId }: RecentDecisionsProps) {
  const [decisions, setDecisions] = useState<DecisionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showingSampleData, setShowingSampleData] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const res = await fetch(`/api/judges/${judgeId}/recent-cases?limit=4`, { cache: 'no-store' })
        if (!res.ok) {
          setDecisions([])
          setShowingSampleData(false)
          return
        }
        const data = await res.json()
        if (data.cases && data.cases.length > 0) {
          setDecisions(data.cases)
          setShowingSampleData(false)
        } else {
          setDecisions([])
          setShowingSampleData(false)
        }
      } catch (e: any) {
        setError('Unable to load recent cases')
        setDecisions([])
        setShowingSampleData(false)
      } finally {
        setLoading(false)
      }
    }
    if (judgeId) load()
  }, [judgeId])

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
            Recent Decisions & Rulings
          </h2>
        </div>
        <div className="p-6">
          <div className="text-center py-8">
            <Gavel className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Recent Case Data Not Available</h3>
            <p className="text-gray-600 mb-4">
              We're working on connecting recent case decisions for this judge from CourtListener.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Coming Soon:</strong> Real-time case data integration with detailed judicial decision patterns and outcomes.
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
            Recent Decisions & Rulings
          </h2>
          <button className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center">
            View Full History
            <ExternalLink className="h-3 w-3 ml-1" />
          </button>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {decisions.map((decision, index) => (
          <div
            key={decision.id}
            className="rounded-lg border border-gray-200 p-4 transition-all hover:shadow-md hover:border-blue-200"
          >
            <div className="mb-3 flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-lg">{decision.case_name}</h3>
                <p className="text-sm text-gray-500">Case No. {decision.case_number}</p>
              </div>
              {decision.courtlistener_id && (
                <a
                  className="text-gray-400 hover:text-blue-600 transition-colors"
                  href={`https://www.courtlistener.com/opinion/${decision.courtlistener_id}/`}
                  target="_blank"
                  rel="noreferrer"
                  title="View on CourtListener"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>

            <div className="mb-3 flex flex-wrap gap-2">
              {decision.case_type && (
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                  decision.case_type === 'Criminal' ? 'bg-red-100 text-red-800' :
                  decision.case_type === 'Family Law' ? 'bg-purple-100 text-purple-800' :
                  decision.case_type === 'Civil Litigation' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {decision.case_type}
                </span>
              )}
              {decision.outcome && (
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                  decision.outcome.includes('Plaintiff') ? 'bg-green-100 text-green-800' :
                  decision.outcome.includes('Defendant') ? 'bg-orange-100 text-orange-800' :
                  decision.outcome.includes('Guilty') ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {decision.outcome}
                </span>
              )}
            </div>

            {decision.summary && (
              <p className="mb-3 text-sm text-gray-700 leading-relaxed">{decision.summary}</p>
            )}

            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center">
                <Calendar className="mr-1 h-3 w-3" />
                {decision.decision_date
                  ? new Date(decision.decision_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })
                  : 'Date unavailable'}
              </div>
              {index === 0 && (
                <span className="inline-flex items-center text-green-600">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Most Recent
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Attorney CTA based on case types */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 border-t">
        <p className="text-sm text-gray-700">
          <strong className="text-gray-900">Attorneys:</strong> This judge frequently handles{' '}
          <span className="font-semibold text-blue-600">{topCaseType || 'various'}</span> cases.{' '}
          <a href="#attorney-slots" className="text-blue-600 hover:text-blue-700 underline">
            Advertise your expertise here →
          </a>
        </p>
      </div>
    </div>
  )
}