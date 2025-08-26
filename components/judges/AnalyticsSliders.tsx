'use client'

import { useEffect, useState } from 'react'

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
  
  // Enhanced confidence metrics
  confidence_civil: number
  confidence_custody: number
  confidence_alimony: number
  confidence_contracts: number
  confidence_sentencing: number
  confidence_plea: number
  overall_confidence: number
  
  // Sample sizes for transparency
  sample_size_civil: number
  sample_size_custody: number
  sample_size_alimony: number
  sample_size_contracts: number
  sample_size_sentencing: number
  sample_size_plea: number
  
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
    if (conf >= 85) return 'text-green-600 bg-green-100'
    if (conf >= 75) return 'text-blue-600 bg-blue-100'
    if (conf >= 65) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }
  
  const getConfidenceLabel = (conf: number) => {
    if (conf >= 85) return 'High'
    if (conf >= 75) return 'Good'
    if (conf >= 65) return 'Fair'
    return 'Low'
  }
  
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className={`px-2 py-1 rounded-full font-medium ${getConfidenceColor(confidence)}`}>
        {getConfidenceLabel(confidence)} ({confidence}%)
      </span>
      <span className="text-gray-500">
        {sampleSize} cases
      </span>
    </div>
  )
}

function AnalyticsSlider({ label, value, leftLabel, rightLabel, color, description, confidence, sampleSize }: SliderProps) {
  const isLowConfidence = confidence < 70
  
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${isLowConfidence ? 'opacity-75' : ''}`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-gray-900 mb-1">{label}</h3>
          <ConfidenceIndicator confidence={confidence} sampleSize={sampleSize} />
        </div>
        <span className={`px-3 py-1 rounded text-lg font-bold ${color}`}>
          {value}%
        </span>
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>{leftLabel}</span>
          <span>{rightLabel}</span>
        </div>
        
        <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${
              isLowConfidence ? 'opacity-60' : ''
            } ${
              value < 30 ? 'bg-red-400' :
              value < 45 ? 'bg-orange-400' :
              value < 55 ? 'bg-yellow-400' :
              value < 70 ? 'bg-green-400' :
              'bg-blue-400'
            }`}
            style={{ width: `${value}%` }}
          />
          
          {/* Center line */}
          <div className="absolute top-0 left-1/2 w-px h-full bg-gray-400 transform -translate-x-1/2" />
          
          {/* Low confidence overlay */}
          {isLowConfidence && (
            <div className="absolute inset-0 bg-gray-300 bg-opacity-30 flex items-center justify-center">
              <span className="text-xs text-gray-600 font-medium">Limited Data</span>
            </div>
          )}
        </div>
      </div>
      
      <p className="text-sm text-gray-600">{description}</p>
      
      {isLowConfidence && (
        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
          ⚠️ Limited data available for this analysis
        </div>
      )}
    </div>
  )
}

function LegalDisclaimer({ analytics }: { analytics: CaseAnalytics }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-6">
      <div className="flex items-start gap-3">
        <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-red-600 text-sm font-bold">!</span>
        </div>
        <div className="text-sm">
          <h4 className="font-semibold text-red-900 mb-2">Important Legal Disclaimer</h4>
          <div className="space-y-2 text-red-800">
            <p>
              <strong>These analytics are AI-generated estimates for informational purposes only.</strong> 
              They are based on available case data and statistical patterns, not comprehensive legal analysis.
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Judicial decisions involve complex legal reasoning that cannot be fully captured by statistical analysis</li>
              <li>Each case is unique and outcomes depend on specific facts, law, and circumstances</li>
              <li>Past patterns do not predict future decisions</li>
              <li>Confidence scores reflect data quality, not certainty of outcomes</li>
              <li>Always consult qualified legal professionals for case strategy and legal advice</li>
            </ul>
            <div className="bg-red-100 p-3 rounded mt-3">
              <p className="font-medium">
                Data Quality: {analytics.analysis_quality.toUpperCase()} | 
                Model: {analytics.ai_model} | 
                Cases Analyzed: {analytics.total_cases_analyzed} |
                Overall Confidence: {analytics.overall_confidence}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}export default function AnalyticsSliders({ judgeId, judgeName }: AnalyticsSlidersProps) {
  const [analytics, setAnalytics] = useState<CaseAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dataSource, setDataSource] = useState<string>('')

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true)
        const response = await fetch(`/api/judges/${judgeId}/analytics`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch analytics')
        }
        
        const data = await response.json()
        setAnalytics(data.analytics)
        setDataSource(data.data_source || 'unknown')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    if (judgeId) {
      fetchAnalytics()
    }
  }, [judgeId])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-gray-600">Analyzing judicial patterns with AI...</p>
          <p className="text-sm text-gray-500">This may take a few moments</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-red-800 font-medium mb-2">Analytics Unavailable</h3>
        <p className="text-red-600">
          Unable to load analytics for this judge. This may be due to insufficient case data or system configuration.
        </p>
        <details className="mt-3">
          <summary className="text-red-700 cursor-pointer font-medium">Technical Details</summary>
          <p className="text-red-600 text-sm mt-2 bg-red-100 p-2 rounded">{error}</p>
        </details>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-gray-800 font-medium mb-2">No Analytics Available</h3>
        <p className="text-gray-600">
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
      color: 'bg-blue-100 text-blue-800',
      description: 'In civil litigation, how often does this judge rule in favor of plaintiffs vs defendants?',
      confidence: analytics.confidence_civil,
      sampleSize: analytics.sample_size_civil
    },
    {
      label: 'Child Custody',
      value: analytics.family_custody_mother,
      leftLabel: 'Father Custody',
      rightLabel: 'Mother Custody',
      color: 'bg-blue-100 text-blue-800',
      description: 'In custody disputes, what is the pattern of custody awards between parents?',
      confidence: analytics.confidence_custody,
      sampleSize: analytics.sample_size_custody
    },
    {
      label: 'Alimony Decisions',
      value: analytics.family_alimony_favorable,
      leftLabel: 'Rarely Awards',
      rightLabel: 'Frequently Awards',
      color: 'bg-sky-100 text-sky-800',
      description: 'How likely is this judge to award alimony or spousal support in divorce proceedings?',
      confidence: analytics.confidence_alimony,
      sampleSize: analytics.sample_size_alimony
    },
    {
      label: 'Contract Enforcement',
      value: analytics.contract_enforcement_rate,
      leftLabel: 'Dismisses Claims',
      rightLabel: 'Enforces Contracts',
      color: 'bg-green-100 text-green-800',
      description: 'In contract disputes, how likely is this judge to enforce contract terms vs dismiss claims?',
      confidence: analytics.confidence_contracts,
      sampleSize: analytics.sample_size_contracts
    },
    {
      label: 'Criminal Sentencing',
      value: analytics.criminal_sentencing_severity,
      leftLabel: 'Lenient',
      rightLabel: 'Strict',
      color: 'bg-red-100 text-red-800',
      description: 'What is the typical severity of criminal sentences imposed by this judge?',
      confidence: analytics.confidence_sentencing,
      sampleSize: analytics.sample_size_sentencing
    },
    {
      label: 'Plea Deal Acceptance',
      value: analytics.criminal_plea_acceptance,
      leftLabel: 'Rarely Accepts',
      rightLabel: 'Often Accepts',
      color: 'bg-orange-100 text-orange-800',
      description: 'How receptive is this judge to plea bargain agreements in criminal cases?',
      confidence: analytics.confidence_plea,
      sampleSize: analytics.sample_size_plea
    }
  ]

  return (
    <div className="space-y-6">
      <div className={`border rounded-lg p-4 ${
        analytics.overall_confidence >= 80 ? 'bg-green-50 border-green-200' :
        analytics.overall_confidence >= 70 ? 'bg-blue-50 border-blue-200' :
        analytics.overall_confidence >= 60 ? 'bg-yellow-50 border-yellow-200' :
        'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">3-Year Judicial Analytics</h2>
            <p className="text-gray-700">
              Analysis based on {analytics.total_cases_analyzed} cases from 2022-2025 using {analytics.ai_model.replace('_', ' ')}
            </p>
            <div className="mt-2 flex items-center gap-4 text-sm">
              <span className="text-gray-600">
                Data Period: <span className="font-medium">Last 3 Years (2022-2025)</span>
              </span>
              <span className="text-gray-600">
                Quality: <span className="font-medium capitalize">{analytics.analysis_quality}</span>
              </span>
            </div>
            <div className="mt-1 flex items-center gap-4 text-sm">
              <span className="text-gray-600">
                Data Source: <span className="font-medium">{dataSource.replace('_', ' ')}</span>
              </span>
              <span className="text-gray-600">
                Coverage: <span className="font-medium">36-Month Analysis</span>
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold ${
              analytics.overall_confidence >= 80 ? 'text-green-700' :
              analytics.overall_confidence >= 70 ? 'text-blue-700' :
              analytics.overall_confidence >= 60 ? 'text-yellow-700' :
              'text-red-700'
            }`}>
              {analytics.overall_confidence}%
            </div>
            <div className="text-sm text-gray-600">Overall Confidence</div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {sliders.map((slider, index) => (
          <AnalyticsSlider key={index} {...slider} />
        ))}
      </div>


      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Last updated: {new Date(analytics.last_updated).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
          <span>
            Generated: {new Date(analytics.generated_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      <LegalDisclaimer analytics={analytics} />
    </div>
  )
}