'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Scale, Calendar, Target, TrendingUp, Clock, Users, Filter } from 'lucide-react'
import Link from 'next/link'
import { AdvancedSearchFilters } from './AdvancedSearchFilters'
import { generateSlug } from '@/lib/utils/slug'
import type { Judge } from '@/types'

interface JudgeSearchResult extends Judge {
  match_score: number
  experience_years: number
  efficiency_score: number
  settlement_rate: number
  primary_specialization: string
}

interface AdvancedJudgeFilters {
  case_types: string[]
  min_experience: number
  max_experience: number
  case_value_range: string
  efficiency_level: string
  settlement_rate_min: number
  settlement_rate_max: number
  specialization: string
  court_types: string[]
}

interface AdvancedJudgeSearchResponse {
  judges: JudgeSearchResult[]
  total_count: number
  page: number
  per_page: number
  has_more: boolean
  applied_filters: AdvancedJudgeFilters
  search_took_ms: number
}

export function EnhancedJudgeSearch() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<AdvancedJudgeSearchResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<AdvancedJudgeFilters | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const performSearch = useCallback(async (query: string, searchFilters: any, page = 1) => {
    setLoading(true)
    setErrorMessage(null)

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      })

      if (query.trim()) {
        params.append('q', query.trim())
      }

      // Add filter parameters
      if (searchFilters) {
        Object.entries(searchFilters).forEach(([key, value]) => {
          if (value !== undefined && value !== '' && value !== 0 && value !== 100 && value !== 50) {
            if (Array.isArray(value) && value.length > 0) {
              params.append(key, value.join(','))
            } else if (!Array.isArray(value) && value !== null) {
              params.append(key, value.toString())
            }
          }
        })
      }

      const response = await fetch(`/api/judges/advanced-search?${params.toString()}`)
      
      if (response.ok) {
        const data: AdvancedJudgeSearchResponse = await response.json()
        setSearchResults(data)
      } else {
        console.error('Search failed:', response.statusText)
        setSearchResults(null)
        setErrorMessage('Unable to load judge search results. Please try again.')
      }
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults(null)
      setErrorMessage('Unable to load judge search results. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleSearch = () => {
    setCurrentPage(1)
    performSearch(searchQuery, filters, 1)
  }

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters)
    setCurrentPage(1)
    performSearch(searchQuery, newFilters, 1)
  }

  const handleClearFilters = () => {
    setFilters(null)
    setCurrentPage(1)
    performSearch(searchQuery, null, 1)
  }

  const loadMore = () => {
    if (searchResults?.has_more) {
      const nextPage = currentPage + 1
      setCurrentPage(nextPage)
      performSearch(searchQuery, filters, nextPage)
    }
  }

  // Initial load - show some judges by default
  useEffect(() => {
    performSearch('', null, 1)
  }, [performSearch])

  const getExperienceColor = (years: number) => {
    if (years >= 20) return 'text-purple-400'
    if (years >= 10) return 'text-blue-400'
    if (years >= 5) return 'text-green-400'
    return 'text-yellow-400'
  }

  const getEfficiencyColor = (score: number) => {
    if (score >= 15) return 'text-green-400'
    if (score >= 5) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getSettlementColor = (rate: number) => {
    if (rate >= 0.6) return 'text-green-400'
    if (rate >= 0.4) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">
            Find the Right Judge for Your Case
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Search through {searchResults?.total_count || '1,810'} California judges with advanced filtering 
            by case type, experience, settlement rates, and judicial patterns.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-4xl mx-auto mb-6">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search judges by name, court, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg font-medium transition-colors"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        <AdvancedSearchFilters
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
          isOpen={filtersOpen}
          onToggle={() => setFiltersOpen(!filtersOpen)}
        />

        {errorMessage && (
          <div className="max-w-4xl mx-auto mb-6 rounded-lg border border-red-500/30 bg-red-500/10 text-red-100 px-4 py-3 text-sm">
            {errorMessage}
          </div>
        )}

        {/* Search Results Summary */}
        {searchResults && (
          <div className="mb-6 flex justify-between items-center">
            <div className="text-gray-300">
              Showing {searchResults.judges.length} of {searchResults.total_count} judges
              {searchResults.search_took_ms && (
                <span className="text-gray-500 ml-2">
                  ({searchResults.search_took_ms}ms)
                </span>
              )}
            </div>
            {searchResults.applied_filters && Object.values(searchResults.applied_filters).some(v => v && v !== '' && (!Array.isArray(v) || v.length > 0)) && (
              <div className="text-blue-400 text-sm">
                Advanced filters applied
              </div>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading && !searchResults && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="animate-pulse rounded-lg border border-gray-800 bg-gray-800/60 p-6">
                <div className="h-4 w-1/2 bg-gray-700 rounded mb-3" />
                <div className="h-3 w-2/3 bg-gray-700 rounded mb-2" />
                <div className="h-3 w-1/3 bg-gray-700 rounded mb-6" />
                <div className="space-y-2">
                  <div className="h-3 w-full bg-gray-700 rounded" />
                  <div className="h-3 w-3/4 bg-gray-700 rounded" />
                  <div className="h-3 w-2/5 bg-gray-700 rounded" />
                  <div className="h-3 w-1/2 bg-gray-700 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results Grid */}
        {searchResults && searchResults.judges.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {searchResults.judges.map((judge) => (
              <Link
                key={judge.id}
                href={`/judges/${generateSlug(judge.name)}`}
                className="group"
              >
                <div className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors border border-gray-700 group-hover:border-blue-500">
                  {/* Match Score Indicator */}
                  {judge.match_score < 1.0 && (
                    <div className="flex justify-end mb-2">
                      <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded">
                        {Math.round(judge.match_score * 100)}% match
                      </span>
                    </div>
                  )}

                  {/* Judge Info */}
                  <div className="mb-4">
                    <h3 className="text-xl font-semibold text-white mb-1 group-hover:text-blue-400 transition-colors">
                      {judge.name}
                    </h3>
                    <p className="text-gray-400 text-sm mb-2">{judge.court_name}</p>
                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                      <Scale className="h-4 w-4" />
                      <span>{judge.jurisdiction}</span>
                    </div>
                  </div>

                  {/* Key Metrics */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Experience:</span>
                      <span className={`font-medium ${getExperienceColor(judge.experience_years)}`}>
                        {judge.experience_years} years
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Efficiency:</span>
                      <span className={`font-medium ${getEfficiencyColor(judge.efficiency_score)}`}>
                        {judge.efficiency_score.toFixed(1)} cases/mo
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Settlement Rate:</span>
                      <span className={`font-medium ${getSettlementColor(judge.settlement_rate)}`}>
                        {(judge.settlement_rate * 100).toFixed(1)}%
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Specialization:</span>
                      <span className="text-blue-400 font-medium text-sm">
                        {judge.primary_specialization}
                      </span>
                    </div>
                  </div>

                  {/* Total Cases */}
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Total Cases:</span>
                      <span className="text-green-400 font-medium">
                        {(judge.total_cases || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Load More */}
        {searchResults?.has_more && (
          <div className="text-center">
            <button
              onClick={loadMore}
              disabled={loading}
              className="px-8 py-3 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-600 rounded-lg font-medium transition-colors border border-gray-600"
            >
              {loading ? 'Loading...' : 'Load More Judges'}
            </button>
          </div>
        )}

        {/* No Results */}
        {searchResults && searchResults.judges.length === 0 && !loading && (
          <div className="text-center py-12">
            <Scale className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No judges found</h3>
            <p className="text-gray-400 mb-4">
              Try adjusting your search query or filters to find more results.
            </p>
            <button
              onClick={handleClearFilters}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
