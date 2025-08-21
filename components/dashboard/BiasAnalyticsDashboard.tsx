'use client'

import { useState, useEffect } from 'react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, AlertTriangle, Scale, Users, Target, Clock, DollarSign, Filter, Download } from 'lucide-react'

interface BiasAnalyticsData {
  overview: {
    total_judges: number
    avg_consistency_score: number
    avg_settlement_rate: number
    potential_bias_flags: number
    cases_analyzed: number
  }
  consistency_distribution: Array<{
    score_range: string
    judge_count: number
    percentage: number
  }>
  settlement_patterns: Array<{
    case_type: string
    avg_settlement_rate: number
    judge_count: number
    variance: number
  }>
  temporal_trends: Array<{
    month: string
    avg_consistency: number
    avg_settlement_rate: number
    case_volume: number
  }>
  bias_indicators: Array<{
    judge_name: string
    judge_id: string
    consistency_score: number
    settlement_rate: number
    speed_score: number
    bias_risk_level: 'Low' | 'Medium' | 'High'
    flags: string[]
  }>
  geographic_distribution: Array<{
    jurisdiction: string
    avg_consistency: number
    avg_settlement_rate: number
    judge_count: number
  }>
  case_value_impact: Array<{
    value_range: string
    settlement_rate: number
    dismissal_rate: number
    judge_count: number
  }>
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']
const RISK_COLORS = {
  Low: '#10B981',
  Medium: '#F59E0B', 
  High: '#EF4444'
}

export function BiasAnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState<BiasAnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'patterns' | 'judges' | 'geographic'>('overview')
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string>('all')
  const [riskFilter, setRiskFilter] = useState<string>('all')

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        const params = new URLSearchParams()
        if (selectedJurisdiction !== 'all') params.append('jurisdiction', selectedJurisdiction)
        if (riskFilter !== 'all') params.append('risk_level', riskFilter)

        const response = await fetch(`/api/admin/bias-analytics?${params.toString()}`)
        if (response.ok) {
          const data = await response.json()
          setAnalyticsData(data)
        }
      } catch (error) {
        console.error('Failed to fetch bias analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalyticsData()
  }, [selectedJurisdiction, riskFilter])

  const exportData = async () => {
    try {
      const response = await fetch('/api/admin/bias-analytics/export')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `bias-analytics-${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Failed to export data:', error)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="bg-white rounded-lg p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Analytics</h3>
        <p className="text-gray-600">There was an error loading the bias analytics data.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Judicial Bias Analytics Dashboard</h2>
          <p className="text-gray-600">
            Comprehensive analysis of judicial patterns across {analyticsData.overview.total_judges} judges
          </p>
        </div>
        <div className="flex gap-3">
          <select
            value={selectedJurisdiction}
            onChange={(e) => setSelectedJurisdiction(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Jurisdictions</option>
            <option value="CA">California</option>
            <option value="Federal">Federal</option>
          </select>
          <button
            onClick={exportData}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export Data
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Judges</p>
              <p className="text-2xl font-bold text-gray-900">
                {analyticsData.overview.total_judges.toLocaleString()}
              </p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Consistency</p>
              <p className="text-2xl font-bold text-green-600">
                {analyticsData.overview.avg_consistency_score.toFixed(1)}
              </p>
            </div>
            <Target className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Settlement Rate</p>
              <p className="text-2xl font-bold text-blue-600">
                {(analyticsData.overview.avg_settlement_rate * 100).toFixed(1)}%
              </p>
            </div>
            <Scale className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Bias Flags</p>
              <p className="text-2xl font-bold text-red-600">
                {analyticsData.overview.potential_bias_flags}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Cases Analyzed</p>
              <p className="text-2xl font-bold text-gray-900">
                {analyticsData.overview.cases_analyzed.toLocaleString()}
              </p>
            </div>
            <Clock className="h-8 w-8 text-gray-500" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'patterns', label: 'Bias Patterns', icon: Scale },
            { id: 'judges', label: 'Judge Analysis', icon: Users },
            { id: 'geographic', label: 'Geographic', icon: Target }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Consistency Distribution */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Consistency Score Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.consistency_distribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="score_range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="judge_count" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Settlement Patterns */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Settlement Patterns by Case Type</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.settlement_patterns}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="case_type" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip formatter={(value: number) => `${(value * 100).toFixed(1)}%`} />
                <Bar dataKey="avg_settlement_rate" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'patterns' && (
        <div className="space-y-6">
          {/* Temporal Trends */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Bias Pattern Trends Over Time</h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={analyticsData.temporal_trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="avg_consistency" stroke="#3B82F6" name="Consistency Score" />
                <Line type="monotone" dataKey="avg_settlement_rate" stroke="#10B981" name="Settlement Rate" />
                <Line type="monotone" dataKey="case_volume" stroke="#F59E0B" name="Case Volume" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Case Value Impact */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Case Value Impact on Outcomes</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.case_value_impact}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="value_range" />
                <YAxis />
                <Tooltip formatter={(value: number) => `${(value * 100).toFixed(1)}%`} />
                <Legend />
                <Bar dataKey="settlement_rate" fill="#10B981" name="Settlement Rate" />
                <Bar dataKey="dismissal_rate" fill="#EF4444" name="Dismissal Rate" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'judges' && (
        <div className="space-y-6">
          {/* Risk Filter */}
          <div className="flex gap-4 items-center">
            <label className="text-sm font-medium text-gray-700">Filter by Risk Level:</label>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Risk Levels</option>
              <option value="High">High Risk</option>
              <option value="Medium">Medium Risk</option>
              <option value="Low">Low Risk</option>
            </select>
          </div>

          {/* Judge Analysis Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Individual Judge Analysis</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Judge
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Consistency
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Settlement Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Speed Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Risk Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Flags
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analyticsData.bias_indicators.map((judge) => (
                    <tr key={judge.judge_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{judge.judge_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{judge.consistency_score}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{(judge.settlement_rate * 100).toFixed(1)}%</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{judge.speed_score}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          judge.bias_risk_level === 'High' ? 'bg-red-100 text-red-800' :
                          judge.bias_risk_level === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {judge.bias_risk_level}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs text-gray-500">
                          {judge.flags.length > 0 ? judge.flags.join(', ') : 'None'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'geographic' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Geographic Distribution of Bias Patterns</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Jurisdiction</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Judges</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Avg Consistency</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Avg Settlement Rate</th>
                </tr>
              </thead>
              <tbody>
                {analyticsData.geographic_distribution.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-3 px-4 text-gray-900">{item.jurisdiction}</td>
                    <td className="py-3 px-4 text-gray-600">{item.judge_count}</td>
                    <td className="py-3 px-4 text-gray-600">{item.avg_consistency.toFixed(1)}</td>
                    <td className="py-3 px-4 text-gray-600">{(item.avg_settlement_rate * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}