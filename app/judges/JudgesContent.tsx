'use client'

import { useState, useEffect, useCallback } from 'react'
import { Gavel, MapPin, Scale, Search, Loader2, Calendar, Users, ArrowRight, Shield, TrendingUp, ChevronRight, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import type { Judge, JudgeDecisionSummary } from '@/types'
import { generateSlug } from '@/lib/utils/slug'
import { useSearchDebounce } from '@/lib/hooks/useDebounce'
import { JudgeCardSkeleton, SearchSkeleton } from '@/components/ui/Skeleton'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { ParticleBackground } from '@/components/ui/ParticleBackground'
import { AnimatedCounter } from '@/components/ui/AnimatedCounter'
import { TypewriterText } from '@/components/ui/TypewriterText'
import { ScrollIndicator } from '@/components/ui/ScrollIndicator'

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

export default function JudgesContent() {
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
  const [judges, setJudges] = useState<JudgeWithDecisions[]>([])
  const [loading, setLoading] = useState(true)
  const [initialLoad, setInitialLoad] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [onlyWithDecisions, setOnlyWithDecisions] = useState(false)
  
  // State for judge-specific stats
  const [judgeStats, setJudgeStats] = useState({
    totalJudges: 0,
    analyticsCoverage: "85%",
    avgExperience: "12 Years Experience",
    updateFrequency: "Weekly Data Updates"
  })

  // Initialize search from URL on mount
  useEffect(() => {
    const searchQuery = searchParams.get('search') || searchParams.get('q') || ''
    if (searchQuery) {
      setSearchInput(searchQuery)
    }
  }, [searchParams])

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
      if (onlyWithDecisions) {
        params.append('only_with_decisions', 'true')
        params.append('recent_years', recentYearsFilter.toString())
      }

      const response = await fetch(`/api/judges/list?${params}`)
      if (!response.ok) throw new Error('Failed to fetch judges')
      
      const data: JudgesResponse = await response.json()
      
      const mergeUniqueById = (existing: JudgeWithDecisions[], incoming: JudgeWithDecisions[]) => {
        const map = new Map<string, JudgeWithDecisions>()
        for (const j of existing) map.set(j.id, j)
        for (const j of incoming) map.set(j.id, j)
        return Array.from(map.values())
      }

      if (reset || page === 1) {
        setJudges(mergeUniqueById([], data.judges))
      } else {
        setJudges(prev => mergeUniqueById(prev, data.judges))
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
  }, [debouncedSearchQuery, selectedJurisdiction, onlyWithDecisions, recentYearsFilter])

  // Filter judges based on decisions toggle
  const filteredJudges = onlyWithDecisions 
    ? judges.filter(judge => judge.decision_summary?.total_recent && judge.decision_summary.total_recent > 0)
    : judges

  useEffect(() => {
    fetchJudges(1, true)
  }, [fetchJudges])
  
  // Fetch judge-specific stats
  useEffect(() => {
    const fetchJudgeStats = async () => {
      try {
        const response = await fetch('/api/stats/judges')
        if (response.ok) {
          const data = await response.json()
          setJudgeStats({
            totalJudges: data.totalJudges,
            analyticsCoverage: data.analyticsCoverage,
            avgExperience: data.avgExperienceDisplay,
            updateFrequency: data.updateFrequency
          })
        }
      } catch (error) {
        console.error('Failed to fetch judge stats:', error)
      }
    }
    fetchJudgeStats()
  }, [])

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
          
          {/* Animated Statistics */}
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
          >
            {[
              { icon: Gavel, value: judgeStats.totalJudges || totalCount, label: "Total Judges", color: "text-primary", suffix: "" },
              { icon: Scale, value: 0, label: "Have Bias Analytics", color: "text-enterprise-accent", isText: true, text: judgeStats.analyticsCoverage, suffix: "" },
              { icon: MapPin, value: 0, label: "Avg Experience", color: "text-enterprise-deep", isText: true, text: judgeStats.avgExperience, suffix: "" },
              { icon: Users, value: 0, label: "Data Freshness", color: "text-enterprise-light", isText: true, text: judgeStats.updateFrequency, suffix: "" }
            ].map((stat, index) => (
              <motion.div 
                key={stat.label}
                className="group"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1 + index * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="p-4 rounded-xl border border-border bg-card/50 backdrop-blur-sm hover:bg-accent/5 transition-all duration-300">
                  <stat.icon className={`w-8 h-8 ${stat.color} mx-auto mb-2`} />
                  <div className={`text-3xl font-bold ${stat.color}`}>
                    {stat.isText ? (
                      <span className="text-lg">{stat.text}</span>
                    ) : (
                      <>
                        <AnimatedCounter end={stat.value} />
                        {stat.suffix}
                      </>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
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
            className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 backdrop-blur-sm bg-white/95"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Judges</label>
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="relative"
              >
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search by judge name..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-blue-400"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Jurisdiction</label>
              <motion.select
                whileHover={{ scale: 1.02 }}
                value={selectedJurisdiction}
                onChange={(e) => setSelectedJurisdiction(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-blue-400"
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
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-all duration-200"
              />
              <span className="ml-2 text-sm text-gray-700">
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
                      <label className="block text-xs font-medium text-gray-500 mb-1">Decision window</label>
                      <select
                        value={recentYearsFilter}
                        onChange={(e) => setRecentYearsFilter(Number(e.target.value))}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
                            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all duration-200 ${isActive ? 'bg-blue-600 text-white border-blue-600 shadow' : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'}`}
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
          
          {/* Results Summary */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200"
          >
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-blue-800">
                <AnimatePresence mode="wait">
                  {loading ? (
                    <motion.div 
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center"
                    >
                      <Loader2 className="h-4 w-4 animate-spin mr-2 text-blue-600" />
                      Loading judges...
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
                {!loading && totalCount > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="text-sm text-blue-700 font-medium"
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
                <Gavel className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              </motion.div>
              <motion.h3 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg font-medium text-gray-900 mb-2"
              >
                {onlyWithDecisions ? 'No judges with recent decisions found' : 'No judges found'}
              </motion.h3>
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-gray-600"
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
                {filteredJudges.map((judge, index) => (
                  <motion.div
                    key={judge.id}
                    variants={cardVariants}
                    whileHover={{ 
                      scale: 1.03,
                      transition: { duration: 0.2 }
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Link
                      href={`/judges/${generateJudgeSlug(judge)}`}
                      className="block bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 group border border-gray-100 hover:border-blue-300 relative overflow-hidden"
                    >
                      {/* Gradient overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-blue-800/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      <div className="relative">
                        <div className="flex items-center justify-between mb-4">
                          <motion.div
                            whileHover={{ rotate: 15 }}
                            transition={{ type: "spring", stiffness: 300 }}
                          >
                            <Gavel className="h-8 w-8 text-blue-600 group-hover:text-blue-700 transition-colors" />
                          </motion.div>
                          <span className="text-sm font-medium text-white bg-gradient-to-r from-enterprise-primary to-enterprise-deep px-3 py-1 rounded-full capitalize">
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
                          <motion.div 
                            className="pt-3 flex items-center text-blue-600 font-medium"
                            whileHover={{ x: 5 }}
                          >
                            <span className="text-sm">View profile</span>
                            <ArrowRight className="w-4 h-4 ml-1" />
                          </motion.div>
                        </div>
                      </div>
                    </Link>
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
                {hasMore && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="text-center mt-12"
                  >
                    <motion.button
                      onClick={handleLoadMore}
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
