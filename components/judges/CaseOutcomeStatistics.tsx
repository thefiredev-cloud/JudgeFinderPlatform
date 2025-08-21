'use client'

import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { TrendingUp, Target, Clock, Scale, Award, AlertTriangle } from 'lucide-react'
import type { Judge } from '@/types'

interface CaseOutcomeStats {
  overall_stats: {
    total_cases: number
    win_rate: number
    settlement_rate: number
    dismissal_rate: number
    reversal_rate: number
    average_case_duration: number
  }
  case_type_breakdown: Array<{
    case_type: string
    total_cases: number
    win_rate: number
    settlement_rate: number
    avg_duration: number
  }>
  yearly_trends: Array<{
    year: number
    total_cases: number
    settlement_rate: number
    win_rate: number
  }>
  performance_metrics: {
    efficiency_score: number // Cases per month
    consistency_score: number // Variance in outcomes
    speed_ranking: 'Fast' | 'Average' | 'Slow'
    specialization_areas: string[]
  }
}

interface CaseOutcomeStatisticsProps {
  judge: Judge
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

export function CaseOutcomeStatistics({ judge }: CaseOutcomeStatisticsProps) {
  const [outcomeStats, setOutcomeStats] = useState<CaseOutcomeStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState<'overview' | 'breakdown' | 'trends'>('overview')

  useEffect(() => {
    const fetchOutcomeStats = async () => {
      try {
        const response = await fetch(`/api/judges/${judge.id}/case-outcomes`)
        if (response.ok) {
          const data = await response.json()
          setOutcomeStats(data)
        }
      } catch (error) {
        console.error('Failed to fetch outcome statistics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOutcomeStats()
  }, [judge.id])

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-1/2 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!outcomeStats) {
    return (
      <div className="bg-gray-900 rounded-lg p-6 text-center">
        <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
        <p className="text-gray-300">Case outcome statistics unavailable</p>
      </div>
    )
  }

  const pieData = [
    { name: 'Settlements', value: outcomeStats.overall_stats.settlement_rate * 100, color: '#10B981' },
    { name: 'Wins', value: (outcomeStats.overall_stats.win_rate - outcomeStats.overall_stats.settlement_rate) * 100, color: '#3B82F6' },
    { name: 'Dismissals', value: outcomeStats.overall_stats.dismissal_rate * 100, color: '#F59E0B' },
    { name: 'Other', value: 100 - (outcomeStats.overall_stats.settlement_rate + outcomeStats.overall_stats.win_rate + outcomeStats.overall_stats.dismissal_rate) * 100, color: '#6B7280' }
  ].filter(item => item.value > 0)

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <Target className="h-6 w-6 text-green-400" />
        <h3 className="text-xl font-semibold text-white">Case Outcome Statistics</h3>
      </div>

      {/* Navigation */}
      <div className="flex gap-4 mb-6 border-b border-gray-700">
        {[
          { id: 'overview', label: 'Overview', icon: Target },
          { id: 'breakdown', label: 'Case Types', icon: BarChart },
          { id: 'trends', label: 'Trends', icon: TrendingUp }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveView(id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${
              activeView === id
                ? 'bg-green-600 text-white border-b-2 border-green-400'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeView === 'overview' && (
        <div>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Scale className="h-5 w-5 text-blue-400" />
                <span className="text-sm text-gray-400">Total Cases</span>
              </div>
              <div className="text-2xl font-bold text-blue-400">
                {outcomeStats.overall_stats.total_cases.toLocaleString()}
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-5 w-5 text-green-400" />
                <span className="text-sm text-gray-400">Win Rate</span>
              </div>
              <div className="text-2xl font-bold text-green-400">
                {(outcomeStats.overall_stats.win_rate * 100).toFixed(1)}%
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-5 w-5 text-purple-400" />
                <span className="text-sm text-gray-400">Settlement Rate</span>
              </div>
              <div className="text-2xl font-bold text-purple-400">
                {(outcomeStats.overall_stats.settlement_rate * 100).toFixed(1)}%
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-yellow-400" />
                <span className="text-sm text-gray-400">Avg Duration</span>
              </div>
              <div className="text-2xl font-bold text-yellow-400">
                {outcomeStats.overall_stats.average_case_duration} days
              </div>
            </div>
          </div>

          {/* Outcome Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-medium text-white mb-4">Outcome Distribution</h4>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`${value.toFixed(1)}%`, '']}
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div>
              <h4 className="text-lg font-medium text-white mb-4">Performance Metrics</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Efficiency Score</span>
                  <span className="text-green-400 font-medium">
                    {outcomeStats.performance_metrics.efficiency_score.toFixed(1)} cases/month
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Consistency Score</span>
                  <span className="text-blue-400 font-medium">
                    {outcomeStats.performance_metrics.consistency_score.toFixed(0)}/100
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Decision Speed</span>
                  <span className={`font-medium ${
                    outcomeStats.performance_metrics.speed_ranking === 'Fast' ? 'text-green-400' :
                    outcomeStats.performance_metrics.speed_ranking === 'Slow' ? 'text-red-400' : 'text-yellow-400'
                  }`}>
                    {outcomeStats.performance_metrics.speed_ranking}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Reversal Rate</span>
                  <span className="text-orange-400 font-medium">
                    {(outcomeStats.overall_stats.reversal_rate * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
              
              {/* Specialization Areas */}
              <div className="mt-4">
                <h5 className="text-md font-medium text-white mb-2">Specialization Areas</h5>
                <div className="flex flex-wrap gap-2">
                  {outcomeStats.performance_metrics.specialization_areas.map((area, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Case Type Breakdown */}
      {activeView === 'breakdown' && (
        <div>
          <h4 className="text-lg font-medium text-white mb-4">Performance by Case Type</h4>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={outcomeStats.case_type_breakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="case_type" stroke="#9CA3AF" angle={-45} textAnchor="end" height={100} />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                formatter={(value: number, name: string) => [
                  name.includes('rate') ? `${(value * 100).toFixed(1)}%` : value,
                  name.replace('_', ' ')
                ]}
              />
              <Bar dataKey="win_rate" fill="#10B981" name="Win Rate" />
              <Bar dataKey="settlement_rate" fill="#3B82F6" name="Settlement Rate" />
            </BarChart>
          </ResponsiveContainer>
          
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left text-gray-400 py-2">Case Type</th>
                  <th className="text-right text-gray-400 py-2">Cases</th>
                  <th className="text-right text-gray-400 py-2">Win Rate</th>
                  <th className="text-right text-gray-400 py-2">Settlement Rate</th>
                  <th className="text-right text-gray-400 py-2">Avg Duration</th>
                </tr>
              </thead>
              <tbody>
                {outcomeStats.case_type_breakdown.map((item, index) => (
                  <tr key={index} className="border-b border-gray-800">
                    <td className="text-white py-2">{item.case_type}</td>
                    <td className="text-gray-300 py-2 text-right">{item.total_cases}</td>
                    <td className="text-green-400 py-2 text-right">{(item.win_rate * 100).toFixed(1)}%</td>
                    <td className="text-blue-400 py-2 text-right">{(item.settlement_rate * 100).toFixed(1)}%</td>
                    <td className="text-yellow-400 py-2 text-right">{item.avg_duration} days</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Trends */}
      {activeView === 'trends' && (
        <div>
          <h4 className="text-lg font-medium text-white mb-4">Performance Trends Over Time</h4>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={outcomeStats.yearly_trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="year" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                formatter={(value: number, name: string) => [
                  name.includes('rate') ? `${(value * 100).toFixed(1)}%` : value,
                  name.replace('_', ' ')
                ]}
              />
              <Line type="monotone" dataKey="total_cases" stroke="#8B5CF6" name="Total Cases" />
              <Line type="monotone" dataKey="win_rate" stroke="#10B981" name="Win Rate" />
              <Line type="monotone" dataKey="settlement_rate" stroke="#3B82F6" name="Settlement Rate" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}