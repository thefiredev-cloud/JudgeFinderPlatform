'use client'

import Link from 'next/link'
import { MapPin, Building, Calendar, BarChart3, ArrowRight, Scale, Gavel } from 'lucide-react'

function AnalyticsMetric({ label, value, suffix }: { label: string; value: number | null | undefined; suffix?: string }) {
  if (value === null || value === undefined) {
    return (
      <div className="flex flex-col">
        <span className="text-xs font-medium text-gray-500">{label}</span>
        <span className="text-sm text-gray-400">Data unavailable</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <span className="text-xs font-medium text-gray-500">{label}</span>
      <span className="text-lg font-semibold text-gray-900">
        {value}
        {suffix}
      </span>
    </div>
  )
}

interface JudgeAnalyticsPreview {
  overall_confidence: number | null
  total_cases_analyzed: number | null
  civil_plaintiff_favor: number | null
  criminal_sentencing_severity: number | null
  generated_at: string | null
}

interface JudgeCardProps {
  judge: {
    id: string
    name: string
    slug?: string
    court_name?: string
    jurisdiction?: string
    appointed_date?: string
    case_count?: number
    analytics_preview?: JudgeAnalyticsPreview | null
    image_url?: string
  }
  compact?: boolean
}

export default function JudgeCard({ judge, compact = false }: JudgeCardProps) {
  // Calculate years of service
  const yearsOfService = judge.appointed_date 
    ? new Date().getFullYear() - new Date(judge.appointed_date).getFullYear()
    : null

  // Generate slug if not provided
  const judgeSlug = judge.slug || judge.name.toLowerCase()
    .replace(/^(judge|justice|the honorable)\s+/i, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')

  const handleViewProfile = () => {
    // Track click for analytics
    fetch('/api/analytics/chat-funnel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'judge_card_click',
        judge_id: judge.id,
        judge_name: judge.name,
        source: 'chat'
      })
    }).catch(console.error)
  }

  if (compact) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all duration-200">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Gavel className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">{judge.name}</h4>
              <p className="text-sm text-gray-600">{judge.court_name || 'Court information not available'}</p>
            </div>
          </div>
        </div>
        
        <Link 
          href={`/judges/${judgeSlug}`}
          onClick={handleViewProfile}
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          View Profile
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-5 hover:shadow-xl transition-all duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Gavel className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Judge {judge.name.replace(/^(judge|justice|the honorable)\s+/i, '')}
            </h3>
            <p className="text-sm text-gray-600">
              {judge.court_name || 'California Court'}
            </p>
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <MapPin className="w-4 h-4 text-gray-400" />
          <span>{judge.jurisdiction || 'California'}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Building className="w-4 h-4 text-gray-400" />
          <span>Superior Court</span>
        </div>
        
        {yearsOfService && (
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span>{yearsOfService}+ Years</span>
          </div>
        )}
        
        {judge.case_count && (
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Scale className="w-4 h-4 text-gray-400" />
            <span>{judge.case_count.toLocaleString()} Cases</span>
          </div>
        )}
      </div>

      {/* Analytics Preview */}
      {judge.analytics_preview && (
        <div className="mb-4 p-3 bg-white/70 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Analytics Snapshot</span>
            <span className="text-xs text-gray-500">
              {judge.analytics_preview.total_cases_analyzed
                ? `${judge.analytics_preview.total_cases_analyzed.toLocaleString()} cases`
                : 'Data pending'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AnalyticsMetric
              label="Civil plaintiff favor"
              value={judge.analytics_preview.civil_plaintiff_favor}
              suffix="%"
            />
            <AnalyticsMetric
              label="Sentencing severity"
              value={judge.analytics_preview.criminal_sentencing_severity}
              suffix="%"
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
            <span>
              Confidence: {judge.analytics_preview.overall_confidence ?? 'N/A'}%
            </span>
            <span>
              Updated {judge.analytics_preview.generated_at ? new Date(judge.analytics_preview.generated_at).toLocaleDateString() : 'recently'}
            </span>
          </div>

          <p className="text-xs text-gray-500 mt-2">
            Full analytics available on profile page
          </p>
        </div>
      )}

      {/* CTA Button */}
      <Link 
        href={`/judges/${judgeSlug}`}
        onClick={handleViewProfile}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200"
      >
        <BarChart3 className="w-5 h-5" />
        View Full Profile & Analytics
        <ArrowRight className="w-5 h-5" />
      </Link>

      {/* Trust Badge */}
      <div className="mt-3 text-center">
        <p className="text-xs text-gray-500">
          Built with public court data. Verify details on each profile.
        </p>
      </div>
    </div>
  )
}