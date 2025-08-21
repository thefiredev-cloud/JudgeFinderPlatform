'use client'

import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts'
import { TrendingUp, Scale, AlertTriangle, CheckCircle, Clock, DollarSign } from 'lucide-react'
import type { Judge } from '@/types'

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
    consistency_score: number // 0-100, higher = more consistent
    speed_score: number // 0-100, higher = faster decisions
    settlement_preference: number // -100 to 100, negative = pro-plaintiff, positive = pro-defendant
    risk_tolerance: number // 0-100, based on case value handling
    predictability_score: number // 0-100, higher = more predictable outcomes
  }
}

interface BiasPatternAnalysisProps {
  judge: Judge
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

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

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-700 rounded"></div>
            <div className="h-3 bg-gray-700 rounded w-5/6"></div>
            <div className="h-3 bg-gray-700 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!biasMetrics) {
    return (
      <div className="bg-gray-900 rounded-lg p-6 text-center">
        <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
        <p className="text-gray-300">Unable to analyze bias patterns at this time</p>
      </div>
    )
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    if (score >= 40) return 'text-orange-400'
    return 'text-red-400'
  }

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-4 w-4" />
    if (score >= 60) return <Clock className="h-4 w-4" />
    return <AlertTriangle className="h-4 w-4" />
  }

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <Scale className="h-6 w-6 text-blue-400" />
        <h3 className="text-xl font-semibold text-white">Judicial Pattern Analysis</h3>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-700">
        {[
          { id: 'patterns', label: 'Case Patterns', icon: BarChart },
          { id: 'outcomes', label: 'Outcome Analysis', icon: TrendingUp },
          { id: 'trends', label: 'Temporal Trends', icon: Clock },
          { id: 'indicators', label: 'Bias Indicators', icon: Scale }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${
              activeTab === id
                ? 'bg-blue-600 text-white border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'patterns' && (
        <div>
          <h4 className="text-lg font-medium text-white mb-4">Case Type Distribution & Outcomes</h4>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={biasMetrics.case_type_patterns}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="case_type" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                    labelStyle={{ color: '#F3F4F6' }}
                  />
                  <Bar dataKey="total_cases" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={biasMetrics.case_type_patterns}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="case_type" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                    labelStyle={{ color: '#F3F4F6' }}
                    formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, 'Settlement Rate']}
                  />
                  <Bar dataKey="settlement_rate" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'outcomes' && (
        <div>
          <h4 className="text-lg font-medium text-white mb-4">Outcome Analysis</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <span className="text-sm text-gray-400">Settlement Rate</span>
              </div>
              <div className="text-2xl font-bold text-green-400">
                {(biasMetrics.outcome_analysis.overall_settlement_rate * 100).toFixed(1)}%
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <span className="text-sm text-gray-400">Dismissal Rate</span>
              </div>
              <div className="text-2xl font-bold text-red-400">
                {(biasMetrics.outcome_analysis.dismissal_rate * 100).toFixed(1)}%
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Scale className="h-5 w-5 text-blue-400" />
                <span className="text-sm text-gray-400">Judgment Rate</span>
              </div>
              <div className="text-2xl font-bold text-blue-400">
                {(biasMetrics.outcome_analysis.judgment_rate * 100).toFixed(1)}%
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-yellow-400" />
                <span className="text-sm text-gray-400">Avg. Duration</span>
              </div>
              <div className="text-2xl font-bold text-yellow-400">
                {biasMetrics.outcome_analysis.average_case_duration} days
              </div>
            </div>
          </div>
          
          <div>
            <h5 className="text-md font-medium text-white mb-4">Settlement Rate by Case Value</h5>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={biasMetrics.outcome_analysis.case_value_trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="value_range" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                  labelStyle={{ color: '#F3F4F6' }}
                />
                <Bar dataKey="settlement_rate" fill="#F59E0B" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'trends' && (
        <div>
          <h4 className="text-lg font-medium text-white mb-4">Temporal Trends</h4>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={biasMetrics.temporal_patterns}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                labelStyle={{ color: '#F3F4F6' }}
              />
              <Legend />
              <Line type="monotone" dataKey="case_count" stroke="#3B82F6" name="Case Count" />
              <Line type="monotone" dataKey="settlement_rate" stroke="#10B981" name="Settlement Rate" />
              <Line type="monotone" dataKey="average_duration" stroke="#F59E0B" name="Avg Duration (days)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {activeTab === 'indicators' && (
        <div>
          <h4 className="text-lg font-medium text-white mb-4">Judicial Bias Indicators</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                name: 'Consistency Score',
                value: biasMetrics.bias_indicators.consistency_score,
                description: 'How consistent the judge is in similar cases',
                icon: Scale
              },
              {
                name: 'Speed Score',
                value: biasMetrics.bias_indicators.speed_score,
                description: 'How quickly the judge resolves cases',
                icon: Clock
              },
              {
                name: 'Settlement Preference',
                value: Math.abs(biasMetrics.bias_indicators.settlement_preference),
                description: 'Tendency toward settlements vs. trials',
                icon: CheckCircle
              },
              {
                name: 'Risk Tolerance',
                value: biasMetrics.bias_indicators.risk_tolerance,
                description: 'Willingness to handle high-value cases',
                icon: DollarSign
              },
              {
                name: 'Predictability Score',
                value: biasMetrics.bias_indicators.predictability_score,
                description: 'How predictable the judge\'s decisions are',
                icon: TrendingUp
              }
            ].map((indicator, index) => (
              <div key={index} className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <indicator.icon className="h-5 w-5 text-blue-400" />
                  <span className="text-sm font-medium text-white">{indicator.name}</span>
                </div>
                <div className={`text-2xl font-bold mb-2 ${getScoreColor(indicator.value)}`}>
                  {getScoreIcon(indicator.value)}
                  <span className="ml-2">{indicator.value.toFixed(0)}</span>
                </div>
                <p className="text-xs text-gray-400">{indicator.description}</p>
                
                {/* Progress bar */}
                <div className="mt-3 bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      indicator.value >= 80 ? 'bg-green-400' :
                      indicator.value >= 60 ? 'bg-yellow-400' :
                      indicator.value >= 40 ? 'bg-orange-400' : 'bg-red-400'
                    }`}
                    style={{ width: `${indicator.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-gray-800 rounded-lg">
            <h5 className="text-md font-medium text-white mb-2">Interpretation Guide</h5>
            <div className="text-sm text-gray-400 space-y-1">
              <p><strong>High Consistency (80+):</strong> Very predictable rulings in similar cases</p>
              <p><strong>High Speed (80+):</strong> Resolves cases faster than average</p>
              <p><strong>Settlement Preference:</strong> Positive values indicate pro-settlement tendencies</p>
              <p><strong>High Risk Tolerance (80+):</strong> Comfortable with high-value, complex cases</p>
              <p><strong>High Predictability (80+):</strong> Outcomes align with historical patterns</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}