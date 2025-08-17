'use client'

import { useState, useEffect } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Gavel, 
  Building2, 
  DollarSign,
  MapPin,
  Clock,
  Star,
  Activity,
  Target
} from 'lucide-react'

interface KPIData {
  totalJudges: number
  totalCourts: number
  totalCases: number
  totalUsers: number
  californiaJudges: number
  platformCoverage: number
  availableSlots: number
  revenueMonthlyPotential: number
  revenueAnnualPotential: number
  searchActivity: number
  dailyAverageSearches: number
  judgesWithCourts: number
  dataQualityScore: number
  growthRate: number
  calculatedAt: string
}

export default function LiveKPIDashboard() {
  const [kpiData, setKpiData] = useState<KPIData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  const fetchKPIData = async () => {
    try {
      const response = await fetch('/api/analytics/kpi')
      if (!response.ok) {
        throw new Error('Failed to fetch KPI data')
      }
      const data = await response.json()
      setKpiData(data)
      setLastUpdated(new Date().toLocaleTimeString())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchKPIData()
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchKPIData, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading live metrics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 rounded-lg p-8">
            <p className="text-red-600">Error loading KPI data: {error}</p>
            <button 
              onClick={fetchKPIData}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`
    }
    return `$${amount.toLocaleString()}`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Live KPI Dashboard</h1>
              <p className="mt-2 text-gray-600">Real-time platform metrics and revenue tracking</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-700 font-medium">Live</span>
              </div>
              <div className="text-sm text-gray-500">
                Last updated: {lastUpdated}
              </div>
              <button 
                onClick={fetchKPIData}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Top Level Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-md">
                <Gavel className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Judges</p>
                <p className="text-2xl font-bold text-gray-900">{kpiData?.totalJudges.toLocaleString()}</p>
                <p className="text-xs text-green-600">+{kpiData?.growthRate}% growth</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-md">
                <Building2 className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Courts</p>
                <p className="text-2xl font-bold text-gray-900">{kpiData?.totalCourts.toLocaleString()}</p>
                <p className="text-xs text-blue-600">Complete coverage</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-md">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Cases</p>
                <p className="text-2xl font-bold text-gray-900">{kpiData?.totalCases.toLocaleString()}</p>
                <p className="text-xs text-purple-600">Database rich</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-md">
                <Target className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Data Quality</p>
                <p className="text-2xl font-bold text-gray-900">{kpiData?.dataQualityScore}%</p>
                <p className="text-xs text-orange-600">Health score</p>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">Monthly Revenue Potential</p>
                <p className="text-3xl font-bold">{formatCurrency(kpiData?.revenueMonthlyPotential || 0)}</p>
                <p className="text-green-200 text-sm">{kpiData?.availableSlots.toLocaleString()} attorney slots available</p>
              </div>
              <DollarSign className="h-12 w-12 text-white opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">Annual Revenue Potential</p>
                <p className="text-3xl font-bold">{formatCurrency(kpiData?.revenueAnnualPotential || 0)}</p>
                <p className="text-purple-200 text-sm">Full platform monetization</p>
              </div>
              <TrendingUp className="h-12 w-12 text-white opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100">California Coverage</p>
                <p className="text-3xl font-bold">{kpiData?.californiaJudges.toLocaleString()}</p>
                <p className="text-orange-200 text-sm">{kpiData?.platformCoverage}% of platform</p>
              </div>
              <MapPin className="h-12 w-12 text-white opacity-80" />
            </div>
          </div>
        </div>

        {/* Detailed Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Platform Health</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Judges with court assignments</span>
                <div className="text-right">
                  <span className="font-semibold text-green-600">{kpiData?.judgesWithCourts.toLocaleString()}</span>
                  <div className="text-xs text-gray-500">
                    {Math.round(((kpiData?.judgesWithCourts || 0) / (kpiData?.totalJudges || 1)) * 100)}% complete
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">California judges accessible</span>
                <span className="font-semibold text-blue-600">{kpiData?.californiaJudges.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Database integrity score</span>
                <span className="font-semibold text-purple-600">{kpiData?.dataQualityScore}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Platform growth rate</span>
                <span className="font-semibold text-orange-600">+{kpiData?.growthRate}%</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Revenue Breakdown</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Available attorney slots</span>
                <span className="font-semibold text-green-600">{kpiData?.availableSlots.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Revenue per slot (monthly)</span>
                <span className="font-semibold text-blue-600">$500</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Pipeline value (monthly)</span>
                <span className="font-semibold text-purple-600">{formatCurrency(kpiData?.revenueMonthlyPotential || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Pipeline value (annual)</span>
                <span className="font-semibold text-orange-600">{formatCurrency(kpiData?.revenueAnnualPotential || 0)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Platform Status</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Star className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-sm text-gray-600">Status</p>
              <p className="font-semibold text-green-600">Operational</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-sm text-gray-600">API Health</p>
              <p className="font-semibold text-blue-600">100%</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
              <p className="text-sm text-gray-600">Last Sync</p>
              <p className="font-semibold text-purple-600">Live</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <BarChart3 className="h-6 w-6 text-orange-600" />
              </div>
              <p className="text-sm text-gray-600">Ready for</p>
              <p className="font-semibold text-orange-600">Phase 5D</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}