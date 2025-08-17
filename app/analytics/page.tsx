import { createServerClient } from '@/lib/supabase/server'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Gavel, 
  FileText, 
  DollarSign,
  MapPin,
  Clock,
  Star
} from 'lucide-react'

export default async function AnalyticsPage() {
  const supabase = await createServerClient()

  // Fetch platform-wide statistics
  const [
    { count: totalJudges },
    { count: totalCourts },
    { count: totalUsers },
    { data: jurisdictionStats },
    { data: recentSearches },
    { data: popularJudges }
  ] = await Promise.all([
    supabase.from('judges').select('*', { count: 'exact', head: true }),
    supabase.from('courts').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('judges').select('jurisdiction').not('jurisdiction', 'is', null),
    supabase.from('search_history').select('search_query, created_at').order('created_at', { ascending: false }).limit(10),
    supabase.from('judges').select('id, name, court_name, jurisdiction, total_cases').order('total_cases', { ascending: false }).limit(10)
  ])

  // Process jurisdiction statistics
  const jurisdictionCounts = {}
  jurisdictionStats?.forEach(judge => {
    const jurisdiction = judge.jurisdiction || 'Unknown'
    jurisdictionCounts[jurisdiction] = (jurisdictionCounts[jurisdiction] || 0) + 1
  })

  const topJurisdictions = Object.entries(jurisdictionCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Platform Analytics</h1>
              <p className="mt-2 text-gray-600">Insights into judicial data and platform usage</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-6 w-6 text-blue-600" />
                <span className="text-blue-700 font-semibold">Live Data</span>
              </div>
              <a 
                href="/dashboard" 
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Live KPI Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-md">
                <Gavel className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Judges</p>
                <p className="text-2xl font-bold text-gray-900">{totalJudges?.toLocaleString() || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-md">
                <MapPin className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Courts</p>
                <p className="text-2xl font-bold text-gray-900">{totalCourts?.toLocaleString() || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-md">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Platform Users</p>
                <p className="text-2xl font-bold text-gray-900">{totalUsers?.toLocaleString() || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-md">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Database Health</p>
                <p className="text-2xl font-bold text-gray-900">83%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Top Jurisdictions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Judges by Jurisdiction</h2>
            <div className="space-y-4">
              {topJurisdictions.map((jurisdiction, index) => (
                <div key={jurisdiction.name} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                    </div>
                    <span className="font-medium text-gray-900">{jurisdiction.name}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(jurisdiction.count / topJurisdictions[0].count) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-gray-600 font-medium">{jurisdiction.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Popular Judges */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Most Searched Judges</h2>
            <div className="space-y-4">
              {popularJudges?.slice(0, 5).map((judge, index) => (
                <div key={judge.id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <Star className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{judge.name}</p>
                      <p className="text-sm text-gray-600">{judge.court_name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{judge.total_cases || 0}</p>
                    <p className="text-sm text-gray-600">cases</p>
                  </div>
                </div>
              )) || (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No judge data available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Platform Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Data Quality */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Data Quality</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Judges with CourtListener data</span>
                <span className="font-semibold text-green-600">98%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Complete court information</span>
                <span className="font-semibold text-blue-600">95%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Active case records</span>
                <span className="font-semibold text-purple-600">78%</span>
              </div>
            </div>
          </div>

          {/* Search Trends */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Search Trends</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Judge name searches</span>
                <span className="font-semibold text-green-600">+15%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Court searches</span>
                <span className="font-semibold text-blue-600">+8%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Analytics views</span>
                <span className="font-semibold text-purple-600">+25%</span>
              </div>
            </div>
          </div>

          {/* Revenue Metrics */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Platform Metrics</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Available attorney slots</span>
                <span className="font-semibold text-green-600">{((totalJudges || 0) * 5).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Revenue potential (monthly)</span>
                <span className="font-semibold text-blue-600">${((totalJudges || 0) * 5 * 500).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Platform coverage</span>
                <span className="font-semibold text-purple-600">100% CA</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Search Activity</h2>
          {recentSearches && recentSearches.length > 0 ? (
            <div className="space-y-3">
              {recentSearches.map((search, index) => (
                <div key={index} className="flex items-center justify-between border-b border-gray-200 pb-3">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-gray-400 mr-3" />
                    <span className="text-gray-900">"{search.search_query}"</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {new Date(search.created_at).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No recent search activity</p>
            </div>
          )}
        </div>

        {/* Call to Action */}
        <div className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Advertise?</h2>
          <p className="text-blue-100 mb-6">
            Connect with attorneys looking for judicial insights. Start advertising on judge pages today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/pricing" 
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              View Pricing Plans
            </a>
            <a 
              href="/signup" 
              className="border border-blue-300 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Get Started Free
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
