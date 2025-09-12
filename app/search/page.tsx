'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Search, Filter, Scale, Building, MapPin, Users, ChevronLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import type { SearchResponse, SearchResult } from '@/types/search'

function SearchResults() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [searchData, setSearchData] = useState<SearchResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<'all' | 'judge' | 'court' | 'jurisdiction'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const query = searchParams.get('q') || ''
  const type = searchParams.get('type') || 'all'

  // Initialize search query from URL
  useEffect(() => {
    setSearchQuery(query)
    setActiveFilter(type as any)
  }, [query, type])

  // Fetch search results
  const fetchSearchResults = useCallback(async () => {
    if (!query.trim()) {
      setSearchData({
        results: [],
        total_count: 0,
        results_by_type: { judges: [], courts: [], jurisdictions: [] },
        counts_by_type: { judges: 0, courts: 0, jurisdictions: 0 },
        query: '',
        took_ms: 0
      })
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      // Use specialized endpoints for better results
      if (activeFilter === 'judge') {
        // Use dedicated judges search endpoint for judge searches
        const response = await fetch(`/api/judges/search?q=${encodeURIComponent(query)}&limit=200`)
        if (response.ok) {
          const judges = await response.json()
          // Transform judges data to match SearchResponse format
          const searchResults = judges.map((judge: any) => ({
            id: judge.id,
            type: 'judge',
            title: judge.name,
            subtitle: judge.title || judge.position,
            description: `${judge.court_name || ''} • ${judge.jurisdiction || ''}`,
            url: `/judges/${judge.slug || judge.id}`,
            score: 1.0
          }))
          
          setSearchData({
            results: searchResults,
            total_count: searchResults.length,
            results_by_type: { 
              judges: searchResults, 
              courts: [], 
              jurisdictions: [] 
            },
            counts_by_type: { 
              judges: searchResults.length, 
              courts: 0, 
              jurisdictions: 0 
            },
            query: query,
            took_ms: 100
          })
        }
      } else {
        // Use general search for other types
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=${activeFilter}&limit=200`)
        if (response.ok) {
          const data: SearchResponse = await response.json()
          setSearchData(data)
        }
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }, [query, activeFilter])

  useEffect(() => {
    fetchSearchResults()
  }, [fetchSearchResults])

  // Update URL when filter changes
  const handleFilterChange = (newFilter: typeof activeFilter) => {
    setActiveFilter(newFilter)
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (newFilter !== 'all') params.set('type', newFilter)
    router.push(`/search?${params.toString()}`)
  }

  // Handle new search
  const handleSearch = () => {
    if (searchQuery.trim()) {
      const params = new URLSearchParams()
      params.set('q', searchQuery.trim())
      if (activeFilter !== 'all') params.set('type', activeFilter)
      router.push(`/search?${params.toString()}`)
    }
  }

  const getFilteredResults = (): SearchResult[] => {
    if (!searchData) return []
    
    switch (activeFilter) {
      case 'judge':
        return searchData.results_by_type.judges
      case 'court':
        return searchData.results_by_type.courts
      case 'jurisdiction':
        return searchData.results_by_type.jurisdictions
      default:
        return searchData.results
    }
  }

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'judge':
        return <Scale className="h-5 w-5 text-blue-400" />
      case 'court':
        return <Building className="h-5 w-5 text-green-400" />
      case 'jurisdiction':
        return <MapPin className="h-5 w-5 text-purple-400" />
      default:
        return <Search className="h-5 w-5 text-gray-400" />
    }
  }

  const filteredResults = getFilteredResults()

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      {/* Header */}
      <div className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4 mb-6">
            <Link
              href="/"
              className="flex items-center text-gray-300 hover:text-white transition-colors"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to home
            </Link>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search judges, courts, or jurisdictions..."
                className="w-full rounded-lg border border-gray-600 bg-gray-700/50 py-3 pl-10 pr-20 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <button
                onClick={handleSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-2 text-sm font-medium text-white hover:from-blue-600 hover:to-purple-600 transition-colors"
              >
                Search
              </button>
            </div>
          </div>

          {/* Search Stats */}
          {searchData && !loading && (
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-300">
              <span>
                {searchData.total_count.toLocaleString()} results for "{query}"
              </span>
              <span>•</span>
              <span>{searchData.took_ms}ms</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Filter Results</h3>
              
              <div className="space-y-2">
                <button
                  onClick={() => handleFilterChange('all')}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                    activeFilter === 'all'
                      ? 'bg-blue-600/20 text-blue-400 font-medium border border-blue-500/30'
                      : 'text-gray-300 hover:bg-gray-700/50'
                  }`}
                >
                  All Results
                  {searchData && (
                    <span className="float-right text-sm text-gray-400">
                      {searchData.total_count}
                    </span>
                  )}
                </button>
                
                <button
                  onClick={() => handleFilterChange('judge')}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                    activeFilter === 'judge'
                      ? 'bg-blue-600/20 text-blue-400 font-medium border border-blue-500/30'
                      : 'text-gray-300 hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-center">
                    <Scale className="h-4 w-4 mr-2 text-blue-400" />
                    Judges
                  </div>
                  {searchData && (
                    <span className="float-right text-sm text-gray-400">
                      {searchData.counts_by_type.judges}
                    </span>
                  )}
                </button>
                
                <button
                  onClick={() => handleFilterChange('court')}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                    activeFilter === 'court'
                      ? 'bg-blue-600/20 text-blue-400 font-medium border border-blue-500/30'
                      : 'text-gray-300 hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-center">
                    <Building className="h-4 w-4 mr-2 text-green-400" />
                    Courts
                  </div>
                  {searchData && (
                    <span className="float-right text-sm text-gray-400">
                      {searchData.counts_by_type.courts}
                    </span>
                  )}
                </button>
                
                <button
                  onClick={() => handleFilterChange('jurisdiction')}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                    activeFilter === 'jurisdiction'
                      ? 'bg-blue-600/20 text-blue-400 font-medium border border-blue-500/30'
                      : 'text-gray-300 hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-purple-400" />
                    Jurisdictions
                  </div>
                  {searchData && (
                    <span className="float-right text-sm text-gray-400">
                      {searchData.counts_by_type.jurisdictions}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-3 mt-8 lg:mt-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                <span className="ml-3 text-gray-300">Searching...</span>
              </div>
            ) : filteredResults.length === 0 ? (
              <div className="text-center py-12">
                <Search className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No results found</h3>
                <p className="text-gray-300">
                  {query 
                    ? `No results found for "${query}"${activeFilter !== 'all' ? ` in ${activeFilter}s` : ''}`
                    : 'Enter a search term to get started'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredResults.map((result) => (
                  <Link
                    key={`${result.type}-${result.id}`}
                    href={result.url}
                    className="block bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 p-6 hover:bg-gray-700/50 hover:border-blue-500/30 transition-all duration-200"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 mt-1">
                        {getResultIcon(result.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-lg font-semibold text-white truncate">
                            {result.title}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                            result.type === 'judge' ? 'bg-blue-600/20 text-blue-400' :
                            result.type === 'court' ? 'bg-green-600/20 text-green-400' :
                            'bg-purple-600/20 text-purple-400'
                          }`}>
                            {result.type}
                          </span>
                        </div>
                        
                        {result.subtitle && (
                          <p className="text-blue-400 font-medium mb-2">{result.subtitle}</p>
                        )}
                        
                        {result.description && (
                          <p className="text-gray-300 mb-3">{result.description}</p>
                        )}
                        
                        <div className="flex items-center text-sm text-gray-400">
                          <span className="truncate">{result.url}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-gray-300">Loading search...</p>
        </div>
      </div>
    }>
      <SearchResults />
    </Suspense>
  )
}