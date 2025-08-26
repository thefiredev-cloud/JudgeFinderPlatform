'use client'

import { useState, useEffect } from 'react'
import { Building, MapPin, Users, Scale, Search, Loader2, ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useSearchDebounce } from '@/lib/hooks/useDebounce'
import { CourtCardSkeleton } from '@/components/ui/Skeleton'
import { generateCourtSlug } from '@/lib/utils/slug'

interface Court {
  id: string
  name: string
  type: string
  jurisdiction: string
  slug?: string
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
      <motion.div 
        className="bg-card rounded-xl border border-border p-6 shadow-sm backdrop-blur-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search courts by name..."
              className="w-full rounded-lg border border-border bg-background py-3 pl-10 pr-10 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Jurisdiction
              </label>
              <select
                className="w-full rounded-lg border border-border bg-background py-2.5 px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
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
              <label className="block text-sm font-medium text-foreground mb-2">
                Court Type
              </label>
              <select
                className="w-full rounded-lg border border-border bg-background py-2.5 px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
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
      </motion.div>

      {/* Error Message */}
      {error && (
        <motion.div 
          className="bg-destructive/10 border border-destructive/30 rounded-lg p-4"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="text-destructive">{error}</div>
        </motion.div>
      )}

      {/* Results Summary */}
      <motion.div 
        className="flex items-center justify-between"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          {loading && courts.length === 0 ? (
            <span className="flex items-center">
              <Loader2 className="h-4 w-4 animate-spin mr-2 text-primary" />
              Loading courts...
            </span>
          ) : (
            <>
              <Sparkles className="h-4 w-4 text-primary" />
              Showing {courts.length} of {totalCount.toLocaleString()} courts
            </>
          )}
        </p>
      </motion.div>

      {/* Courts Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {courts.map((court, index) => (
          <motion.div
            key={court.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.5 }}
            whileHover={{ scale: 1.02 }}
            className="group"
          >
            <Link
              href={`/courts/${court.slug || generateCourtSlug(court.name)}`}
              className="block h-full"
            >
              <div className="relative h-full rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:bg-accent/5 group-hover:border-primary/30">
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-enterprise-primary to-enterprise-deep opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
                
                <div className="relative flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                        <Building className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium text-primary">
                        {court.type}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors mb-3">
                      {court.name}
                    </h3>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{court.jurisdiction}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        <span>{court.judge_count} judges</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-sm font-medium">View Details</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </div>
                  
                  <div className="ml-4">
                    <div className="p-2 rounded-lg bg-muted/50 group-hover:bg-primary/10 transition-colors">
                      <Scale className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
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
        <motion.div 
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="bg-primary/10 text-primary px-8 py-3 rounded-lg font-medium hover:bg-primary hover:text-primary-foreground transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
        </motion.div>
      )}
    </div>
  )
}