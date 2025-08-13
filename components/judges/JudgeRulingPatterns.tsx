'use client'

import { useState } from 'react'
import { BarChart, PieChart, TrendingUp, TrendingDown } from 'lucide-react'

interface JudgeRulingPatternsProps {
  judgeId: string
}

export function JudgeRulingPatterns({ judgeId }: JudgeRulingPatternsProps) {
  const [activeTab, setActiveTab] = useState('overview')

  // Mock data - would be fetched based on judgeId
  const patterns = {
    plaintiff_win_rate: 0.58,
    defendant_win_rate: 0.42,
    settlement_rate: 0.35,
    dismissal_rate: 0.15,
    summary_judgment: {
      granted: 0.28,
      denied: 0.72
    },
    case_types: [
      { type: 'Civil Rights', percentage: 25, trend: 'up' },
      { type: 'Contract Disputes', percentage: 20, trend: 'stable' },
      { type: 'Personal Injury', percentage: 18, trend: 'down' },
      { type: 'Employment', percentage: 15, trend: 'up' },
      { type: 'Criminal', percentage: 12, trend: 'stable' },
      { type: 'Other', percentage: 10, trend: 'stable' }
    ]
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Ruling Patterns</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`rounded px-3 py-1 text-sm ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('trends')}
            className={`rounded px-3 py-1 text-sm ${
              activeTab === 'trends'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Trends
          </button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Win Rates */}
          <div>
            <h3 className="mb-4 font-semibold text-gray-900">Party Win Rates</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-gray-200 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm text-gray-600">Plaintiff Win Rate</span>
                  <BarChart className="h-4 w-4 text-gray-400" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {(patterns.plaintiff_win_rate * 100).toFixed(0)}%
                </p>
                <div className="mt-2 h-2 rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full bg-blue-600"
                    style={{ width: `${patterns.plaintiff_win_rate * 100}%` }}
                  />
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm text-gray-600">Defendant Win Rate</span>
                  <BarChart className="h-4 w-4 text-gray-400" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {(patterns.defendant_win_rate * 100).toFixed(0)}%
                </p>
                <div className="mt-2 h-2 rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full bg-green-600"
                    style={{ width: `${patterns.defendant_win_rate * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Case Types */}
          <div>
            <h3 className="mb-4 font-semibold text-gray-900">Case Type Distribution</h3>
            <div className="space-y-3">
              {patterns.case_types.map((caseType) => (
                <div key={caseType.type} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <PieChart className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{caseType.type}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-900">
                      {caseType.percentage}%
                    </span>
                    {caseType.trend === 'up' && (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    )}
                    {caseType.trend === 'down' && (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Metrics */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-600">Settlement Rate</p>
              <p className="text-xl font-bold text-gray-900">
                {(patterns.settlement_rate * 100).toFixed(0)}%
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-600">Dismissal Rate</p>
              <p className="text-xl font-bold text-gray-900">
                {(patterns.dismissal_rate * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'trends' && (
        <div className="py-8 text-center text-gray-500">
          <TrendingUp className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <p>Trend analysis coming soon</p>
        </div>
      )}
    </div>
  )
}