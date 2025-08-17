'use client'

import { useState, useEffect } from 'react'
import { Gavel, Filter, Search, ChevronDown, Badge, Calendar, User } from 'lucide-react'
import Link from 'next/link'

interface Judge {
  id: string
  name: string
  appointed_date: string | null
  position_type: string
  status: string
  courtlistener_id: string | null
}

interface CourtJudgesResponse {
  judges: Judge[]
  total_count: number
  page: number
  per_page: number
  has_more: boolean
  court_info: {
    id: string
    name: string
    jurisdiction: string
  } | null
}

interface CourtJudgesSectionProps {
  courtId: string
  courtName: string
  initialJudges?: Judge[]
}

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800 border-green-200',
  retired: 'bg-gray-100 text-gray-800 border-gray-200',
  inactive: 'bg-red-100 text-red-800 border-red-200'
}

const POSITION_COLORS = {
  'Chief Judge': 'bg-purple-100 text-purple-800 border-purple-200',
  'Presiding Judge': 'bg-blue-100 text-blue-800 border-blue-200',
  'Judge': 'bg-slate-100 text-slate-800 border-slate-200',
  'Commissioner': 'bg-amber-100 text-amber-800 border-amber-200',
  'Magistrate Judge': 'bg-teal-100 text-teal-800 border-teal-200',
  'Acting Judge': 'bg-orange-100 text-orange-800 border-orange-200',
  'Temporary Judge': 'bg-pink-100 text-pink-800 border-pink-200',
  'Retired Judge': 'bg-gray-100 text-gray-800 border-gray-200'
}

export default function CourtJudgesSection({ courtId, courtName, initialJudges = [] }: CourtJudgesSectionProps) {
  const [judges, setJudges] = useState<Judge[]>(initialJudges)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'retired' | 'inactive'>('all')
  const [positionFilter, setPositionFilter] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Get unique position types from current judges
  const positionTypes = Array.from(new Set(judges.map(judge => judge.position_type))).sort()

  const fetchJudges = async (pageNum: number = 1, reset: boolean = false) => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '20',
        status: statusFilter,
        ...(positionFilter && { position_type: positionFilter })
      })

      const response = await fetch(`/api/courts/${courtId}/judges?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch judges')
      }

      const data: CourtJudgesResponse = await response.json()
      
      if (reset || pageNum === 1) {
        setJudges(data.judges)
      } else {
        setJudges(prev => [...prev, ...data.judges])
      }
      
      setHasMore(data.has_more)
      setTotalCount(data.total_count)
      setPage(pageNum)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Filter judges client-side by search query
  const filteredJudges = judges.filter(judge =>
    searchQuery === '' || judge.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Refetch when filters change
  useEffect(() => {
    fetchJudges(1, true)
  }, [statusFilter, positionFilter])

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchJudges(page + 1)
    }
  }

  const getStatusBadgeClass = (status: string) => {
    return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS.active
  }

  const getPositionBadgeClass = (position: string) => {
    return POSITION_COLORS[position as keyof typeof POSITION_COLORS] || POSITION_COLORS.Judge
  }

  const formatAppointmentDate = (dateString: string | null) => {
    if (!dateString) return null
    return new Date(dateString).getFullYear()
  }

  if (error && judges.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Gavel className="h-5 w-5 mr-2 text-blue-600" />
          Judges at This Court
        </h2>
        <div className="text-center py-8">
          <p className="text-red-600">Error loading judges: {error}</p>
          <button 
            onClick={() => fetchJudges(1, true)}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <Gavel className="h-5 w-5 mr-2 text-blue-600" />
          Judges at This Court
          {totalCount > 0 && (
            <span className="ml-2 px-2 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
              {totalCount}
            </span>
          )}
        </h2>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <Filter className="h-4 w-4 mr-1" />
          Filters
          <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Judges
              </label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="retired">Retired</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Position Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Position Type
              </label>
              <select
                value={positionFilter}
                onChange={(e) => setPositionFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Positions</option>
                {positionTypes.map(position => (
                  <option key={position} value={position}>
                    {position}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filters Summary */}
          {(statusFilter !== 'all' || positionFilter || searchQuery) && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
              <span className="text-sm text-gray-600">Active filters:</span>
              {statusFilter !== 'all' && (
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                  Status: {statusFilter}
                </span>
              )}
              {positionFilter && (
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                  Position: {positionFilter}
                </span>
              )}
              {searchQuery && (
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                  Search: "{searchQuery}"
                </span>
              )}
              <button
                onClick={() => {
                  setStatusFilter('all')
                  setPositionFilter('')
                  setSearchQuery('')
                }}
                className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 underline"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}

      {/* Judges List */}
      {filteredJudges.length === 0 ? (
        <div className="text-center py-8">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            {searchQuery || statusFilter !== 'all' || positionFilter
              ? 'No judges match your current filters.'
              : 'No judges found for this court.'}
          </p>
          {(searchQuery || statusFilter !== 'all' || positionFilter) && (
            <button
              onClick={() => {
                setStatusFilter('all')
                setPositionFilter('')
                setSearchQuery('')
              }}
              className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredJudges.map((judge) => (
            <Link
              key={judge.id}
              href={`/judges/${judge.name.toLowerCase().replace(/\s+/g, '-').replace(/[.,]/g, '')}`}
              className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors hover:border-blue-300 hover:shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-medium text-gray-900">{judge.name}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadgeClass(judge.status)}`}>
                      {judge.status.charAt(0).toUpperCase() + judge.status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className={`px-2 py-1 text-xs font-medium rounded-md border ${getPositionBadgeClass(judge.position_type)}`}>
                      {judge.position_type}
                    </span>
                    
                    {judge.appointed_date && (
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Appointed {formatAppointmentDate(judge.appointed_date)}
                      </div>
                    )}
                  </div>
                </div>
                
                <span className="text-blue-600 font-medium ml-4">View Profile →</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Load More / View All */}
      <div className="mt-6 text-center space-y-3">
        {loading && (
          <div className="text-gray-600">Loading judges...</div>
        )}
        
        {hasMore && !loading && filteredJudges.length > 0 && searchQuery === '' && (
          <button
            onClick={loadMore}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
          >
            Load More Judges
          </button>
        )}
        
        {totalCount > 0 && (
          <Link 
            href={`/judges?court=${encodeURIComponent(courtName)}`} 
            className="block text-blue-600 hover:text-blue-700 font-medium"
          >
            View all {totalCount} judges in dedicated directory →
          </Link>
        )}
      </div>
    </div>
  )
}