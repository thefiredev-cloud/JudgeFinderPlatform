'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Gavel, Scale, Search, Loader2, Calendar, ArrowRight, ChevronRight, Sparkles, AlertCircle, RefreshCcw } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import type { Judge, JudgeDecisionSummary } from '@/types'
import { generateSlug } from '@/lib/utils/slug'
import { useSearchDebounce } from '@/lib/hooks/useDebounce'
import { JudgeCardSkeleton, SearchSkeleton } from '@/components/ui/Skeleton'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import GlassCard from '@/components/ui/GlassCard'
import { ParticleBackground } from '@/components/ui/ParticleBackground'
import { TypewriterText } from '@/components/ui/TypewriterText'
import { ScrollIndicator } from '@/components/ui/ScrollIndicator'
import { SharedTransitionLink } from '@/components/ui/SharedTransitionLink'
import * as Sentry from '@sentry/nextjs'

const RECENT_JUDGE_YEARS = 3
const RECENT_YEAR_OPTIONS = [
  { value: 1, label: 'Last 12 months' },
  { value: 3, label: 'Last 3 years' },
  { value: 5, label: 'Last 5 years' }
]

const RECENT_YEAR_CHIPS = [
  { value: 1, label: '12m' },
  { value: 3, label: '3y' },
  { value: 5, label: '5y' }
]

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

interface JudgesContentProps {
  initialData?: JudgesResponse
}

interface FetchOptions {
  reset?: boolean
  prefetch?: boolean
}

const INITIAL_VISIBLE_COUNT = 24
const VISIBLE_INCREMENT = 12

export default function JudgesContent({ initialData }: JudgesContentProps) {
  const currentYear = new Date().getFullYear()
  const [recentYearsFilter, setRecentYearsFilter] = useState(RECENT_JUDGE_YEARS)
  const recentDecisionsStartYear = currentYear - (recentYearsFilter - 1)
  const { scrollYProgress } = useScroll()
  const y = useTransform(scrollYProgress, [0, 1], [0, -50])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0.3])
  const searchParams = useSearchParams()
  
  // Initialize search from URL parameter
  const [searchInput, setSearchInput] = useState('')
  const [selectedJurisdiction, setSelectedJurisdiction] = useState('CA')
  const [judges, setJudges] = useState<JudgeWithDecisions[]>(initialData?.judges ?? [])
  const [visibleCount, setVisibleCount] = useState(() => {
    const initialLength = initialData?.judges?.length ?? 0
    return Math.min(initialLength, INITIAL_VISIBLE_COUNT)
  })
  const [loading, setLoading] = useState(!initialData)
  const [initialLoad, setInitialLoad] = useState(!initialData)
  const [totalCount, setTotalCount] = useState(initialData?.total_count ?? 0)
  const [currentPage, setCurrentPage] = useState(initialData?.page ?? 1)
  const [hasMore, setHasMore] = useState(initialData?.has_more ?? false)
  const [onlyWithDecisions, setOnlyWithDecisions] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const prefetchedPagesRef = useRef<Map<string, JudgesResponse>>(new Map())
  const prefetchInFlightRef = useRef<Set<string>>(new Set())
  const activeSignatureRef = useRef<string>('')
  
  // Initialize search from URL on mount
  useEffect(() => {
    const searchQuery = searchParams.get('search') || searchParams.get('q') || ''
    if (searchQuery) {
      setSearchInput(searchQuery)
    }
  }, [searchParams])

  // Use debounced search
  const { debouncedSearchQuery, isSearching } = useSearchDebounce(searchInput, 300)

  const filtersSignature = useMemo(
    () =>
      JSON.stringify({
        search: debouncedSearchQuery.trim() || '',
        jurisdiction: selectedJurisdiction || 'all',
        onlyWithDecisions,
        recentYearsFilter,
      }),
    [debouncedSearchQuery, selectedJurisdiction, onlyWithDecisions, recentYearsFilter],
  )

  useEffect(() => {
    activeSignatureRef.current = filtersSignature
    prefetchedPagesRef.current.clear()
    prefetchInFlightRef.current.clear()
    setFetchError(null)
    setVisibleCount((previous) => {
      if (previous <= INITIAL_VISIBLE_COUNT) {
        return INITIAL_VISIBLE_COUNT
      }
      return previous
    })
  }, [filtersSignature])

  const buildPrefetchKey = useCallback(
    (page: number, signature: string) => `${signature}::${page}`,
    [],
  )

  const commitPageData = useCallback((data: JudgesResponse, { reset }: { reset: boolean }) => {
    const mergeUniqueById = (existing: JudgeWithDecisions[], incoming: JudgeWithDecisions[]) => {
      const map = new Map<string, JudgeWithDecisions>()
      for (const judge of existing) map.set(judge.id, judge)
      for (const judge of incoming) map.set(judge.id, judge)
      return Array.from(map.values())
    }

    setJudges((previous) => {
      const base = reset || data.page <= 1 ? [] : previous
      const nextJudges = mergeUniqueById(base, data.judges)

      setVisibleCount((count) => {
        if (reset) {
          return Math.min(Math.max(nextJudges.length, INITIAL_VISIBLE_COUNT), INITIAL_VISIBLE_COUNT)
        }
        if (nextJudges.length < count) {
          return nextJudges.length
        }
        return count
      })

      return nextJudges
    })

    setTotalCount(data.total_count)
    setCurrentPage(data.page)
    setHasMore(data.has_more)
  }, [])

  const requestJudges = useCallback(
    async (page: number) => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        include_decisions: 'true',
      })

      const trimmedQuery = debouncedSearchQuery.trim()
      if (trimmedQuery) params.append('q', trimmedQuery)
      if (selectedJurisdiction) params.append('jurisdiction', selectedJurisdiction)
      if (onlyWithDecisions) {
        params.append('only_with_decisions', 'true')
        params.append('recent_years', recentYearsFilter.toString())
      }

      const url = `/api/judges/list?${params.toString()}`
      const start = typeof performance !== 'undefined' ? performance.now() : Date.now()

      try {
        const response = await fetch(url)
        if (!response.ok) {
          const error = new Error(`Failed to fetch judges (status ${response.status})`)
          ;(error as any).status = response.status
          throw error
        }

        const data: JudgesResponse = await response.json()
        const duration = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - start
        return { data, duration, url }
      } catch (unknownError) {
        const duration = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - start
        const error = unknownError instanceof Error ? unknownError : new Error('Failed to fetch judges')
        ;(error as any).duration = duration
        ;(error as any).url = url
        throw error
      }
    },
    [debouncedSearchQuery, onlyWithDecisions, recentYearsFilter, selectedJurisdiction],
  )

  const queuePrefetch = useCallback(
    async (page: number) => {
      if (page <= 0) return

      const signature = filtersSignature
      const key = buildPrefetchKey(page, signature)

      if (prefetchedPagesRef.current.has(key) || prefetchInFlightRef.current.has(key)) {
        return
      }

      prefetchInFlightRef.current.add(key)

      try {
        const { data } = await requestJudges(page)
        if (activeSignatureRef.current !== signature) return
        prefetchedPagesRef.current.set(key, data)
      } catch (error) {
        if (error instanceof Error && activeSignatureRef.current === signature) {
          Sentry.captureException(error, {
            tags: {
              feature: 'judges-directory',
              fetch_type: 'prefetch',
            },
            extra: {
              page,
              durationMs: (error as any).duration ?? undefined,
              url: (error as any).url ?? undefined,
              signature,
            },
            level: 'warning',
          })
        }
      } finally {
        prefetchInFlightRef.current.delete(key)
      }
    },
    [buildPrefetchKey, filtersSignature, requestJudges],
  )

  const fetchJudges = useCallback(
    async (page = 1, options: FetchOptions = {}) => {
      const { reset = false, prefetch = false } = options
      const signature = filtersSignature

      if (reset) {
        setLoading(true)
        setFetchError(null)
        prefetchedPagesRef.current.clear()
        prefetchInFlightRef.current.clear()
      } else if (!prefetch) {
        setLoading(true)
        setFetchError(null)
      }

      try {
        const { data, duration, url } = await requestJudges(page)

        if (signature !== activeSignatureRef.current) {
          return data
        }

        if (prefetch) {
          prefetchedPagesRef.current.set(buildPrefetchKey(page, signature), data)
          return data
        }

        commitPageData(data, { reset: reset || page === 1 })
        setFetchError(null)

        if (page === 1) {
          Sentry.captureMessage('judges-list-initial-fetch', {
            level: 'info',
            tags: {
              feature: 'judges-directory',
            },
            extra: {
              durationMs: Math.round(duration),
              page,
              hasMore: data.has_more,
              totalCount: data.total_count,
              searchTerm: debouncedSearchQuery.trim() || null,
              jurisdiction: selectedJurisdiction || 'all',
              onlyWithDecisions,
              recentYearsFilter,
              url,
              preloaded: Boolean(initialData),
              signature,
            },
          })
        }

        if (data.has_more) {
          void queuePrefetch(data.page + 1)
        }

        return data
      } catch (error) {
        if (!prefetch && signature === activeSignatureRef.current && error instanceof Error) {
          setFetchError('We had trouble loading judges. Please try again.')
          Sentry.captureException(error, {
            tags: {
              feature: 'judges-directory',
              fetch_type: reset ? 'reset' : 'paginate',
            },
            extra: {
              page,
              durationMs: (error as any).duration ?? undefined,
              url: (error as any).url ?? undefined,
              searchTerm: debouncedSearchQuery.trim() || null,
              jurisdiction: selectedJurisdiction || 'all',
              onlyWithDecisions,
              recentYearsFilter,
              signature,
            },
            level: 'error',
          })
        }

        throw error
      } finally {
        if (!prefetch && signature === activeSignatureRef.current) {
          setLoading(false)
          setInitialLoad(false)
        }
      }
    },
    [
      commitPageData,
      buildPrefetchKey,
      debouncedSearchQuery,
      filtersSignature,
      initialData,
      onlyWithDecisions,
      queuePrefetch,
      recentYearsFilter,
      requestJudges,
      selectedJurisdiction,
    ],
  )

  // Filter judges based on decisions toggle
  const filteredJudges = onlyWithDecisions 
    ? judges.filter(judge => judge.decision_summary?.total_recent && judge.decision_summary.total_recent > 0)
    : judges
  const visibleJudges = filteredJudges.slice(0, visibleCount)

  const hasCachedResults = judges.length > 0

  useEffect(() => {
    // If we have initial data from SSR, don't immediately refetch on mount.
    // Refetch when user changes filters/search.
    if (!initialData) {
      fetchJudges(1, { reset: true })
    }
  }, [fetchJudges, initialData])
  
  const handleLoadMore = useCallback(async () => {
    if (!hasMore || loading) return

    const nextPage = currentPage + 1
    const signature = filtersSignature
    const key = buildPrefetchKey(nextPage, signature)
    const prefetched = prefetchedPagesRef.current.get(key)

    if (prefetched && signature === activeSignatureRef.current) {
      prefetchedPagesRef.current.delete(key)
      commitPageData(prefetched, { reset: false })
      setFetchError(null)

      if (prefetched.has_more) {
        void queuePrefetch(prefetched.page + 1)
      }

      Sentry.captureMessage('judges-list-prefetch-consumed', {
        level: 'info',
        tags: {
          feature: 'judges-directory',
        },
        extra: {
          page: nextPage,
          totalCount: prefetched.total_count,
          hasMore: prefetched.has_more,
          signature,
        },
      })

      return
    }

    try {
      await fetchJudges(nextPage)
    } catch (error) {
      // Errors are already surfaced via fetchJudges
    }
  }, [
    buildPrefetchKey,
    commitPageData,
    currentPage,
    fetchJudges,
    filtersSignature,
    hasMore,
    loading,
    queuePrefetch,
  ])

  const loadMoreVisible = useCallback(() => {
    setVisibleCount((count) => {
      const nextCount = count + VISIBLE_INCREMENT
      return Math.min(nextCount, filteredJudges.length)
    })
  }, [filteredJudges.length])

  const handleRetry = useCallback(() => {
    void fetchJudges(1, { reset: true })
  }, [fetchJudges])

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
    const windowLabel = recentYearsFilter === 1
      ? `${currentYear}`
      : `${recentDecisionsStartYear}-${currentYear}`

    if (recentYears) {
      return `Recent decisions (${windowLabel}) • ${recentYears}`
    }

    return `Recent decisions (${windowLabel}) • ${summary.total_recent}`
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

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.3 }
    }
  }

  // Show skeleton during initial load
  if (initialLoad) {
    return (
      <div className="min-h-screen bg-background text-foreground overflow-hidden">
        {/* Enhanced Hero Section with Animations */}
        <section className="relative min-h-[60vh] flex items-center justify-center">
          <ParticleBackground particleCount={30} />
          
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-enterprise-primary/10 via-enterprise-deep/10 to-background" />
          
          <motion.div 
            className="relative z-10 text-center px-4 max-w-7xl mx-auto w-full"
            style={{ y, opacity }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="mb-6 text-5xl md:text-7xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-enterprise-primary to-enterprise-deep bg-clip-text text-transparent">
                  California Judges
                </span>
                <br />
                <span className="text-foreground">
                  <TypewriterText text="Directory" />
                </span>
              </h1>
            </motion.div>
            
            <motion.p 
              className="mx-auto mb-12 max-w-2xl text-lg md:text-xl text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              Loading judicial profiles and analytics...
            </motion.p>
          </motion.div>
          
          <ScrollIndicator />
        </section>

        {/* Search and Filters Skeleton */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <SearchSkeleton />
        </div>

        {/* Judges Grid Skeleton */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <JudgeCardSkeleton />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Enhanced Hero Section with Animations */}
      <section className="relative min-h-[60vh] flex items-center justify-center">
        <ParticleBackground particleCount={30} />
        
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-enterprise-primary/10 via-enterprise-deep/10 to-background" />
        
        <motion.div 
          className="relative z-10 text-center px-4 max-w-7xl mx-auto w-full"
          style={{ y, opacity }}
        >
          {/* Breadcrumb */}
          <motion.div 
            className="mb-6 flex items-center justify-center gap-2 text-sm"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">
              Home
            </Link>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <span className="text-foreground font-medium">Judges</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="mb-6 text-5xl md:text-7xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-enterprise-primary to-enterprise-deep bg-clip-text text-transparent">
                California Judges
              </span>
              <br />
              <span className="text-foreground">
                <TypewriterText text="Directory" />
              </span>
            </h1>
          </motion.div>
          
          <motion.p 
            className="mx-auto mb-12 max-w-2xl text-lg md:text-xl text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            Research judicial profiles, decision patterns, and case histories for bias detection and transparency
          </motion.p>
          
        </motion.div>
        
        <ScrollIndicator />
      </section>

      {/* Main Content with Animation */}
      <motion.section 
        className="px-4 py-16"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8 text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Comprehensive Judge Database</span>
            </div>
          </motion.div>
          
          <motion.div 
            whileHover={{ scale: 1.01 }}
            className="rounded-2xl border border-border ring-1 ring-border/60 p-8 backdrop-blur-sm bg-card/90 shadow-sm"
          >
          <motion.h2 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-bold bg-gradient-to-r from-enterprise-primary to-enterprise-deep bg-clip-text text-transparent mb-6"
          >
            Find Judges
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <label className="block text-sm font-medium text-muted-foreground mb-2">Search Judges</label>
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="relative"
              >
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search by judge name..."
                  className="w-full pl-10 pr-4 py-3 border border-input bg-background text-foreground placeholder:text-muted-foreground/70 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 hover:border-primary/50"
                />
                <AnimatePresence>
                  {isSearching && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <label className="block text-sm font-medium text-muted-foreground mb-2">Jurisdiction</label>
              <motion.select
                whileHover={{ scale: 1.02 }}
                value={selectedJurisdiction}
                onChange={(e) => setSelectedJurisdiction(e.target.value)}
                className="w-full px-4 py-3 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 hover:border-primary/50"
              >
                {jurisdictionOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </motion.select>
            </motion.div>
          </div>
          
          {/* Filter Toggle and Advanced Search */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-6 flex items-center justify-between"
          >
            <motion.label 
              whileHover={{ scale: 1.02 }}
              className="flex items-center cursor-pointer"
            >
              <input
                type="checkbox"
                checked={onlyWithDecisions}
                onChange={(e) => setOnlyWithDecisions(e.target.checked)}
                className="h-4 w-4 text-primary focus:ring-primary border-input bg-background rounded transition-all duration-200"
              />
                <span className="ml-2 text-sm text-muted-foreground">
                Show only judges with recent decisions ({recentDecisionsStartYear}-{currentYear})
              </span>
            </motion.label>
            <motion.div className="flex items-center gap-4">
              <AnimatePresence>
                {onlyWithDecisions && (
                  <motion.div
                    key="recent-window"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-4"
                  >
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Decision window</label>
                      <select
                        value={recentYearsFilter}
                        onChange={(e) => setRecentYearsFilter(Number(e.target.value))}
                        className="px-3 py-2 border border-input bg-background text-foreground rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                      >
                        {RECENT_YEAR_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="hidden md:flex items-center gap-2">
                      {RECENT_YEAR_CHIPS.map(option => {
                        const isActive = recentYearsFilter === option.value
                        return (
                          <motion.button
                            key={option.value}
                            type="button"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setRecentYearsFilter(option.value)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all duration-200 ${isActive ? 'bg-primary text-primary-foreground border-primary shadow-sm' : 'bg-muted text-muted-foreground border-input hover:bg-accent/20 hover:border-accent/40'}`}
                            aria-pressed={isActive}
                          >
                            {option.label}
                          </motion.button>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/judges/advanced-search"
                  className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-enterprise-primary to-enterprise-deep rounded-lg hover:from-enterprise-accent hover:to-enterprise-primary transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Advanced Search
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>

          <AnimatePresence>
            {fetchError && (
              <motion.div
                key="fetch-error"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="mt-6 rounded-lg border border-destructive/40 bg-destructive/10 p-4"
                role="alert"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 text-destructive" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-medium text-destructive">
                        {hasCachedResults
                          ? "We couldn't refresh the judge list. Showing cached results for now."
                          : fetchError}
                      </p>
                      {hasCachedResults && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          Retry to fetch the latest data when you're ready.
                        </p>
                      )}
                    </div>
                  </div>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleRetry}
                    className="inline-flex items-center justify-center gap-2 rounded-md border border-destructive/60 bg-destructive/20 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive hover:text-white"
                  >
                    <RefreshCcw className="h-4 w-4" aria-hidden="true" />
                    Retry now
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results Summary */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-6 p-4 rounded-lg border border-primary/30 bg-primary/5"
          >
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-primary">
                <AnimatePresence mode="wait">
                  {loading ? (
                    <motion.div 
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center"
                    >
                      <Loader2 className="h-4 w-4 animate-spin mr-2 text-primary" />
                      Loading judges...
                    </motion.div>
                  ) : fetchError ? (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 text-destructive"
                    >
                      <AlertCircle className="h-4 w-4" aria-hidden="true" />
                      <span className="text-sm">
                        {hasCachedResults
                          ? 'Showing cached results until the latest data is available.'
                          : fetchError}
                      </span>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="results"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      {onlyWithDecisions ? (
                        hasMore
                          ? `Showing ${filteredJudges.length} of ${totalCount} judges with decisions since ${recentDecisionsStartYear}. Load more to discover additional judges.`
                          : `Showing ${filteredJudges.length} judges with decisions since ${recentDecisionsStartYear} (of ${totalCount} total).`
                      ) : (
                        `Found ${totalCount} judges matching your criteria`
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <AnimatePresence>
                {!loading && !fetchError && totalCount > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="text-sm text-primary font-medium"
                  >
                    Showing {onlyWithDecisions ? filteredJudges.length : judges.length} of {totalCount}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Judges Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <AnimatePresence mode="wait">
          {loading && judges.length === 0 ? (
            <motion.div 
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {Array.from({ length: 6 }).map((_, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <JudgeCardSkeleton />
                </motion.div>
              ))}
            </motion.div>
          ) : fetchError && judges.length === 0 ? (
            <motion.div
              key="fetch-error-empty"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center justify-center rounded-2xl border border-destructive/30 bg-destructive/10 px-6 py-16 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', duration: 0.4 }}
              >
                <AlertCircle className="h-12 w-12 text-destructive" aria-hidden="true" />
              </motion.div>
              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mt-6 text-lg font-semibold text-foreground"
              >
                We couldn't load judges right now
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="mt-2 max-w-md text-sm text-muted-foreground"
              >
                Check your network connection and retry. We'll reload the list as soon as we're able to reach the data source again.
              </motion.p>
              <motion.button
                type="button"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleRetry}
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-destructive px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-transform hover:bg-destructive/90"
              >
                <RefreshCcw className="h-4 w-4" aria-hidden="true" />
                Try again
              </motion.button>
            </motion.div>
          ) : filteredJudges.length === 0 ? (
            <motion.div 
              key="no-results"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center py-12"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.5 }}
              >
                <Gavel className="h-12 w-12 mx-auto text-muted-foreground/70 mb-4" />
              </motion.div>
              <motion.h3 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg font-medium text-foreground mb-2"
              >
                {onlyWithDecisions ? 'No judges with recent decisions found' : 'No judges found'}
              </motion.h3>
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-muted-foreground"
              >
                {onlyWithDecisions 
                  ? 'Try unchecking the filter to see all judges or adjusting your search criteria.'
                  : 'Try adjusting your search filters.'
                }
              </motion.p>
            </motion.div>
          ) : (
            <motion.div key="results">
              <motion.div 
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {visibleJudges.map((judge, index) => (
                  <motion.div
                    key={judge.id}
                    variants={cardVariants}
                    whileHover={{ 
                      scale: 1.03,
                      transition: { duration: 0.2 }
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <SharedTransitionLink 
                      href={`/judges/${generateJudgeSlug(judge)}`}
                      className="block group relative overflow-hidden"
                      viewTransitionName={`judge-title-${judge.id}`}
                    >
                      <GlassCard className="p-6">
                      {/* Gradient overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-blue-800/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      <div className="relative">
                        <div className="flex items-center justify-between mb-4">
                          <motion.div
                            whileHover={{ rotate: 15 }}
                            transition={{ type: "spring", stiffness: 300 }}
                          >
                            <Gavel className="h-8 w-8 text-primary group-hover:text-primary/80 transition-colors" />
                          </motion.div>
                          <span className="text-sm font-medium text-white bg-gradient-to-r from-enterprise-primary to-enterprise-deep px-3 py-1 rounded-full capitalize">
                            {judge.jurisdiction || 'Jurisdiction'}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2" data-view-transition-name={`judge-title-${judge.id}`}>
                          {judge.name}
                        </h3>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <Scale className="h-4 w-4 mr-2 text-muted-foreground/70 flex-shrink-0" />
                            <span className="truncate">{getCourtAndStateDisplay(judge)}</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-muted-foreground/70" />
                            <span className="text-xs">{getRecentDecisionsDisplay(judge)}</span>
                          </div>
                          <motion.div 
                            className="pt-3 flex items-center text-primary font-medium"
                            whileHover={{ x: 5 }}
                          >
                            <span className="text-sm">View profile</span>
                            <ArrowRight className="w-4 h-4 ml-1" />
                          </motion.div>
                        </div>
                      </div>
                      </GlassCard>
                    </SharedTransitionLink>
                  </motion.div>
                ))}
              
                {/* Show skeleton cards while loading more */}
                {loading && hasMore && (
                  <>
                    {Array.from({ length: 3 }).map((_, index) => (
                      <motion.div
                        key={`loading-${index}`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <JudgeCardSkeleton />
                      </motion.div>
                    ))}
                  </>
                )}
              </motion.div>

              {/* Load More Button */}
              <AnimatePresence>
                {(visibleCount < filteredJudges.length || hasMore) && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="text-center mt-12"
                  >
                    <motion.button
                      onClick={() => {
                        if (visibleCount < filteredJudges.length) {
                          loadMoreVisible()
                          return
                        }
                        handleLoadMore()
                      }}
                      disabled={loading}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-gradient-to-r from-enterprise-primary to-enterprise-deep text-white px-8 py-3 rounded-lg font-medium hover:from-enterprise-accent hover:to-enterprise-primary disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Loading...
                        </>
                      ) : (
                        <>
                          Load More Judges
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
