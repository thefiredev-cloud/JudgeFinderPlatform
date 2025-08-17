'use client'

import { useState, useEffect } from 'react'
import { Building, MapPin, Users, Scale, Search, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useSearchDebounce } from '@/lib/hooks/useDebounce'
import { CourtCardSkeleton } from '@/components/ui/Skeleton'

interface Court {
  id: string
  name: string
  type: string
  jurisdiction: string
  address?: string | number
  phone?: string
  website?: string
  judge_count: number
}

interface CourtsResponse {
  courts: Court[]
  total_count: number
  page: number
  per_page: number
  has_more: boolean
}

interface CourtsSearchProps {
  initialCourts: Court[]
  initialJurisdiction?: string
}

export function CourtsSearch({ initialCourts, initialJurisdiction = 'CA' }: CourtsSearchProps) {
  const [selectedType, setSelectedType] = useState('')
  const [selectedJurisdiction, setSelectedJurisdiction] = useState(initialJurisdiction)
  const [searchInput, setSearchInput] = useState('')
  const [courts, setCourts] = useState<Court[]>(initialCourts)
  const [loading, setLoading] = useState(false)
  const [initialLoad, setInitialLoad] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState(initialCourts.length)

  // Use debounced search
  const { debouncedSearchQuery, isSearching } = useSearchDebounce(searchInput, 300)

  useEffect(() => {
    let isMounted = true
    let abortController: AbortController | null = null
    
    async function searchCourts() {
      try {
        if (page === 1) {
          setLoading(true)
        }
        setError(null)
        
        // Create new abort controller for this request
        abortController = new AbortController()
        
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '20',
          ...(debouncedSearchQuery && { q: debouncedSearchQuery }),
          ...(selectedJurisdiction && { jurisdiction: selectedJurisdiction }),
          ...(selectedType && { type: selectedType }),
        })

        const res = await fetch(`/api/courts?${params}`, {
          signal: abortController.signal
        })

        if (!isMounted) return

        if (!res.ok) {
          throw new Error(`Failed to load courts: ${res.status}`)
        }

        const data: CourtsResponse = await res.json()
        
        if (isMounted) {
          if (page === 1) {
            setCourts(data.courts)
          } else {
            setCourts(prev => [...prev, ...data.courts])
          }
          setHasMore(data.has_more)
          setTotalCount(data.total_count)
        }
      } catch (error) {
        if (isMounted && !(error instanceof Error && error.name === 'AbortError')) {
          setError('Failed to load courts')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
          setInitialLoad(false)
        }
      }
    }

    // Reset page when search parameters change
    if (page === 1) {
      searchCourts()
    } else {
      setPage(1)
    }

    return () => {
      isMounted = false
      if (abortController) {
        abortController.abort()
      }
    }
  }, [debouncedSearchQuery, selectedJurisdiction, selectedType, page])

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1)
    }
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search courts by name..."
              className="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-10 text-sm placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jurisdiction
              </label>
              <select
                className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={selectedJurisdiction}
                onChange={(e) => setSelectedJurisdiction(e.target.value)}
              >
                <option value="">All Jurisdictions</option>
                <option value="CA">California</option>
                <option value="NY">New York</option>
                <option value="TX">Texas</option>
                <option value="FL">Florida</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Court Type
              </label>
              <select
                className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="">All Types</option>
                <option value="Superior Court">Superior Court</option>
                <option value="Municipal Court">Municipal Court</option>
                <option value="Family Court">Family Court</option>
                <option value="Criminal Court">Criminal Court</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {loading && courts.length === 0 ? (
            <span className="flex items-center">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Loading courts...
            </span>
          ) : (
            `Showing ${courts.length} of ${totalCount.toLocaleString()} courts`
          )}
        </p>
      </div>

      {/* Courts Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {courts.map((court) => (
          <Link
            key={court.id}
            href={`/courts/${court.id}`}
            className="group block"
          >
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow group-hover:shadow-md">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Building className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-600">
                      {court.type}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {court.name}
                  </h3>
                  
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{court.jurisdiction}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="h-4 w-4" />
                      <span>{court.judge_count} judges</span>
                    </div>
                  </div>
                </div>
                
                <div className="ml-4">
                  <Scale className="h-8 w-8 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </div>
              </div>
            </div>
          </Link>
        ))}
        
        {/* Show skeleton cards while loading more */}
        {loading && hasMore && (
          <>
            {Array.from({ length: 3 }).map((_, index) => (
              <CourtCardSkeleton key={`loading-${index}`} />
            ))}
          </>
        )}
        
        {/* Show skeleton cards during initial search */}
        {loading && courts.length === 0 && (
          <>
            {Array.from({ length: 6 }).map((_, index) => (
              <CourtCardSkeleton key={`initial-${index}`} />
            ))}
          </>
        )}
      </div>

      {/* Load More Button */}
      {hasMore && courts.length > 0 && (
        <div className="text-center">
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="bg-gray-100 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="inline h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More Courts'
            )}
          </button>
        </div>
      )}
    </div>
  )
}