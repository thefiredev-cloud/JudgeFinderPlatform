'use client'

import { useState, useEffect, useCallback } from 'react'
import { Gavel, MapPin, Scale, Search, Loader2, Calendar, Users } from 'lucide-react'
import Link from 'next/link'
import type { Judge, JudgeDecisionSummary } from '@/types'
import { generateSlug } from '@/lib/utils/slug'
import { useSearchDebounce } from '@/lib/hooks/useDebounce'
import { JudgeCardSkeleton, SearchSkeleton } from '@/components/ui/Skeleton'

interface JudgeWithDecisions extends Judge {
  decision_summary?: JudgeDecisionSummary
}

interface JudgesResponse {
  judges: JudgeWithDecisions[]
  total_count: number
  page: number
  per_page: number
  has_more: boolean
}

export default function JudgesPage() {
  const [searchInput, setSearchInput] = useState('')
  const [selectedJurisdiction, setSelectedJurisdiction] = useState('CA')
  const [judges, setJudges] = useState<JudgeWithDecisions[]>([])
  const [loading, setLoading] = useState(true)
  const [initialLoad, setInitialLoad] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [onlyWithDecisions, setOnlyWithDecisions] = useState(true)

  // Use debounced search
  const { debouncedSearchQuery, isSearching } = useSearchDebounce(searchInput, 300)

  const fetchJudges = useCallback(async (page = 1, reset = false) => {
    if (reset) {
      setLoading(true)
    }
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        include_decisions: 'true' // Use combined endpoint
      })
      
      if (debouncedSearchQuery.trim()) params.append('q', debouncedSearchQuery)
      if (selectedJurisdiction) params.append('jurisdiction', selectedJurisdiction)

      const response = await fetch(`/api/judges/list?${params}`)
      if (!response.ok) throw new Error('Failed to fetch judges')
      
      const data: JudgesResponse = await response.json()
      
      if (reset || page === 1) {
        setJudges(data.judges)
      } else {
        setJudges(prev => [...prev, ...data.judges])
      }
      
      setTotalCount(data.total_count)
      setCurrentPage(data.page)
      setHasMore(data.has_more)
    } catch (error) {
      console.error('Error fetching judges:', error)
    } finally {
      setLoading(false)
      setInitialLoad(false)
    }
  }, [debouncedSearchQuery, selectedJurisdiction])

  // Filter judges based on decisions toggle
  const filteredJudges = onlyWithDecisions 
    ? judges.filter(judge => judge.decision_summary?.total_recent && judge.decision_summary.total_recent > 0)
    : judges

  useEffect(() => {
    fetchJudges(1, true)
  }, [fetchJudges])

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      fetchJudges(currentPage + 1, false)
    }
  }

  // Use consistent slug generation from utils
  const generateJudgeSlug = (judge: Judge) => {
    return generateSlug(judge.name)
  }

  const getRecentDecisionsDisplay = (judge: JudgeWithDecisions) => {
    const summary = judge.decision_summary
    if (!summary || summary.total_recent === 0) {
      return 'No recent decisions'
    }

    const recentYears = summary.yearly_counts
      .filter(yc => yc.count > 0)
      .slice(0, 3)
      .map(yc => `${yc.year}: ${yc.count}`)
      .join(' | ')

    return recentYears || 'No recent decisions'
  }

  const getCourtAndStateDisplay = (judge: Judge) => {
    const courtName = judge.court_name || 'Court not specified'
    const state = judge.jurisdiction || 'Unknown jurisdiction'
    
    // Format consistently as "Court Name, State"
    if (courtName === 'Court not specified' && state === 'Unknown jurisdiction') {
      return 'Court and jurisdiction not specified'
    }
    
    return `${courtName}, ${state}`
  }

  const jurisdictionOptions = [
    { value: '', label: 'All Jurisdictions' },
    { value: 'Federal', label: 'Federal' },
    { value: 'CA', label: 'California' },
    { value: 'Texas', label: 'Texas' },
  ]

  // Show skeleton during initial load
  if (initialLoad) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Judges Directory</h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Research judicial profiles, decision patterns, and case histories for bias detection and transparency
              </p>
            </div>
          </div>
        </div>

        {/* Search and Filters Skeleton */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <SearchSkeleton />
        </div>

        {/* Judges Grid Skeleton */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <JudgeCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Judges Directory</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Research judicial profiles, decision patterns, and case histories for bias detection and transparency
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Find Judges</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Judges</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search by judge name..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Jurisdiction</label>
              <select
                value={selectedJurisdiction}
                onChange={(e) => setSelectedJurisdiction(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {jurisdictionOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Filter Toggle */}
          <div className="mt-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={onlyWithDecisions}
                onChange={(e) => setOnlyWithDecisions(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">
                Show only judges with recent decisions (2023-2025)
              </span>
            </label>
          </div>
          
          {/* Results Summary */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-blue-800">
                {loading ? (
                  <div className="flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Loading judges...
                  </div>
                ) : onlyWithDecisions ? (
                  `Found ${filteredJudges.length} judges with recent decisions (${totalCount} total in database)`
                ) : (
                  `Found ${totalCount} judges matching your criteria`
                )}
              </div>
              {!loading && totalCount > 0 && (
                <div className="text-sm text-blue-600">
                  Showing {onlyWithDecisions ? filteredJudges.length : judges.length} of {onlyWithDecisions ? filteredJudges.length : totalCount}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Judges Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {loading && judges.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <JudgeCardSkeleton key={index} />
            ))}
          </div>
        ) : filteredJudges.length === 0 ? (
          <div className="text-center py-12">
            <Gavel className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {onlyWithDecisions ? 'No judges with recent decisions found' : 'No judges found'}
            </h3>
            <p className="text-gray-600">
              {onlyWithDecisions 
                ? 'Try unchecking the filter to see all judges or adjusting your search criteria.'
                : 'Try adjusting your search filters.'
              }
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredJudges.map((judge) => (
                <Link
                  key={judge.id}
                  href={`/judges/${generateJudgeSlug(judge)}`}
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-200 p-6 group border border-gray-100 hover:border-blue-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <Gavel className="h-8 w-8 text-blue-600 group-hover:text-blue-700 transition-colors" />
                    <span className="text-sm font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded capitalize">
                      {judge.jurisdiction || 'Jurisdiction'}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {judge.name}
                  </h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Scale className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{getCourtAndStateDisplay(judge)}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-xs">{getRecentDecisionsDisplay(judge)}</span>
                    </div>
                    <div className="pt-2">
                      <span className="text-xs text-blue-600 hover:text-blue-800">
                        View profile →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
              
              {/* Show skeleton cards while loading more */}
              {loading && hasMore && (
                <>
                  {Array.from({ length: 3 }).map((_, index) => (
                    <JudgeCardSkeleton key={`loading-${index}`} />
                  ))}
                </>
              )}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="text-center mt-12">
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center mx-auto"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Loading...
                    </>
                  ) : (
                    'Load More Judges'
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}